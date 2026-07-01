const { getKeycloakUsers } = require('../apis/users');
const getUserData = require('../functions/get-user-data');

const usersEndpoints = function (app, logger) {
    app.get('/keycloak-users', async (req, res) => {
        let userData;
        try {
             userData = await getUserData(req);

            const authHeader = req.headers.authorization

             if (!userData.admin) {
                console.log("User is not admin, " + userData);
                res.status(401).send({ status: 401, message: "User is not an admin"});
             }

             const users = await getKeycloakUsers(authHeader);

             return res.send({ status: 200, data: users });

        } catch (err) {
            console.error(err)
            logger.logEndpoint(500, req, userData)
            res.status(500).send({ status: 500, message: JSON.stringify(err) })
        }
    })
}

module.exports = usersEndpoints;
