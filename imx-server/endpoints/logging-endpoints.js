const loggingEndpoints = function(app, logger){
    const frontend_logger = require(`../logging/${process.env.LOGGER}`)

    app.post('/logging/:tag', async (req, res) => {
        const tag = req.params.tag
        const log = req.body

        try {
            let result = await frontend_logger.logForward(log, tag)

            if(result?.status && (result.status === 200 || result.status === 201)){
                logger.logEndpoint(200, req, undefined)
                res.send( { status: 200 })
            } else {
                console.log(result)
                logger.logEndpoint(result.status, req, undefined)
                res.send({ status: 500, "message": ``})
            }
        } catch(err) {
            console.error(err)
            res.send({ status: 500, message: 'Something went wrong.' })
        }
    })
}

module.exports = loggingEndpoints
