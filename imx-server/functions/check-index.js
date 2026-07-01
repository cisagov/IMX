const db = require('../database/db')

/**
 *
 * @param {The Request} req
 * @param {The environment variables} env
 * @returns Same response for User Authentication. Primarily used to get Username for Keycloak after authenticating
 */
const checkIndex = async function(index){
    return new Promise((resolve, reject) => {
        db.getIndex(index)
            .then(async (getIndexRes) => {
                let message = `SUCCESS. DB index: ${index} already exists`
                console.log(message)
                resolve({status: getIndexRes.status, message: message})
            })
            .catch(async (err) => {
                if(err.status === 404){
                   console.log(`ERROR. DB does not have expected index ${index}`)
                    let createIndexRes = await db.createIndex(index)

                    if(createIndexRes.status === 200){
                        let message = `SUCCESS. DB index created: ${index}`
                        console.log(message)
                        resolve({status: 200, message: message})
                    } else {
                        let message = `ERROR. Unable to find or create index: ${index}`
                        console.log(message)
                        reject(new Error(message))
                    }
                } else {
                    reject(err)
                }
            })
    })
}

module.exports = checkIndex
