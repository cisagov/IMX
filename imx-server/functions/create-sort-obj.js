/**
 *
 * @param {The Request} req
 * @param {The environment variables} env
 * @returns Same response for User Authentication. Primarily used to get Username for Keycloak after authenticating
 */
const createSortObj = function(sortKey){
    let sortObj = {}

    if(sortKey === 'na'){
        sortObj["@created_timestamp"] = "desc"
    } else {
        let splitKey = sortKey.split('-')

        if(splitKey[0] === 'modified' || splitKey[0] === 'created'){
            sortObj[`${splitKey[0]}_date`] = splitKey[1]
        } else if (splitKey[2] === 'string'){
            sortObj[`${splitKey[0]}.keyword`] = splitKey[1]
        } else {
            sortObj[splitKey[0]] = splitKey[1]
        }
    }

    return sortObj
}

module.exports = createSortObj
