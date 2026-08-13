import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EnvService } from '../env-service/env.service';

@Injectable({
    providedIn: 'root',
})
export class MispService {
    constructor(
        private envService: EnvService,
        private httpClient: HttpClient
    ) {}

    searchMisp(indicators) {
        return new Promise<any[]>(async (resolve, reject) => {
            const headers = new HttpHeaders()
                .set('Content-Type', 'application/json')
                .set('Authorization', `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`);

            const url = `${this.envService.env.imxServer.url}/search-misp`;

            this.httpClient.post(url, { indicators: indicators }, { headers: headers }).subscribe({
                next: (result: any) => {
                    const events = [];

                    const addedSet = new Set();

                    result.data.forEach((searchResult) => {
                        if (!searchResult.misp && searchResult?.stix?.objects?.length == 0) {
                            return;
                        }

                        // if (!elem.type) {
                        //     const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                        //     const ipv6Regex =
                        //         /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
                        //     if (ipv4Regex.test(elem.value)) elem.type = 'IPv4';
                        //     else if (ipv6Regex.test(elem.value)) elem.type = 'IPv6';
                        //     else elem.type = 'Unidentified';
                        // }

                        searchResult.expanded = false;
                        searchResult.checked = false;
                        searchResult.selectAll = true;
                        searchResult.tab = 'misp';
                        searchResult.misp = searchResult.misp.Event;
                        searchResult.eventId = searchResult.misp.id;

                        searchResult.checkedObjectsMap = new Map();

                        searchResult.stix?.objects.forEach((stixObj) => {
                            searchResult.checkedObjectsMap.set(stixObj.id, { checked: true, object: stixObj });
                        });

                        if (!addedSet.has(searchResult.eventId)) {
                            events.push(searchResult);
                            addedSet.add(searchResult.eventId);
                        } else {
                            const foundEvent = events.find((event) => event.eventId == searchResult.eventId);

                            if (foundEvent) {
                                if (!foundEvent.additionalValues) foundEvent.additionalValues = [];

                                foundEvent.additionalValues.push({ searchall: searchResult.searchall });
                            }
                        }
                    });

                    return resolve(events);
                },
                error: (err) => {
                    return reject({ message: `Error encountered when searching MISP: ${err.message ? err.message : JSON.stringify(err)}` });
                },
            });
        });
    }

    validateAndClassifyInputs(text: string): {
        ips: string[];
        ipv4: string[];
        ipv6: string[];
        sha1: string[];
        sha256: string[];
        md5: string[];
        invalid: string[];
        cidr: string[];
        hasMixed: boolean;
    } {
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex =
            /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
        const hashRegex = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/;
        const sha1Regex = /^[a-fA-F0-9]{40}$/;
        const sha256Regex = /^[a-fA-F0-9]{64}$/;
        const md5Regex = /^[a-fA-F0-9]{32}$/;
        const cidrRegex = /\/\d{1,3}$/;

        const ips: string[] = [];
        const ipv4: string[] = [];
        const ipv6: string[] = [];
        const sha1: string[] = [];
        const sha256: string[] = [];
        const md5: string[] = [];
        const invalid: string[] = [];
        const cidr: string[] = [];

        const lines = text.split(/\r?\n/);

        lines.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            const defanged = trimmed.replace(/\[\.?\]/g, '.').replace(/\[|\]/g, '');

            if (cidrRegex.test(defanged)) {
                cidr.push(trimmed);
            } else if (ipv4Regex.test(defanged)) {
                ips.push(defanged);
                ipv4.push(defanged);
            } else if (ipv6Regex.test(defanged)) {
                ips.push(defanged);
                ipv6.push(defanged);
            } else if (sha1Regex.test(defanged)) {
                sha1.push(defanged);
            } else if (sha256Regex.test(defanged)) {
                sha256.push(defanged);
            } else if (md5Regex.test(defanged)) {
                md5.push(defanged);
            } else {
                invalid.push(trimmed);
            }
        });

        const uniqueIps = [...new Set(ips)];
        const uniqueIpv4 = [...new Set(ipv4)];
        const uniqueIpv6 = [...new Set(ipv6)];
        const uniqueSha1 = [...new Set(sha1)];
        const uniqueSha256 = [...new Set(sha256)];
        const uniqueMd5 = [...new Set(md5)];
        const hasMixed = uniqueIps.length > 0 && (uniqueSha1.length > 0 || uniqueSha256.length > 0 || uniqueMd5.length > 0);

        return {
            ips: uniqueIps,
            ipv4: uniqueIpv4,
            ipv6: uniqueIpv6,
            sha1: uniqueSha1,
            sha256: uniqueSha256,
            md5: uniqueMd5,
            invalid,
            cidr,
            hasMixed,
        };
    }

    mapClassification(classification) {
        const indicators = [];

        classification.sha1.forEach((sha1) => indicators.push({ value: sha1, type: 'sha1' }));
        classification.sha256.forEach((sha256) => indicators.push({ value: sha256, type: 'sha256' }));
        classification.md5.forEach((md5) => indicators.push({ value: md5, type: 'md5' }));
        classification.ipv4.forEach((ipv4) => indicators.push({ value: ipv4 }));
        classification.ipv6.forEach((ipv6) => indicators.push({ value: ipv6 }));

        return indicators;
    }

    buildIndicatorString(component) {
        let indicators = '';
        if (component.type === 'file') {
            for (const prop in component.hashes) {
                if (indicators) indicators += '\n';

                indicators += component.hashes[prop];
            }
        } else {
            if (indicators) indicators += '\n';

            indicators += component.value;
        }

        return indicators;
    }
}
