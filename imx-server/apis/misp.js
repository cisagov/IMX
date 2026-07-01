const axios = require('axios');
const https = require('node:https');
const db = require('../database/db')
const py = require("../apis/imx-py")

/**
 * Add new Event to MISP. MISP will return 404 if event has already been added. Then, search and return the event from MISP
 * @param {*} misp MISP object to upload
 * @param {*} mispUrl MISP URL to upload to
 * @param {*} api MISP API to authenticate with
 * @returns Uploaded MISP object
 */
const addEvent = async function(misp, mispUrl, api) {
    return new Promise(async (res, rej) => {
        try {
            let url = `${mispUrl}events/add`;

            const options = {
                headers: {
                    'Authorization': api,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                httpsAgent: new https.Agent({ rejectUnauthorized: false })
            }

            const resp = await axios.post(url, misp, options);
            res({ status: 200, data: resp.data });
        } catch (err) {
            if (err.status === 404) {
                try {
                    const uuid = JSON.parse(misp).uuid;

                    const event = await getEvent(uuid, mispUrl, api);
                    res({status: 404, data: event});
                } catch(err2) {
                    console.error(err2);
                    rej(err2);
                }
            } else {
                console.error(err);
                rej(err);
            }
        }
    });
}


/**
 * Search and return Event object based on the UUID
 * @param {string} uuid UUID of the Event Object
 * @returns
 */
const getEvent = async function(uuid, mispUrl, api) {
    return new Promise(async (res, rej) => {
        try {
            let url = `${mispUrl}events/restSearch`;

            const options = {
                headers: {
                    'Authorization': api,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                httpsAgent: new https.Agent({ rejectUnauthorized: false })
            }

            const body = {
                uuid: uuid
            };

            const resp = await axios.post(url, body, options);

            if (resp.data.response && resp.data.response.length > 0) {
                res(resp.data.response[0]);
            } else {
                res({});
            }
        } catch (err) {
            console.error(err);
            rej(err);
        }
    });
}

const searchEvent = async function(indicators) {
    return new Promise(async (resolve, reject) => {
        try {
            let url = `${process.env.MISP_URL}events/restSearch`;

            const options = {
                headers: {
                    'Authorization': process.env.MISP_KEY,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                httpsAgent: new https.Agent({ rejectUnauthorized: false })
            }

            const results = [];
            for (let indicator of indicators) {
                try {
                    const misp = await axios.post(url, indicator, options);

                    let stix2 = {
                        data: null
                    };

                    if (misp?.data?.response)
                        stix2 = await py.mispToStix(misp.data.response[0]);

                    results.push({
                        stix2: stix2.data,
                        misp: misp.data,
                        type: indicator.type,
                        value: indicator.value
                    })
                } catch (e) {
                    console.error(`Misp Indicator ${indicator} error: `, e);
                    continue;
                }
            }

            return resolve(results);
        } catch (e) {
            console.error(e);
            reject(e);
        }
    });
}

/**
 * Add MISP Server for user to connect to
 * @param {string} url url where the misp server is hosted
 * @param {string} api API key for MISP
 */
const addServer = async function(url, api, user) {
    return new Promise(async (res, rej) => {
        try {
            const index = 'misp';

            let checkIndex;
            let createIndex;
            try {
                checkIndex = await db.getIndex(index);
            } catch (err) {
                console.info("Index not found, creating index");
                createIndex = await db.createIndex(index);
                // await db.deleteIndex(index);
            }

            const doc = {
                url: url,
                api: api,
                user: user
            };

            if (
                (!checkIndex && createIndex?.status === 200)
                || checkIndex?.status === 200
            ) {
                const queryData = {
                    'user.keyword': user
                }

                let servers;
                try {
                    servers = await db.searchDocs(index, queryData, 100, 0, {});
                    servers = servers?.data?.hits?.hits;
                } catch (err) {
                    servers = null;
                }

                let result;
                if (servers) {
                    const foundServer = servers.find(elem => elem._source?.url == url);
                    if (foundServer) {
                        result = await db.updateDoc(index, doc, foundServer._id);
                        if (result.status === 200)
                            res(result);
                        else
                            rej({"message": "Something went wrong"});
                    } else {
                        result = await db.postDoc(index, doc);
                    }
                } else {
                    result = await db.postDoc(index, doc);
                }

                if (result?.status === 201) {
                    res(result);
                } else {
                    rej(result);
                }
            } else {
                return rej({"message": "Something went wrong"});
            }
        } catch (err) {
            console.error(err);
            return rej(err);
        }
    });
}

/**
 * Get all MISP servers
 */
const getServers = async function(user) {
    return new Promise(async (res, rej) => {
        try {
            const index = 'misp';

            const checkIndex = await db.getIndex(index);

            if (JSON.stringify(checkIndex.data) == '{}') {
                return res({ status: 200, data: [] });
            } else {

                const queryData = {
                    'user.keyword': user
                };

                const result = await db.searchDocs(index, queryData, 100, 0, {})

                const data = {
                    status: 200,
                    data: []
                }

                if (result.status === 200) {
                    const mapped = [];
                    if (process.env.MISP_URL && process.env.MISP_KEY)
                        mapped.push({ url: process.env.MISP_URL, api: process.env.MISP_KEY });

                    result.data?.hits?.hits.forEach(elem => {
                        elem._source.id = elem._id;
                        mapped.push(elem._source)
                    });

                    data.data = mapped;
                    res(data);
                } else {
                    res(data)
                }

            }
        } catch (err) {
            console.error(err);

            const mapped = [];
            if (process.env.MISP_URL && process.env.MISP_KEY)
                mapped.push({ url: process.env.MISP_URL, api: process.env.MISP_KEY });

            res({ status: 200, data: mapped});
        }
    });

}

/**
 * Delete server from elasticsearch
 * @param {string} url URL of MISP server to remove
 */
const deleteServer = async function(id) {
    return new Promise(async (res, rej) => {
        try {
            const index = 'misp';
            let checkDoc = await db.deleteDoc(index, id);

            return res(checkDoc);

        } catch (err) {
            console.error(err);
            rej(err);
        }
    });

}

const addSubmission = async function(user, submission, url, title) {
    return new Promise(async (res, rej) => {
        try {
            const index = 'misp-submissions';
            let checkIndex;
            let createIndex;
            let result;

            try {
                checkIndex = await db.getIndex(index);
            } catch (err) {
                console.info("Index not found, creating index");
                createIndex = await db.createIndex(index);
            }

            let doc = {
                "@created_timestamp": (new Date()).toISOString(),
                "@updated_timestamp": null,
                "res": null,
                "url": url,
                "userID": user,
                "user": user,
                "docName": title,
                "status": "Pending",
                "misp": submission,
                "eventId": null
            };

            if (
                (!checkIndex && createIndex?.status === 200)
                || checkIndex?.status == 200
            ) {
                result = await db.postDoc(index, doc);
                if (result?.status == 201 && result?.data?._id) {
                    res(result.data._id);
                } else {
                    rej(null);
                }
            } else {
                return rej(null);
            }
        } catch (e) {
            console.error("Something went wrong creating submission document")
            console.error(e)
            console.trace();
            rej(null);
        }
    })
}

const updateSubmission = async function(docId, resp, status) {
    return new Promise(async (res, rej) => {
        try {
            if (!docId)
                rej(false);

            const index = 'misp-submissions';

            let checkDoc = await db.getDoc(index, docId);

            if (JSON.stringify(checkDoc.data) === '{}') {
                console.info(`Doc: ${docId} is not found`)
                console.trace();
                rej(false)
            } else {
                let data = checkDoc.data;

                if (resp) {
                    data.res = JSON.stringify(resp);
                    data.eventId = resp['Event']?.id;
                }

                data.status = status;

                data["@updated_timestamp"] = (new Date()).toISOString();

                let result = await db.updateDoc(index, data, docId);

                if (result.status === 200) {
                    res(true);
                } else {
                    console.error("Something went wrong while updating document " + docId)
                    console.error(result);
                    console.trace();
                    rej(false);
                }
            }

        } catch (e) {
            rej(e);
        }
    })
}

const getSubmissions = async function(user, from) {
    return new Promise(async (res, rej) => {
        try {
            const index = 'misp-submissions';

            let checkIndex = await db.getIndex(index);

            if (JSON.stringify(checkIndex.data) === "{}") {
                return res({ status: 404 })
            }  else {

                let userArray = user.split('+');

                const queryData = {
                    "terms": {
                        "term": "user.keyword",
                        "arr": userArray
                    }
                };

                const result = await db.searchDocs(index, queryData, 10, from, {"@created_timestamp": "desc"});
                const data = [];

                if (result.status == 200) {
                    result.data?.hits?.hits.forEach(elem => data.push(elem._source));
                    let hasMore = result.data?.hits?.total.value > (Number(from) + result.data.hits.hits.length)

                    return res({ status: 200, data: data, hasMore: hasMore });
                }
            }

            return res({ status: 404 });
        } catch (e) {
            return rej({ status: 404 });
        }
    });
}

module.exports = { getEvent, addEvent, addServer, getServers, getSubmissions, addSubmission, updateSubmission, deleteServer, searchEvent }
