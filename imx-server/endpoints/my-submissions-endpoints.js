const mySubmissionsEndpoints = function(app, logger){
    const db = require('../database/db')

    const getUserData = require('../functions/get-user-data')

    //Gets number of submissions from user profile if index exists
    app.get('/get-my-submissions-all/:user', async (req, res) => {
        try {
            let userData = await getUserData(req)
            const user = req.params.user

            const index = `submissions`

            const checkIndex = await db.getIndex(index)

            if (JSON.stringify(checkIndex.data) === "{}") {
                logger.logEndpoint(404, req, userData)
                res.status(404).send({status: 404, message: "User does not have any submissions"})
            } else {
                const result = await db.aggregateDocs(index, user)

                const dataToSendBack = {
                    total: result.statusResp.data.hits.total.value,
                    day: [],
                    status: {
                        complete: 0,
                        pending: 0,
                        unknown: 0
                    }
                }

                result.dateResp.data.aggregations.by_day.buckets.forEach((entry) => {
                    const date = entry.key_as_string
                    const count = entry.doc_count

                    if (count > 0)
                        dataToSendBack.day.push({date: date, count: count})
                })

                result.statusResp.data.aggregations.by_status.buckets.forEach((status) => {
                    dataToSendBack.status[status.key] = status.doc_count
                })

                dataToSendBack.status.unknown = dataToSendBack.total - dataToSendBack.status.complete - dataToSendBack.status.pending

                if (result?.status === 200) {
                    logger.logEndpoint(200, req, userData)
                    return res.send({ data: dataToSendBack })
                } else {
                    logger.logEndPoint(result.response.status, req, userData)
                    res.status(500).send({ "message": `Attempt to reach ES instance at ${target.url} has failed`})
                }
            }
        } catch (err) {
            console.log(err)
            logger.logEndpoint(500, req, undefined)
            res.status(500).send({ status: 500})
        }
    })

    //Gets last 10 submissions from user profile if index exists
    app.get('/get-my-submissions/:page/:users', async (req, res) => {
        const page = req.params.page
        const usersStr = req.params.users

        try {
            let userData = await getUserData(req)
            let userArray = usersStr.split('+')
            const index = `submissions`
            const queryData = {
                "terms": {
                    "term": "user.keyword",
                    "arr": userArray
                }
            }

            const size = 10
            let from = 0

            switch(page){
                case 0:
                case 1:
                    break
                default:
                    from = (page - 1) * 10
            }

            const checkIndex = await db.getIndex(index)

            if(JSON.stringify(checkIndex.data) === "{}"){
                console.log(checkIndex)
                console.trace()
                logger.logEndpoint(404, req, userData)
                res.send({ status: 404, message: "User does not have any submissions"})
            } else {
                setTimeout(async function(){
                    const result = await db.searchDocs(index, queryData, size, from, {"@created_timestamp": "desc"})

                    if(!result.status){
                        console.log(result)
                        logger.logEndpoint(500, req, undefined)
                        res.send({ status: 500, message: 'Unable to search database for query. Please create a support request if the issue persists.' })
                        return
                    }

                    switch(result.status){
                        case 400:
                            res.send({ status: 500, message: 'Unable to search database for query. Please create a support request if the issue persists.' })
                            return
                        case 404:
                            res.send({ status: 404, message: 'Unable to find based off query.' })
                            return
                    }

                    for(let i in result.data.hits.hits){
                        let hit = result.data.hits.hits[i]

                        if(hit._source.res) hit._source.res = JSON.parse(hit._source.res)
                        if(hit._source.collection) hit._source.collection = JSON.parse(hit._source.collection)
                    }

                    //Response
                    if(result?.status === 200){
                        logger.logEndpoint(200, req, userData)
                        res.send(result.data.hits)
                    } else {
                        console.log(result)
                        logger.logEndpoint(result.response.status, req, userData)
                        res.send({ "message": `Attempt to reach ES instance at ${target.url} has failed`})
                    }
                }, 1000)
            }
        } catch(err) {
            console.log(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500 })
        }
    })

    //Gets single document by id
    app.get('/get-submission/:docID', async (req, res) => {
        const docID = req.params.docID
        try {
            let userData = await getUserData(req)
            const index = `submissions`

            const checkIndex = await db.getIndex(index)

            if(JSON.stringify(checkIndex.data) === "{}"){
                logger.logEndpoint(404, req, userData)
                res.send({ status: 404, message: "User does not have this submission"})
            } else {
                setTimeout(async function(){
                    const result = await db.getDoc(index, docID)

                    if(result.data){
                        result.data.collection = JSON.parse(result.data.collection)
                        result.data.res = JSON.parse(result.data.res)
                        logger.logEndpoint(200, req, userData)
                        res.send(result.data)
                    } else {
                        logger.logEndpoint(result.response.status, req, userData)
                        res.send({"status":500, "message": `Attempt to reach ES instance has failed`})
                    }
                }, 1000)
            }
        } catch(err) {
            console.error(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500 })
        }
    })

    //Gets last 10 submissions that match query results
    app.get('/search-my-submissions/:query', async (req, res) => {
        try {
            let userData = await getUserData(req)
            const index = `submissions`
            const queryData = {
                'user.keyword': `${userData.user}`
            }
            const size = 10
            const from = 0

            let query = JSON.parse(new Buffer.from(req.params.query, 'base64'))
            for(let field in query){
                if(field === 'name'){
                    queryData[`${field}.keyword`] = query[field]
                } else {
                    queryData[`${field}`] = query[field]
                }
            }

            const checkIndex = await db.getIndex(index)

            if(JSON.stringify(checkIndex.data) === "{}"){
                logger.logEndpoint(404, req, userData)
                res.send({ status: 404, message: "User does not have any submissions"})
            } else {
                const result = await db.searchDocs(index, queryData, size, from, {})

                for(let i in result.data.hits.hits){
                    let hit = result.data.hits.hits[i]
                    if(hit._source.res) hit._source.res = JSON.parse(hit._source.res)
                    if(hit._source.collection) hit._source.collection = JSON.parse(hit._source.collection)
                }

                //Response
                if(result?.status === 200){
                    logger.logEndpoint(200, req, userData)
                    res.send({ data: result.data.hits })
                } else {
                    logger.logEndpoint(result.response.status, req, userData)
                    res.send({ "message": `Attempt to reach ES instance at ${target.url} has failed`})
                }
            }
        } catch(err) {
            console.log(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500 })
        }
    })

    //Posts submission to user profile index, if not already created it creates the index as well
    app.post('/post-my-submission', async (req, res) => {
        try {
            const userData = await getUserData(req)
            const index = `submissions`
            let checkIndex = await db.getIndex(index)

            let doc = {
                "@created_timestamp": (new Date()).toISOString(),
                "feature": 'my-submissions',
                "res": JSON.stringify(req.body.res),
                "type": req.body.type,
                "taxiiServer": req.body.taxiiServer,
                "root": req.body.root,
                "collection": JSON.stringify(req.body.collection),
                "url": req.body.url,
                "userID": userData.user,
                "user": userData.user,
                "docName": req.body.docName,
                "status": req.body.res.status
            }

            //If Index exists
            if((checkIndex.data && JSON.stringify(checkIndex.data) === "{}" )
                || (checkIndex?.response?.data && checkIndex.response.data.status !== 404)){
                let createIndex = await db.createIndex(index)

                //Response
                if(createIndex?.status === 200){
                    let result = await db.postDoc(index, doc)

                    //Response
                    if(result?.status === 201){
                        logger.logEndpoint(201, req, userData)
                        res.send({ status: 201, "message": `Index and Doc posted successfully`, data: result.data })
                    } else {
                        logger.logEndpoint(result.response.status, req, userData)
                        res.send({ status: 500, "message": `Index created but posting doc failed`})
                    }
                } else {
                    logger.logEndpoint(createIndex.response.status, req, undefined)
                    res.send({ status: 500, "message": `Attempt to store submission has failed`})
                }
            } else {
                let result = await db.postDoc(index, doc)

                //Response
                if(result?.status === 201){
                    logger.logEndpoint(201, req, userData)
                    res.send({ status: 201, "message": `Doc posted successfully`, data: result.data })
                } else {
                    logger.logEndpoint(result.response.status, req, userData)
                    res.send({ status: 500, "message": `Attempt to store submission has failed`})
                }
            }
        } catch (err){
            console.log(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, message: 'There was an error communicating with the IMX Server' })
        }
    })

    app.post('/update-my-submission/:docID', async (req, res) => {
        const docID = req.params.docID
        try {
            const index = `submissions`
            let checkDoc = await db.getDoc(index, docID)

            //If Doc exists
            if(JSON.stringify(checkDoc.data) === "{}"){
                console.log(`Doc: ${req.params.docID} , is not found`)
                console.trace()
                logger.logEndpoint(404, req, undefined)
                res.send({ status: 404, message: "Doc is not found" })
            } else {
                let data = checkDoc.data
                data.res = JSON.stringify(req.body.res)
                data.status = req.body.res.status
                data.collection = JSON.stringify(req.body.collection)
                //call to ES
                let result = await db.updateDoc(index, data, docID)

                //Response
                if(result?.status === 200){
                    logger.logEndpoint(201, req, undefined)
                    res.send({ data: result.data })
                } else {
                    logger.logEndpoint(result.response.status, req, undefined)
                    res.send({ "message": `Attempt to reach ES instance at ${target.url} has failed`})
                }
            }
        } catch(err) {
            console.log(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, message: 'There was an error communicating with the IMX Server' })
        }
    })

    app.post('/update-by-status-id/:statusID', async (req, res) => {
        const statusID = req.params.statusID
        try {
            const userData = await getUserData(req)
            const index = `submissions`
            const queryData = {
                'user.keyword': `${userData.user}`,
                'res': statusID
            }

            setTimeout(async function(){
                const findDoc = await db.searchDocs(index, queryData, 1, 0, {})

                if(JSON.stringify(findDoc.data === "{}")){
                    console.log(`Doc: ${req.params.docID} , is not found`)
                    console.trace()
                    logger.logEndpoint(404, req, undefined)
                    res.send({ status: 404, message: "Doc is not found" })
                } else {
                    let docID = findDoc.data.hits.hits[0]._id
                    let data = findDoc.data.hits.hits[0]._source

                    data.res = JSON.stringify(req.body)

                    data.status = req.body.status

                    //call to ES
                    let result = await db.updateDoc(index, data, docID)

                    //Response
                    if(result?.status === 200){
                        logger.logEndpoint(201, req, undefined)
                        res.send({ data: result.data })
                    } else {
                        logger.logEndpoint(result.response.status, req, undefined)
                        res.send({ "message": `Attempt to reach ES instance at ${target.url} has failed`})
                    }
                }
            }, 1000)

        } catch(err) {
            console.log(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, message: 'There was an error communicating with the IMX Server' })
        }
    })

}

module.exports = mySubmissionsEndpoints
