const stix_1 = require('../functions/stix-1')
const a1 = require('../apis/analyst1')
const py = require('../apis/imx-py')

const xml = require('xml')

const stix_1Endpoints = function(app, logger){
    app.post('/test-stix-one', async (req, res) => {
        try{
            console.log(req.body)
            let result = {
                status: 200,
                data: []
            }

            logger.logStix11('getStixOne-TEST', req, { 'postData': req.body })
            let res = await py.getStixOne((req.body))
            console.info('Got response from StixOne')
            result.data.push(res.data)

            if(result?.status === 200){
                logger.logEndpoint(200, req, undefined)
                console.log(result.data)

                res.status(200)
                res.setHeader('Content-Type', 'application/xml')
                res.send(xml(result.data))
            } else {
                console.log(result)
                logger.logEndpoint(result.status, req, undefined)
                res.status(500).send({ "message": "Something went wrong" })
            }
        } catch(err){
            console.error(err)
            let message = err
            let status = 500

            if(err.status === 400){
                message = err.response.data.message
                status = 400
            }

            logger.logStix11('ERROR-TEST', req, { message: message, status: status })
            res.status(status).send({ "message": message })
        }
    })

    app.post('/get-stix-one', async (req, res) => {
        if(process.env.A1_ENABLED === false){
            let message = "environment not configured for Stix 1.1. Requires A1 enabled"
            let status = 403

            logger.logStix11('ERROR', req, { message: message, status: status })
            res.status(403).send({message: message})
            return
        }

        let evPkgs = req.body.evPkgs
        if(evPkgs === null || evPkgs === undefined || evPkgs.length === 0) {
            let message = "No evPkgs found"
            let status = 400

            logger.logStix11('ERROR', req, { message: message, status: status })
            res.status(status).send({
                message: message
            })
            return
        }

        try {
            logger.logStix11('start', req, {})
            let result = {
                status: 200,
                data: []
            }

            for(let i in evPkgs){
                let ev = evPkgs[i]
                if(ev.evID === null || ev.evID === undefined){
                    let message = `EV Package Number: ${i} not found.`
                    let status = 403

                    logger.logStix11('ERROR', req, { message: message, status: status })
                    res.status(status).send({
                        message: message
                    })
                    return
                }

                console.log(`EV ID: ${ev.evID}`)
                if(ev.indIDs.length === 0){
                    console.log(`EV Package Number ${i} has no ind ids`)
                }

                for(let ind of ev.indIDs){
                    console.log(`IND ID: ${ind}`)
                }

                try {
                    logger.logStix11('getA1Data', req, { 'evID': ev.evID, 'indIDs': ev.indIDs })
                    let evPkgData =  await a1.getAllDataForEvidencePkg(ev.evID, ev.indIDs)
                    console.log(`Got EV Package Data`)

                    logger.logStix11('formatBefore', req, { 'evID': ev.evID, 'indIDs': ev.indIDs, 'evPkgData': evPkgData })
                    let struct = JSON.stringify(await stix_1.format(evPkgData))
                    console.log('Formated EV Package')

                    // For testing without A1
                    // let struct = '[{"type":"main","guid":"A-16999576","attribs":{"doctitle":"IB-25-10009 Credential Harvesting Activity Observed in Energy Sector","docid":"TPG-16999576","overview":"On January 27, 2025, a trusted third party reported a phishing email from a likely compromised Energy sector email account. The malicious email contained a link to a \\"zoho.com\\" cloud hosted document, which contained a link to a credential harvesting URL.\\r\\n\\r\\nThe end.","produced":"2025-01-27","intent":"Indicators","tlp":"GREEN","patterns":["Reconnaissance / Phishing for Information: Spearphishing Link [T1598.003] (ENT)","Collection / Input Capture [T1056] (ENT)","Execution / User Execution: Malicious Link [T1204.001] (ENT)","Initial Access / Phishing: Spearphishing Link [T1566.002] (ENT)"],"consent":"EVERYONE","org_name":"CISA","org_country":"US","org_admin":"US-DC","org_sector":"Government National","org_source":"NONFED","proprietary":"false"}}]'

                    let postData = {
                        format: 'ais',
                        data: `${struct}`
                    }

                    logger.logStix11('getStixOne', req, { 'evID': ev.evID, 'indIDs': ev.indIDs, 'evPkgData': evPkgData, 'postData': postData })
                    let res = await py.getStixOne((postData))
                    logger.logStix11('response', req, { 'evID': ev.evID, 'indIDs': ev.indIDs, 'evPkgData': evPkgData, 'postData': postData })
                    console.log('Got response from StixOne')
                    result.data.push(res.data)
                } catch(err) {
                    console.log(err)
                    let message = err
                    let status = 500

                    if(err.status === 400){
                        message = err.response.data.message
                        status = 400
                    }

                    logger.logStix11('ERROR-1', req, { message: message, status: status })
                    result = {
                        status: status,
                        message: message
                    }
                }
            }

            if(result?.status === 200){
                logger.logEndpoint(200, req, undefined)
                console.log(result.data)

                console.log('Sending Result')

                res.status(200)
                res.setHeader('Content-Type', 'application/xml')
                res.send(xml(result.data))
            } else {
                console.log(result)
                logger.logEndpoint(result.status, req, undefined)
                res.status(result.status).send({ "message": result.message })
            }

        } catch(err) {
            let message = err
            let status = 500

            if(err.status === 400){
                message = err.response.data.message
                status = 400
            }

            logger.logStix11('ERROR-2', req, { message: message, status: status })
            res.status(status).send({ "message": message })
        }
    })
}

module.exports = stix_1Endpoints
