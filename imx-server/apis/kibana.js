const axios = require('axios')
const fs = require('node:fs')
const db = require('../database/db')

const dashboardDir = './assets/kb-dashboards'

const getAuthHeader = function(){
    let string = `${process.env.DB_USER}:${process.env.DB_PASS}`

    return `Basic ${Buffer.from(string).toString('base64')}`
}

const testConnection = async function(){
    if(process.env.KIBANA_ENABLED === 'false') return 200

    const headers = {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
    }

    return new Promise((resolve, reject) => {
        axios.get(process.env.KIBANA_URL, { headers: headers })
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const getIndexName = function(dashboardTitle){
    let index = 'imx-'
    switch(dashboardTitle){
        case 'IMX Dashboard':
            index += process.env.ENV === 'production' ? 'prod*' : 'dev*'
            break
        case 'IMX Healthchecks':
            index += 'healthchecks*'
            break
    }

    return index
}

/**
 * Entry point to setup Kibana dashboard. Runs from Startup
 * @returns nothing
 */
const setupKibana = async function(){
    try {
        //Setup basic auth and headers
        const headers = {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        }

        const files = await getFiles()

        for(let file of files){
            let curr = require(`../${dashboardDir}/${file}`)
            let dashboardTitle = curr.objects[0].attributes.title

            let index = getIndexName(dashboardTitle)

            let getIndexRes = await getIndex(index)

            switch(getIndexRes){
                case 200:
                    console.info(`SUCCESS: Index ${index} already exists`)
                    break
                case 404:
                    console.info(`WARNING: Index ${index} does not exist.. creating now`)
                    await createIndex(index)
                    break
                default:
                    console.error(`ERROR: Server error when trying to retrieve Index ${index}`)
                    return
            }

            let getDataViewRes = await getDataView(headers, index)

            switch(getDataViewRes.status){
                case 200:
                    console.info(`SUCCESS: Data View ${index} already exists`)
                    break
                case 404: {
                    console.info(`WARNING: Data View ${index} does not exist.. creating now`)
                    let id = ''
                    if(curr.objects){
                        id = curr.objects[1].id
                    }
                    await createDataView(headers, index, dashboardTitle.replaceAll(' Dashboard', ''), id)
                    break
                }
                default:
                    console.error(`ERROR: Server error when trying to retieve Data View ${index}`)
                    return
            }

            let getDashboardRes = await getDashboard(headers, dashboardTitle)

            switch(getDashboardRes.status){
                case 200:
                    console.info(`SUCCESS: Dashboard ${dashboardTitle} already exists`)
                    break
                case 404:
                    console.info(`WARNING: Dashboard ${dashboardTitle} does not exist.. creating now`)
                    await createDashboard(headers, curr)
                    break
                default:
                    console.error(`ERROR: Server error when trying to retieve Dashboard ${dashboardTitle}`)
                    return
            }
        }

    } catch(err) {
        console.error(err)
    }
}

const getFiles = function(){
    return new Promise((resolve, reject) => {
        fs.readdir(dashboardDir, (err, files) => {
            if(err){
                console.error('Unable to scan directory: ' + err)
                reject(err)
            }

            resolve(files)
        })
    })
}

const getIndex = async function(index){
    return new Promise((resolve, reject) => {
        db.getIndex(index)
            .then((resp) => {
                if(JSON.stringify(resp.data) === '{}'){
                    resolve(404)
                } else {
                    resolve(resp.status)
                }
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

const createIndex = async function(index){
    index = index.replaceAll('*', '-')
    return new Promise((resolve, reject) => {
        db.createIndex(index)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

const getDashboard = async function(headers, title){
    return new Promise ((resolve, reject) => {
        axios.get(`${process.env.KIBANA_URL}api/saved_objects/_find?type=dashboard`, { headers: headers })
        .then((resp) => {
            if(resp.data && resp.data.total >= 1){
                for(let dash of resp.data.saved_objects){
                    if(dash.attributes.title === title){
                        console.info(`SUCCESS ${title} already exists`)
                        resolve({status : 200, already: true})
                        return
                    }
                }
                console.error(`ERROR. ${title} not found`)
                resolve({status : 404, already: false})
            } else {
                console.error('ERROR. No Kibana dashboards exist')
                resolve({status : 404, already: false})
            }
        })
        .catch((err) => {
            console.error(err)
            console.error('ERROR. occurred trying to get Kibana Dashboards. Trying again')
            reject(err)
        })
    })
}

const getDataView = async function(headers, index){
    return new Promise((resolve, reject) => {

        axios.get(`${process.env.KIBANA_URL}api/saved_objects/_find?type=index-pattern&search_fields=title&search=${index}&fields=title,indexPattern`, { headers: headers })
            .then((resp) => {
                if(resp.data.saved_objects.length === 0){
                    resolve({status: 404})
                } else {
                    resolve({status: 200, id: resp.data.saved_objects[0].id})
                }
            })
            .catch((err) => {
                console.error('ERROR. occurred trying to get Kibana Data View')
                reject(err)
            })
    })
}

const createDataView = async function(headers, index, title, id){
    return new Promise((resolve, reject) => {
        let temp = {
            data_view: {
                title: index,
                name: title
            }
        }

        if(id !== ''){
            temp.data_view['id'] = id
        }

        headers['kbn-xsrf'] = 'reporting'

        axios.post(`${process.env.KIBANA_URL}api/data_views/data_view`, temp, { headers: headers })
            .then((resp) => {
                if(resp.data){
                    console.info(`SUCCESS. Data View for ${index} created`)
                    resolve({status:200, id: resp.data.data_view.id})
                }
            })
            .catch((err) => {
                console.error(err)
                console.error('ERROR. occurred trying to create Kibana Data View')
                reject(err)
            })
    })
}

const createDashboard = async function(headers, dashboard){

    headers['kbn-xsrf'] = 'reporting'

    return new Promise((resolve, reject) => {
        axios.post(`${process.env.KIBANA_URL}api/kibana/dashboards/import?exclude=index-pattern`, dashboard , { headers: headers })
            .then((resp) => {
                console.info(`SUCCESS. Dashboard for ${dashboard.attributes.title} created`)
                resolve({status : 200, already: false})
            })
            .catch((err) => {
                console.error(err)
                console.error("ERROR. attempting to create Kibana Dashboard")
                resolve({status : 500, already: false})
            })
    })
}

//All functions that are being exported
module.exports = { setupKibana, testConnection }
