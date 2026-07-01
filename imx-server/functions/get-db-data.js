/**
 *
 * @param {The request} req
 * @param {The response (so can send response if target es not found)} res
 * @param logger
 * @returns
 */
const getTarget = function(req, res, logger){
    const es_imx = {
        url: process.env.DB_URL,
        user: process.env.DB_USER,
        pass: process.env.DB_PASS,
    }

    const es_taxii = {
        url: process.env.ES_TAXII_URL,
        user: process.env.ES_TAXII_USER,
        pass: process.env.ES_TAXII_PASS,
        can_write: process.env.ES_TAXII_CAN_WRITE
    }

    switch(req.params.target){
        case 'imx':
            return es_imx;
        case 'taxii':
            return es_taxii;
    }

    logger.logEndpoint(404, req, undefined);

    if(res) res.send({ "message" : "The target in your endpoint was not found"});

    return undefined;
}

module.exports = getTarget;
