const db = require('../database/db')
const kibana = require('../apis/kibana')
const logger = require(`../logging/${process.env.LOGGER}`)
const taxii = require('../apis/taxii-server')
const py = require('../apis/imx-py')
const tika = require('../apis/tika')
const a1 = require('../apis/analyst1')
const vt = require('../apis/virus-total')

const esLogger = require('../logging/elasticsearch')
const checkIndex = require('../functions/check-index')

const arr = [
    'db',
    'kibana',
    'logger',
    'taxii',
    'ais',
    // 'cma',
    'py',
    'tika',
    'a1',
    'vt'
]

const testConnections = async function(){
    let result = {
        successfulConnections: [],
        naConnections: [],
        undefinedConnections: [],
        failedConnections: []
    }

    for(let step of arr){
        let currRes = 'UNDEFINED'
        switch(step){
            case 'db':
                currRes = await testDB()
                break
            case 'kibana':
                currRes = await testKibana()
                break
            case 'logger':
                currRes = await testLogger(logger)
                break
            case 'taxii': {
                let config = {
                    url: process.env.TAXII_URL,
                    user: process.env.TAXII_USER,
                    pass: process.env.TAXII_PASS
                }
                currRes = await testTaxii(config)
                break
            }
            case 'ais':{
                let config = {
                    url: process.env.AIS_URL,
                    user: process.env.AIS_USER,
                    pass: process.env.AIS_PASS
                }
                currRes = await testTaxii(config)
                break
            }
            // case 'cma':{
            //     let config = {
            //         url: process.env.CMA_URL,
            //         user: process.env.CMA_USER,
            //         pass: process.env.CMA_PASS
            //     }
            //     currRes = await testTaxii(config)
            //     break
            // }
            case 'py':
                currRes = await testIMXPy()
                break
            case 'tika':
                currRes = await testTika()
                break
            case 'vt':
                currRes = await testVT()
                break
            case 'a1':
                currRes = await testA1()
                break
            default:
                console.log('Unexpected Connection Test')
        }

        console.log(`${currRes}: Testing Connection ${step}`)

        switch(currRes){
            case 'ERROR':
                result.failedConnections.push(step)
                break
            case 'N/A':
                result.naConnections.push(step)
                break
            case 'SUCCESS':
                result.successfulConnections.push(step)
                break
            case 'UNDEFINED':
                result.undefinedCollections.push(step)
                break
            default:
                console.log(`Unexpected result: ${currRes} for step: ${step}`)
        }
    }

    logResult(result)

    return result
}

const logResult = function(result){
    if(process.env.LOG_HEALTHCHECKS !== 'enabled') return

    return new Promise((resolve, reject) => {
        esLogger.logHealthCheckResult(result)
            .then((res) => {
                resolve(res)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const logError = function(error){
    if(process.env.LOG_HEALTHCHECKS !== 'enabled') return

    return new Promise((resolve, reject) => {
        esLogger.logHealthCheckError(error)
            .then((res) => {
                resolve(res)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const testDB = async function(){
    if(process.env.DB_URL === '' || process.env.DB_URL === undefined) return 'N/A'

    return new Promise((resolve) => {
        db.check()
            .then(() => {
                resolve('SUCCESS')
            })
            .catch((err) => {
                logError(err)
                resolve('ERROR')
            })
    })
}

const testKibana = async function(){
    if(process.env.KIBANA_ENABLED !== 'true') return 'N/A'

    return new Promise((resolve) => {
        kibana.testConnection()
            .then(async () => {
                await checkIndex('imx-healthchecks')
                resolve('SUCCESS')
            })
            .catch((err) => {
                logError(err)
                resolve('ERROR')
            })
    })
}

const testLogger = async function(logger){
    return new Promise((resolve) => {
        logger.testConnection()
            .then(() => {
                resolve('SUCCESS')
            })
            .catch((err) => {
                logError(err)
                resolve('ERROR')
            })
    })
}

const testTaxii = async function(config){
    if(config.url === '' || config.url === undefined) return 'N/A'

    if(config.url.endsWith('/taxii/v2.1-os/')){
        config.url.replaceAll('taxii/v2.1-os/', '')
    }

    return new Promise((resolve) => {
        taxii.testConnection(config)
            .then(() => {
                resolve('SUCCESS')
            })
            .catch((err) => {
                logError(err)
                resolve('ERROR')
            })
    })
}

const testIMXPy = async function(){
    if(process.env.IMX_PY_URL === '') return 'N/A'

    return new Promise((resolve) => {
        py.testConnection()
            .then(() => {
                resolve('SUCCESS')
            })
            .catch((err) => {
                logError(err)
                resolve('ERROR')
            })
    })
}

const testTika = async function(){
    if(process.env.TIKA_URL === '') return 'N/A'

    return new Promise((resolve) => {
        tika.testConnection()
            .then(() => {
                resolve('SUCCESS')
            })
            .catch((err) => {
                logError(err)
                resolve('ERROR')
            })
    })
}

const testA1 = async function(){
    if(process.env.A1_ENABLED === 'false') return 'N/A'

    return new Promise((resolve) => {
        a1.testConnection()
            .then(() => {
                resolve('SUCCESS')
            })
            .catch((err) => {
                logError(err)
                resolve('ERROR')
            })
    })
}

const testVT = async function(){
    if(process.env.VIRUS_TOTAL_ENABLED === 'false') return 'N/A'

    return new Promise((resolve) => {
        vt.testConnection()
            .then(() => {
                resolve('SUCCESS')
            })
            .catch((err) => {
                logError(err)
                resolve('ERROR')
            })
    })
}

module.exports = testConnections
