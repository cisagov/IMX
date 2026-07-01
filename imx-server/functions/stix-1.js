const getFOUO = function(data){
    if(data.title && data.title.classification.toLowerCase().includes("fouo"))
        return "1"

    return null
}

const getSighted = function(indicator){
    if('activityDates' in indicator && indicator.activityDates.length > 0)
        return indicator.activityDates[0].date

    return null
}

const getPhase = function(indicator){
    if('exploitStage' in indicator && indicator.exploitStage !== null && indicator.exploitStage !== undefined)
        return indicator.exploitStage.name

    return null
}

const format = async function(data){
    return new Promise((resolve, reject) => {
        try {
            let struct = []

            // EVPKG
            let evPkg = {
                type: "main",
                guid: `A-${data.id}`,
                attribs: {
                    doctitle: data.title ?
                       data.title.name : "",
                    docid: `TPG-${data.id}`,
                    overview: data.description ?
                       data.description.name : "",
                    produced: data.reportedDate ?
                        data.reportedDate.date : null,
                    intent: "Indicators",
                    fouo: getFOUO(data),
                    tlp: data.tlp ? data.tlp.toUpperCase() : "NO_TLP_PROVIDED",
                    patterns: (data.attackPattern && data.attackPattern.idNamePairs) ?
                        getAttackPatternNames(data.attackPattern.idNamePairs) : null,
                    consent: "EVERYONE",
                    org_name: "CISA",
                    org_country: "US",
                    org_admin: "US-DC",
                    org_sector: "Government National",
                    org_source: "NONFED",
                    proprietary: "false"
                }
            }
            evPkg.attribs = removeNull(evPkg.attribs)
            struct.push(evPkg)

            if('indicators' in data){
                for(let indicator of data.indicators){

                    // INDICATORS
                    let indType = indicator.type.toLowerCase()
                    let newIndicator = {
                        type: 'indicator',
                        guid: `B-${indicator.id}`,
                        attribs: {
                            name: indicator.value.name,
                            type: getIndicatorType(indType),
                            sighted: getSighted(indicator),
                            phase: getPhase(indicator),
                            fouo: 'description' in indicator && indicator.description !== null && indicator.description !== undefined && indicator.description.classification.toLowerCase().includes("fouo") ?
                                "1" : null,
                            tlp: getTlp(indicator.tlp.toUpperCase()),
                        }
                    }
                    newIndicator.attribs = removeNull(newIndicator.attribs)
                    struct.push(newIndicator)

                    // DETAILS
                    let details = {
                        type: getDetailsType(indType, indicator.value?.name),
                        guid: `C-${indicator.id}`,
                        attribs: getDetailsAttribs(indicator, indType)
                    }
                    details.attribs = removeNull(details.attribs)
                    struct.push(details)
                }
            }

            resolve(struct)
        } catch(err) {
            console.log(err)
            reject(err)
        }
    })


}

const getAttackPatternNames = function(idNamePairs){
    let result = []
    for(let namePair of idNamePairs){
        result.push(namePair.name)
    }

    return result
}

const getIndicatorType = function(indType){
    switch(indType){
        case 'domain':
            return 'Domain Watchlist'
        case 'ipv4':
        case 'ipv6':
        case 'ip':
            return 'IP Watchlist'
        case 'email':
            return 'Malicious E-mail'
        case 'file':
            return 'File Hash Watchlist'
        case 'string':
        case 'mutex':
            return 'Malware Artifacts'
        case 'httpRequest':
        case 'smtpboolean':
        case 'url':
            return 'URL Watchlist'
        default:
            return null
    }
}

const getTlp = function(tlp){
    switch(tlp){
        case 'CLEAR':
            return 'WHITE'
        case 'AMBER+STRICT':
        case 'AMBERSTRICT':
            return "AMBER"
        default:
            return tlp
    }
}

const removeNull = function(object){
    for(let field in object){
        if(object[field] === null){
            delete object[field]
        }
    }

    return object
}

const getDetailsType = function(indType, name = null){
    switch(indType){
        case 'httprequest':
        case 'domain':
        case 'fqdn':
            return 'fqdn'
        case 'mutex':
        case 'string':
            return 'mutex'
        case 'ip':
            if (!name)
                return 'ip';
            if (name.includes('.'))
                return 'ipv4';
            if (name.includes(':'))
                return 'ipv6';

            return 'ip';
        default:
            return indType
    }
}

const getDetailsAttribs = function(indicator, type){
    let attribs = {}
    switch(type){
        case 'httprequest':
        case 'domain':
        case 'fqdn':
            attribs = {
                fqdn: addSlashes(indicator.value.name),
            }
            break
        case 'email':
            attribs = {
                sfrom: indicator.value.name,
                subject: 'subjects' in indicator && indicator.subjects.length > 0 ?
                    indicator.subjects[0].name : null
            }
            break
        case 'file': {
            attribs = {
                filename: 'fileNames' in indicator && indicator.fileNames !== null ?
                    getFileName(indicator) : null,
                path: 'path' in indicator && indicator.path !== null ?
                    addSlashes(indicator.path.name) : null,
                size: 'fileSize' in indicator && indicator.fileSize !== null ?
                    indicator.fileSize?.value : null,
            }

            let hashes = getHashes(indicator)
            for(let field in hashes){
                attribs[field] = hashes[field]
            }
            break
        }
        case 'ip':
        case 'ipv4':
            attribs = {
                ip: indicator.value.name,
            }
            break
        case 'ipv6':
            attribs = {
                ipv6: indicator.value.name,
            }
            break
        case 'mutex':
        case 'string':
            attribs = {
                mutex: indicator.value.name,
            }
            break
        case 'url':
            attribs = {
                url: indicator.value.name,
            }
            break
        case 'ua':
            attribs = {
                useragent: indicator.value.name,
            }
            break
        default:
            console.log(`Unknown indicator type: ${type}`)
    }

    return attribs
}

const addSlashes = function(str){
    return str.replace(/\\/g, '\\\\')
}

const getFileName = function(indicator){
    let result = ''

    for(let file of indicator.fileNames){
        if(result.length > 0){
            result += '; '
        }

        result += file.name
    }
    if(result.length > 0){
        return result
    }

    return null
}

const getHashes = function(indicator){
    if(!('hashes' in indicator && indicator.hashes !== null)) return {}

    let result = {
        md5 : null,
        sha1 : null,
        sha256: null,
        sha512: null,
        ssdeep: null
    }

    for(let hash of indicator.hashes){
        let hashType = hash.type.toLowerCase()

        switch(hashType){
            case 'md5':
            case 'sha1':
            case 'sha256':
            case 'sha512':
            case 'ssdeep':
                result[hashType] = hash.value
                break
            default:
                console.log(`Hash Type Unknown: ${hashType}`)
        }
    }

    result = removeNull(result)
    return result
}

module.exports = { format }
