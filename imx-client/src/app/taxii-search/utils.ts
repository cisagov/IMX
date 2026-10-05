import { StixService } from '../stix-service.service';

interface Sort {
    sortKey: string;
    results: any[];
}

export function sort(
    col: string,
    table: 'objects' | 'status',
    arg: {
        sortKey: string;
        unsortedQueryResults: any[];
        manifestsQueryResults?: any[];
        objectsQueryResults?: any[];
        statusTable?: any[];
    },
    stixService: StixService
): Sort {
    if (!arg.objectsQueryResults?.length && table === 'objects') return { sortKey: arg.sortKey, results: arg.objectsQueryResults };
    if (!arg.statusTable?.length && table === 'status') return { sortKey: arg.sortKey, results: arg.statusTable };

    const returnObj: Sort = {
        sortKey: arg.sortKey,
        results: null,
    };

    if (table === 'objects') {
    } else if (table === 'status') {
    }

    if (arg.sortKey === '') {
        if (table === 'objects') returnObj.results = sortResultsDes(col, arg.objectsQueryResults, stixService, arg.manifestsQueryResults);
        else if (table === 'status') returnObj.results = sortResultsDes(col, arg.statusTable, stixService, arg.manifestsQueryResults);

        returnObj.sortKey = `${col}-des`;
    } else {
        let keyArr = arg.sortKey.split('-');

        if (col === keyArr[0] && keyArr[1] === 'des') {
            if (table === 'objects') returnObj.results = sortResultsAsc(col, arg.objectsQueryResults, stixService, arg.manifestsQueryResults);
            else if (table === 'status') returnObj.results = sortResultsAsc(col, arg.statusTable, stixService, arg.manifestsQueryResults);

            returnObj.sortKey = `${col}-asc`;
        } else if (col === keyArr[0] && keyArr[1] === 'asc') {
            if (table === 'objects') returnObj.results = arg.unsortedQueryResults;
            else if (table === 'status') returnObj.results = arg.unsortedQueryResults;
            returnObj.sortKey = '';
        } else {
            if (table === 'objects') returnObj.results = sortResultsDes(col, arg.objectsQueryResults, stixService, arg.manifestsQueryResults);
            else if (table === 'status') returnObj.results = sortResultsDes(col, arg.statusTable, stixService, arg.manifestsQueryResults);
            returnObj.sortKey = `${col}-des`;
        }
    }

    return returnObj;
}

export function sortResultsDes(col: string, tableArray: any[], stixService: StixService, manifestsQueryResults: any[]) {
    switch (col) {
        case 'name':
            return tableArray.sort((a, b) =>
                getComponentDisplayLowercase(a, stixService) > getComponentDisplayLowercase(b, stixService)
                    ? 1
                    : getComponentDisplayLowercase(a, stixService) < getComponentDisplayLowercase(b, stixService)
                      ? -1
                      : 0
            );
        case 'status':
            return tableArray.sort((a, b) =>
                sortToLowercase(a.res[col]) > sortToLowercase(b.res[col]) ? 1 : sortToLowercase(a.res[col]) < sortToLowercase(b.res[col]) ? -1 : 0
            );
        case 'request_timestamp':
            return tableArray.sort((a, b) => sortDate(a.res[col], b.res[col], 'des'));
        case 'created':
        case 'modified':
        case 'date_added':
        case 'version':
            return tableArray.sort((a, b) => sortDate(a[col], b[col], 'des'));
        case 'published':
            if (!manifestsQueryResults) return tableArray;

            return tableArray.sort((a, b) =>
                sortDate(
                    manifestsQueryResults?.find((elem) => elem.id == a.id)?.date_added,
                    manifestsQueryResults?.find((elem) => elem.id == b.id)?.date_added,
                    'des'
                )
            );
        default:
            return tableArray.sort((a, b) =>
                sortToLowercase(a[col]) > sortToLowercase(b[col]) ? 1 : sortToLowercase(a[col]) < sortToLowercase(b[col]) ? -1 : 0
            );
    }
}

export function sortResultsAsc(col: string, tableArray: any[], stixService: StixService, manifestsQueryResults: any[]) {
    switch (col) {
        case 'name':
            return tableArray.sort((a, b) =>
                getComponentDisplayLowercase(a, stixService) < getComponentDisplayLowercase(b, stixService)
                    ? 1
                    : getComponentDisplayLowercase(a, stixService) > getComponentDisplayLowercase(b, stixService)
                      ? -1
                      : 0
            );
        case 'status':
            return tableArray.sort((a, b) =>
                sortToLowercase(a.res[col]) < sortToLowercase(b.res[col]) ? 1 : sortToLowercase(a.res[col]) > sortToLowercase(b.res[col]) ? -1 : 0
            );
        case 'request_timestamp':
            return tableArray.sort((a, b) => sortDate(a.res[col], b.res[col], 'asc'));
        case 'created':
        case 'modified':
        case 'date_added':
        case 'version':
            return tableArray.sort((a, b) => sortDate(a[col], b[col], 'asc'));
        case 'published':
            if (!manifestsQueryResults) return tableArray;

            return tableArray.sort((a, b) =>
                sortDate(
                    manifestsQueryResults?.find((elem) => elem.id == a.id)?.date_added,
                    manifestsQueryResults?.find((elem) => elem.id == b.id)?.date_added,
                    'asc'
                )
            );
        default:
            return tableArray.sort((a, b) =>
                sortToLowercase(a[col]) < sortToLowercase(b[col]) ? 1 : sortToLowercase(a[col]) > sortToLowercase(b[col]) ? -1 : 0
            );
    }
}

export function sortDate(a: any, b: any, type: string) {
    a = new Date(a);
    b = new Date(b);
    if (type === 'asc') {
        if (!isValidDate(a) && !isValidDate(b)) return 0;
        else if (!isValidDate(a)) return 1;
        else if (!isValidDate(b)) return -1;
        else return a < b ? 1 : a > b ? -1 : 0;
    }
    if (type === 'des') {
        if (!isValidDate(a) && !isValidDate(b)) return 0;
        else if (!isValidDate(a)) return 1;
        else if (!isValidDate(b)) return -1;
        else return a > b ? 1 : a < b ? -1 : 0;
    }

    return 0;
}

export function sortToLowercase(item) {
    if (typeof item === 'string') return item.toLowerCase();

    return item;
}

export function isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
}

export function getComponentDisplayLowercase(component: any, stixService: StixService) {
    let result = getComponentDisplay(component, stixService);

    if (typeof result === 'string') return result.toLowerCase();

    return result;
}

export function getComponentDisplay(component: any, stixService: StixService): string {
    if (component.type) {
        let componentDisplay = '';

        switch (component.type) {
            case 'artifact': {
                if (component.payload_bin) {
                    if (component.hashes) {
                        const keys = Object.keys(component.hashes);
                        componentDisplay = component.hashes[keys[0]];
                    } else componentDisplay = component.id;
                } else componentDisplay = component.url;
                break;
            }
            case 'autonomous-system': {
                componentDisplay = `${component.number} ${component.name ? '(' + component.name + ')' : ''}`;
                break;
            }
            case 'directory': {
                componentDisplay = component.path;
                break;
            }
            case 'email-message': {
                componentDisplay = `${component.subject ? component.subject : `No Subject Included: (${component.id})`}`;
                break;
            }
            case 'file': {
                if (component.name) componentDisplay = component.name;
                else if (component.hashes)
                    componentDisplay = `${Object.keys(component.hashes)[0]}: ${component.hashes[Object.keys(component.hashes)[0]]}`;
                else componentDisplay = `<NO NAME> (${component.id})`;
                break;
            }
            case 'domain-name':
            case 'email-addr':
            case 'url':
            case 'ipv4-addr':
            case 'ipv6-addr':
            case 'mac-addr': {
                componentDisplay = component.value;
                break;
            }
            case 'mutex':
            case 'software': {
                componentDisplay = component.name;
                break;
            }
            case 'process': {
                if (component.pid) componentDisplay = component.pid;
                else if (component.cwd) componentDisplay = component.cwd;
                else componentDisplay = `<NO NAME> (${component.id})`;
                break;
            }
            case 'relationship': {
                if (component.source_ref && component.target_ref) {
                    let sourceRefObject = stixService.bundle.objects.filter((obj) => obj.id === component.source_ref),
                        targetRefObject = stixService.bundle.objects.filter((obj) => obj.id === component.target_ref);
                    if (sourceRefObject.length > 0 && targetRefObject.length > 0)
                        componentDisplay = `${getComponentDisplay(sourceRefObject[0], stixService)} -> ${getComponentDisplay(targetRefObject[0], stixService)}`;
                    else componentDisplay = `<NO NAME> (${component.id})`;
                } else componentDisplay = `<NO NAME> (${component.id})`;
                break;
            }
            case 'user-account': {
                if (component.user_id) componentDisplay = component.user_id;
                else if (component.account_login) componentDisplay = component.account_login;
                else if (component.display_name) componentDisplay = component.display_name;

                break;
            }
            case 'windows-registry-key': {
                if (component.key) componentDisplay = component.key;
                else componentDisplay = `<NO NAME> (${component.id})`;
                break;
            }
            case 'x509-certificate': {
                if (component.subject) componentDisplay = component.subject;
                else if (component.serial_number) componentDisplay = component.serial_number;
                else if (component.hashes)
                    componentDisplay = `${Object.keys(component.hashes)[0]}: ${component.hashes[Object.keys(component.hashes)[0]]}`;
                else if (component.issuer) componentDisplay = component.issuer;
                else componentDisplay = `<NO NAME> (${component.id})`;
                break;
            }
            default:
                return component.name ? component.name : `<NO NAME> (${component.id})`;
        }

        return componentDisplay;
    } else return component.name ? component.name : '<NO NAME>';
}
