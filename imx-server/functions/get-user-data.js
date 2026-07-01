/**
 *
 * @param {The Request} req
 * @param {The environment variables} env
 * @returns Same response for User Authentication. Primarily used to get Username for Keycloak after authenticating
 */
const getUserData = async function(req){
    let result

    const authHeader = req.headers.authorization
    if(process.env.AUTH === 'none'){
        result = await require(`../auth/none-auth`)(authHeader)
        return result
    }

    try {
        if(authHeader){
            if(authHeader.startsWith('Basic')) result = await require(`../auth/basic-auth`)(authHeader)
            else if(authHeader.startsWith('Bearer')){
                if(process.env.AUTH.includes("oidc")){
                    result = await require(`../auth/oidc-auth`)(authHeader)
                } else {
                    result = await require(`../auth/keycloak-auth`)(authHeader)
                }
            }
        }

    } catch(err){
        console.error(err)
        result = req?.body?.user ? req.body.user : undefined
    }

    return result
}

module.exports = getUserData
