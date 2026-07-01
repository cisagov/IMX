const axios = require('axios');
const https = require("node:https");
const db = require('../database/db');

const getServer = async function() {
    return new Promise(async (resolve, reject) => {
        try {
            const index = 'groups';

            const checkIndex = await db.getIndex(index);

            if (JSON.stringify(checkIndex.data) == '{}')
                return resolve({ status: 200, data: {}});

            const result = await db.getAllDocs(index);

            if (result.data != '{}')
                return resolve({ status: 200, data: result.data.hits.hits});

            return resolve({ status: 200, data: {}})
        } catch (err) {
            console.error("No data: ", err);

            return resolve({ status: 200, data: {}});
        }
    })
}

const addServer = async function(api, collection) {
    return new Promise(async (resolve, reject) => {
        try {
            let index = 'groups';

            let checkIndex;

            try {
                try {
                    checkIndex = await db.getIndex(index);

                    if (checkIndex?.status === 200) {
                        await db.deleteIndex(index);
                    }
                } catch(e) {
                    console.error("No index found, continuing to creating index");
                }
            } catch (err) {
                console.error("Something went wrong while checking or removing index: ", err);
                return reject(err);
            }

            console.info("Creating index");
            const createIndex = await db.createIndex(index);

            if (createIndex?.status === 200) {
                let doc = {
                    "api": api,
                    "collection": collection
                }

                const result = await db.postDoc(index, doc);

                if (result?.status == 201 && result?.data?._id);
                    return resolve(result.data);
            } else
                return reject({message: "Something went wrong"});

        } catch(err) {
            console.error("Something went wrong adding server: ", err);
            return reject(err);
        }
    })
}

const deleteServer = async function() {
    return new Promise(async (resolve, reject) => {
        try {
            let index = 'groups';

            await db.deleteIndex(index);

            return resolve(true);
        } catch (err) {
            console.error("Something went wrong deleting index", err);
            return reject(err);
        }
    })
}

module.exports = { getServer, addServer, deleteServer }
