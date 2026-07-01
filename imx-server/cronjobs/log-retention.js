const cron = require('node-cron')
const db = require('../database/db')
const logger = require('../logging/elasticsearch')

const cronLogRetention = function(){
    cron.schedule('0 0 * * *', async () => {
    // cron.schedule('*/1 * * * *', async () => {
        console.info('STARTING LOG RETENTION')
        let target = new Date
        target.setDate(target.getDate() - process.env.LOG_RETENTION)
        target = getDate(target)

        console.info('REMOVING LOGS FROM: ', target)
        try {
            let res = await db.deleteIndex(`*${target}`)
            logger.logRetention(res, target, 'SUCCESS')
        } catch(err) {
            logger.logRetention(err, target, 'FAIL')
        }
    })
}

const getDate = function(today){
    let year = today.getFullYear()
    let month = String(today.getMonth() + 1).padStart(2, '0')
    let day = String(today.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
}

module.exports = cronLogRetention
