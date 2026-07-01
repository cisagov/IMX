const alertSubEndpoints = function(app, logger){
    const db = require('../database/db')

    const getUserData = require('../functions/get-user-data')

    /**
     * Get alert subscriptions for the current user (adding sorting capability just incase)
     * @param {string to determine sort order} sortKey
     * @param {from what number to start query (start is 0)} from
     * @param {number of hits returned from DB} size
     */
    app.get('/get-alert-subs/:sortKey/:from/:size', async (req, res) => {
        try {
            let userData = await getUserData(req)
            const index = `${process.env.ENV}-subs`
            const queryData = {
                'users':`${userData.user}`
            }
            const size = req.params.size
            const from = req.params.from
            const sortKey = req.params.sortKey

            const checkIndex = await db.getIndex(index)

            if(JSON.stringify(checkIndex.data) !== "{}"){
                setTimeout(async function(){
                    let sortObj = {}

                    if(sortKey === 'na'){
                        sortObj["@created_timestamp"] = "desc"
                    } else {
                        let splitKey = sortKey.split('-')

                        if (splitKey[0] === 'modified' || splitKey[0] === 'created'){
                            sortObj[`${splitKey[0]}_date`] = splitKey[1]
                            console.log(sortObj)
                        } else if (splitKey[2] === 'string'){
                            sortObj[`${splitKey[0]}.keyword`] = splitKey[1]
                        } else {
                            sortObj[splitKey[0]] = splitKey[1]
                        }
                    }

                    const result = await db.searchDocsArray(index, queryData, size, from, sortObj)

                    if(!result.status){
                        logger.logEndpoint(500, req, undefined)
                        res.send({ status: 500, message: 'Unable to search database for query. Please create a support request if the issue persists.' })
                        return
                    }

                    //Response
                    if(result?.status && result.status === 200){
                        logger.logEndpoint(200, req, userData)
                        res.send(result.data.hits)
                    } else {
                        console.log(result)
                        logger.logEndpoint(result.response.status, req, userData)
                        res.send({ "message": `Attempt to reach ES instance at ${ELASTICSEARCH.url} has failed`})
                    }
                }, 1000)
            }

        } catch(err) {
            console.error(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, message: 'There was an error communicating with the IMX Server' })
        }
    })

    /**
     * Endpoint to add alert subscription
     * req.body should contain taxiiServer, type, and sub
     */
    app.post('/add-alert-sub', async (req, res) => {
        try {
            const userData = await getUserData(req)
            const index = `${process.env.ENV}-subs`
            let checkIndex = await db.getIndex(index)

            let doc = {
                "@created_timestamp": (new Date()).toISOString(),
                "taxiiServer": req.body.taxiiServer,
                'type': req.body.type,
                "sub": req.body.sub,
                "users": [ userData.user ]
            }

            if(checkIndex.data && JSON.stringify(checkIndex.data) !== "{}"
                || (checkIndex.response?.data && checkIndex.response.data.status !== 404)){
                const queryData = {
                    "taxiiServer.keyword": doc.taxiiServer,
                    "sub.collection.keyword": doc.sub.collection,
                    "sub.apiRootPath.keyword": doc.sub.apiRootPath
                }

                let queryRes = await db.searchDocs(index, queryData, 15, 0, { "@created_timestamp": "desc"})
                let result = await postOrUpdateSub(index, doc, queryRes)


                //Response
                if(result?.status && result.status === 201){
                    logger.logEndpoint(201, req, userData)
                    res.send({ status: 201, "message": `Doc posted successfully`, data: result.data })
                } else if(result?.status && result.status === 409){
                    logger.logEndpoint(409, req, userData)
                    res.send({ status: 409, "message": `User is already subscribed`, data: result.data })
                } else {
                    logger.logEndpoint(result.response.status, req, userData)
                    res.send({ status: 500, "message": `Attempt to store alert has failed`})
                }
            } else {
               createAndPostSub(index, doc, userData)
            }
        } catch(err) {
            console.error(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, message: 'There was an error communicating with the IMX Server' })
        }
    })

    /**
     * remove alert sub
     * If sub has other users's subscribed only removes the user not the subscription
     * @param {id of subscription} docID
     */
    app.post('/remove-alert-sub/:docID', async (req, res) => {
        const docID = req.params.docID
        try {
            const userData = await getUserData(req)
            const index = `${process.env.ENV}-subs`
            let checkDoc = await db.getDoc(index, docID)

            //If Doc exists
            if(JSON.stringify(checkDoc.data) === "{}") {
                console.error(`Doc: ${req.params.docID} , is not found`)
                console.trace()
                logger.logEndpoint(404, req, undefined)
                res.send({ status: 404, message: "Doc is not found" })
            } else {
                let data = checkDoc.data
                for(let field in req.body){
                    data[field] = req.body[field]
                }

                let i = data.users.indexOf(`${userData.user}`)
                if(i !== -1){
                    data.users.splice(i, 1)
                }

                let result = {}
                console.log(data)
                if(data.users.length === 0){
                    result = await db.deleteDoc(index, docID)
                } else {
                    result = await db.updateDoc(index, data, docID)
                }

                //Response
                if(result?.status && result.status === 200){
                    logger.logEndpoint(201, req, undefined)
                    res.send({ status: 200, data: result.data })
                } else {
                    logger.logEndpoint(result.response.status, req, undefined)
                    res.send({ "message": `Attempt to reach ES instance at ${target.url} has failed`})
                }
            }
        } catch (err){
            console.error(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500 })
        }
    })
}

const postOrUpdateSub = async function(index, doc, queryRes){
    if(queryRes.data.hits.hits.length === 0){
        return await db.postDoc(index, doc)
    } else {
        let hit = queryRes.data.hits.hits[0]
        let doc = queryRes.data.hits.hits[0]._source
        if(doc.users.includes(userData.user)){
            let result = {
                status: 409,
                data: {
                    "message": "user is already subscribed"
                }
            }
            return result
        } else {
            doc.users.push(userData.user)
            return await db.updateDoc(index, doc, hit._id)
        }
    }
}

const createAndPostSub = async function(index, doc, userData){
    let createIndex = await db.createIndex(index)
    //Response
    if(createIndex?.status && createIndex.status === 200){
        let result = await db.postDoc(index, doc)

        //Response
        if(result?.status && result.status === 201){
            logger.logEndpoint(201, req, userData)
            res.send({ status: 201, "message": `Index and Doc posted successfully`, data: result.data })
        } else {
            logger.logEndpoint(result.response.status, req, userData)
            res.send({ status: 500, "message": `Index created but posting doc failed`})
        }
    } else {
        logger.logEndpoint(createIndex.response.status, req, undefined)
        res.send({ status: 500, "message": `Attempt to store alert has failed`})
    }
}

module.exports = alertSubEndpoints
