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
        }

        return domain;
    }

    async openDeciderTool() {
        return new Promise<any[]>(async (resolve) => {
            let domain = this.getDeciderDomain();
            document.cookie = `imx_attack_patterns=; Max-Age=0; domain=${domain};`;

            window.open(this.envService.env.decider.url, '_blank').focus();

            let deciderRes = await this.getImxDeciderCookie();

            let cartObj = JSON.parse(deciderRes);

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
                document.cookie = `imx_attack_patterns=; Max-Age=0; domain=${domain};`;
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

                    for (let i = 0; i < splitCookie.length; i++) {
                        if (splitCookie[i].startsWith('imx_attack_patterns')) {
                            resolve(splitCookie[i + 1]);
                            clearInterval(interval);
                        }
                    }
                }
            }, 200);
        });
    }
}
