const templateEndpoints = function(app, logger){

    //Gets last 10 submissions from user profile if index exists
    app.get('/get-template', async (req, res) => {
        try {
            let userData = await getUserData(req)

            logger.logEndpoint(200, req, userData)
            res.send({ status: 200, message:'get-template success'})
        } catch(err) {
            console.log(err)
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, message: JSON.stringify(err) })
        }
    })
}

module.exports = templateEndpoints
