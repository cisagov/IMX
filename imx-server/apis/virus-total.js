const axios = require('axios')
const https = require('node:https')

const getHash = async function(hash, ttp = false) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.VIRUS_TOTAL_URL}api/v3/files/${hash}`
        if (ttp) {
            url +=`/behaviour_mitre_trees`
        }

        let options = getOptions()

        axios.get(url, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const testConnection = function(){
    let options = getOptions()

    return new Promise((resolve, reject) => {
        axios.get(process.env.VIRUS_TOTAL_URL, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const getIp = async function(ip) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.VIRUS_TOTAL_URL}api/v3/ip_addresses/${ip}`

        let options = getOptions()

        axios.get(url, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const getIpResolutions = async function(ip, limit = 40, cursor = null) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.VIRUS_TOTAL_URL}api/v3/ip_addresses/${ip}/resolutions?limit=${limit}`

        if (cursor) {
            url += `&cursor=${cursor}`
        }

        let options = getOptions()

        axios.get(url, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const getIpCommunicatingFiles = async function(ip, limit = 40, cursor = null) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.VIRUS_TOTAL_URL}api/v3/ip_addresses/${ip}/communicating_files?limit=${limit}`

        if (cursor) {
            url += `&cursor=${cursor}`
        }

        let options = getOptions()

        axios.get(url, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const getIpReferrerFiles = async function(ip, limit = 40, cursor = null) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.VIRUS_TOTAL_URL}api/v3/ip_addresses/${ip}/referrer_files?limit=${limit}`

        if (cursor) {
            url += `&cursor=${cursor}`
        }

        let options = getOptions()

        axios.get(url, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const getIpHistoricalWhois = async function(ip, limit = 40, cursor = null) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.VIRUS_TOTAL_URL}api/v3/ip_addresses/${ip}/historical_whois?limit=${limit}`

        if (cursor) {
            url += `&cursor=${cursor}`
        }

        let options = getOptions()

        axios.get(url, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const getIpHistoricalSslCerts = async function(ip, limit = 40, cursor = null) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.VIRUS_TOTAL_URL}api/v3/ip_addresses/${ip}/historical_ssl_certificates?limit=${limit}`

        if (cursor) {
            url += `&cursor=${cursor}`
        }

        let options = getOptions()

        axios.get(url, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const getOptions = function(){
    const decodedBase64Key = Buffer.from(process.env.VIRUS_TOTAL_KEY, 'base64').toString('utf-8')
    const agent = new https.Agent({ rejectUnauthorized: false })
    const headers = {
        "accept": "application/json",
        "x-apikey": decodedBase64Key
    }
    let options = {
        headers
    }
    if (process.env.VIRUS_TOTAL_PROXY === 'true') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
        options = {
            httpsAgent: agent,
            headers,
            timeout: 10000
        }
    }

    return options
}

const getDomain = async function(domain) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.VIRUS_TOTAL_URL}api/v3/domains/${domain}`

        let options = getOptions()

        axios.get(url, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const getDomainResolutions = async function(domain, limit = 40, cursor = null) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.VIRUS_TOTAL_URL}api/v3/domains/${domain}/resolutions?limit=${limit}`

        if (cursor) {
            url += `&cursor=${cursor}`
        }

        let options = getOptions()

        axios.get(url, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const getDomainCommunicatingFiles = async function(domain, limit = 40, cursor = null) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.VIRUS_TOTAL_URL}api/v3/domains/${domain}/communicating_files?limit=${limit}`

        if (cursor) {
            url += `&cursor=${cursor}`
        }

        let options = getOptions()

        axios.get(url, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const getDomainReferrerFiles = async function(domain, limit = 40, cursor = null) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.VIRUS_TOTAL_URL}api/v3/domains/${domain}/referrer_files?limit=${limit}`

        if (cursor) {
            url += `&cursor=${cursor}`
        }

        let options = getOptions()

        axios.get(url, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const getDomainSubdomains = async function(domain, limit = 40, cursor = null) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.VIRUS_TOTAL_URL}api/v3/domains/${domain}/subdomains?limit=${limit}`

        if (cursor) {
            url += `&cursor=${cursor}`
        }

        let options = getOptions()

        axios.get(url, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const getDomainHistoricalWhois = async function(domain, limit = 40, cursor = null) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.VIRUS_TOTAL_URL}api/v3/domains/${domain}/historical_whois?limit=${limit}`

        if (cursor) {
            url += `&cursor=${cursor}`
        }

        let options = getOptions()

        axios.get(url, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const getDomainHistoricalSslCerts = async function(domain, limit = 40, cursor = null) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.VIRUS_TOTAL_URL}api/v3/domains/${domain}/historical_ssl_certificates?limit=${limit}`

        if (cursor) {
            url += `&cursor=${cursor}`
        }

        let options = getOptions()

        axios.get(url, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const getSigmaRule = async function(ruleId) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.VIRUS_TOTAL_URL}api/v3/sigma_rules/${ruleId}`

        let options = getOptions()

        axios.get(url, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

module.exports = { getHash, getIp, testConnection, getIpResolutions, getIpCommunicatingFiles, getIpReferrerFiles, getIpHistoricalWhois, getIpHistoricalSslCerts, getSigmaRule, getDomain, getDomainResolutions, getDomainCommunicatingFiles, getDomainReferrerFiles, getDomainSubdomains, getDomainHistoricalWhois, getDomainHistoricalSslCerts }
