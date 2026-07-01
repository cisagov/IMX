const alertEndpoints = function(app, logger){
    const getUserData = require('../functions/get-user-data')
    const db = require('../database/db')
    const taxii = require('../apis/taxii-server')

    /**
     * gets alerts for current user. Also currently searches manifests and updates alerts accordingly
     * @param {determines how we're sorting alerts} sortKey
     * @param {what hit we start search from for Elasticsearch} from
     * @param {max number of hits to be returned} size
     */
    app.get('/get-alerts/:sortKey/:from/:size', async (req, res) => {
        try {
            let userData = await getUserData(req, process.env)
            const index = `user-data-${process.env.ENV}-${userData.user}`
            const queryData = {
                'feature.keyword': 'alert'
            }
            let size = req.params.size
            let from = req.params.from

            const checkIndex = await db.getIndex(index)

            if(JSON.stringify(checkIndex.data) === "{}"){
                console.log(checkIndex)
                console.trace()
                logger.logEndpoint(404, req, userData)
                res.send({ status: 404, message: "User does not have any alerts"})
            } else {
                setTimeout(async function(){
                    const result = await db.searchDocs(index, queryData, size, from, {"@created_timestamp": "desc"})

                    if(!result.status){
                        console.log(result)
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
                        res.send({ "message": `Attempt to reach ES instance at ${target.url} has failed`})
                    }
                }, 500)
            }
        } catch(err) {
            console.error(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500 })
        }
    })

    /**
     * Entrypoint to start manifest search. Coordinates alert creation as well
     * @param {data pertinent to the current user, contains username} userData
     * @param {req from hitting the endpoint} req
     * @returns status if able to complete all operations
     */
    const startManifestSearch = async function(userData, req){
        return new Promise((resolve, reject) => {
            //Need to get subs for current user
            getCurrentSubs(userData)
                .then(async (currentSubsRes) => {
                    switch(currentSubsRes.status){
                        case 404:
                        case 500:
                            console.log(currentSubsRes.message)
                            resolve(currentSubsRes)
                            return
                    }

                    //Need to get most recent search for current user and create timestamp
                    let mostRecentSearchRes = await getMostRecentSearch(userData)
                    let timestamp = new Date()
                    let now = new Date()

                    if(mostRecentSearchRes.status === 500){
                        console.log(mostRecentSearchRes)
                        resolve(mostRecentSearchRes)
                        return
                    } else if (mostRecentSearchRes?.data?.hits.hits.length === 0){
                        let createManifestQueryRes = await createManifestQuery(userData, currentSubsRes.hits, timestamp.toISOString())

                        console.log(createManifestQueryRes)
                        resolve(createManifestQueryRes)
                        return
                    }

                    timestamp = new Date(mostRecentSearchRes.data.hits.hits[0]._source.last_updated)

                    //Need to search manifests for target collections w/ timestamp
                    let searchManifestsRes = await searchManifests(currentSubsRes.hits, mostRecentSearchRes.data.hits.hits, timestamp.toISOString(), req)

                    if(searchManifestsRes.status === 500){
                        console.log(searchManifestsRes)
                        resolve(searchManifestsRes)
                        return
                    }

                    //Need to record manifest search timestamp
                    await updateManifestQuery(now.toISOString(), mostRecentSearchRes.data, currentSubsRes.hits, userData)

                    //Need to create alert if manifest results
                    if(searchManifestsRes.results.length === 0){
                        console.log('Alerts were not created')
                        resolve({status: 404})
                    } else {
                        let createAlertsRes = await createAlerts(searchManifestsRes, userData)
                        resolve(createAlertsRes)
                    }
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }

    /**
     * Gets current users subscriptions
     * @param {Current user's data} userData
     * @returns all subscriptions that are assigned to the current user
     */
    const getCurrentSubs = async function(userData){
        const index = `${process.env.ENV}-subs`
        const queryData = {
            'users': `${userData.user}`
        }
        const size = 50
        const from = 0
        const sortObj = {
            '@created_timestamp': 'desc'
        }

        return new Promise((resolve, reject) => {
            db.searchAllDocsArray(index, queryData, size, from, sortObj)
                .then((result) => {
                    //Response
                    if(result.length !== 0){
                        resolve({status: 200, hits: result})
                    } else if (result.length === 0) {
                        resolve({ status: 404, message: `No subscriptions found for user ${userData.user}`})
                    } else {
                        console.log(result)
                        resolve({ status: 404, message: `No results for current User's subscriptions`})
                    }
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }

    /**
     * queries user's index to receive previous search results
     * @param {Contains user's data} userData
     * @returns previous search object or error message
     */
    const getMostRecentSearch = async function(userData){
        const index = `user-data-${process.env.ENV}-${userData.user}`
        const queryData = {
            'feature.keyword': `manifest-query`
        }
        const size = 1
        const from = 0
        const sortObj = {
            '@created_timestamp': 'desc'
        }

        return new Promise((resolve, reject) => {
            db.searchDocs(index, queryData, size, from, sortObj)
                .then((result) => {
                    //Response
                    if(result?.status && result.status === 200){
                        resolve(result)
                    } else {
                        console.log(result)
                        resolve({ status: 500, message: `Error searching for current User's most recent search`})
                    }
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }



    /**
     * organizes query to the Taxii Server for each subscription
     * @param {subscriptions for the current user} subs
     * @param {most recent search object} mostRecentSearchHits
     * @param {new timestamp of search} timestamp
     * @param {req from the client} req
     * @returns status and results array
     */
    const searchManifests = async function(subs, mostRecentSearchHits, timestamp, req){
        return new Promise((resolve, reject) => {
            let resultArray = []
            let queryString = `?added_after=${timestamp}&limit=64`
            let errorFound = false

            //based of each sub contruct query
            for(let i in subs){
                //Exit case, don't need to search brand new subscription
                if(subNotInPrevSearch(subs[i], mostRecentSearchHits)) continue

                let sub = subs[i]._source
                let taxiiUrl = `${sub.taxiiServer}taxii/v2.1-os/${sub.sub.apiRootPath}/collections/${sub.sub.collection}/manifest/${queryString}`

                taxii.searchManifest(taxiiUrl, req)
                    .then((result) => {
                        if(result.status === 200){
                            let tempRes = {
                                status: result.status,
                                hits: result.data.objects ? result.data.objects.length : 0,
                                timestamp: timestamp,
                                query: {
                                    type: 'collection',
                                    apiRoot: sub.sub.apiRootPath,
                                    collectionID: sub.sub.collection,
                                    url: taxiiUrl
                                }
                            }

                            if(tempRes.hits !== 0){
                                resultArray.push(tempRes)
                            }
                        } else {
                            errorFound = true
                        }
                    })
                    .catch((err) => {
                        reject(err)
                    })
            }

            let status = 200
            if(errorFound === true) status = 500

            resolve({status: status, results: resultArray})
        })
    }

    /**
     * Creates previous search object
     * @param {Current user's data} userData
     * @param {Current user's subscriptions} subs
     * @param {timestamp of previous search} timestamp
     * @returns status of attempting to create previous search object
     */
    const createManifestQuery = async function(userData, subs, timestamp){
        const index = `user-data-${process.env.ENV}-${userData.user}`

        let tempDoc = {
            '@created_timestamp': timestamp,
            last_updated: timestamp,
            feature: 'manifest-query',
            subs: subs
        }

        return new Promise((resolve, reject) => {
            db.postDoc(index, tempDoc)
                .then((result) => {
                    if(result?.status === 201){
                        resolve(result)
                    } else {
                        resolve({status: 500, message: 'Error creating manifest query doc'})
                    }
                })
                .catch((err) => {
                    reject(err)
                })

        })
    }

    /**
     * updates previous search object of current user
     * @param {timestamp of now} now
     * @param {response from searching for prev search object} data
     * @param {current user's subscriptions that were queried} subs
     * @param {current user's data} userData
     * @returns response from updateDoc
     */
    const updateManifestQuery = async function(now, data, subs, userData){
        const index = `user-data-${process.env.ENV}-${userData.user}`

        return new Promise((resolve, reject) => {
            let doc = data.hits.hits[0]._source

            doc.last_updated = now
            doc.subs = subs

            db.updateDoc(index, doc, data.hits.hits[0]._id)
                .then((updateRes) => {
                    resolve(updateRes)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }

    /**
     * Create Alerts based off new objects in the Taxii Server Manifests
     * @param {response from search manifests in Taxii Server} searchManifestsRes
     * @param {current user's data} userData
     * @returns status if last object
     */
    const createAlerts = async function(searchManifestsRes, userData){
        const index = `user-data-${process.env.ENV}-${userData.user}`

        return new Promise((resolve, reject) => {
            for(let i in searchManifestsRes.results){
                let result = searchManifestsRes.results[i]
                let tempAlert = result
                tempAlert.feature = 'alert'
                tempAlert.read = false

                db.postDoc(index, tempAlert)
                    .then(() => {
                        if(i == searchManifestsRes.results.length - 1) resolve({status: 200, alertsCreated: searchManifestsRes.results.length})
                    })
                    .catch((err) => {
                        reject(err)
                    })
            }
        })
    }

    /**
     * returns unread alerts
     */
    app.get('/get-unread-alerts', async (req, res) => {
        try {
            let userData = await getUserData(req, process.env)
            const index = `user-data-${process.env.ENV}-${userData.user}`
            const queryData = {
                'feature.keyword': 'alert',
                'read': false
            }
            let size = 15
            let from = 0

            //Searches manifests, create new alerts in necessary
            const startManifestSearchRes = await startManifestSearch(userData, req)
            console.log(startManifestSearchRes)
            switch(startManifestSearchRes.status){
                case 404:
                case 500:
                    res.send(startManifestSearchRes)
                    return
            }

            const checkIndex = await db.getIndex(index)

            if(JSON.stringify(checkIndex.data) === "{}"){
                console.log(checkIndex)
                console.trace()
                logger.logEndpoint(404, req, userData)
                res.send({ status: 404, message: "User does not have any alerts"})
            } else {
                setTimeout(async function(){
                    const result = await db.searchDocs(index, queryData, size, from, {"@created_timestamp": "desc"})

                    if(!result.status){
                        console.log(result)
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
                        res.send({ "message": `Attempt to reach ES instance at ${process.env.DB_URL} has failed`})
                    }
                }, 500)
            }
        } catch(err) {
            console.error(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500 })
        }
    })

    /**
     * Currently not in use, would return status on submitted bundle to a different user than the one who posted (if part of their subscription)
     */
    app.post('/get-status', async(req, res) => {
        try{
            const user = req.body._source.user
            const statusID = req.body._source.status
            let alertObj = req.body

            let userData = await getUserData(req, process.env)

            const index = `user-data-${process.env.ENV}-${user}`
            const queryData = {
                'res': statusID
            }

            try {
                let currUserIndex = `user-data-${process.env.ENV}-${userData.user}`

                let checkDoc = await db.getDoc(currUserIndex, alertObj._id)

                //If Doc exists
                if(JSON.stringify(checkDoc.data) === "{}"){
                    console.log(`Doc: ${req.params.docID} , is not found`)
                    console.trace()
                } else {
                    let data = checkDoc.data

                    data.read = true

                    // //call to ES
                    let result = await db.updateDoc(currUserIndex, data, alertObj._id)

                    //Response
                    if(result?.status && result.status === 200){
                        logger.logEndpoint(201, req, undefined)
                        console.log(result.data)
                    } else {
                        logger.logEndpoint(result.response.status, req, undefined)
                        console.error({ "message": `Attempt to reach ES instance at ${target.url} has failed`})
                    }
                }
            } catch(e){
                console.error(e)
            }

            const checkIndex = await db.getIndex(index)

            if(JSON.stringify(checkIndex.data) === "{}"){
                console.log(checkIndex)
                console.trace()
                logger.logEndpoint(404, req, userData)
                res.send({ status: 404, message: "Status ID does not exist... yikes"})
            } else {
                setTimeout(async function(){
                    const result = await db.searchDocs(index, queryData, 1, 0, {"@created_timestamp": "desc"})

                    if(!result.status){
                        console.log(result)
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
                        res.send({ "message": `Attempt to reach ES instance at ${target.url} has failed`})
                    }
                }, 1000)
            }
        } catch(err) {
            console.error(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500 })
        }
    })

    /**
     * Updates alert if read
     * @param {id of alert} docID
     */
    app.post('/update-alert/:docID', async (req, res) => {
        const docID = req.params.docID
        try {
            const userData = await getUserData(req, process.env)
            const index = `user-data-${process.env.ENV}-${userData.user}`
            let checkDoc = await db.getDoc(index, docID)

            //If Doc exists
            if(JSON.stringify(checkDoc.data) === "{}"){
                console.error(`Doc: ${req.params.docID} , is not found`)
                console.trace()
                logger.logEndpoint(404, req, undefined)
                res.send({ status: 404, message: "Doc is not found" })
            } else {
                let data = checkDoc.data
                data.read = !data.read

                //call to ES
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
            console.error(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500 })
        }
    })
}

/**
 * Determines if the sub was in the previous search
 * @param {data of the current sub being tested} currentSub
 * @param {most recent search @ index 0} mostRecentSearchHits
 * @returns if sub is in previous search object
 */
const subNotInPrevSearch = function(currentSub, mostRecentSearchHits){
    for(let hit of mostRecentSearchHits[0]._source.subs){
        if(hit._id === currentSub._id) return false
    }

    return true
}

module.exports = alertEndpoints
