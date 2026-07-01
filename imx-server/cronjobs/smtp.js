const cron = require('node-cron')
const test = require('../startup/test-smtp')

const cronSmtp = function(){
    console.info('CRON SMTP')
    cron.schedule('0 0 * * 1-5', async () => {
    // cron.schedule('*/1 * * * 1-5', async () => {
        console.info('STARTING SMTP CRON')
        if(process.env.SMTP_HOST === "") {
            console.info('EXITING SMTP CRON')
            return
        }

        try{
            const res = await test()
        } catch(err){
            console.error("Error in SMTP cron job")
        }
    })
}

module.exports = cronSmtp
