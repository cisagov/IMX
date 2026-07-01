/**
 *
 * @param {Taken from req.headers.authorization} authHeader
 * @param {Environment object that contains all environment variables} env
 * @returns returns response from other auth files
 */
const hybridAuth = async function(authHeader){
    //Calls basic or keycloak auth based off what the header starts with
    //Would need to change if something else uses Bearer other than Keycloak
    return new Promise((resolve, reject) => {
        if(authHeader.startsWith('Basic')){
            require('./basic-auth')(authHeader)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        } else if (authHeader.startsWith('Bearer')){
            require('./oidc-auth')(authHeader)
                    .then((res) => {
                        resolve(res)
                    })
                    .catch((err) => {
                        reject(err)
                    })
        }
    })
}

module.exports = hybridAuth
