const axios = require('axios')

// params = {
// index: STRING
// user: STRING
// }
function aggregateDocs(params) {
    const queryStatus = {
        "size": 0,
        "query": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "user.keyword": {
                            "value": params.user
                            }
                        }
                    },
                ]
            }
        },
        "aggs": {
            "by_status": {
            "terms": {
                "field": "status.keyword"
            }
            }
        }
    }
    const queryDate = {
        "size": 0,
        "query": {
            "bool": {
            "must": [
                {
                "term": {
                    "user.keyword": {
                    "value": params.user
                    }
                }
                },
                {
                "range": {
                    "@created_timestamp": {
                    "gte": "now-30d/d",
                    "lte": "now/d"
                    }
                }
                }
            ]
            }
        },
        "aggs": {
            "by_day": {
            "date_histogram": {
                "field": "@created_timestamp",
                "calendar_interval": "day"
            }
            }
        }
    }

    if (!params.index) return undefined

    return new Promise((resolve, reject) => {
        let headers = {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        }

        //Query for status aggregation
        axios.get(`${process.env.DB_URL}${params.index}/_search`, { headers: headers, data: queryStatus })
            .then((resp) => {
                console.log(`${resp.data.hits.total.value} docs retrieved for: ${JSON.stringify(queryStatus)}`)
                console.trace()

                //Query for date aggregation
                axios.get(`${process.env.DB_URL}${params.index}/_search`, { headers: headers, data: queryDate })
                    .then((dateResp) => {
                        console.log(`${dateResp.data.hits.total.value} docs retrieved for: ${JSON.stringify(queryDate)}`)
                        console.trace()
                        let status
                        if (resp.status === 200 && dateResp.status === 200)
                            status = 200
                        else if (resp.status === 200 && dateResp.status !== 200)
                            status = dateResp.status
                        else if (resp.status !== 200 && dateResp.status === 200)
                            status = resp.status
                        else
                            status = 500

                        resolve({
                            status: status,
                            statusResp: resp,
                            dateResp: dateResp
                        })
                    })
                    .catch((err) => {
                        console.error(err)
                        console.error(`Error searching index for: ${JSON.stringify(queryDate)}` )
                        console.trace()
                        try{
                            if(err.status === 404){
                                resolve({ status: 404 })
                                return
                            }
                            if(err.response.data.error.root_cause[0].reason.includes('[@created_timestamp]')){
                                let new_err = {
                                    status: 404,
                                    message: 'No saved bundles for user'
                                }

                                console.error(err.response.data.error.root_cause[0].reason)
                                console.error(new_err)
                                resolve(new_err)
                            }
                        } catch(e){
                            console.error(e)
                            resolve(e)
                        }
                    })
            })
            .catch((err) => {
                console.error(err)
                console.error(`Error searching index for: ${JSON.stringify(queryStatus)}` )
                console.trace()
                try{
                    if(err.status === 404){
                        resolve({ status: 404 })
                        return
                    }
                    if(err.response.data.error.root_cause[0].reason.includes('[@created_timestamp]')){
                        let new_err = {
                            status: 404,
                            message: 'No saved bundles for user'
                        }

                        console.error(err.response.data.error.root_cause[0].reason)
                        console.error(new_err)
                        resolve(new_err)
                    }
                } catch(e){
                    console.error(e)
                    resolve(e)
                }
            })

    })
}

// params = undefined
function check(params) {
    return new Promise((resolve, reject) => {
        let headers = {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        }

        axios.get(`${process.env.DB_URL}`, {headers: headers})
        .then((resp) => {
            resolve(resp)
        })
        .catch((err) => {
            reject(err)
        })
    })
}

// params = {
// index: STRING
// }
function createIndex(params){
    return new Promise((resolve, reject) => {
        let headers = {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        }

        axios.put(`${process.env.DB_URL}${params.index}`, {}, { headers: headers })
        .then((resp) => {
            console.info(`${params.index} created for: ${process.env.DB_URL}`)
            console.trace()
            resolve(resp)
        })
        .catch((err) => {
            console.error(err)
            console.error(`Error creating index for: ${process.env.DB_URL}${params.index}` )
            console.trace()
            reject(err)
        })
    })
}

// params = {
// repoName: STRING
// }
function createSnapshotRepo(params){
    return new Promise((resolve, reject) => {
        let headers = {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        }

        let data = {
            "type": "fs",
            "settings": {
                "location": "/opt/snapshots"
            }
        }

        try {
            axios.post(`${process.env.DB_URL}_snapshot/${params.repoName}`, data, { headers: headers })
                .then((resp) => {
                    if(resp.status === 200) console.log('SUCCESS. Snapshot repo created')
                    resolve(resp)
                })
                .catch((err) => {
                    reject(err)
                })
        } catch(err) {
            reject(err)
        }
    })
}

// params = {
// docId: STRING
// index: STRING
// }
function deleteDoc(params){

    return new Promise((resolve, reject) => {
        let headers = {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        }

        axios.delete(`${process.env.DB_URL}${params.index}/_doc/${params.docId}`, { headers: headers })
        .then((resp) => {
            console.info(`${params.docId} deleted at ${params.index} for: ${process.env.DB_URL}`)
            console.trace()
            resolve(resp)
        })
        .catch((err) => {
            console.error(`Error deleting for: ${process.env.DB_URL}${params.index}` )
            console.trace()
            reject(err)
        })
    })
}

// params = {
// index: STRING
// }
function deleteIndex(params){

    return new Promise((resolve, reject) => {
        const headers = {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        }

        axios.delete(`${process.env.DB_URL}${params.index}`, { headers: headers })
            .then((resp) => {
                console.info(`${params.index} deleted for: ${process.env.DB_URL}`)
                console.trace()
                resolve(resp)
            })
            .catch((err) => {
                console.error(`Error deleting index for: ${process.env.DB_URL}` )
                console.trace()
                reject(err)
            })
    })
}

// params = undefined
function getAliases(params) {
    return new Promise((resolve, reject) => {
        let headers = {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        }

        axios.get(`${process.env.DB_URL}_aliases`, {headers: headers})
        .then((resp) => {
            resolve(resp)
        })
        .catch((err) => {
            reject(err)
        })
    })
}

// params = {
// index: STRING
// }
function getAllDocs(params){
    return new Promise((resolve, reject) => {
        let headers = {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        }
        const data = {
            "size": 50,
            "query": {
                "match_all": {}
            }
        }

        axios.get(`${process.env.DB_URL}${params.index}*/_search`, { headers: headers, data: data })
        .then((resp) => {
            console.info(`Docs retrieved`)
            console.trace()
            resolve(resp)
        })
        .catch((err) => {
            console.error(`Error retrieving docs `)
            console.trace()
            reject(err)
        })
    })
}

function getAuthHeader(){
    let string = `${process.env.DB_USER}:${process.env.DB_PASS}`

    return `Basic ${Buffer.from(string).toString('base64')}`
}

// params = {
// docId: STRING
// index: STRING
// }
function getDoc(params){

    return new Promise((resolve, reject) => {
        let headers = {
            'Authorization': getAuthHeader(),
        }

        axios.get(`${process.env.DB_URL}${params.index}/_source/${params.docId}`, { headers: headers })
        .then((resp) => {
            console.log(`Doc with ID ${params.docId} retrieved`)
            console.trace()
            resolve(resp)
        })
        .catch((err) => {
            console.error(`Error retrieving doc `)
            console.trace()
            resolve(err)
        })
    })
}

// params = {
// index: STRING
// }
function getIndex(params){
    return new Promise((resolve, reject) => {
        let headers = {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        }

        axios.get(`${process.env.DB_URL}${params.index}`, {headers: headers})
        .then((resp) => {
            resolve(resp)
        })
        .catch((err) => {
            reject(err)
        })
    })
}

// params = {
// doc: OBJECT
// docId: STRING
// index: STRING
// }
function postDoc(params){

    return new Promise((resolve, reject) => {
        let headers = {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        }
        const postURL = (params.docId) ? `${process.env.DB_URL}${params.index}/_doc/${params.docId}` : `${process.env.DB_URL}${params.index}/_doc`

        axios.post(postURL, params.doc, { headers: headers })
        .then((resp) => {
            console.info(`Doc posted at ${params.index}`)
            console.trace()
            resolve(resp)
        })
        .catch((err) => {
            console.error(`Error posting doc for: ${process.env.DB_URL}${params.index}` )
            console.trace()
            reject(err)
        })
    })
}

// params = {
// from: INTEGER
// index: STRING
// queryData: OBJECT
// size: INTEGER
// sort: STRING
// }
function searchAllDocs(params){
    return new Promise((resolve, reject) => {
        //Get First set of query to determine number of hits (ES will return total hits, but not all if they exceed the size)
        searchDocs(params)
            .then(async (initResp) => {
                let allDocs = []

                if(initResp.data){
                    //Determine number of iterations required, set allDocs
                    allDocs = initResp.data.hits.hits
                    let total = initResp.data.hits.total.value
                    let iterations = Math.ceil(total/size)

                    //Loop through until all hits are grabbed and pushed into allDocs
                    for(let i=1; i<iterations; i++){
                        let newParams = {
                            index: params.index,
                            queryData: params.queryData,
                            size: params.size,
                            from: (i*size),
                            sort: undefined
                        }
                        let newResp = await searchDocs(newParams)

                        if(newResp.data){
                            for(let hit of newResp.data.hits.hits){
                                allDocs.push(hit)
                            }
                        }
                    }
                }

                //Return allDocs once complete
                resolve(allDocs)
            })
            .catch((err) => {
                reject(err)
            })

    })
}

// params = {
// from: INTEGER
// index: STRING
// queryData: OBJECT
// size: INTEGER
// sort: STRING
// }
function searchAllDocsArray(params){
    return new Promise((resolve, reject) => {
        //Get First set of query to determine number of hits (ES will return total hits, but not all if they exceed the size)
        searchDocsArray(params)
            .then(async (initResp) => {
                let allDocs = []

                if(initResp.data){
                    //Determine number of iterations required, set allDocs
                    allDocs = initResp.data.hits.hits
                    let total = initResp.data.hits.total.value
                    let iterations = Math.ceil(total/size)

                    //Loop through until all hits are grabbed and pushed into allDocs
                    for(let i=1; i<iterations; i++){
                        let newParams = {
                            index: params.index,
                            queryData: params.queryData,
                            size: params.size,
                            from: (i*params.size),
                            sort: params.sort
                        }
                        let newResp = await searchDocsArray(newParams)

                        if(newResp.data){
                            for(let hit of newResp.data.hits.hits){
                                allDocs.push(hit)
                            }
                        }
                    }
                }

                //Return allDocs
                resolve(allDocs)
            })
            .catch((err) => {
                reject(err)
            })

    })
}

// params = {
// from: INTEGER
// index: STRING
// queryData: OBJECT
// size: INTEGER
// sort: STRING
// }
function searchDocs(params){
    if(!params.index) return undefined

    return new Promise((resolve, reject) => {
        let headers = {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        }

        let searchData = {
            "from": params.from,
            "size": params.size,
            "sort": params.sort,
            "query": {
                "bool": {
                    "must": []
                }
            }
        }

        for(let field in params.queryData){
            switch(field){
                case 'terms': {
                    let term = params.queryData[field].term
                    let terms = {}
                    terms[term] = params.queryData[field].arr

                    searchData["query"] = {
                        "terms": terms,
                        "bool": {
                            "must": []
                        }
                    }
                    break
                }
                case 'filter': {
                    let term1 = params.queryData[field].term
                    searchData.query.bool["filter"] = []

                    for(let val of params.queryData[field].arr){
                        if(val === "") continue

                        let temp1 = {}
                        temp1[term1] = val
                        let temp2 = {
                            "term": temp1
                        }

                        searchData.query.bool.filter.push(temp2)
                    }
                    break
                }
                case 'query_string':
                    searchData.query.bool.must.push({ query_string: params.queryData[field] })
                    break
                case 'wildcard':
                    searchData.query.bool.must.push({ wildcard: params.queryData[field] })
                    break
                case 'term':
                    searchData.query.bool.must.push({ "term": params.queryData[field] })
                    break
                default: {
                    let temp = {}
                    temp[`${field}`] = params.queryData[field]
                    searchData.query.bool.must.push({"match_phrase": temp})
                }
            }
        }

        if(searchData.query.bool.must.length === 0) {
            delete searchData.query.bool

            if(JSON.stringify(searchData.query) === '{}'){
                delete searchData.query
            }
        }

        axios.get(`${process.env.DB_URL}${params.index}/_search`, { headers: headers, data: searchData })
        .then((resp) => {
            console.log(`${resp.data.hits.total.value} docs retrieved for: ${JSON.stringify(params.queryData)}`)
            console.trace()
            resolve(resp)
        })
        .catch((err) => {
            console.error(err)
            console.error(`Error searching index for: ${JSON.stringify(params.queryData)}` )
            console.trace()
            try{
                if(err.status === 404){
                    resolve({ status: 404 })
                    return
                }
                if(err.response.data.error.root_cause[0].reason.includes('[@created_timestamp]')){
                    let new_err = {
                        status: 404,
                        message: 'No saved bundles for user'
                    }

                    console.error(err.response.data.error.root_cause[0].reason)
                    console.error(new_err)
                    resolve(new_err)
                }
            } catch(e){
                console.error(e)
                resolve(e)
            }
        })
    })
}

// params = {
// from: INTEGER
// index: STRING
// queryData: OBJECT
// size: INTEGER
// sort: STRING
// }
function searchDocsArray(params){
    // If not config or index query cannot be run. Safeguard for prod data from dev server
    if(!params.index) return undefined

    return new Promise((resolve, reject) => {
        let headers = {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        }

        //Creating searchData. From, size, sort, and filter info
        const searchData = {
            "from": params.from,
            "size": params.size,
            "sort": params.sort,
            "query": {}
        }
        for(let field in params.queryData){
            let temp = {}
            temp[`${field}`] = params.queryData[field]
            searchData.query['match'] = temp
        }

        //SEARCH!!!
        axios.get(`${process.env.DB_URL}${params.index}*/_search`, { headers: headers, data: searchData })
        .then((resp) => {
            console.log(`${resp.data.hits.total.value} docs retrieved for: ${JSON.stringify(params.queryData)}`)
            console.trace()
            resolve(resp)
        })
        .catch((err) => {
            console.log(`Error searching index for: ${JSON.stringify(params.queryData)}` )
            console.trace()
            resolve(err)
        })
    })
}

// params = {
// data: OBJECT
// docId: STRING
// index: STRING
// }
function updateDoc(params){

    return new Promise((resolve, reject) => {
        let headers = {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        }

        let update = {
            "doc": {
                '@updated_timestamp': (new Date()).toISOString()
            }
        }

        for(let field in params.data){
            update.doc[field] = params.data[field]
        }

        axios.post(`${process.env.DB_URL}${params.index}/_update/${params.docId}`, update, { headers: headers })
        .then((resp) => {
            console.log(`Doc ${params.docId} updated at ${params.index}`)
            console.trace()
            resolve(resp)
        })
        .catch((err) => {
            console.error(`Error updating doc for: ${process.env.DB_URL}` )
            console.trace()
            reject(err)
        })
    })
}

//All functions that are being exported
module.exports = { check, createSnapshotRepo, getAliases, getIndex, createIndex, deleteIndex, getAllDocs, searchDocs, searchAllDocs, searchAllDocsArray, searchDocsArray, postDoc, deleteDoc, getDoc, updateDoc, aggregateDocs }
