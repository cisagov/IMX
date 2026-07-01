const axios = require('axios')
const https = require("node:https")

const testConnection = async function(){
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'Authorization': `Basic ${btoa(`${process.env.A1_USER}:${process.env.A1_PASS}`)}`,
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        }

        axios.get(`${process.env.A1_URL}`, options)
            .then(res => {
                resolve(res.data)
            })
            .catch(error => {
                console.error(error)
                reject(error)
            })
    })
}

const getApiCall = async function(url){
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'Authorization': `Basic ${btoa(`${process.env.A1_USER}:${process.env.A1_PASS}`)}`,
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        }

        try {
            console.info('Attempting A1 API Call')
            axios.get(url, options).then(res => {
                resolve(res.data)
            }).catch(error => {
                console.error(error)
                reject(error)
            })
        } catch(err){
            console.error(err)
            reject(err)
        }
    })
}

const getIndicatorFromA1 = async function (id, pageNum = 1) {
    return new Promise(async (resolve, reject) => {
        try {
            console.info(`Getting indicator for evidence: ${id}, page: ${pageNum}`)
            const url = `${process.env.A1_URL}evidence/${id}/indicator?page=${pageNum}&pageSize=100`;
            const resp = await getApiCall(url);

            if (!resp || !resp.results) {
                return resolve([]);
            }

            if (resp.totalPages > resp.page) {
                return resolve([...resp.results, ...await getIndicatorFromA1(id, pageNum + 1)]);
            } else {
                return resolve(resp.results);
            }
        } catch (e) {
            console.error("Error retrieving indicator: ", id);
            console.error(e);
            return resolve([]);
        }
    })
}

const getDataFromA1 = async function(endpoint, limit) {
    return new Promise((resolve, reject) => {
        getApiCall(`${process.env.A1_URL}${endpoint}`)
            .then(async (initApiCall) => {
                let result = []

                if(initApiCall.totalPages !== undefined && limit === false){
                    let endpointWithPage = endpoint
                    result = initApiCall.results

                    for(let i=2; i<initApiCall.totalPages; i++){
                        if(endpointWithPage.includes('?')){
                            endpointWithPage += '&'
                        } else {
                            endpointWithPage += '?'
                        }
                        endpointWithPage += `page=${i}`

                        let newApiCall = await getApiCall(`${process.env.A1_URL}${endpointWithPage}`)
                        result = result.concat(newApiCall.results)
                    }
                } else if (initApiCall.totalPages !== undefined && limit === true) {
                    result = initApiCall.results
                } else {
                    result = initApiCall
                }
                resolve(result)
            })
            .catch((err) => {
                console.error(err)
                reject(error)
            })
    })
}

const getAllDataForEvidencePkg = async function(evId, indsToIncludeArr=null){
    let evPkgData = await getDataFromA1(`evidence/${evId}`, false)

    if(
        evPkgData !== null &&
        'actors' in evPkgData &&
        evPkgData.actors !== null &&
        evPkgData.actors.idNamePairs !== null
    ) {
        for(let current of evPkgData.actors.idNamePairs){
            let actorId = current.id

            let actor = await getDataFromA1(`actor/${actorId}`, true)
            if(
                actor?.results &&
                actor.results.length > 0 &&
                actor.results[0].country !== null &&
                actor.results[0].country.name !== null
            ){
                current.country = actor.results[0].country.name
            } else {
                console.error('No country listed for actor')
            }
        }
    } else {
        console.error('No actor for Evidence ID')
    }
    // let allIndicators = await getDataFromA1(`evidence/${evId}/indicator`, false)
    let allIndicators = await getIndicatorFromA1(evId);

    if(indsToIncludeArr !== null){

        allIndicators = allIndicators.filter(indicator => indsToIncludeArr.includes(indicator.id))

        evPkgData.indicators = allIndicators
    }

    return evPkgData
}

module.exports = { getAllDataForEvidencePkg, testConnection }
