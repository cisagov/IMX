const getUserData = require('../functions/get-user-data')
const checkIndex = require('../functions/check-index')

const opensearch = require('../database/db')

const escape = function(){
    return(
        process.env.DB_URL === '' ||
        process.env.DB_USER === '' ||
        process.env.DB_PASS === ''
    )
}

const getDate = function(today){
    let year = today.getFullYear()
    let month = String(today.getMonth() + 1).padStart(2, '0')
    let day = String(today.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
}

/**
 *
 * @param {NUM of http status code} status
 * @param {OBJ of req} req
 * @param {OBJ containes req.headers.authorization or gathered user data for someone who is unauthorized} user
 */
const logAuth = function(status, req, user){
    let log = {
        status: status,
        path: req.originalUrl,
        method: req.method,
        headers: req.headers,
        user: user,
        timestamp: (new Date()).toISOString()
    }

    let today = new Date()
    let index = `imx-server-auth-${getDate(today)}`
    let userData = getUserData(req)

    console.log(log)
    console.log(index)

    let userIndex = `user-data-${process.env.ENV}-${userData.user}`

    checkIndex(userIndex)

    return new Promise((resolve, reject) => {
        opensearch.postDoc(index, log)
            .then((opensearchRes) => {
                resolve({ status: opensearchRes.status })
            })
            .catch((err) => {
                reject(err)
            })
    })
}

const logForward = function(log, tag) {
    let today = new Date()
    let index = `${tag.replace('.', '-')}-${getDate(today)}`

    if (!log.timestamp)
        log.timestamp = (new Date()).toISOString()

    console.log(log)
    console.log(tag)

    return new Promise((resolve, reject) => {
        opensearch.postDoc(index, log)
            .then((opensearchRes) => {
                resolve({ status: opensearchRes.status })
            })
            .catch((err) => {
                reject(err)
            })
    })
}

/**
 *
 * @param {NUM of http status code} status
 * @param {OBJ of req} req
 * @param {OBJ of environment used} env
 * @param {OBJ of user data} userData
 */
const logEndpoint = async function(status, req, userData){
    if(!userData){
        userData = await getUserData(req)
    }

    let log = {
        status: status,
        path: req.originalUrl,
        method: req.method,
        params: req.params,
        headers: req.headers,
        user: process.env.AUTH === 'none' ? 'dev-user': userData.user,
        timestamp: (new Date()).toISOString()
    }

    let today = new Date()
    let index = `imx-server-endpoint-${getDate(today)}`

    console.log(log)
    console.log(index)

    return new Promise((resolve, reject) => {
        opensearch.postDoc(index, log)
            .then((opensearchRes) => {
                resolve({ status: opensearchRes.status })
            })
            .catch((err) => {
                reject(err)
            })
    })
}

const logHealthCheckError = async function(error){
    if(escape()) return

    error = error.toJSON()
    let result = {
        message: error.message ? error.message : 'N/A',
        name: error.name ? error.name : 'N/A',
        status: error.status ? error.status : 'N/A',
        code: error.code ? error.code : 'N/A',
        stack: error.stack ? error.stack : 'N/A',
        method: error.config.method ? error.config.method : 'N/A',
        url: error.config.url ? error.config.url : 'N/A'
    }

    let log = {
        status: 'ERROR',
        type: 'error',
        result: result,
        timestamp: (new Date()).toISOString()
    }
    let today = new Date()
    let index = `imx-healthchecks-${getDate(today)}`

    console.log(log)

    return await postDoc(log, index)
}

const logHealthCheckResult = async function(result){
    if(escape()) return

    let log = {
        status: result.failedConnections.length === 0 ? 'SUCCESS' : 'FAIL',
        type: 'result',
        result: result,
        timestamp: (new Date()).toISOString()
    }
    let today = new Date()
    let index = `imx-healthchecks-${getDate(today)}`

    console.log(log)

    return await postDoc(log, index)
}

const logSmtp = async function(res) {
    if(escape()) return

    let log = {
        timestamp: (new Date()).toISOString(),
        res: res,
    }
    let today = new Date()
    let index = `imx-server-smtp-${getDate(today)}`

    console.log(log)

    return await postDoc(log, index)
}

const logStix11 = async function(step, req, params) {
    if(escape()) return

    let log = {
        timestamp: (new Date()).toISOString(),
        step: step,
        req_body: req.body,
        params: params
    }
    let today = new Date()
    let index = `imx-stix11-${getDate(today)}`

    console.log(log)

    return await postDoc(log, index)
}

const logRetention = async function(res, target, status) {
    if(escape()) return

    let log = {
        target: target,
        res: res,
        status: status
    }
    let index = `log-retention-logs`

    return await postDoc(log, index)
}

const postDoc = async function(log, index){
    return new Promise((resolve, reject) => {
        opensearch.postDoc(index, log)
            .then((opensearchRes) => {
                resolve({ status: opensearchRes.status })
            })
            .catch((err) => {
                reject(err)
            })
    })
}

const testConnection = async function(){
    return new Promise((resolve, reject) => {
        opensearch.check()
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

const unAuthLog = async function(req){
    try {
        console.log('UNAUTH LOGGING')
        console.log(req.body.event.action)
        let index = `user-data-${process.env.ENV}-${req.body.user}`

        let checkIndex = await db.getIndex(index)

        if(checkIndex.status && checkIndex.status === 200){
            console.log('AUTH_RES: Authenticated')
            logAuth(200, req, result.user)
            next()
        } else {
            logAuth(401, req, undefined)

            console.log('AUTH_RES: Failed finding user for logging endpoint, Not Authenticated')
            let error = new Error('You are not authenticated!')
            error.status = 401
            throw error
        }
    } catch(err) {
        console.error(err)
        logAuth(401, req, undefined)

        console.log('AUTH_RES: Failed finding user for logging endpoint, Not Authenticated')
        let error = new Error('You are not authenticated!')
        error.status = 401
        throw error
    }
}

module.exports = { logAuth, logEndpoint, logForward, logHealthCheckError, logHealthCheckResult, logRetention, logStix11, testConnection, unAuthLog, logSmtp }
