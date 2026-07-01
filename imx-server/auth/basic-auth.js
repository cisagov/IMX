/**
 *
 * @param {Taken from req.headers.authorization} authHeader
 * @param {Environment object that contains all environment variables} env
 * @returns {res = if authenticated or not, user = username}
 */
const basicAuth = function(authHeader){
    return new Promise((resolve, reject) => {
        //Decodes and splits username and password into separate values
        const auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':')
        const user = auth[0]
        const pass = auth[1]

        //If username and password matches environment file
        if(process.env.BASIC_USER === user && process.env.BASIC_PASS === pass){
            let result = {
                res: true,
                user: user || undefined
            }
            resolve(result)
        } else {
            let result = {
                res: false,
                user: user || undefined
            }
            resolve(result)
        }

    })
}

module.exports = basicAuth
