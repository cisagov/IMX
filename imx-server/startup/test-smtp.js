const smtpTest = require('../mailer/test-connection')
const logger = require(`../logging/${process.env.LOGGER}`)

const main = async function(){
    smtpTest()
        .then((res) => {
            console.log('SMTP Connection success')
            logger.logSmtp(res)
        })
        .catch((err) => {
            console.error(err)
            logger.logSmtp(err)
        })
}

module.exports = main
