/**
 *
 * @param {Taken from req.headers.authorization} authHeader
 * @param {Environment object that contains all environment variables} env
 * @returns {res = if authenticated or not, user = username}
 */
const keycloakAuth = function(authHeader){
    const axios = require("axios")
    const https = require("node:https")

    return new Promise((resolve, reject) => {
        //Contains any and all axios required headers, data, etc.
        //Required if needed to add things like the httpsAgent below (don't want to add it for everything)
        let axiosData = {
            headers: {
                Authorization: authHeader
            }
        }

        //Adds rejectUnauthorized call if TEN as TEN has self-signed certificates and axios does not like that
        if(process.env.KC_CERT === 'TEN'){
            axiosData['httpsAgent'] = new https.Agent({ rejectUnauthorized: false })
        }
        console.info('KEYCLOAK URL: ' + `${process.env.KC_URL}realms/${process.env.KC_REALM}/protocol/openid-connect/userinfo`)
        //Sends request to target keycloak from environment file with user info from the auth header in request
        axios.get(`${process.env.KC_URL}realms/${process.env.KC_REALM}/protocol/openid-connect/userinfo`, axiosData)
            .then((res) => {
                if(res.status === 200){
                    let result = {
                        res: true,
                        user: res.data.preferred_username ? res.data.preferred_username : undefined,
                        admin: res.data.groups ? res.data.groups.includes('imx-admin') : false
                    }
                    resolve(result)
                }
                else {
                    let result = {
                        res: false,
                        user: res.data.preferred_username ? res.data.preferred_username : undefined,
                        admin: res.data.groups ? res.data.groups.includes('imx-admin') : false
                    }
                    resolve(result)
                }
            })
            .catch((err) => {
                console.error('ERROR AUTH KEYCLOAK')
                reject(err)
            })
    })
}

module.exports = keycloakAuth
