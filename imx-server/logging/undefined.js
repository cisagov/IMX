const noneLogger = require('./none')
/**
 *
 * @param {NUM of http status code} status
 * @param {OBJ of req} req
 * @param {OBJ of environment used} env
 * @param {Fluentd logger to emit call} logger
 * @param {OBJ of user data} userData
 */
const logEndpoint = async function(status, req, userData){
    return new Promise ((resolve, reject) => {
        noneLogger.logEndpoint(status, req, userData)
            .then((resp) => {
                resolve(resp)
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
 * @param {OBJ containes req.headers.authorization or gathered user data for someone who is unauthorized} user
 * @param {Fluentd logger to emit call} logger
 */
const logAuth = function(status, req, user){
    return new Promise ((resolve, reject) => {
        noneLogger.logAuth(status, req, user)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

const logForward = function(log, tag) {
    return new Promise ((resolve, reject) => {
        noneLogger.logForward(log, tag)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

const testConnection = function() {
    return new Promise ((resolve, reject) => {
        noneLogger.testConnection()
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

const unAuthLog = function(req) {
    return new Promise ((resolve, reject) => {
        noneLogger.unAuthLog(req)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

const logStix11 = function(step, req, params) {
    return new Promise ((resolve, reject) => {
        noneLogger.logStix11(step, req, params)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

const logSmtp = function(res) {
    return new Promise ((resolve, reject) => {
        noneLogger.logSmtp(step, req, params)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

module.exports = { logEndpoint, logAuth, logForward, testConnection, unAuthLog, logStix11, logSmtp }
