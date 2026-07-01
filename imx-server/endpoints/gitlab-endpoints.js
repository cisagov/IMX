const gitlabEndpoints = function(app, logger){
    const axios = require('axios')
    const admzip = require('adm-zip')
    const fs = require('node:fs')
    const FormData = require('form-data')
    const https = require('node:https')

    const getUserData = require('../functions/get-user-data')
    const db = require('../database/db')

    //Creates headers for Axios calls containes Headers, httpsAgent (if needed)
    let axiosData = {
        headers: {
            "PRIVATE-TOKEN": process.env.GITLAB_TOKEN
        }
    }
    //Required for TEN as the TEN has self-signed certs and Axios does not like that
    if(process.env.GITLAB_CERT === 'TEN'){
        axiosData['httpsAgent'] = new https.Agent({ rejectUnauthorized: false })
    }

    //Create gitlab issue
    //IF feature just creates issue and returns response
    //IF bug, creates issue, searches logs, creates zip, uploads zip, attaches zip to issue
    app.post('/gitlab-issue/:type/:envi/', async (req, res) => {
        if(process.env.GITLAB_ON !== 'true'){
            res.send({ status:404, message: 'GitLab functionality is turned off for this instance'})
            return
        }

        try {
            let userData = await getUserData(req)
            const queryData = {
                "user.keyword": userData.user
            }

            const issueUrl = `${process.env.GITLAB_URL}api/v4/projects/${req.body.id}/issues?title=${req.body.issueType}%20from%20${userData.user}&description=${req.body.description}&labels=${req.body.labels}`
            const zipUrl = `${process.env.GITLAB_URL}api/v4/projects/${req.body.id}/uploads`
            let issueResult = await postIssue(issueUrl)

            if(req.params.type === 'Issue' && issueResult.status === 201){
                const zip = new admzip()
                for(let field in req.body){
                    switch(field){
                        case 'description':
                        case 'id':
                        case 'issueType':
                        case 'labels':
                            continue
                        default:
                            zip.addFile(`${field}.txt`, JSON.stringify(req.body[field]))
                            break
                    }
                }

                const logs = await db.searchDocs(`imx-${req.params.envi}`, queryData, 100, 0, {})
                zip.addFile(`logs.txt`, JSON.stringify(logs.data))

                let zipResult = await postZip(zipUrl, zip, userData)
                if(zipResult.data.markdown){
                    const noteUrl = `${process.env.GITLAB_URL}api/v4/projects/${req.body.id}/issues/${issueResult.data.iid}/notes?body=${zipResult.data.markdown.toString()}`

                    await postNote(noteUrl)
                }
            }

            logger.logEndpoint(200, req, userData)
            res.send(issueResult.data)
        }
        catch(err){
            console.log(err)
            console.trace()
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, error: 'Something happened on the IMX Server'})
        }

    })

    /**
     *
     * @param {STRING of constucted url to create gitlab issue from API} url
     * @returns response from gitlab (contains issue id, iid, needed to attach zip to issue)
     */
    const postIssue = function(url){
        return new Promise((resolve, reject) => {
            axios.post(url, {}, axiosData)
                .then((resp) => {
                    console.log('Issue Posted')
                    console.trace()
                    resolve(resp)
                })
                .catch((err) => {
                    console.log('Error in Posting Issue')
                    console.trace()
                    reject(err)
                })
        })
    }

    /**
     *
     * @param {STRING of constructed url to post zip} url
     * @param {zip file} zip
     * @param {OBJ of user data} userData
     * @returns response from gitlab (contains markdown needed to attach to issue)
     */
    const postZip = function(url, zip, userData){
        zip.writeZip(`./zip/${userData.user}.zip`)
        const form = new FormData()
        form.append('file', fs.createReadStream(`./zip/${userData.user}.zip`))

        return new Promise((resolve, reject) => {
            axios.post(url, form, axiosData)
                .then((resp) => {
                    console.log('Zip Posted')
                    console.trace()
                    resolve(resp)
                })
                .catch((err) => {
                    console.log('Error in Posting Zip')
                    deleteFile(userData)
                    console.trace()
                    reject(err)
                })
        })
    }

    /**
     *
     * @param {STRING of contructed url that attaches zip to posted issue} url
     * @returns response from gitlab (contains status)
     */
    const postNote = function(url){
        return new Promise((resolve, reject) => {
            axios.post(url, {}, axiosData)
                .then((resp) => {
                    console.log('Note Posted')
                    console.trace()
                    resolve(resp)
                })
                .catch((err) => {
                    console.log('Error in Posting Note')
                    console.trace()
                    reject(err)
                })
        })
    }

    const deleteFile = function(userData){
        fs.unlink(`./zip/${userData.user}.zip`, (err) => {
            if(err) throw err
            console.log('Zip Deleted')
        })
    }
}

module.exports = gitlabEndpoints
