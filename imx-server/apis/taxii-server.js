const axios = require('axios')
const https = require('node:https')

const getAuthHeader = function(){
    let string = `${process.env.TAXII_USER}:${process.env.TAXII_PASS}`

    return `Basic ${btoa(string)}`
}

const getUrl = function(url){
    if(url.includes("localhost"))
        return url.replace("localhost", "host.docker.internal")
    return url
}

const testConnection = async function(config){
    return new Promise((resolve, reject) => {
        let options = {
            headers: {
                'Accept': 'application/taxii+json;version=2.1',
                'Content-Type': 'application/taxii+json;version=2.1',
                'Authorization': getAuthHeader()
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        }

        axios.get(`${getUrl(process.env.TAXII_URL)}taxii/${process.env.TAXII_API_VERSION}/taxii2/`, options)
        .then((resp) => {
            resolve(resp)
        })
        .catch((err) => {
            console.error(err)
            reject(err)
        })
    })
}

/**
 * Posts bundle from "post-bundle-endpoint", replaces with Bearer Token for credentials if necessary
 * @param {JSON of the bundle being posted} bundle
 * @param {Target URL of the Taxii Server} taxiiUrl
 * @param {request from the IMX Client} req
 * @returns resp/err from attempting to post bundle
 */
const postBundle = async function(bundle, taxiiUrl, req){
    return new Promise((resolve) => {
        let headers = {
            'Accept': 'application/taxii+json;version=2.1',
            'Content-Type': 'application/taxii+json;version=2.1',
            'Authorization': getAuthHeader(taxii_config)
        }

        if(req.headers.authorization.startsWith('Bearer')){
            headers.Authorization = req.headers.authorization
        }

        axios.post(getUrl(taxiiUrl), bundle, { headers: headers, httpsAgent: new https.Agent({ rejectUnauthorized: false }) })
            .then((resp) => {
                console.info(`Post to default TAXII Server success: ${taxiiUrl}`)
                console.trace()
                resolve(resp)
            })
            .catch((err) => {
                console.error(`Error communicating to TAXII Server ${taxiiUrl}` )
                console.trace()
                resolve(err)
            })
    })
}

/**
 * Searches manifests in taxii server from "get-alerts" endpoint, replaces with Bearer Token for credentials if necessary
 * @param {*} taxiiUrl
 * @param {*} req
 * @returns resp/err from attempting to query manifests
 */
const searchManifest = async function(taxiiUrl, req){
    return new Promise((resolve) => {
        let headers = {
            'Accept': 'application/taxii+json;version=2.1',
            'Content-Type': 'application/taxii+json;version=2.1',
            'Authorization': getAuthHeader(taxii_config)
        }

        if(req.headers.authorization.startsWith('Bearer')){
            headers.Authorization = req.headers.authorization
        }

        axios.get(getUrl(taxiiUrl), { headers: headers, observe: 'response', httpsAgent: new https.Agent({ rejectUnauthorized: false }) })
            .then((resp) => {
                console.info(`Get Manifest to default TAXII Server success: ${taxiiUrl}`)
                console.trace()
                resolve(resp)
            })
            .catch((err) => {
                console.error(`Error communicating to TAXII Server ${taxiiUrl}` )
                console.trace()
                resolve(err)
            })
    })
}

//All functions that are being exported
module.exports = { postBundle, searchManifest, testConnection }
