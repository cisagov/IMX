const elasticsearch = require('./elasticsearch')
const opensearch = require('./opensearch')

const supportedDbs = ['elasticsearch', 'opensearch']

async function aggregateDocs(index, user){
    try{
        let params = {
            index: index,
            user: user
        }
        return await redirect('aggregateDocs', params)
    } catch(err) {
        console.error(err)
        throw err
    }
}

async function check(){
    try {
        return await redirect('check', undefined)
    } catch(err) {
        console.error(err)
        throw err
    }
}

async function createIndex(index){
    try{
        console.info('db.js createIndex')
        return await redirect('createIndex', { index: index })
    } catch(err) {
        console.error(err)
        throw err
    }
}

async function createSnapshotRepo(repoName){
    try{
        return await redirect('createSnapshotRepo', { repoName: repoName })
    } catch(err) {
        console.error(err)
        throw err
    }
}

async function deleteDoc(index, docId){
    try{
        console.info('db.js deleteDoc')
        let params = {
            docId: docId,
            index: index
        }
        return await redirect('deleteDoc', params)
    } catch(err) {
        console.error(err)
        throw err
    }
}

async function deleteIndex(index){
    try{
        console.info('db.js deleteIndex')
        let params = {
            index: index
        }
        return await redirect('deleteIndex', params)
    } catch(err) {
        console.error(err)
        throw err
    }
}

async function getAliases(){
    try {
        console.info('db.js getAliases')
        return await redirect('getAliases', undefined)
    } catch(err) {
        console.error(err)
        throw err
    }
}

async function getAllDocs(index){
    try{
        console.info('db.js getAllDocs')
        return await redirect('getAllDocs', { index: index })
    } catch(err) {
        console.error(err)
        throw err
    }
}

function getDb(){
    if(supportedDbs.includes(process.env.DB))
        return process.env.DB

    throw new Error('DB not supported')
}

async function getDoc(index, docId){
    try{
        return await redirect('getDoc', { index: index, docId: docId })
    } catch(err) {
        console.error(err)
        throw err
    }
}

async function getIndex(index){
    try{
        console.info('db.js getIndex')
        return await redirect('getIndex', { index: index })
    } catch(err) {
        console.error(err)
        throw err
    }
}

async function postDoc(index, doc, docId){
    try{
        console.info('db.js postDoc')
        let params = {
            doc: doc,
            docId: docId,
            index: index
        }
        return await redirect('postDoc', params)
    } catch(err) {
        console.error(err)
        throw err
    }
}

async function redirect(func, params){
    try {
        switch(process.env.DB){
            case 'elasticsearch':
                return await elasticsearch[func](params)
            case 'opensearch':
                return await opensearch[func](params)
            default:
                throw new Error('Unknown DB')
        }

    } catch(err) {
        console.error(err)
        throw err
    }
}

async function searchAllDocs(index, queryData, size, from){
    try{
        console.info('db.js searchAllDocs')
        let params = {
            index: index,
            queryData: queryData,
            size: size,
            from: from,
            sort: undefined
        }
        return await redirect('searchAllDocs', params)
    } catch(err) {
        console.error(err)
        throw err
    }
}

async function searchAllDocsArray(index, queryData, size, from, sort){
    try{
        let params = {
            index: index,
            queryData: queryData,
            size: size,
            from: from,
            sort: sort
        }
        return await redirect('searchAllDocsArray', params)
    } catch(err) {
        console.error(err)
        throw err
    }
}

async function searchDocs(index, queryData, size, from, sort){
    try{
        let params = {
            index: index,
            queryData: queryData,
            size: size,
            from: from,
            sort: sort
        }
        return await redirect('searchDocs', params)
    } catch(err) {
        console.error(err)
        throw err
    }
}

async function searchDocsArray(index, queryData, size, from, sort){
    try{
        let params = {
            index: index,
            queryData: queryData,
            size: size,
            from: from,
            sort: sort
        }
        return await redirect('searchDocsArray', params)
    } catch(err) {
        console.error(err)
        throw err
    }
}

async function updateDoc(index, data, docId){
    try{
        let params = {
            data: data,
            docId: docId,
            index: index
        }
        return await redirect('updateDoc', params)
    } catch(err) {
        console.error(err)
        throw err
    }
}

module.exports = {
    aggregateDocs,
    check, createIndex, createSnapshotRepo,
    deleteDoc, deleteIndex,
    getAliases, getAllDocs, getDb, getDoc, getIndex,
    postDoc,
    searchAllDocs, searchAllDocsArray, searchDocs, searchDocsArray,
    updateDoc
}
