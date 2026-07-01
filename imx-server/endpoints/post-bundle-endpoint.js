const postBundleEndpoints = function(app, logger){
    const db = require('../database/db')
    const taxiiServer = require('../apis/taxii-server')
    const getUserData = require('../helper-functions/get-user-data')

    //Check if can reach IMX Backend
    app.post('/post-bundle', async (req, res) => {
        try{
            //Make call to Taxii
            let tempBundle = req.body.bundle
            let taxiiUrl = req.body.taxiiUrl
            let userData = await getUserData(req)

            let taxiiResult = await taxiiServer.postBundle(tempBundle, taxiiUrl, req)

            if(taxiiResult){
                switch(taxiiResult.status){
                    case 200:
                    case 201:
                    case 202:{

                        //Subscription Query
                        let subscriptions = await getRelevantSubscriptions(taxiiUrl)

                        for(let sub of subscriptions){
                            await createAlerts(sub._source, userData.user, taxiiResult.data, taxiiUrl)
                        }
                        break
                    }
                    default:
                }

                //Send response
                logger.logEndpoint(200, req, undefined)
                res.send(taxiiResult.data ? taxiiResult.data : { status: 500, message: 'There was an error communicating with the TAXII Server' })
            } else {
                logger.logEndpoint(500, req, undefined)
                res.send({ status: 500, message: 'There was an error communicating with the TAXII Server' })
            }
        } catch(err){
            console.log(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, message: 'There was an error communicating with the IMX Server' })
        }
    })

    const getRelevantSubscriptions = async function(url){
        let index = `${process.env.ENV}-subs`
        let sortObj = {
            '@created_timestamp': 'desc'
        }
        let from = 0
        let size = 50 //Will need to be increased or more dynamic as these get larger. (Not worrying about now, will come back and change. worried about initial functionality)

        let splitUrl = url.split('/')
        let apiRoot = splitUrl[5]
        let collectionId = splitUrl[7]

        let collectionQuery = {
            "type.keyword": 'collection',
            "sub.collection.keyword": collectionId,
            "sub.apiRootPath.keyword": apiRoot
        }

        let collectionSubRes = await getCollectionSubscriptions(index, from, size, collectionQuery, sortObj)

        return collectionSubRes
    }

    const getCollectionSubscriptions = async function(index, from, size, queryData, sortObj){
        return new Promise((resolve) => {
            db.searchAllDocs(index, queryData, size, from, sortObj)
                .then((result) => {
                    if(result.length === 0){
                        resolve([])
                    } else {
                        resolve(result)
                    }
                })
                .catch((err) => {
                    console.log(err)
                    resolve(err)

                })
        })

    }

    const createAlerts = async function(sub, currentUser, taxiiResultData, url){
        let tempAlert = {
            '@created_timestamp': (new Date()).toISOString(),
            published: taxiiResultData.request_timestamp,
            feature: 'alert',
            type: sub.type,
            read: false,
            status: taxiiResultData.id,
            user: currentUser,
            data: {}
        }

        if(sub.type === 'collection'){
            let splitUrl = url.split('/')
            let colData = {
                root: splitUrl[5],
                collectionId: splitUrl[7]
            }
            tempAlert.data = colData
        }

        for(let user of sub.users){
            let index = `user-data-${process.env.ENV}-${user}`

            let alertResult = await db.postDoc(index, tempAlert)

            if(alertResult?.status === 201){
                console.log(`Alert created for user: ${user}`)
            } else {
                console.log(`Error Creating alert for user: ${user}`)
            }
        }
    }

}

module.exports = postBundleEndpoints
