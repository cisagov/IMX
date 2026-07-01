const imxEndpoints = function(app, logger){

    const axios = require('axios')
    const https = require("node:https")
    const py = require('../apis/imx-py')

    function getAuthHeader(user, pass){
        let string = `${user}:${pass}`

        return `Basic ${Buffer.from(string).toString('base64')}`
    }

    const startupConnections = {
        db: {
            url: process.env.DB_URL,
            headers: {
                'Authorization': getAuthHeader(process.env.DB_USER, process.env.DB_PASS),
                'Content-Type': 'application/json'
            }
        },
        logger: {
            url: process.env.LOGGER_URL,
            headers: undefined
        },
        taxii: {
            url: `${process.env.TAXII_URL}taxii/v2.1-os/taxii2/`,
            headers: {
                'Authorization': getAuthHeader(process.env.TAXII_USER, process.env.TAXII_PASS),
                'Accept': 'application/taxii+json;version=2.1',
                'Content-Type': 'application/taxii+json;version=2.1',
            }
        },
        tika: {
            url: process.env.TIKA_URL,
            headers: undefined
        },
        kibana: {
            url: process.env.KIBANA_URL,
            headers: {
                'Authorization': getAuthHeader(process.env.DB_USER, process.env.DB_PASS),
                'Content-Type': 'application/json'
            }
        }
    }

    //Check if can reach IMX Backend
    app.get('/test', async (req, res) => {
        logger.logEndpoint(200, req, undefined)
        res.send({
            "message": `${process.env.NODE_ENV} - You have successfully reached the IMX Backend Server`,
            "connection_status": process.env.CON_TEST ? process.env.CON_TEST : "n/a"
        })
    })

    app.get('/test-py-400', async (req, res) => {
        try{
            let result = await py.test400Connection()
            res.status(500).send({ "message": "Test unsuccessful"})
        } catch(err){
            console.log(err)
            res.status(200).send({ "message": `Test successful: ${err.response.data.message}`})
        }
    })

    app.get('/test-logging', async (req, res) => {
        let key = 'logging'
        let result = await testConnection(startupConnections[key], key)
        let message = `ERROR. Cannot reach ${startupConnections[key].url}`

        if(result.status && result.status === 200){
            message = `SUCCESS. Able to connect to ${startupConnections[key].url}`
        } else {
            console.log(result)
        }

        res.send({message: message})
    })

    app.get('/test-db', async (req, res) => {
        let key = 'db'
        let result = await testConnection(startupConnections[key], key)
        let message = `ERROR. Cannot reach ${startupConnections[key].url}`

        if(result.status && result.status === 200){
            message = `SUCCESS. Able to connect to ${startupConnections[key].url}`
        } else {
            console.log(result)
        }

        res.send({message: message})
    })

    app.get('/test-taxii', async (req, res) => {
        let key = 'taxii'
        let result = await testConnection(startupConnections[key], key)
        let message = `ERROR. Cannot reach ${startupConnections[key].url}`

        if(result.status && result.status === 200){
            message = `SUCCESS. Able to connect to ${startupConnections[key].url}`
        } else {
            console.log(result)
        }

        res.send({message: message})
    })

    app.get('/test-tika', async (req, res) => {
        let key = 'tika'
        let result = await testConnection(startupConnections[key], key)
        let message = `ERROR. Cannot reach ${startupConnections[key].url}`

        if(result.status && result.status === 200){
            message = `SUCCESS. Able to connect to ${startupConnections[key].url}`
        } else {
            console.log(result)
        }

        res.send({message: message})
    })

    app.get('/test-kibana', async (req, res) => {
        let key = 'kibana'
        let result = await testConnection(startupConnections[key], key)
        let message = `ERROR. Cannot reach ${startupConnections[key].url}`

        if(result.status && result.status === 200){
            message = `SUCCESS. Able to connect to ${startupConnections[key].url}`
        } else {
            console.log(result)
        }

        res.send({message: message})
    })

    const testConnection = async function(config, step=''){
        return new Promise((resolve) => {
            let headers = config.headers ? {headers: config.headers} : undefined

            if(step && step === 'taxii') headers['httpsAgent'] = new https.Agent({ rejectUnauthorized: false })

            axios.get(config.url, headers)
                .then((resp) => {
                    resolve(resp)
                })
                .catch((err) => {
                    resolve(err)
                })
        })
    }

}

module.exports = imxEndpoints
