const cron = require('node-cron')
const testConnections = require('../startup/test-connections')
const sendEmail = require('../mailer/healthchecks')
const logger = require(`../logging/${process.env.LOGGER}`)

const cronHealthchecks = function(){
    cron.schedule('0 * * * 1-5', async () => {
    // cron.schedule('*/1 * * * 1-5', async () => {
        console.info('STARTING HEALTHCHECKS')
        const res = await testConnections()
        console.info('HEALTHCHECK RESULTS:')
        console.info(res)

        if(res.failedConnections.length > 0 && process.env.ALERT_HEALTHCHECKS === 'enabled'){
            sendEmail(res)
                .then((res) => {
                    logger.logSmtp(res)
                })
                .catch((err) => {
                    logger.logSmtp(err)
                })
        }
    })
}

module.exports = cronHealthchecks
