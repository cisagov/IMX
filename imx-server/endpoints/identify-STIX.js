const { upload } = require('../index')
const FormData = require('form-data')

const identifyStixEndpoints = function(app, logger){
    const fileExtensions = require('file-extensions')
    const { v5: uuidV5, v4: uuidV4 } = require("uuid")
    const fs = require('node:fs')
    const axios = require('axios')

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
      "SSDEEP": /^[0-9]{1,6}:[A-Za-z0-9]{3,64}:[A-Za-z0-9]{10,128}$/,
      "TLSH": /^[0-9a-fA-F]{35,70}$/,
      'windows-registry-key': /^HKEY_(?:LOCAL_MACHINE|CURRENT_USER|CLASSES_ROOT|USERS)(?:\\\\[^\\]+)*$/,
      'directory': new RegExp('^(?=^.{1, 200})(.*)(/|\\\\)+([^/]*)$'),
    }

    const splitRegex = /[,\s;!?=<>]+|\r|\n/
    const spec_version = "2.1"

    const removeEnd = [ '.', '[', ']', '"', ':', '>' ]
    const removeStart = [ '(', '[', ']', '"' ]

    const months = new Set([
        'january',
        'february',
        'march',
        'april',
        'may',
        'june',
        'july',
        'august',
        'september',
        'october',
        'november',
        'december'
    ])
    const monthAcr = new Set([
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec'
    ])
    const processNotAllowed = new Set([
        'of',
        'in',
        'year',
        'within'
    ])

    const otherExtensions = new Set([
        'md',
        'sys',
        'ds'
    ])

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
    ]

    const commonSlashPhrases = new Set([
        'and/or',
        '24/7'
    ])

    app.post('/identify-stix', async (req, res) => {
        const text = req.body.text

        parseText(text, req, res)
    })



    /**
     * Entry point for identify stix with a file upload
     */
    app.put('/identify-stix-file/:fileName', dynamicFileUpload, async (req, res) => {
        let fileName = req.params.fileName

        let file = fs.createReadStream(`./uploads/${fileName}`)

        const form = new FormData()
        form.append('file', file)

        const headers = {
            ...form.getHeaders(),
            'Content-Type': 'application/octet-stream',
            'Accept': 'text/plain',
        }

        axios.put(process.env.TIKA_URL, file, { headers: headers })
            .then((resp) => {
                fs.unlinkSync(`./uploads/${fileName}`)
                if(resp.data){
                    console.log('Successful Res from Apache Tika')
                    let text = removeDelimiters(resp.data)

                    parseText(text, req, res)
                } else {
                    console.error('Error Communicating W/ Apache Tika')
                    res.send({ status: 500, error: 'Not able to read file'})
                }
            })
            .catch((err) => {
                console.error(err)
            })
    })


    /**
     *
     * @param {string of the overall text} text
     * @param {req from the client} req
     * @param {response object to send to client} res
     */
    const parseText = function(text, req, res){
        try {
            let result = getObjects(text)

            let objectFields = [ 'hashes' ]

            for(let object of result){
                for(let field of objectFields){
                    if(object[field]){
                        if(Object.keys(object[field]).length === 0){
                            delete object[field]
                        }
                    }
                }
            }

            logger.logEndpoint(200, req, undefined)
            console.log(result)
            res.send({ "objects": result })
        } catch(e) {
            console.error(e)
            console.trace()
            logger.logEndpoint(500, req, undefined)
            res.send({ status: 500, error: 'Something happened on the IMX Server'})
        }
    }

    /**
     *
     * @param {string of overall text} text
     * @returns text converted to array of objects
     */
    const getObjects = function(text){
        let objects = []
        let split = text.split(splitRegex).filter(word => word.trim() !== '')

        let currentFile
        let currentHashes
        let isFileFirst = true

        for(let i in split){
            let str = checkStartStr(split[i])
            str = checkEndStr(str)

            if(str === "" || str === ":"){
                continue
            } else {
                for(let exp in regex){
                    let matchFound = regex[exp].test(str)
                    if(!matchFound && (exp === 'domain-name' || exp === 'sub-domain-name' || exp === 'sub-sub-domain-name' || exp === 'ipv4-addr')){
                        let tempStr = removeOptionalBrackets(str)
                        matchFound = regex[exp].test(tempStr)

                        if(matchFound) str = tempStr
                    }
                    else if(matchFound && (exp === 'mac-addr')) str = (str.toLowerCase()).replaceAll('-', ':')

                    if(matchFound){
                        let addToObjects = true
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
                            case 'TLSH': {
                                let hashes = {}
                                hashes[exp] = str


                                if(isFileFirst === false && currentFile){
                                    createFile(currentFile, currentHashes, objects)
                                    currentHashes = undefined
                                    currentFile = undefined
                                }

                                if(!currentHashes) currentHashes = {}

                                for(let hash in hashes){
                                    if(currentHashes[hash] && !currentFile){
                                        createFileOnlyHashes(currentHashes, objects)
                                        currentHashes = hashes
                                    } else if(currentHashes[hash]){
                                        createFile(currentFile, currentHashes, objects)

                                        currentFile = undefined
                                        currentHashes = hashes
                                        isFileFirst = false
                                    } else {
                                        if(currentFile) isFileFirst = true
                                        else isFileFirst = false

                                        currentHashes[hash] = hashes[hash]
                                    }
                                }

                                addToObjects = false

                                break
                            }
                            case 'sub-domain-name':
                            case 'sub-sub-domain-name':
                            case 'domain-name':
                            case 'url':
                            case 'file':

                                if(str.includes(".")){
                                    let str_split = str.split(".")
                                    let postfix = str_split[str_split.length - 1]
                                    let prefix = str_split[0]

                                    let isFileExt = fileExtensions.find( ext => ext.ext === postfix)

                                    if(currentFile){
                                        createFile(currentFile, currentHashes, objects)
                                        currentFile = undefined
                                        currentHashes = undefined
                                    }

                                    if(!prefix.startsWith('http') && (isFileExt !== undefined || otherExtensions.has(postfix))){
                                        if(!currentHashes) isFileFirst = true

                                        currentFile = {
                                            type: 'file',
                                            spec_version: spec_version,
                                            hashes: {},
                                            name: str
                                        }

                                        addToObjects = false
                                        break
                                    } else {
                                        if(exp === 'sub-domain-name' || exp === 'sub-sub-domain-name'){
                                            temp.type = 'domain-name'
                                        }
                                        else if(exp === 'file') addToObjects = false

                                        //If it is not a file
                                        if(currentHashes){
                                            createFileOnlyHashes(currentHashes, objects)
                                            currentHashes = undefined
                                        }
                                    }
                                } else {
                                    addToObjects = false
                                }
                                break

                            case 'process':
                                let fourDigit = /^\d{4}$/

                                if(fourDigit.test(str)){
                                    let isYear = false

                                    let range = [i-1, i-2]
                                    if(!str.includes('.')){
                                        range.push(i+1)
                                        range.push(i+2)
                                    }

                                    for(let index of range){
                                        if(index === i-1 || (range.includes(i+1) && index === i+1)){
                                            if(split[index] && processNotAllowed.has(split[index].toLowerCase())){
                                                isYear = true
                                                break
                                            }
                                        }

                                        if(split[index] && monthAcr.has(split[index].toLowerCase())){
                                            isYear = true
                                            break
                                        }

                                        if(split[index]){
                                            let separate = split[index].split('-')

                                            for(let string of separate){
                                                if(months.has(string.toLowerCase())){
                                                    isYear = true
                                                    break
                                                }
                                            }

                                            if(isYear) break
                                        }
                                    }

                                    if(isYear) continue
                                }


                                if(currentFile){
                                    createFile(currentFile, currentHashes, objects)
                                    currentFile = undefined
                                    currentHashes = undefined
                                }
                                if(currentHashes){
                                    createFileOnlyHashes(currentHashes, objects)
                                    currentHashes = undefined
                                }

                                delete temp.value
                                temp['pid'] = str
                                break

                            case 'windows-registry-key':
                                if(currentFile){
                                    createFile(currentFile, currentHashes, objects)
                                    currentFile = undefined
                                    currentHashes = undefined
                                }
                                if(currentHashes){
                                    createFileOnlyHashes(currentHashes, objects)
                                    currentHashes = undefined
                                }

                                delete temp.value
                                temp['key'] = str
                                break

                            case 'directory':
                                { str = checkEndStr(str)

                                if(str === '/') continue

                                if(currentFile){
                                    createFile(currentFile, currentHashes, objects)
                                    currentFile = undefined
                                    currentHashes = undefined
                                }
                                if(currentHashes){
                                    createFileOnlyHashes(currentHashes, objects)
                                    currentHashes = undefined
                                }

                                let splitSlash = str.split(/[\\\/]/)
                                let prefix = splitSlash[0]

                                if(regex['domain-name'].test(prefix) || regex['sub-domain-name'].test(prefix)){
                                    let tempDomain = {
                                        type: 'domain-name',
                                        spec_version: 'spec_version',
                                        value: prefix
                                    }

                                    // isDuplicate(tempUrl, objects)
                                    isDuplicate(tempDomain, objects)

                                    continue
                                }

                                let allowedPrefix = new Set([ 'C:', '.', '..', '~' ])
                                if(!allowedPrefix.has(prefix) && splitSlash.length < 3){
                                    if(splitSlash.length === 2 && splitSlash[1] !== '' && splitSlash[0] !== '' && !commonSlashPhrases.has(str)){
                                        let splitDot = splitSlash[ splitSlash.length-1 ].split('.')

                                        if(splitDot.length > 1){
                                            let postfix = splitDot[ splitDot.length-1 ]
                                            let isFileExt = fileExtensions.find( ext => ext.ext === postfix)

                                            if(!isFileExt && !otherExtensions.has(postfix)){
                                                continue
                                            }
                                        }
                                    } else {
                                        continue
                                    }
                                }
                                else if(prefix.includes(':') && !prefix.startsWith('C')) continue

                                let splitDot = splitSlash[ splitSlash.length-1 ].split('.')

                                if(splitDot.length > 1){
                                    let postfix = splitDot[ splitDot.length-1 ]
                                    let isFileExt = fileExtensions.find( ext => ext.ext === postfix)

                                    if(isFileExt || otherExtensions.has(postfix)){
                                        currentFile = {
                                            type: 'file',
                                            spec_version: spec_version,
                                            hashes: {},
                                            name: splitSlash[ splitSlash.length-1 ]
                                        }
                                    }
                                }

                                temp.type = 'directory'
                                delete temp.value
                                temp['path'] = str
                                break }

                            case 'artifact':
                                if(currentFile){
                                    createFile(currentFile, currentHashes, objects)
                                    currentFile = undefined
                                    currentHashes = undefined
                                }
                                if(currentHashes){
                                    createFileOnlyHashes(currentHashes, objects)
                                    currentHashes = undefined
                                }

                                delete temp.value
                                temp['payload_bin'] = str
                                break

                            default:
                                str = checkEndStr(str)
                                str = checkStartStr(str)
                                temp.value = str

                                if(currentFile){
                                    createFile(currentFile, currentHashes, objects)
                                    currentFile = undefined
                                    currentHashes = undefined
                                }
                                if(currentHashes){
                                    createFileOnlyHashes(currentHashes, objects)
                                    currentHashes = undefined
                                }
                        }// END SWITCH

                        if(addToObjects) isDuplicate(temp, objects)

                        break
                    }

                }//end regex for loop

            }

        }//end split string for loop

        if(currentFile){
            createFile(currentFile, currentHashes, objects)
            currentFile = undefined
            currentHashes = undefined
        }
        if(currentHashes){
            createFileOnlyHashes(currentHashes, objects)
            currentHashes = undefined
        }

        return objects
    }

    /**
     * Checks for duplicate already in identified objects. Deligates merge if necessary
     * @param {object that we are testing for a Dup} tempObj
     * @param {array of current objects} objects
     * @returns nothing
     */
    const isDuplicate = function(tempObj, objects){
        for(let i in objects){
            let obj = objects[i]

            if(obj.type !== tempObj.type) continue

            switch(obj.type){
                case 'directory':
                    if(obj.path.toLowerCase() === tempObj.path.toLowerCase()){
                        mergeDuplicate(objects[i], tempObj)
                        return
                    }
                    break
                case 'file':
                    if((obj.name && tempObj.name) && obj.name.toLowerCase() === tempObj.name.toLowerCase()){
                        mergeDuplicate(objects[i], tempObj)
                        return
                    }
                    break
                case 'process':
                    if(obj.pid === tempObj.pid){
                        mergeDuplicate(objects[i], tempObj)
                        return
                    }
                    break
                case 'artifact':
                    if(obj.url && obj.url === tempObj.url){
                        mergeDuplicate(objects[i], tempObj)
                        return
                    }
                    if(obj.payload_bin && obj.payload_bin === tempObj.payload_bin){
                        mergeDuplicate(objects[i], tempObj)
                        return
                    }
                    break
                case 'windows-registry-key':
                    if(obj.key === tempObj.key){
                        mergeDuplicate(objects[i], tempObj)
                        return
                    }
                    break
                default:
                    if(obj.value.toLowerCase() === tempObj.value.toLowerCase()){
                        mergeDuplicate(objects[i], tempObj)
                        return
                    }
                    break
            }
        }

        if(tempObj.type === 'file' && !regex['file'].test(tempObj.name)){
            delete tempObj.name
        }
        tempObj['id'] = `${tempObj.type}--${generateUUID(tempObj)}`

        objects.push(tempObj)
    }



    const createFile = function(currentFile, currentHashes, objects){
        if(currentHashes)
            currentFile.hashes = currentHashes

        isDuplicate(currentFile, objects)

        currentFile = undefined
        currentHashes = undefined
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

            isDuplicate(tempFile, objects)
        }
    }

    const checkEndStr = function(str){
        for(let c of removeEnd){
            if(str.endsWith(c)){
                str = str.slice(0, -1)
                str = checkEndStr(str)
                break
            }
        }

        return str
    }

    const checkStartStr = function(str){
        for(let c of removeStart){
            if(str.startsWith(c)){
                str = str.slice(1)
                str = checkStartStr(str)
                break
            }
        }

        return str
    }


    const generateUUID = function(componentData){
        const namespace = "00abedb4-aa42-466c-9c01-fed23315a9b7"
        let uuidString = {}

        this.idContributingProperties = IdContributingProperties
        let index = this.idContributingProperties.findIndex(obj =>
          Object.keys(obj)[0] === componentData.type
        )

        if (index > -1) {
          this.idContributingProperties[index][componentData.type].forEach(prop => {
            if (prop === 'hashes') {
                const hashOrder = ["MD5", 'SHA-1', "SHA-256", "SHA-512"]
                let hashFound = false

                hashOrder.forEach(hash => {
                  if (hashFound)
                    return

                  if (componentData['hashes'][hash]) {
                    hashFound = true
                    uuidString.hashes = { [hash]: componentData['hashes'][hash] }
                  }
                })

                if (!hashFound) {
                  const keys = Object.keys(componentData['hashes'])

                  if (keys && keys.length > 0)
                    uuidString.hashes = { [keys[0]]: componentData['hashes'][keys[0]] }
                }

                return
              }

            if (prop === 'values' && componentData.type === 'windows-registry-key') {
              uuidString[prop] = componentData['values']
              return
            }
            if ((prop === 'language_contents' && componentData.type === 'language-content')) {
              uuidString[prop] = componentData[prop]
              return
            }

            if (prop === 'protocols' && componentData.type === 'network-traffic') {
              uuidString[prop] = this.stringArrays.get("protocols")
              return
            }

            if (prop === 'number') {
              uuidString[prop] = Number(componentData[prop])
              return
            }

            if (componentData[prop] !== "") {
              uuidString[prop] = componentData[prop]
            }
          })
        }

        if (Object.keys(uuidString).length) {
          return uuidV5(JSON.stringify(uuidString), namespace)
        } else {
          return uuidV4()
        }
    }
}

const dynamicFileUpload = function(req, res, next) {
    const contentType = req.headers['content-type'] || ''

    if (contentType.includes('multipart/form-data')) {
        const multerSingle = upload.single('file') // for single file
        multerSingle(req, res, next)
    } else {
        next() // Not a file upload
    }
}

/**
 *
 * @param {string to be modified} string
 * @returns string without delimiters below
 */
const removeDelimiters = function(string){
    string = string.replaceAll(String.raw`\n`, ' ')
    string = string.replaceAll(String.raw`\t`, ' ')
    string = string.replaceAll(String.raw`\r`, ' ')
    string = string.replaceAll('\\\\\\\\', ' ')
    string = string.replaceAll('\\\\', '\\')

    return string
}

const mergeDuplicate = function(original, duplicate){
    for(let field in duplicate){
        switch(field){
            case 'type':
            case 'spec_version':
            case 'value':
            case 'id':
            case 'name':
                continue
            case 'hashes':
                for(let hash in duplicate['hashes']){

                    if(original['hashes'][hash]){
                        let dupSplit = duplicate['hashes'][hash].split(', ')

                        for(let str of dupSplit){
                            if(!original['hashes'][hash].includes(str)){
                                original['hashes'][hash] += `, ${str}`
                            }
                        }
                    } else {
                        original['hashes'][hash] = duplicate['hashes'][hash]
                    }

                }
                break
            default:
                original[field] = duplicate[field]
        }
    }
}

const removeOptionalBrackets = function(str){
    let replaceMap = {
        '[.]': '.',
        '[s]': 's'
    }

    for(let ogStr in replaceMap){
        let repStr = replaceMap[ogStr]

        str = str.replaceAll(ogStr, repStr)
    }

    return str
}

module.exports = identifyStixEndpoints
