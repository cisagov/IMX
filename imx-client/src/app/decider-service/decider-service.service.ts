import { Injectable } from '@angular/core';
import { EnvService } from '../env-service/env.service';

@Injectable({
    providedIn: 'root',
})
export class DeciderServiceService {
    mitreAttackName: String = 'mitre-attack';
    mitreAttackUrl: String = 'https://attack.mitre.org/techniques/';
    domain: String = '';

    constructor(private envService: EnvService) {}

    getDeciderDomain() {
        let deciderHostArr = this.envService.env.decider.url.split('.');
        let domain = '';
        deciderHostArr.splice(0, 1);

        if (this.envService.env.decider.url.includes('localhost')) domain = 'localhost';
        else {
            domain = deciderHostArr.join('.');
            domain = domain.replace('/', '');
            domain = `.${domain}`;
        }

        console.debug(`Decider Domain: ${domain}`);

        return domain;
    }

    async openDeciderTool() {
        return new Promise<any[]>(async (resolve, reject) => {
            let domain = this.getDeciderDomain();
            document.cookie = `imx_attack_patterns=; expires=Thu, 01 Jan 9070 00:00:00 GMT; path=/; domain=${domain}; SameSite=None; Secure`;

            window.open(this.envService.env.decider.url, '_blank').focus();

            let deciderRes = await this.getImxDeciderCookie();
            console.debug(deciderRes);

            let cartObj = {
                cartItems: [],
            };
            try {
                cartObj = JSON.parse(deciderRes);
            } catch (err) {
                console.error(err);
                reject(err);
                return;
            }

            let tempResult = cartObj;
            let result = [];

            for (let obj of tempResult.cartItems) {
                let splitId = obj.index.split('.');
                let idPath = '';
                if (splitId.length > 1) {
                    idPath = `${splitId[0]}/${splitId[1]}`;
                } else {
                    idPath = obj.index;
                }

                let phase_name = obj.tacticName.toLowerCase();
                phase_name = phase_name.replaceAll(' ', '-');

                let temp = {
                    external_reference: {
                        external_id: obj.index,
                        source_name: this.mitreAttackName,
                        url: `${this.mitreAttackUrl}${idPath}`,
                    },
                    kill_chain_phase: {
                        kill_chain_name: this.mitreAttackName,
                        phase_name: phase_name,
                    },
                };

                result.push(temp);
                document.cookie = `imx_attack_patterns=; expires=Thu, 01 Jan 9070 00:00:00 GMT; path=/; domain=${domain}; SameSite=None; Secure`;
            }
            resolve(result);
        });
    }

    async getImxDeciderCookie(): Promise<string> {
        return new Promise((resolve, reject) => {
            let interval = setInterval(function () {
                let cookie = document.cookie;

                if (cookie && cookie.indexOf('imx_attack_patterns') !== -1) {
                    let splitCookie = cookie.split('=');
                    console.debug(splitCookie);

                    for (let i = 0; i < splitCookie.length; i++) {
                        if (splitCookie[i].startsWith(';')) splitCookie[i] = splitCookie[i].slice(1, splitCookie[i].length);
                        if (splitCookie[i].startsWith(' ')) splitCookie[i] = splitCookie[i].slice(1, splitCookie[i].length);

                        if (splitCookie[i].startsWith('imx_attack_patterns')) {
                            if (splitCookie[i + 1].includes('{') && splitCookie[i + 1].includes('}')) {
                                resolve(splitCookie[i + 1]);
                                clearInterval(interval);
                            }

                            break;
                        }
                    }
                }
            }, 200);
        });
    }
}
