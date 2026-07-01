const errorHandler = function(err, req, res, logger) {
    console.log(`ERROR_PATH: ${req.originalUrl}`)
    try {
        if (err.response?.data?.status) {
            const { status, error } = err.response.data
            const { reason } = error
            console.log(`Error Code ${status}: ${reason}`)
            console.trace()
            logger.logEndpoint(status, req, undefined)
            res.status(err.status).send({ message: err.reason })
        } else if (err.status && err.reason) {
            console.log(`Error Code ${err.status}: ${err.reason}`)
            console.trace()
            logger.logEndpoint(err.status, req, undefined)
            res.status(err.status).send({ message: err.reason })
        } else {
            logger.logEndpoint(500, req, undefined)
            res.status(err.status).send({ message: "Unexpected error encountered" })
        }
    } catch (err) {
        console.error(err)
        console.trace()
        logger.logEndpoint(500, req, undefined)
        res.status(500).send({ message: "Unexpected error encountered" })
    }
}

module.exports = errorHandler
