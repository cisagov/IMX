const errorHandler = require('../functions/error-handler')
const db = require("../database/db")

const getSortObj = function(sortKey){
    let sortObj = {}

    if(sortKey === 'na'){
        sortObj["@created_timestamp"] = "desc"
    } else {
        let splitKey = sortKey.split('-')

        if (splitKey[0] === 'modified' || splitKey[0] === 'created'){
            sortObj[`${splitKey[0]}_date`] = splitKey[1]
        } else if (splitKey[2] === 'string'){
            sortObj[`${splitKey[0]}.keyword`] = splitKey[1]
        } else {
            sortObj[splitKey[0]] = splitKey[1]
        }
    }

    return sortObj
}

const getTempRes = function(result, message, status){
    try{
        if(result.response.data.error.root_cause[0].reason === 'No mapping found for [@created_timestamp] in order to sort on'){
            message = 'No saved bundles for user'
            status = 404
        }
    } catch(err){
        console.error(err)
    }

    let tempRes = {
        message: message,
        status: status
    }

    return tempRes
}

const formatHit = async function(hit, index){
    //Add check to make sure sortable dates have the right format
    if(!hit._source.created_date || !hit._source.modified_date || hit._source.modified_date === ''){
        if(hit._source.modified === ''){
            hit._source.modified_date = null
        } else {
            hit._source.modified_date = (new Date(hit._source.modified)).toISOString()
        }

        hit._source.created_date = (new Date(hit._source.created)).toISOString()
        console.log(`Updated ${hit._id} to have _date field`)

        await db.updateDoc(index, hit._source, hit._id)
    }

    return hit
}

const savedBundlesEndpoints = function(app, logger){
    const getUserData = require('../functions/get-user-data')

    //Gets last 100 saved bundles from user profile if index exists
    app.get('/get-saved-bundles/:sortKey/:from/:size/:users', async (req, res) => {
        try {
            let userData = await getUserData(req)
            const index = `saved-bundles`
            const size = req.params.size
            const from = req.params.from
            const sortKey = req.params.sortKey

            const usersStr = req.params.users
            console.log(userData)
            let userArray = usersStr == 'undefined' ? [ userData.user ] : usersStr.split('+')

            const queryData = {
                "terms": {
                    "term": "user.keyword",
                    "arr": userArray
                }
            }

            const checkIndex = await db.getIndex(index)

            if(JSON.stringify(checkIndex.data) === "{}"){
                logger.logEndpoint(404, req, userData)
                res.send({ status: 404, message: "User does not have any saved bundles"})
            } else {
                setTimeout(async function(){
                    let sortObj = getSortObj(sortKey)

                    const result = await db.searchDocs(index, queryData, size, from, sortObj)

                    if(!result.status){
                        logger.logEndpoint(500, req, undefined)
                        res.send({ status: 500, message: 'Unable to search database for query. Please create a support request if the issue persists.' })
                        return
                    } else if (!result.data){
                        let message = 'Something went wrong in retrieving saved bundles. Please create a support request if the issue persists.'
                        let tempRes = getTempRes(result, message, result.status)
                        message = tempRes.message
                        result.status = tempRes.status

                        logger.logEndpoint(result.status ? result.status : 500, req, undefined)
                        res.send({ status: result.status ? result.status : 500, message: message })
                        return
                    }

                    if(result?.status === 400){
                        logger.logEndpoint(result.status, req, undefined)
                        res.send({ status: result.status, message: 'Unexpected Error with Database. Please create a support request if the issue persists.' })
                        return

                    }

                    for(let i in result.data.hits.hits){
                        let hit = await formatHit(result.data.hits.hits[i], index)

                        hit._source.bundle = JSON.parse(hit._source.bundle)
                    }

                    if(result?.status && result.status === 200){
                        logger.logEndpoint(200, req, userData)
                        res.send(result.data.hits)
                    } else {
                        logger.logEndpoint(result.response.status, req, userData)
                        res.send({ "message": `Attempt to reach DB instance at ${process.env.DB_URL} has failed`})
                    }
                }, 1000)
            }
        } catch(err) {
            console.error(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500 })
        }
    })

    //Implementing wildcard search
    app.get('/search-saved-bundles/:query/:sortkey/:from/:size/:users', async (req, res) => {
        try {
            let userData = await getUserData(req)
            const index = `saved-bundles`
            const size = req.params.size
            const from = req.params.from
            const sortKey = req.params.sortkey

            const usersStr = req.params.users
            let userArray = usersStr.split('+')
            const queryData = {
                "filter": {
                    "term": "user.keyword",
                    "arr": userArray
                }
            }

            let query = JSON.parse(new Buffer.from(req.params.query, 'base64'))

            for(let field in query){
                if(field === 'name'){
                    queryData[`${field}.keyword`] = query[field]
                } else {
                    queryData[`${field}`] = query[field]
                }
            }

            let sortObj = getSortObj(sortKey)

            const checkIndex = await db.getIndex(index)

            if(JSON.stringify(checkIndex.data) === "{}"){
                logger.logEndpoint(404, req, userData)
                res.send({ status: 404, message: "User does not have any saved bundles"})
            } else {
                const result = await db.searchDocs(index, queryData, size, from, sortObj)

                //Response
                if(result?.status === 200){
                    for(let i in result.data.hits.hits){
                        let hit = result.data.hits.hits[i]
                        hit._source.bundle = JSON.parse(hit._source.bundle)
                    }

                    logger.logEndpoint(200, req, userData)
                    res.send({ data: result.data.hits })
                } else if(result?.status && result.status === 404){
                    logger.logEndpoint(404, req, userData)
                    res.send({ data: { hits: []} })
                }
                else {
                    console.log(result)
                    logger.logEndpoint(result.response.status, req, userData)
                    res.send({ "message": `Attempt to reach ES instance at ${target.url} has failed`})
                }
            }
        } catch (err) {
            console.log(err)
            return errorHandler(err, req, res, logger)
        }
    })

    //Gets last 100 bundles that match query results
    app.get('/search-saved-bundles/:query/:users', async (req, res) => {
        try {
            let userData = await getUserData(req)
            const index = `saved-bundles`
            const usersStr = req.params.users
            let userArray = usersStr.split('+')
            const queryData = {
                "filter": {
                    "term": "user.keyword",
                    "arr": userArray
                }
            }
            const size = 100
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
                res.send({ status: 404, message: "User does not have any saved bundles"})
            } else {
                const result = await db.searchDocs(index, queryData, size, from, {})

                for(let i in result.data.hits.hits){
                    let hit = result.data.hits.hits[i]
                    hit._source.bundle = JSON.parse(hit._source.bundle)
                }

                //Response
                if(result?.status && result.status === 200){
                    logger.logEndpoint(200, req, userData)
                    res.send({ data: result.data.hits.hits })
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

    const postSavedBundle = async function(req, res, userData, index, doc){
        let result = await db.postDoc(index, doc)

        return result;
    }

    //Posts bundle to user profile index, if not already created it creates the index as well
    app.post('/post-saved-bundle', async (req, res) => {
        try {
            const userData = await getUserData(req)
            const index = `saved-bundles`
            let checkIndex = await db.getIndex(index)

            let mostRecent = {
                reportNo: 0
            }

            try {
                let getMostRecentBundle = await db.searchDocs(index, {}, 1, 0, {"@created_timestamp": "desc"})
                mostRecent = getMostRecentBundle.data.hits.hits[0]._source
            } catch(err){
                console.error(err)
                console.log('Error retrieving Most Recent saved bundle')
            }

            let doc = {
                "@created_timestamp": (new Date()).toISOString(),
                "user": `${userData.user}`
            }

            for(let field in req.body){
                switch(field){
                    case 'reportNo':
                        doc[field] = mostRecent[field]+1
                        break
                    case 'bundle':
                        doc[field] = JSON.stringify(req.body[field])
                        break
                    default:
                        doc[field] = req.body[field]
                }
            }

            //If Index exists
            if((checkIndex.data && JSON.stringify(checkIndex.data) !== "{}")
                || (checkIndex?.response?.data && checkIndex.response.data.status !== 404)){
                const result = await postSavedBundle(req, res, userData, index, doc);

                if(result?.status && result.status === 201){
                    logger.logEndpoint(201, req, userData)
                    res.send({ status: 201, "message": `Doc posted successfully`, data: result.data })
                } else {
                    logger.logEndpoint(result.response.status, req, userData)
                    res.send({ status: 500, "message": `Attempt to store bundle has failed`})
                }
            } else {
                let createIndex = await db.createIndex(index)

                //Response
                if(createIndex?.status === 200){
                    const result = await postSavedBundle(req, res, userData, index, doc);

                    if(result?.status && result.status === 201){
                        logger.logEndpoint(201, req, userData)
                        res.send({ status: 201, "message": `Doc posted successfully`, data: result.data })
                    } else {
                        logger.logEndpoint(result.response.status, req, userData)
                        res.send({ status: 500, "message": `Attempt to store bundle has failed`})
                    }
                } else {
                    logger.logEndpoint(createIndex.response.status, req, undefined)
                    res.send({ status: 500, "message": `Attempt to store bundle has failed`})
                }
            }
        } catch (err){
            console.log(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, message: 'There was an error communicating with the IMX Server' })
        }
    })

    //Updates bundle with specified docID
    app.post('/update-saved-bundle/:docID', async (req, res) => {
        const docID = req.params.docID
        try {
            const index = `saved-bundles`
            let checkDoc = await db.getDoc(index, docID)

            //If Doc exists
            if(JSON.stringify(checkDoc.data) === "{}"){
                console.log(`Doc: ${req.params.docID} , is not found`)
                console.trace()
                logger.logEndpoint(404, req, undefined)
                res.send({ status: 404, message: "Doc is not found" })
            } else {
                let data = checkDoc.data
                for(let field in req.body){
                    if(field === 'bundle'){
                        data[field] = JSON.stringify(req.body[field])
                    } else {
                        data[field] = req.body[field]
                    }
                }

                // //call to ES
                let result = await db.updateDoc(index, data, docID)

                //Response
                if(result?.status && result.status === 200){
                    logger.logEndpoint(201, req, undefined)
                    res.send({ data: result.data })
                } else {
                    logger.logEndpoint(result.response.status, req, undefined)
                    res.send({ "message": `Attempt to reach ES instance at ${target.url} has failed`})
                }
            }
        } catch (err){
            console.log(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500 })
        }
    })

    //Deletes bundle @ id within index
    app.delete('/delete-saved-bundle/:docID', async (req, res) => {
        const docID = req.params.docID
        try {
            const index = `saved-bundles`
            let checkDoc = await db.getDoc(index, docID)

            //If Doc exists
            if(JSON.stringify(checkDoc.data) === "{}"){
                console.log(`Doc: ${req.params.docID} , is not found`)
                console.trace()
                logger.logEndpoint(404, req, undefined)
                res.send({ status: 404, message: "Doc is not found" })
            } else {
                //call to ES
                let result = await db.deleteDoc(index, docID)

                //Response
                if(result?.status && result.status === 200){
                    logger.logEndpoint(200, req, undefined)
                    res.send({ data: result.data })
                } else {
                    logger.logEndpoint(result.response.status, req, undefined)
                    res.send({ "message": `Attempt to reach ES instance at ${target.url} has failed`})
                }
            }
        } catch (err){
            console.log(err)
            console.trace()
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, error: JSON.stringify(err) })
        }
    })

}

module.exports = savedBundlesEndpoints
