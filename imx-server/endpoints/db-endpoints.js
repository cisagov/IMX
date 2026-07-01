const dbEndpoints = function(app, logger){
    const db = require('../database/db')

    const getUserData = require('../functions/get-user-data')
    const getTarget = require('../functions/get-db-data')

    /*********** Get Calls */

    app.get('/check-db', async (req, res) => {

        try {
            let result = await db.check()

            //Response
            if(result?.status === 200){
                logger.logEndpoint(200, req, undefined)
                res.send({ "message": `You have successfully reached the DB instance at ${process.env.DB_URL}`})
            } else {
                logger.logEndpoint(500, req, undefined)
                res.send({ "status": 500, "message": `Attempt to reach DB instance has failed`})
            }
        } catch(err) {
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, error: err })
        }
    })

    /**
     * Gets index pattern settings
     */
    app.get('/get-aliases', async (req, res) => {
        try {
            let result = await db.getAliases()

            //Response
            if(result?.status && result.status === 200){
                logger.logEndpoint(200, req, undefined)
                res.send({ data: result.data })
            } else {
                logger.logEndpoint(500, req, undefined)
                res.send({ "status": result.response.status, "message": `Attempt to reach DB index has failed`})
            }
        } catch(err) {
            console.error(err)
            console.trace()
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500 })
        }


    })

    /**
     * Gets all documents from index at target es
     */
    app.get('/get-all-docs/:index', async (req, res) => {
        const index = req.params.index

        try {
            let result = await db.getAllDocs(index)

            //Response
            if(result?.status && result.status === 200){
                logger.logEndpoint(200, req, undefined)
                res.send({ data: result.data })
            } else {
                logger.logEndpoint(result.response.status, req, undefined)
                res.send({ "status": result.response.status, "message": `Attempt to reach DB index has failed`})
            }
        } catch(err) {
            console.error(err)
            console.trace()
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, error: err })
        }
    })

    /**
     * Gets doc with id from index at target es
     */
    app.get('/get-doc/:index/:docID', async (req, res) => {
        const index = req.params.index
        const docID = req.params.docID

        try {
            let result = await db.getDoc(index, docID)

            //Response
            if(result?.status && result.status === 200){
                logger.logEndpoint(200, req, undefined)
                res.send({ data: result.data })
            } else {
                logger.logEndpoint(result.response.status, req, undefined)
                res.send({ "status": result.response.status, "message": `Attempt to reach DB index has failed`})
            }
        } catch(err) {
            console.error(err)
            console.trace()
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, error: err })
        }
    })

    /**
     * Gets index pattern settings
     */
    app.get('/get-index/:index', async (req, res) => {
        const index = req.params.index

        try {
            let result = await db.getIndex(index)

            //Response
            if(result?.status && result.status === 200){
                logger.logEndpoint(200, req, undefined)
                res.send({ data: result.data })
            } else {
                logger.logEndpoint(500, req, undefined)
                res.send({ "status": 500, "message": `Attempt to reach DB index has failed`})
            }
        } catch(err) {
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, error: err })
        }
    })

    /**
     * Gets last 50 documents from index at target es based off query
     */
    app.get('/search-docs/:index/:query/:strict/:size/:from', async (req, res) => {
        //Params
        const index = req.params.index
        let query = ''
        let queryData = {}
        const strict = req.params.strict
        const size = req.params.size
        const from = req.params.from

        try {
            if(req.params.query !== 'undefined'){
                query = JSON.parse(new Buffer.from(req.params.query, 'base64'))
                for(let field in query){
                    if(strict === 'true'){
                        queryData[`${field}.keyword`] = query[field]
                    } else {
                        queryData[`${field}`] = query[field]
                    }
                }
            }
        } catch(err){
            console.error(err)
            logger.logEndpoint(500, req, undefined)
            res.status(500).send({ err: JSON.stringify(err) })
            return
        }

        try {
            let result = await db.searchDocs(index, queryData, size, from, undefined)

            //Response
            if(result?.status && result.status === 200){
                logger.logEndpoint(200, req, undefined)
                res.send({ data: result.data })
            } else {
                let status = result.response?.status || result.status || 500
                logger.logEndpoint(status, req, undefined)
                res.status(status).send({ "message": `Attempt to reach DB index has failed` })
            }
        } catch(err) {
            console.error(err)
            logger.logEndpoint(500, req, undefined)
            res.status(500).send({ error: JSON.stringify(err) })
        }
    })

    /**
     * Gets logs for user specified
     */
    app.get('/get-logs/:index/:user/:size/:from', async (req, res) => {
        //Params
        const index = req.params.index
        const size = req.params.size
        const from = req.params.from

        const queryData = {
            "user.keyword": req.params.user
        }

        try {
            if(target){
                //call to ES
                let result = await db.searchDocs(target, index, queryData, size, from)

                //Response
                if(result?.status && result.status === 200){
                    logger.logEndpoint(200, req, undefined)
                    res.send({ data: result.data })
                } else {
                    logger.logEndpoint(result.response.status, req, undefined)
                    res.send({ "status": result.response.status, "message": `Attempt to reach ES index has failed`})
                }
            } else {
                logger.logEndpoint(404, req, undefined)
                res.send({
                    "message": `target or user not found`,
                    "status": 404
                })
            }
        } catch(err) {
            console.error(err)
            console.trace()
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, error: JSON.stringify(err) })
        }
    })

    /********** Post Calls */

    /**
     * Creates index with name at req.body.index
     */
    app.post('/create-index/:target', async (req, res) => {
        const target = getTarget(req, res, logger)
        const index = req.body.index
        console.log(req.body)
        try {
            if(target?.can_write === 'true'){
                //call to ES
                let result = await db.createIndex(target, index)

                //Response
                if(result?.status === 200){
                    logger.logEndpoint(200, req, undefined)
                    res.send({ data: result.data })
                } else {
                    logger.logEndpoint(result.response.status, req, undefined)
                    res.send({ "status": result.response.status, "message": `Attempt to reach ES index has failed`})
                }
            } else {
                let status = {
                    status: 404,
                    message: "ES instance not found"
                }
                if(target?.can_write === 'false'){
                    status.status = 405
                    status.message = "ES instance is not writable"
                }


                console.error(`Target: ${req.params.target} , is not found or is not writable`)
                console.trace()
                logger.logEndpoint(status.status, req, undefined)
                res.send(status)
            }
        } catch (err){
            console.error(err)
            console.trace()
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500 })
        }
    })

    /**
     * Posts to index that already exists
     */
    app.post('/post-doc/:target/:index', async (req, res) => {
        const target = getTarget(req, res, logger)
        const index = req.params.index
        try {
            if(target?.can_write === 'true'){
                const userData = await getUserData(req)
                let checkIndex = await db.getIndex(target, index)

                let doc = {
                    "@created_timestamp": (new Date()).toISOString(),
                    "user": userData.user,
                    "data": data
                }

                //If Index exists
                if(JSON.stringify(checkIndex.data) === "{}"){
                    console.error(`Index: ${req.params.index} , is not found`)
                    console.trace()
                    logger.logEndpoint(404, req, userData)
                    res.send({ status: 404, message: "Index is not found" })
                } else {
                    //call to ES
                    let result = await db.postDoc(target, index, doc)

                    //Response
                    if(result?.status === 201){
                        logger.logEndpoint(201, req, userData)
                        res.send({ data: result.data })
                    } else {
                        logger.logEndpoint(result.response.status, req, userData)
                        res.send({ "status": result.response.status, "message": `Attempt to reach ES index has failed`})
                    }
                }
            } else {
                let status = {
                    status: 404,
                    message: "ES instance not found"
                }
                if(target?.can_write === 'false'){
                    status.status = 405
                    status.message = "ES instance is not writable"
                }


                console.error(`Target: ${req.params.target} , is not found or is not writable`)
                console.trace()
                logger.logEndpoint(status.status, req, undefined)
                res.send(status)
            }
        } catch (err){
            console.error(err)
            console.trace()
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500 })
        }
    })

    /**
     * Posts to update document
     */
    app.post('/update-doc/:target/:index/:docID', async (req, res) => {
        const target = getTarget(req, res, logger)
        const index = req.params.index
        const docID = req.params.docID

        try {
            if(target?.can_write === 'true'){
                let checkDoc = await db.getDoc(target, index, docID)

                //If Index exists
                if(JSON.stringify(checkDoc.data) === "{}"){
                    console.log(`Doc: ${req.params.docID} , is not found`)
                    console.trace()
                    logger.logEndpoint(404, req, undefined)
                    res.send({ status: 404, message: "Doc is not found" })
                } else {
                    //call to ES
                    let result = await db.updateDoc(target, index, req.body, docID)

                    //Response
                    if(result?.status === 200){
                        logger.logEndpoint(201, req, undefined)
                        res.send({ data: result.data })
                    } else {
                        logger.logEndpoint(result.response.status, req, undefined)
                        res.send({ "status": result.response.status, "message": `Attempt to reach ES index has failed`})
                    }
                }
            } else {
                let status = {
                    status: 404,
                    message: "ES instance not found"
                }
                if(target?.can_write === 'false'){
                    status.status = 405
                    status.message = "ES instance is not writable"
                }

                console.error(`Target: ${req.params.target} , is not found or is not writable`)
                console.trace()
                logger.logEndpoint(status.status, req, undefined)
                res.send(status)
            }
        } catch (err){
            console.error(err)
            console.trace()
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500 })
        }
    })


    /*********** Delete Calls */

    /**
     * Deletes index and its contents
     */
    app.delete('/delete-index/:target/:index', async (req, res) => {
        const target = getTarget(req, res, logger)
        const index = req.params.index

        try {
            if(target?.can_write === 'true'){
                //call to ES
                let result = await db.deleteIndex(target, index)

                //Response
                if(result?.status === 200){
                    logger.logEndpoint(200, req, undefined)
                    res.send({ data: result.data })
                } else {
                    logger.logEndpoint(result.response.status, req, undefined)
                    res.send({ "status": result.response.status, "message": `Attempt to reach ES index has failed`})
                }
            } else {
                console.log(target)
                let status = {
                    status: 404,
                    message: "ES instance not found"
                }
                if(target?.can_write === 'false'){
                    status.status = 405
                    status.message = "ES instance is not writable"
                }


                console.error(`Target: ${req.params.target} , is not found or is not writable`)
                console.trace()
                logger.logEndpoint(status.status, req, undefined)
                res.send(status)
            }
        } catch (err){
            console.error(err)
            console.trace()
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, error: JSON.stringify(err) })
        }
    })

    /**
     * Deletes document @ id within index
     */
    app.delete('/delete-docs/:target/:index/:docID', async (req, res) => {
        const target = getTarget(req, res, logger)
        const index = req.params.index
        const docID = req.params.docID

        try {
            if(target?.can_write === 'true'){
                //call to ES
                let result = await db.deleteDoc(target, index, docID)

                //Response
                if(result?.status === 200){
                    logger.logEndpoint(200, req, undefined)
                    res.send({ data: result.data })
                } else {
                    logger.logEndpoint(result.response.status, req, undefined)
                    res.send({ "status": result.response.status, "message": `Attempt to reach ES index has failed`})
                }
            } else {
                let status = {
                    status: 404,
                    message: "ES instance not found"
                }
                if(target?.can_write === 'false'){
                    status.status = 405
                    status.message = "ES instance is not writable"
                }

                console.error(`Target: ${req.params.target} , is not found or is not writable`)
                console.trace()
                logger.logEndpoint(status.status, req, undefined)
                res.send(status)
            }
        } catch (err){
            console.error(err)
            console.trace()
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, error: JSON.stringify(err) })
        }
    })

}

module.exports = dbEndpoints
