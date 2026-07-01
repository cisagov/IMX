const disabledTaxiiEndpoints = function(app, logger){

    const db = require('../database/db');

    const checkIndex = require('../functions/check-index');
    const createSortObj = require('../functions/create-sort-obj');

    const index = 'disabled-taxii'

    app.get('/get-disabled-taxii/:sortKey/:from/:size', async (req, res) => {
        try {
            const sortObj = createSortObj(req.params.sortKey)
            const queryData = {}
            await checkIndex(index)

            setTimeout(async function(){
                let getDocsRes = await db.searchDocs(index, queryData, req.params.size, req.params.from, sortObj)

                switch(getDocsRes.status){
                    case 200:
                        logger.logEndpoint(getDocsRes.status, req, undefined)
                        res.send({ status: getDocsRes.status, data: getDocsRes.data })
                        break;
                    case 404:
                        logger.logEndpoint(getDocsRes.status, req, undefined)
                        res.send({ status: getDocsRes.status, message: "No disabled TAXII Servers found" })
                        break;
                    default:
                        logger.logEndpoint(getDocsRes.status, req, undefined)
                        res.send({ status: getDocsRes.status, message: "Something unexpected happened" })
                        return
                }
            }, 1000)
        } catch(err) {
            console.error(err);
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, message: JSON.stringify(err) })
        }
    })

    app.post('/add-disabled-taxii', async (req, res) => {
        try {
            let url = req.body.url
            let username = req.body.username
            let password = req.body.password

            await checkIndex(index)
            await checkForDuplicates(url, username)

            let doc = {
                "@created_timestamp": (new Date()).toISOString(),
                "url": url,
                "username": username,
                "password": password
            }

            let postRes = await postDisabledTaxiiServer(doc)

            logger.logEndpoint(201, req, undefined);
            res.send(postRes)
        } catch(err) {
            console.error(err);
            logger.logEndpoint(err.status ? err.status : 500, req, undefined);
            res.send({ status: err.status ? err.status : 500, message: JSON.stringify(err) });
        }
    })

    app.delete('/delete-disabled-taxii/:id', async (req, res) => {
        try {
            await deleteDoc(req.params.id)

            logger.logEndpoint(200, req, undefined);
            res.send({ status: 200, message:'get-template success'})
        } catch(err) {
            console.error(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: JSON.stringify(err) });
        }
    })

    const checkForDuplicates = async function(url, username){
        return new Promise((resolve, reject) => {
            const queryData = {
                "url.keyword": url,
                "username.keyword": username
            }

            db.searchDocs(index, queryData, 1, 0, {})
                .then((getDocRes) => {
                    switch(getDocRes.status){
                        case 201:
                        case 200:
                            if(getDocRes.data.hits.total.value !== 0){
                                reject({status: 400, message: "Bad Request. Duplicate entry found"})
                                return
                            }

                            resolve({status: getDocRes.status, message: "No duplicate found"})
                            break;
                        default:
                            reject({status: getDocRes.status ?? 500, message: getDocRes.message ? getDocRes.message : "Bad Request. Unknown error"})
                    }
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }

    const postDisabledTaxiiServer = async function(doc){
        return new Promise((resolve, reject) => {
            db.postDoc(index, doc)
                .then((result) => {
                    if(result?.status === 201){
                        resolve({ status: 201, message: 'SUCCESS. Disabled TAXII Server added.'})
                    } else {
                        let message = result.message ? result.message : "ERROR: Unknown error"
                        reject(new Error(message))
                    }
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }

    const deleteDoc = async function(id){
        return new Promise((resolve, reject) => {
            db.deleteDoc(index, id)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }
}

module.exports = disabledTaxiiEndpoints
