let environment = {
    taxiiServer: {
        url: process.env.TAXII_URL,
        username: process.env.TAXII_USER,
        password: process.env.TAXII_PASS,
        a1ApiRoot: process.env.TAXII_A1_API_ROOT,
        a1ChildRoot: `${process.env.TAXII_URL}taxii/${process.env.TAXII_API_VERSION}/${process.env.TAXII_A1_API_ROOT}/`,
        ctiCollectionId: process.env.TAXII_A1_CTI_ID,
        a1CollectionId: process.env.TAXII_A1_COL_ID,
        a1RawCollectionId: process.env.TAXII_A1_RAW_ID,
        apiVersion: process.env.TAXII_API_VERSION,
        adminRoleName: process.env.TAXII_ADMIN_ROLE,
        required: JSON.parse(JSON.stringify(process.env.TAXII_REQUIRED))
    },
    adminServer: {
        url: process.env.TAXII_URL,
        username: process.env.TAXII_USER,
        password: process.env.TAXII_PASS,
        apiVersion: process.env.TAXII_ADMIN_VERSION,
        baselineGroup: process.env.TAXII_BASELINE_GROUP,
    },
    extensionSchema: {
        url: `${process.env.TAXII_URL}ext/${process.env.TAXII_EXT_VERSION}/schema/`,
        username: process.env.TAXII_USER,
        password: process.env.TAXII_PASS,
    },
    aisTaxiiProxy: {
        url: process.env.AIS_URL,
        username: process.env.AIS_USER,
        password: process.env.AIS_PASS,
        required: JSON.parse(JSON.stringify(process.env.AIS_REQUIRED))
    },
    quicksight: {
        enabled: process.env.QUICKSIGHT_ENABLED,
        dashboardId: process.env.QUICKSIGHT_DASHBOARD,
        userArn: process.env.QUICKSIGHT_USER_ARN,
        apiGatewayUrl: process.env.QUICKSIGHT_API_URL,
        resetDisabled: process.env.QUICKSIGHT_RESET_DISABLED,
        undoRedoDisabled: process.env.QUICKSIGHT_UNDO_REDO,
    },
    // cmaServer: {
    //     url: process.env.CMA_FRONT_URL,
    //     username: process.env.CMA_USER,
    //     password: process.env.CMA_PASS,
    //     required: JSON.parse(JSON.stringify(process.env.CMA_REQUIRED))
    // },
    disabledTaxiiServers: [],
    mispServer: {
        url: process.env.MISP_URL
    }
}

const db = require('../database/db')
const getUserData = require('../functions/get-user-data')

const envEndpoints = function(app, logger){
    app.get('/get-env', async (req, res) => {
        try {
            environment.lastAccess = await updateLastAccess(req)
            environment.disabledTaxiiServers = await getDesiabledTaxiiServers()

            let result = JSON.stringify(environment)
            result = btoa(result)

            logger.logEndpoint(200, req, undefined)
            res.send({ result: result })

        } catch(err) {
            console.log(err)
            logger.logEndpoint(500, req, undefined)
            res.send(err)
        }
    })
}

const updateLastAccess = async function(req) {
    return new Promise((resolve, reject) => {
        let now = new Date()
        getUserData(req)
            .then(async (userData) => {
                let doc = {
                    feature: 'last-access',
                    "@created_timestamp": (new Date()).toISOString(),
                    value: now.toString()
                }

                let index = `user-data-${process.env.ENV}-${userData.user}`
                let queryData = {
                    'feature.keyword': 'last-access'
                }

                try {
                    let getDocRes = await db.searchDocs(index, queryData, 1, 0, undefined)

                    if(getDocRes.status === 200 && getDocRes.data.hits.total.value === 1){
                        console.log('UPDATING last access')
                        let docID = getDocRes.data.hits.hits[0]._id

                        await db.updateDoc(index, doc, docID)

                        resolve(getDocRes.data.hits.hits[0]._source.value)
                    } else {
                        console.log('CREATING last access')
                        await db.postDoc(index, doc, undefined)

                        resolve("")
                    }
                } catch(e) {
                    console.error(e)
                    resolve("")
                }
            })
            .catch((err) => {
                reject(err)
            })



    })
}

const getDesiabledTaxiiServers = async function(){
    return new Promise((resolve) => {
        const index = 'disabled-taxii'
        const queryData = {}
        const sortObj = {
            "@created_timestamp": "desc"
        }

        db.searchAllDocs(index, queryData, 15, 0, sortObj)
            .then((getRes) => {
                let arr = []
                for(let server of getRes){
                    arr.push(server._source.url)
                }

                resolve(arr)
            })
            .catch((err) => {
                console.error(err)
                resolve([])
            })
    })
}

module.exports = envEndpoints
