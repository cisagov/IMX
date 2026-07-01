const getUserData = require('../functions/get-user-data')
const esLogger = require('./elasticsearch')
/**
 *
 * @param {NUM of http status code} status
 * @param {OBJ of req} req
 * @param {OBJ of environment used} env
 * @param {Fluentd logger to emit call} logger
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
        user: process.env.AUTH === 'none' || process.env.AUTH === undefined ? 'dev-user' : userData.user,
        timestamp: (new Date()).toISOString()
    }

    console.log(log)

    return({status: 200})
}

/**
 *
 * @param {NUM of http status code} status
 * @param {OBJ of req} req
 * @param {OBJ containes req.headers.authorization or gathered user data for someone who is unauthorized} user
 * @param {Fluentd logger to emit call} logger
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

    console.log(log)

    return {status: 200}
}

const logForward = function(log, tag) {
    if (!log.timestamp)
        log.timestamp = (new Date()).toISOString()

    console.log(log)
    console.log(tag)

    return {status: 200}
}

const logSmtp = function(res) {
    return esLogger.logSmtp(res)
}

const logStix11 = function(step, req, params) {
    return esLogger.logStix11(step, req, params)
}

const testConnection = function(){
    return Promise.resolve({status: 200})
}

const unAuthLog = async function(req){
    try {
        console.info('UNAUTH LOGGING')
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

module.exports = { logEndpoint, logAuth, logForward, testConnection, unAuthLog, logStix11, logSmtp }
