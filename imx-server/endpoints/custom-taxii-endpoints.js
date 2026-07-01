const errorHandler = require('../functions/error-handler')
const axios = require('axios')
const https = require('node:https')

const customTaxiiEndpoints = function (app, logger) {
    const db = require('../database/db')
    const getUserData = require('../functions/get-user-data')

    app.get('/taxii', async (req, res) => {
        try {
            const userData = await getUserData(req)
            const index = "taxiiinfo"
            const checkIndex = await db.getIndex(index)

            if (!userData?.user)
                return errorHandler({ status: 401, reason: "Could not identify user"}, req, res, logger)


            if(checkIndex.data && JSON.stringify(checkIndex.data) !== "{}"){
                const result = await db.getAllDocs(index)

                if(JSON.stringify(result.data) === "{}"){
                    return res.send(null)
                } else {
                    logger.logEndpoint(200, req, logger, userData)
                    return res.send(result.data)
                }
            } else {
                return errorHandler({ status: 404, reason: "No data found"}, req, res, logger)
            }
        } catch (error) {
            return errorHandler(error, req, res, logger)
        }
    })

    app.get('/taxii/:serverUrl', async (req, res) => {
        try {
            const userData = await getUserData(req)
            const index = "taxiiinfo"
            const checkIndex = await db.getIndex(index)
            const serverUrl = req.params.serverUrl
            if (!userData?.user)
                return errorHandler({ status: 401, reason: "Could not identify user"}, req, res, logger)


            if(checkIndex.data && JSON.stringify(checkIndex.data) !== "{}"){
                const result = await db.getDoc(index, serverUrl)
                if (result?.response?.status === 404) {
                    return errorHandler({ status: 404, reason: "No information found associated with the given server" }, req, res, logger)
                }

                if(JSON.stringify(result.data) === "{}") {
                    return errorHandler({ status: 404, reason: "Failed to find server information" }, req, res, logger)
                } else {
                    logger.logEndpoint(200, req, userData)
                    return res.send(result.data)
                }
            } else {
                return errorHandler({ status: 404, reason: "Check Index has failed"}, req, res, logger)
            }
        } catch (error) {
            return errorHandler(error, req, res, logger)
        }
    })

    app.post('/taxii/:serverUrl', async (req, res) => {
        try {
            const serverUrl = req.params.serverUrl
            const index = 'taxiiinfo'
            const userData = await getUserData(req)
            const checkIndex = await db.getIndex(index)
            const { username, password, cert, key, roles, useCert, url, pem, certPassword } = req.body
            const serverDoc = {
                url: url,
                username: username,
                password: password,
                certPassword: certPassword,
                cert: cert,
                key: key,
                roles: roles,
                useCert: useCert,
                pem: pem
            }

            async function postToDoc() {
                let result = await db.postDoc(index, serverDoc, serverUrl)

                    if(result?.status && (result.status === 201 || result.status === 200)){
                        logger.logEndpoint(201, req, userData)
                        return res.send({ status: 201, "message": `Index and Doc posted successfully`, data: result.data })
                    } else {
                        return errorHandler({ status: 500, reason: `Unexpected error when creating index or posting doc`}, req, res, logger)
                    }
            }

            if ((checkIndex.data && JSON.stringify(checkIndex.data) !== "{}" )
            || (checkIndex?.response?.data && checkIndex.response.data.status !== 404)) {
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

    app.delete('/taxii-delete/:serverUrl', async (req, res) => {
        try {
            const serverUrl = req.params.serverUrl
            const index = 'taxiiinfo'

            let checkDoc = await db.getDoc(index, serverUrl)
            if (JSON.stringify(checkDoc.data) === "{}"){
                console.error(`Doc: ${serverUrl} , is not found`)
                console.trace()
                logger.logEndpoint(404, req, undefined)
                return res.status(404).send({ status: 404, message: "Associated certificate is not found" })
            } else {
                //call to ES
                let result = await db.deleteDoc(index, serverUrl)
                //Response
                if(result?.status && result.status === 200){
                    logger.logEndpoint(200, req, undefined)
                    return res.send({ data: result.data })
                } else {
                    logger.logEndpoint(result.response.status, req, undefined)
                    return res.status(500).send({ status: 500, "message": `Attempt to reach ES instance has failed`})
                }
            }
        } catch (error) {
            return errorHandler(error, req, res, logger)
        }
    })

    app.post('/proxy-custom/:serverUrl', async (req, res) => {
        try {
            const body = req.body
            const userData = await getUserData(req)
            const index = "taxiiinfo"
            const checkIndex = await db.getIndex(index)
            const serverUrl = req.params.serverUrl

            if(checkIndex.data && JSON.stringify(checkIndex.data) !== "{}"){
                const result = await db.getDoc(index, serverUrl)

                if (result?.response?.status === 404) {
                    return errorHandler({ status: 404, reason: "No information found associated with the given server" }, req, res, logger)
                }

                if(JSON.stringify(result.data) === "{}") {
                    return errorHandler({ status: 404, reason: "Failed to find server information" }, req, res, logger)
                } else {
                    logger.logEndpoint(200, req, userData)
                    const taxiiInfo = result.data
                    const { method, url, reqBody, observe } = body
                    const httpsAgent = new https.Agent({
                        cert: taxiiInfo.cert.replaceAll('\n','\n'),
                        key: taxiiInfo.key.replaceAll('\n','\n'),
                        rejectUnauthorized: false
                    })

                    switchProxyCustom(method, url, reqBody, observe, httpsAgent)
                }
            } else {
                return errorHandler({ status: 404, reason: "Check Index has failed"}, req, res, logger)
            }
        } catch (error) {
            console.error("ERR?", error.response)
            return errorHandler(error, req, res, logger)
        }
    })
}

const switchProxyCustom = async function(method, url, reqBody, observe, httpsAgent){
    switch (method) {
        case 'get': {
            const response = await axios.get(url, { httpsAgent: httpsAgent, headers: { 'Content-Type': '*/*', 'Accept': '*/*' } })
            if (observe && observe === 'response') {
                const headerMap = new Map()
                Object.entries(response.headers).forEach(([key, val]) => {
                    if (key === 'x-taxii-date-added-last')
                        key = 'X-TAXII-Date-Added-Last'
                    if (key === 'x-taxii-date-added-first')
                        key = 'X-TAXII-Date-Added-First'
                    headerMap.set(key, val)
                })
                res.status(200)
                res.send({ body: response.data, headers: [...headerMap] } )
            } else
                res.send(response.data)
            break
        }
        case 'post': {
            const response = await axios.post(url, reqBody, { httpsAgent: httpsAgent, headers: { 'Content-Type': '*/*', 'Accept': '*/*' } })
            if (observe && observe === 'response') {
                const headerMap = new Map()
                Object.entries(response.headers).forEach(([key, val]) => {
                    if (key === 'x-taxii-date-added-last')
                        key = 'X-TAXII-Date-Added-Last'
                    if (key === 'x-taxii-date-added-first')
                        key = 'X-TAXII-Date-Added-First'
                    headerMap.set(key, val)
                })
                res.status(200)
                res.send({ body: response.data, headers: [...headerMap] } )
            } else
                res.send(response.data)
            break
        }
        case 'delete': {
            const response = await axios.delete(url, { httpsAgent })
            if (observe && observe === 'response') {
                const headerMap = new Map()
                Object.entries(response.headers).forEach(([key, val]) => {
                    if (key === 'x-taxii-date-added-last')
                        key = 'X-TAXII-Date-Added-Last'
                    if (key === 'x-taxii-date-added-first')
                        key = 'X-TAXII-Date-Added-First'
                    headerMap.set(key, val)
                })
                res.status(200)
                res.send({ body: response.data, headers: [...headerMap] } )
            } else
                res.send(response.data)
            break
        }
    }
}

module.exports = customTaxiiEndpoints
