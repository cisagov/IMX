const vt = require('../apis/virus-total');

module.exports = function(app, logger) {
    const { v5: uuidV5, v4: uuidV4 } = require("uuid");
    const fileExtensions = require('file-extensions');

    const regex = {
      "ipv4-addr": /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/,
      "ipv6-addr": /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
      'email-addr': /(?=^.{1, 200})[a-zA-Z0-9]+@[a-z]+\.[a-z]{2,3}/,
      "domain-name": /^[a-z0-9]+(?:\-[\w]+)*\.[a-z]{2,6}$/i,
      "sub-domain-name": /^[a-z0-9]+(?:\-[\w]+)*\.[a-z0-9]+(?:\-[\w]+)*\.[a-z]{2,6}$/i,
      "sub-sub-domain-name": /^[a-z0-9]+(?:\-[\w]+)*\.[a-z0-9]+(?:\-[\w]+)*\.[a-z0-9]+(?:\-[\w]+)*\.[a-z]{2,6}$/i,
      "url": /^(?=.{1,500}$)[A-Za-z][A-Za-z0-9+.-]*:\/\/\S+$/,
      "mac-addr": /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
      'artifact': /^(?!.*(?:[\\/]|:\/\/))([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)$/,
      "file": /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/,
      'process': /^\d{4,5}$/,
      "MD5": /^[a-fA-F0-9]{32}$/,
      "SHA-1": /^([a-fA-F0-9]{40})$/,
      "SHA-256": /^[A-Fa-f0-9]{64}$/,
      "SHA-512": /^[0-9a-fA-F]{512}$/,
      "SSDEEP": /^(\\D+):([A-Za-z0-9+/]+)(:([A-Za-z0-9+/]+=*))?$/,
      "TLSH": /^[a-zA-Z0-9]{69,71}$/,
      'windows-registry-key': /^HKEY_(?:LOCAL_MACHINE|CURRENT_USER|CLASSES_ROOT|USERS)(?:\\\\[^\\]+)*$/,
      'directory': new RegExp('^(?=^.{1, 200})(.*)(/|\\\\)+([^/]*)$'),
    }

    const splitRegex = /[,\s;!?=<>]+|\r|\n/;
    const spec_version = "2.1";

    const removeEnd = [ '.', '[', ']', '"', ':', '>' ];
    const removeStart = [ '(', '[', ']', '"' ];

    const otherExtensions = [
        'md',
        'sys',
        'ds'
        ];

    const IdContributingProperties = [
      { 'artifact': ['hashes', 'payload_bin'] },
      { 'autonomous-system': ['number'] },
      { 'directory': ['path'] },
      { 'domain-name': ['value'] },
      { 'email-addr': ['value'] },
      { 'email-message': ['from_ref', 'subject', 'body'] },
      { 'file': ['hashes', 'name', 'extensions', 'parent_directory_ref'] },
      { 'ipv4-addr': ['value'] },
      { 'ipv6-addr': ['value'] },
      { 'mac-addr': ['value'] },
      { 'mutex': ['name'] },
      { 'network-traffic': ['start', 'src_ref', 'dst_ref', 'src_port', 'dst_port', 'protocols'] },
      { 'software': ['name', 'cpe', 'swid', 'vendor', 'version'] },
      { 'url': ['value'] },
      { 'user-account': ['account_type', 'user_id', 'account_login'] },
      { 'windows-registry-key': ['key', 'values'] },
      { 'x509-certificate': ['hashes', 'serial_number'] },
    ];

    app.post('/identify-stix-vt', async (req, res) => {
        const text = req.body.text;

        parseText(text, req, res);
    });

    /**
     *
     * @param {string of the overall text} text
     * @param {req from the client} req
     * @param {response object to send to client} res
     */
    const parseText = function(text, req, res){
        try {
            let result = getObjects(text);

            let objectFields = [ 'hashes' ]

            for(let object of result){
                for(let field of objectFields){
                    if(object[field]){
                        if(Object.keys(object[field]).length === 0){
                            delete object[field];
                        }
                    }
                }
            }

            logger.logEndpoint(200, req, undefined);
            console.log(result);
            res.send({ "objects": result });
        } catch(e) {
            console.log(e);
            console.trace();
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, error: 'Something happened on the IMX Server'});
        }
    }

    /**
     *
     * @param {string of overall text} text
     * @returns text converted to array of objects
     */
    const getObjects = function(text){
        let objects = [];
        let split = text.split(splitRegex).filter(word => word.trim() !== '');
        let currentFile = undefined;
        let currentHashes = undefined;
        let isFileFirst = true;
        for(let i in split){
            let str = checkStartStr(split[i]);
            str = checkEndStr(str);

            if(str === "" || str === ":"){
                continue;
            } else {
                for(let exp in regex){
                    let matchFound = regex[exp].test(str);
                    if(exp === 'url'){
                        console.log(str);
                        console.log(regex[exp].test(str));
                    }
                    if(!matchFound && (exp === 'domain-name' || exp === 'sub-domain-name' || exp === 'sub-sub-domain-name' || exp === 'ipv4-addr')){
                        let tempStr = removeOptionalBrackets(str)
                        matchFound = regex[exp].test(tempStr);

                        if(matchFound) str = tempStr;
                    }
                    else if(matchFound && (exp === 'mac-addr')) str = (str.toLowerCase()).replaceAll('-', ':');

                    if(matchFound){
                        let addToObjects = true;
                        let temp = {
                            type: exp,
                            spec_version: spec_version,
                            value: str
                        }

                        switch(exp){
                            case 'MD5':
                            case 'SHA-1':
                            case 'SHA-256':
                            case 'SHA-512':
                            case 'SSDEEP':
                            case 'TLSH':
                                let hashes = {};
                                hashes[exp] = str;

                                // Loops through rest of hashes and makes sure there aren't other matches
                                // for(let hashType in hashRegex){
                                //     if(exp === hashType){
                                //         continue;
                                //     }

                                //     if(hashRegex[hashType].test(str)){
                                //         hashes[hashType] = str;
                                //     }
                                // }


                                if(isFileFirst === false && currentFile){
                                    createFile(currentFile, currentHashes, objects);
                                    currentHashes = undefined;
                                    currentFile = undefined;
                                }

                                if(!currentHashes) currentHashes = {};

                                for(let hash in hashes){
                                    if(currentHashes[hash] && !currentFile){
                                        createFileOnlyHashes(currentHashes, objects);
                                        currentHashes = hashes;
                                    } else if(currentHashes[hash]){
                                        createFile(currentFile, currentHashes, objects);

                                        currentFile = undefined;
                                        currentHashes = hashes;
                                        isFileFirst = false;
                                    } else {
                                        if(currentFile) isFileFirst = true;
                                        else isFileFirst = false;

                                        currentHashes[hash] = hashes[hash];
                                    }
                                }

                                addToObjects = false;

                                break;

                            case 'sub-domain-name':
                            case 'sub-sub-domain-name':
                            case 'domain-name':
                            case 'url':
                            case 'file':

                                if(str.includes(".")){
                                    let str_split = str.split(".");
                                    let postfix = str_split[str_split.length - 1];
                                    let prefix = str_split[0];

                                    let isFileExt = fileExtensions.find( ext => ext.ext === postfix);

                                    if(currentFile){
                                        createFile(currentFile, currentHashes, objects);
                                        currentFile = undefined;
                                        currentHashes = undefined;
                                    }

                                    if(!prefix.startsWith('http') && (isFileExt !== undefined || otherExtensions.includes(postfix))){
                                        if(!currentHashes) isFileFirst = true;

                                        currentFile = {
                                            type: 'file',
                                            spec_version: spec_version,
                                            hashes: {},
                                            name: str
                                        }

                                        addToObjects = false;
                                        break;
                                    } else {
                                        if(exp === 'sub-domain-name' || exp === 'sub-sub-domain-name'){
                                            temp.type = 'domain-name';

                                            // let tempUrl = {
                                            //     type: 'url',
                                            //     spec_version: spec_version,
                                            //     value: `http[s]://${str}`
                                            // };

                                            // isDuplicate(tempUrl, objects);
                                        }
                                        else if (exp === 'domain-name'){
                                            // let tempUrl = {
                                            //     type: 'url',
                                            //     spec_version: spec_version,
                                            //     value: `http[s]://${str}`
                                            // };

                                            // isDuplicate(tempUrl, objects);

                                        } else if (exp === 'url'){
                                            // let splitUrl = str.split('/');

                                            // for(let string of splitUrl){
                                            //     if(regex['domain-name'].test(string)){
                                            //         let tempDomain = {
                                            //             type: 'domain-name',
                                            //             spec_version: 'spec_version',
                                            //             value: string
                                            //         };


                                            //         isDuplicate(tempDomain, objects);
                                            //         break;
                                            //     }
                                            //     else if(regex['sub-domain-name'].test(string)){
                                            //         let tempDomain = {
                                            //             type: 'domain-name',
                                            //             spec_version: 'spec_version',
                                            //             value: `${string}`
                                            //         };


                                            //         isDuplicate(tempDomain, objects);
                                            //         break;
                                            //     }
                                            // }
                                        }
                                        else if(exp === 'file') addToObjects = false;

                                        //If it is not a file
                                        if(currentHashes){
                                            createFileOnlyHashes(currentHashes, objects);
                                            currentHashes = undefined;
                                        }
                                    }
                                } else {
                                    addToObjects = false;
                                }
                                break;

                            default:
                                str = checkEndStr(str);
                                str = checkStartStr(str);
                                temp.value = str;

                                if(currentFile){
                                    createFile(currentFile, currentHashes, objects);
                                    currentFile = undefined;
                                    currentHashes = undefined;
                                }
                                if(currentHashes){
                                    createFileOnlyHashes(currentHashes, objects);
                                    currentHashes = undefined;
                                }
                        }// END SWITCH

                        if(addToObjects) isDuplicate(temp, objects);

                        break;
                    }

                }//end regex for loop

            }

        }//end split string for loop

        if(currentFile){
            createFile(currentFile, currentHashes, objects);
            currentFile = undefined;
            currentHashes = undefined;
        }
        if(currentHashes){
            createFileOnlyHashes(currentHashes, objects);
            currentHashes = undefined;
        }

        return objects;
    }

    /**
     * Checks for duplicate already in identified objects. Deligates merge if necessary
     * @param {object that we are testing for a Dup} tempObj
     * @param {array of current objects} objects
     * @returns nothing
     */
    const isDuplicate = function(tempObj, objects){
        for(let i in objects){
            let obj = objects[i];

            if(obj.type !== tempObj.type) continue;

            switch(obj.type){
                case 'directory':
                    if(obj.path.toLowerCase() === tempObj.path.toLowerCase()){
                        mergeDuplicate(objects[i], tempObj);
                        return;
                    }
                    break;
                case 'file':
                    if((obj.name && tempObj.name) && obj.name.toLowerCase() === tempObj.name.toLowerCase()){
                        mergeDuplicate(objects[i], tempObj);
                        return;
                    }
                    break;
                case 'process':
                    if(obj.pid === tempObj.pid){
                        mergeDuplicate(objects[i], tempObj);
                        return;
                    }
                    break;
                case 'artifact':
                    if(obj.url && obj.url === tempObj.url){
                        mergeDuplicate(objects[i], tempObj);
                        return;
                    }
                    if(obj.payload_bin && obj.payload_bin === tempObj.payload_bin){
                        mergeDuplicate(objects[i], tempObj);
                        return;
                    }
                    break;
                case 'windows-registry-key':
                    if(obj.key === tempObj.key){
                        mergeDuplicate(objects[i], tempObj);
                        return;
                    }
                    break;
                default:
                    if(obj.value.toLowerCase() === tempObj.value.toLowerCase()){
                        mergeDuplicate(objects[i], tempObj);
                        return;
                    }
                    break;
            }
        }

        if(tempObj.type === 'file' && !regex['file'].test(tempObj.name)){
            delete tempObj.name;
        }
        tempObj['id'] = `${tempObj.type}--${generateUUID(tempObj)}`;

        objects.push(tempObj);
    }

    const mergeDuplicate = function(original, duplicate){
        for(let field in duplicate){
            switch(field){
                case 'type':
                case 'spec_version':
                case 'value':
                case 'id':
                case 'name':
                    continue;
                case 'hashes':
                    for(let hash in duplicate['hashes']){

                        if(original['hashes'][hash]){
                            let dupSplit = duplicate['hashes'][hash].split(', ');

                            for(let str of dupSplit){
                                if(!original['hashes'][hash].includes(str)){
                                    original['hashes'][hash] += `, ${str}`;
                                }
                            }
                        } else {
                            original['hashes'][hash] = duplicate['hashes'][hash];
                        }

                    }
                    break;
                default:
                    original[field] = duplicate[field];
            }
        }
    }

    const createFile = function(currentFile, currentHashes, objects){
        if(currentHashes)
            currentFile.hashes = currentHashes;

        isDuplicate(currentFile, objects);

        currentFile = undefined;
        currentHashes = undefined;
    }

    const createFileOnlyHashes = function(currentHashes, objects){
        for(let hash in currentHashes){
            let tempFile = {
                type: 'file',
                spec_version: spec_version,
                hashes: {},
                name: `${currentHashes[hash]}`
            }

            tempFile.hashes[hash] = currentHashes[hash]

            isDuplicate(tempFile, objects);
        }
    }

    const checkEndStr = function(str){
        for(let c of removeEnd){
            if(str.endsWith(c)){
                str = str.slice(0, -1);
                str = checkEndStr(str);
                break;
            }
        }

        return str;
    }

    const checkStartStr = function(str){
        for(let c of removeStart){
            if(str.startsWith(c)){
                str = str.slice(1);
                str = checkStartStr(str);
                break;
            }
        }

        return str;
    }

    const removeOptionalBrackets = function(str){
        let replaceMap = {
            '[.]': '.',
            '[s]': 's'
        }

        for(let ogStr in replaceMap){
            let repStr = replaceMap[ogStr];

            str = str.replaceAll(ogStr, repStr);
        }

        return str;
    }

    const generateUUID = function(componentData){
        const namespace = "00abedb4-aa42-466c-9c01-fed23315a9b7";
        var uuidString = {};

        this.idContributingProperties = IdContributingProperties;
        let index = this.idContributingProperties.findIndex(obj =>
          Object.keys(obj)[0] === componentData.type
        )

        if (index > -1) {
          this.idContributingProperties[index][componentData.type].forEach(prop => {
            if (prop === 'hashes') {
                const hashOrder = ["MD5", 'SHA-1', "SHA-256", "SHA-512"];
                let hashFound = false;

                hashOrder.forEach(hash => {
                  if (hashFound)
                    return;

                  if (componentData['hashes'][hash]) {
                    hashFound = true;
                    uuidString.hashes = { [hash]: componentData['hashes'][hash] }
                  }
                });

                if (!hashFound) {
                  const keys = Object.keys(componentData['hashes']);

                  if (keys && keys.length > 0)
                    uuidString.hashes = { [keys[0]]: componentData['hashes'][keys[0]] };
                }


                return;
              }

            if (prop === 'values' && componentData.type === 'windows-registry-key') {
              uuidString[prop] = componentData['values'];
              return;
            }
            if ((prop === 'language_contents' && componentData.type === 'language-content')) {
              uuidString[prop] = componentData[prop];
              return;
            }

            if (prop === 'protocols' && componentData.type === 'network-traffic') {
              uuidString[prop] = this.stringArrays.get("protocols");
              return;
            }

            if (prop === 'number') {
              uuidString[prop] = Number(componentData[prop]);
              return;
            }

            if (componentData[prop] !== "") {
              uuidString[prop] = componentData[prop];
            }
          })
        }

        if (!Object.keys(uuidString).length) {
          return uuidV4();
        } else {
          return uuidV5(JSON.stringify(uuidString), namespace);
        }
    }

    app.post('/get-hash', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let hash = req.body.hash;
        if(hash === null || hash === undefined || hash.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No hash found"
            });
            return;
        }

        try {
            let vtResponse =  await vt.getHash(hash);

            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-hash-ttp', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let hash = req.body.hash;
        if(hash === null || hash === undefined || hash.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No hash found"
            });
            return;
        }

        try {
            let vtResponse =  await vt.getHash(hash, true);
            logger.logEndpoint(200, req, undefined);

            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-ip', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let ip = req.body.ip;
        if(ip === null || ip === undefined || ip.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No IP address found"
            });
            return;
        }

        try {
            let vtResponse =  await vt.getIp(ip);

            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-ip-resolutions', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let ip = req.body.ip;
        let limit = req.body.limit || 40;
        let cursor = req.body.cursor || null;

        if(ip === null || ip === undefined || ip.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No IP address found"
            });
            return;
        }

        try {
            let vtResponse = await vt.getIpResolutions(ip, limit, cursor);
            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-ip-communicating-files', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let ip = req.body.ip;
        let limit = req.body.limit || 40;
        let cursor = req.body.cursor || null;

        if(ip === null || ip === undefined || ip.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No IP address found"
            });
            return;
        }

        try {
            let vtResponse = await vt.getIpCommunicatingFiles(ip, limit, cursor);
            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-ip-historical-ssl-certs', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let ip = req.body.ip;
        let limit = req.body.limit || 40;
        let cursor = req.body.cursor || null;

        if(ip === null || ip === undefined || ip.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No IP address found"
            });
            return;
        }

        try {
            let vtResponse = await vt.getIpHistoricalSslCerts(ip, limit, cursor);
            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-ip-historical-whois', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let ip = req.body.ip;
        let limit = req.body.limit || 40;
        let cursor = req.body.cursor || null;

        if(ip === null || ip === undefined || ip.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No IP address found"
            });
            return;
        }

        try {
            let vtResponse = await vt.getIpHistoricalWhois(ip, limit, cursor);
            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-sigma-rule', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let ruleId = req.body.ruleId;
        if(ruleId === null || ruleId === undefined || ruleId.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No rule ID found"
            });
            return;
        }

        try {
            let vtResponse = await vt.getSigmaRule(ruleId);
            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-ip-referrer-files', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let ip = req.body.ip;
        let limit = req.body.limit || 40;
        let cursor = req.body.cursor || null;

        if(ip === null || ip === undefined || ip.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No IP address found"
            });
            return;
        }

        try {
            let vtResponse = await vt.getIpReferrerFiles(ip, limit, cursor);
            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-domain', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let domain = req.body.domain;
        if(domain === null || domain === undefined || domain.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No domain found"
            });
            return;
        }

        try {
            let vtResponse = await vt.getDomain(domain);
            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-url', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let url = req.body.url;
        if(url === null || url === undefined || url.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No URL found"
            });
            return;
        }

        try {
            let vtResponse = await vt.getUrl(url);
            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-url-serving-ip', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let url = req.body.url;
        if(url === null || url === undefined || url.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No URL found"
            });
            return;
        }

        try {
            let vtResponse = await vt.getUrlLastServingIp(url);
            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-domain-resolutions', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let domain = req.body.domain;
        let limit = req.body.limit || 40;
        let cursor = req.body.cursor || null;

        if(domain === null || domain === undefined || domain.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No domain found"
            });
            return;
        }

        try {
            let vtResponse = await vt.getDomainResolutions(domain, limit, cursor);
            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-domain-communicating-files', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let domain = req.body.domain;
        let limit = req.body.limit || 40;
        let cursor = req.body.cursor || null;

        if(domain === null || domain === undefined || domain.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No domain found"
            });
            return;
        }

        try {
            let vtResponse = await vt.getDomainCommunicatingFiles(domain, limit, cursor);
            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-domain-referrer-files', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let domain = req.body.domain;
        let limit = req.body.limit || 40;
        let cursor = req.body.cursor || null;

        if(domain === null || domain === undefined || domain.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No domain found"
            });
            return;
        }

        try {
            let vtResponse = await vt.getDomainReferrerFiles(domain, limit, cursor);
            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-domain-subdomains', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let domain = req.body.domain;
        let limit = req.body.limit || 40;
        let cursor = req.body.cursor || null;

        if(domain === null || domain === undefined || domain.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No domain found"
            });
            return;
        }

        try {
            let vtResponse = await vt.getDomainSubdomains(domain, limit, cursor);
            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-domain-historical-whois', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let domain = req.body.domain;
        let limit = req.body.limit || 40;
        let cursor = req.body.cursor || null;

        if(domain === null || domain === undefined || domain.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No domain found"
            });
            return;
        }

        try {
            let vtResponse = await vt.getDomainHistoricalWhois(domain, limit, cursor);
            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })

    app.post('/get-domain-historical-ssl-certs', async (req, res) => {
        if(!process.env.VIRUS_TOTAL_ENABLED){
            logger.logEndpoint(403, req, undefined);
            res.send({
                status: 403,
                message: "VIRUS TOTAL is DISABLED"
            })
            return;
        }

        let domain = req.body.domain;
        let limit = req.body.limit || 40;
        let cursor = req.body.cursor || null;

        if(domain === null || domain === undefined || domain.length === 0) {
            logger.logEndpoint(400, req, undefined);
            res.send({
                status: 400,
                message: "No domain found"
            });
            return;
        }

        try {
            let vtResponse = await vt.getDomainHistoricalSslCerts(domain, limit, cursor);
            logger.logEndpoint(200, req, undefined);
            res.send(vtResponse.data);
        } catch(err) {
            console.log(err);
            logger.logEndpoint(500, req, undefined);
            res.send({ status: 500, message: 'Something went wrong contacting VirusTotal' });
        }
    })


}
