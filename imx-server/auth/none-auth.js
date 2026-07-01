/**
 *
 * @param {Taken from req.headers.authorization} authHeader
 * @param {Environment object that contains all environment variables} env
 * @returns {res = if authenticated or not, user = username}
 */
const noAuth = function(authHeader){
    return new Promise((resolve, reject) => {
        let result = {
            res: true,
            user: 'dev-user'
        }
        resolve(result)
    })
}

module.exports = noAuth
