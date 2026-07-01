const db = require('../database/db')

const start = async function() {
    let settingsIndex = 'imx-settings'

    let isDatabaseRefactoredRes
    try {
        isDatabaseRefactoredRes = await isDatabaseRefactored(settingsIndex)
    } catch(err) {
        console.error(err)
        isDatabaseRefactoredRes = false
    }

    if(isDatabaseRefactoredRes === true) {
        console.log('SUCCESS. DB is in expected format. Aborting refactor.')
        return
    }

    let userDataIndexes = await getUserDataIndexes()

    if(userDataIndexes === undefined){
        console.log('ERROR. No User Data Indexes found. Aborting refactor.')
        return
    }

    let allSubmissions = await getOldSubmissions(userDataIndexes)
    let allSavedBundles = await getOldSavedBundles(userDataIndexes)

    if(allSavedBundles === undefined || allSubmissions === undefined) {
        console.log('ERROR. retrieving saved bundles or submissions unsuccessful. Aborting refactor.')
        return
    }
    console.log(`allSubmissions length: ${allSubmissions.length}`)
    console.log(`allSavedBundles length: ${allSavedBundles.length}`)

    let createNewIndexesRes = await createNewIndexes()

    if(createNewIndexesRes === undefined) {
        console.log('ERROR. creating new indexes for submissions and saved bundles failed. Aborting refactor.')
        return
    }

    let injectSubmissionsRes = await injectSubmissions(allSubmissions)
    let injectSavedBundlesRes = await injectSavedBundles(allSavedBundles)

    if(injectSavedBundlesRes === undefined || injectSubmissionsRes === undefined) {
        console.log('ERROR. injecting saved bundles or submissions into new indexes unsuccessful. Aborting refactor.')
        return
    }

    let deleteOldSubmissionsRes = await deleteOldSubmissions(allSubmissions)
    let deleteOldSavedBundlesRes = await deleteOldSavedBundles(allSavedBundles)
    let postRefactorObjectRes = await postRefactorObject()

    if(
        deleteOldSubmissionsRes === true &&
        deleteOldSavedBundlesRes === true &&
        postRefactorObjectRes === true
    ){
        console.log('SUCCESS. refactor of ES successful')
    } else {
        console.log('ERROR. Deleting objects and/or creating refactor object failed. However refactor did go through.')
    }
}

const isDatabaseRefactored = async function(index) {
    try {
        let getIndexRes = await db.getIndex(index)
        if(getIndexRes.status === 404){
            console.log('ERROR. DB does not have expected index: imx-settings')
            let createIndexRes = await db.createIndex(index)

            if(createIndexRes.status === 200){
                console.log('SUCCESS. DB index created: imx-settings')
            }

        } else {
            console.log('SUCCESS. DB does have expected index: imx-settings')
        }

        let queryData = {
            'feature.keyword': 'refactor'
        }
        let getDocRes = await db.searchDocs(index, queryData, 1, 0, undefined)

        return(getDocRes.status === 200 && getDocRes.data.hits.total.value === 1)
    } catch(err) {
        console.error(err)
        return false
    }
}

const postRefactorObject = async function() {
  try {
    let doc = {
      "feature": "refactor",
      "status": true
    }

    let postDocRes = await db.postDoc('imx-settings', doc, undefined)

    if(postDocRes.status === 201){
      console.log('SUCCESS. refactor object posted')
      return true
    }

    return undefined
  } catch(err) {
    console.error(err)
    throw err
  }
}

const getUserDataIndexes = async function() {
  try {
    let aliasesRes = await db.getAliases()

    let result = []

    for(let field in aliasesRes.data){
      if(field.startsWith(`user-data-${process.env.ENV}`)) {
        result.push(field)
      }
    }

    return(result)
  } catch(err) {
    console.error(err)
    throw err
  }
}

const getUsernameFromIndex = function(index){
    let indexSplit = index.split('-')
    indexSplit.splice(0, 3)
    return indexSplit.join('-')
}

const getOldSubmissions = async function(userDataIndexes) {
    let result = []
    let queryData = {
        "feature.keyword": "my-submissions"
    }
    let userSubmissions = []

    try {
        for(let index of userDataIndexes) {
            let username = getUsernameFromIndex(index)

            userSubmissions = await db.searchAllDocs(index, queryData, 50, 0)
            for(let submission of userSubmissions) {
                submission._source["user"] = username
            }

            result = result.concat(userSubmissions)
        }

        return result
    } catch(e) {
        console.log(e)
        return undefined
    }
}

const getOldSavedBundles = async function(userDataIndexes) {
    let result = []
    let queryData = {
        "feature.keyword": "saved-bundles"
    }
    let userSavedBundles = []

    try {
        for(let index of userDataIndexes) {
            let username = getUsernameFromIndex(index)

            userSavedBundles = await db.searchAllDocs(index, queryData,50, 0)
            for(let savedBundle of userSavedBundles) {
                savedBundle._source["user"] = username
            }

            result = result.concat(userSavedBundles)
        }

        return result
    } catch(e) {
        console.log(e)
        return undefined
    }
}

const createNewIndexes = async function(){
    try {
        let submissionRes = await db.createIndex('submissions')
        let savedBundlesRes = await db.createIndex('saved-bundles')

        if(submissionRes.status !== 200 || savedBundlesRes.status !== 200){
            return undefined
        }

        return true
    } catch(e) {
        console.error(e)
        throw e
    }
}

const injectSubmissions = async function(allSubmissions) {
    try {
        console.log(allSubmissions)
        for(let submission of allSubmissions){
            let postRes = await db.postDoc('submissions', submission._source)

            if(postRes.status !== 201){
                return undefined
            }
        }

        return true
    } catch(e) {
        console.error(e)
        return undefined
    }
}

const injectSavedBundles = async function(allSavedBundles) {
    try {
        for(let savedBundle of allSavedBundles){
            let postRes = await db.postDoc('saved-bundles', savedBundle._source)

            if(postRes.status !== 201){
                return undefined
            }
        }

        return true
    } catch(e) {
        console.error(e)
        return undefined
    }
}

const deleteOldSubmissions = async function(allSubmissions) {
    try {
        console.log('Deleting Submissions')
        for(let submission of allSubmissions){
            let index = `user-data-${process.env.ENV}-${submission._source.user}`

            let deleteRes = await db.deleteDoc(index, submission._id)

            if(deleteRes.status !== 200){
                return undefined
            }
        }

        return true
    } catch(e) {
        console.error(e)
        return undefined
    }
}

const deleteOldSavedBundles = async function(allSavedBundles) {
    try {
        console.log('Deleting Saved Bundles')
        for(let savedBundle of allSavedBundles){
            let index = `user-data-${process.env.ENV}-${savedBundle._source.user}`

            let deleteRes = await db.deleteDoc(index, savedBundle._id)

            if(deleteRes.status !== 200){
                return undefined
            }
        }

        return true
    } catch(e) {
        console.error(e)
        return undefined
    }
}

module.exports = { start }
