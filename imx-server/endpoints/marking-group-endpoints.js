const getUserData = require('../functions/get-user-data')
const group = require("../apis/group");

const markingEndpoints = function (app, logger) {
    app.get('/cui', async (req, res) => {
        let userData;
        try {
            userData = await getUserData(req);

            const resp = await group.getServer();

            return res.send(resp);
        } catch (err) {
            console.error(err);
            logger.logEndpoint(500, req, userData);
            return res.status(500).send({ status: 500, message: JSON.stringify(err) });
        }
    });

    app.post('/cui', async (req, res) => {
        let userData;
        try {
            userData = await getUserData(req);

            const body = req.body;

            if (!body || !body.api || !body.collection)
                return res.status(400).send({ status: 400, message: 'Invalid body'});

            let result = await group.addServer(body.api, body.collection);

            if (result) {
                return res.status(201).send({ status: 201, data: result });
            }

        } catch (err) {
            console.error(err);
            logger.logEndpoint(500, req, userData);
            return res.status(500).send({ status: 500, message: JSON.stringify(err) });
        }
    });

    app.delete('/cui', async (req, res) => {
        let userData;
        try {
            await group.deleteServer();

            return res.send({ status: 200, message:"Successfully deleted" });
        } catch (err) {
            console.error(err);
            logger.logEndpoint(500, req, userData);
            return res.status(500).send({ status: 500, message: JSON.stringify(err) });
        }
    })
}

module.exports = markingEndpoints
