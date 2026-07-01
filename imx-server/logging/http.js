const axios = require('axios')

const getUserData = require('../helper-functions/get-user-data')

const getAuthHeader = function(){
    let string = `${process.env.LOGGER_USER}:${process.env.LOGGER_PASS}`

    return `Basic ${Buffer.from(string).toString('base64')}`
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
        user: process.env.AUTH === 'none' || process.env.AUTH === undefined ? 'dev-user' : userData.user,
        timestamp: (new Date()).toISOString()
    }
    let url = `${process.env.LOGGER_URL}`

    let headers = {
        "Content-Type": "application/json"
    }
    if(process.env.LOGGER_USER !== ''){
        headers = {
            'Authorization': getAuthHeader(),
            "Content-Type": "application/json"
        }
    }

    console.log(log)

    return new Promise((resolve) => {
        axios.post(url, log, { headers: headers })
            .then((resp) => {
                console.log('logEndpoint success')
                resolve({ status: resp.status })
            })
            .catch((error) => {
                console.log('logEndpoint failure')
                resolve(error)
            })
    })
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
    let url = `${process.env.LOGGER_URL}`

    let headers = {
        "Content-Type": "application/json"
    }
    if(process.env.LOGGER_USER !== ''){
        headers = {
            'Authorization': getAuthHeader(),
            "Content-Type": "application/json"
        }
    }

    console.log(log)

    return new Promise((resolve) => {
        axios.post(url, log, { headers: headers })
            .then((resp) => {
                console.log(`logAuth success`)
                resolve({ status: resp.status })
            })
            .catch((error) => {
                console.log(`logAuth failure`)
                resolve(error)
            })
    })
}

const logForward = function(log, tag) {
    let url = `${process.env.LOGGER_URL}`

    let headers = {
        "Content-Type": "application/json"
    }
    if(process.env.LOGGER_USER !== ''){
        headers = {
            'Authorization': getAuthHeader(),
            "Content-Type": "application/json"
        }
    }

    if (!log.timestamp)
        log.timestamp = (new Date()).toISOString()

    console.log(log)

    return new Promise((resolve) => {
        axios.post(url, log, { headers: headers })
            .then((resp) => {
                console.log(`logForward success`)
                resolve({ status: resp.status })
            })
            .catch((error) => {
                console.log(`logForward failure`)
                console.log(error)
                resolve(error)
            })
    })
}

const unAuthLog = async function(){
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

module.exports = { logEndpoint, logAuth, logForward, unAuthLog }
