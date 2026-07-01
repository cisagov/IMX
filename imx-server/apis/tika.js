const axios = require('axios')

const testConnection = async function(){
    return new Promise((resolve, reject) => {
        axios.get(process.env.TIKA_URL)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) =>{
                console.error(err)
                reject(err)
            })
    })
}

module.exports = { testConnection }
