const axios = require('axios')

const mispToStix = function(misp){
    return new Promise((resolve, reject) => {
        axios.post(`${process.env.IMX_PY_URL}misp-to-stix`, misp)
            .then(response => {
                resolve(response)
            })
            .catch(error => {
                console.error(error)
                reject(error)
            })
    })
}

const stixToMisp = function(stix){
    return new Promise((resolve, reject) => {
        axios.post(`${process.env.IMX_PY_URL}stix-to-misp`, stix)
            .then(response => {
                resolve(response)
            })
            .catch(error => {
                console.error(error)
                reject(error)
            })
    })
}

const testConnection = function(){
    return new Promise((resolve, reject) => {
        axios.get(`${process.env.IMX_PY_URL}test`)
            .then(response => {
                resolve(response)
            })
            .catch(error => {
                console.error(error)
                reject(error)
            })
    })
}

const test400Connection = function(){
    return new Promise((resolve, reject) => {
        axios.get(`${process.env.IMX_PY_URL}test-400`)
            .then(response => {
                resolve(response)
            })
            .catch(error => {
                console.error(error)
                reject(error)
            })
    })
}

const getStixOne = async function(data) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.IMX_PY_URL}stix_1`

        const options = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        }

        axios.post(url, data, options)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
}

module.exports = { mispToStix, stixToMisp, testConnection, test400Connection, getStixOne }
