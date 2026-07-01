const errorHandler = require('../functions/error-handler')

const certEndpoints = function(app, logger) {
    const db = require('../database/db')
    const getUserData = require('../functions/get-user-data')

    app.get('/cert', async (req, res) => {
        try {
            const userData = await getUserData(req)
            const index = "certificate"
            const checkIndex = await db.getIndex(index)

            if(checkIndex.data && JSON.stringify(checkIndex.data) !== "{}"){
                const result = await db.getDoc(index, userData.user)

                if (result.response?.status === 404) {
                    return errorHandler({ status: 404, reason: "No cert associated with user" }, req, res, logger)
                }

                if(JSON.stringify(result.data) === "{}"){
                    return errorHandler({ status: 404, reason: "Failed to find ceritficate associated with user" }, req, res, logger)
                } else {
                    logger.logEndpoint(200, req, userData)
                    return res.send( {status:200, data: {pkcs10: result.data.pkcs10, user: result.data.username} })
                }

            } else {
                return errorHandler({ status: 404, reason: "Check Index has failed"}, req, res, logger)
            }
        } catch (error) {
            return errorHandler(error, req, res, logger)
        }
    })

    app.get("/cert/:userName", async (req, res) => {
        try {
            const userData = await getUserData(req)
            const index = "certificate"
            const checkIndex = await db.getIndex( index)
            const userName = req.params.userName

            if(checkIndex.data && JSON.stringify(checkIndex.data) !== "{}"){
                const result = await db.getDoc(index, userName)
                if (result.response?.status === 404) {
                    return errorHandler({ status: 404, reason: "No cert associated with user" }, req, res, logger)
                }

                if(JSON.stringify(result.data) === "{}"){
                    return errorHandler({ status: 404, reason: "Failed to find ceritficate associated with user" }, req, res, logger)
                } else {
                    logger.logEndpoint(200, req, userData)
                    return res.send({ username: result.data.username})
                }
            } else {
                return errorHandler({ status: 404, reason: "Check Index has failed"}, req, res, logger)
            }
        } catch (error) {
            return errorHandler(error, req, res, logger)
        }

    })

    app.post('/cert/:userName', async (req, res) => {
        try {
            const userName = req.params.userName
            const index = 'certificate'
            const userData = await getUserData(req)
            const checkIndex = await db.getIndex(index)
            const { pkcs10, user } = req.body
            const { roles, password } = user
            const username = user.user

            const userDoc = {
                pkcs10: pkcs10,
                roles: roles,
                username: username,
                password: password
            }

            async function postToDoc() {
                let result = await db.postDoc(index, userDoc, userName)
                    //Response
                    if (result?.status && (result.status === 201 || result.status === 200)) {
                        logger.logEndpoint(201, req, userData)
                        return res.send({ status: 201, "message": `Index and Doc posted successfully`, data: result.data })
                    } else {
                        return errorHandler({ status: 500, reason: `Unexpected error when creating index or posting doc`}, req, res, logger)
                    }
            }

            if ((checkIndex.data && JSON.stringify(checkIndex.data) !== "{}" )
            || (checkIndex.response?.data && checkIndex.response.data.status !== 404)) {
                await postToDoc()
            } else {
                const createIndex = await db.createIndex(index)
                if(createIndex?.status && createIndex.status === 200){
                    await postToDoc()
                } else {
                    return errorHandler({ status: 500, "reason": `Attempt to store certificate has failed`}, req, res, logger)
                }
            }
        } catch (error) {
            return errorHandler(error, req, res, logger)
        }
    })

    app.delete('/cert/:userName', async (req, res) => {
        try {
            const userName = req.params.userName
            const index = 'certificate'
            let checkDoc = await db.getDoc(index, userName)
            if (JSON.stringify(checkDoc.data) === "{}"){
                console.error(`Doc: ${userName} , is not found`)
                console.trace()
                logger.logEndpoint(404, req, undefined)
                return res.status(404).send({ status: 404, message: "Associated certificate is not found" })
            } else {
                //call to ES
                let result = await db.deleteDoc(index, userName)

                //Response
                if(result?.status && result.status === 200){
                    logger.logEndpoint(200, req, undefined)
                    return res.send({ data: result.data, username: checkDoc.data.username })
                } else {
                    logger.logEndpoint(result.response.status, req, undefined)
                    return res.status(500).send({ status: 500, "message": `Attempt to reach ES instance has failed`})
                }
            }
        } catch (error) {
            return errorHandler(error, req, res, logger)
        }
    })
}

module.exports = certEndpoints
