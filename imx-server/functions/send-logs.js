const getUserData = require('./get-user-data')

/**
 *
 * @param {NUM of http status code} status
 * @param {OBJ of req} req
 * @param {OBJ of environment used} env
 * @param {Fluentd logger to emit call} logger
 * @param {OBJ of user data} userData
 */
const logEndpoint = async function(status, req, env, logger, userData){
    if(!userData){
        userData = await getUserData(req, env)
    }

    let log = {
        status: status,
        path: req.originalUrl,
        params: req.params,
        user: userData.user
    }

    if(logger) logger.emit('endpoint', log)
}

/**
 *
 * @param {NUM of http status code} status
 * @param {OBJ of req} req
 * @param {OBJ containes req.headers.authorization or gathered user data for someone who is unauthorized} user
 * @param {Fluentd logger to emit call} logger
 */
const logAuth = function(status, req, user, logger){
    let log = {
        status: status,
        path: req.originalUrl,
        headers: req.headers,
        user: user
    }

    if(logger) logger.emit('auth', log)
}

module.exports = { logEndpoint, logAuth }
