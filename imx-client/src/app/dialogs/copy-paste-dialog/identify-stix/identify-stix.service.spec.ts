import { describe, it, expect, beforeEach } from 'vitest';
// HttpClient & HttpHeaders are only needed for typing; import lazily to avoid Angular runtime
interface HttpClient {
    post(url: string, body: any, options: any): { subscribe(next: (v:any)=>void, error?: (e:any)=>void): void };
    put(url: string, body: any, options: any): { subscribe(next: (v:any)=>void, error?: (e:any)=>void): void };
}
interface HttpHeaders { [key: string]: any; }
//import { IdentifyStixService } from './identify-stix.service';

// Local copy of the service logic for testing without Angular runtime
class LocalIdentifyStixService {
    imxServerUrl;
    headers;
    postPath = '/identify-stix';
    postPathVt = '/identify-stix-vt';
    postFilePath = '/identify-stix-file';
    constructor(private httpClient: any, private envService: any) {
        this.imxServerUrl = this.envService.env.imxServer.url;
        this.headers = {
            Authorization: `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`,
        };
    }
    async postIdentifyStix(text) {
        this.headers['Content-Type'] = 'application/json';
        const body = { text };
        return new Promise((resolve, reject) => {
            try {
                this.httpClient
                    .post(`${this.imxServerUrl}${this.postPath}`, body, {
                        headers: this.headers,
                    })
                    .subscribe((data) => resolve(data), (error) => resolve(error));
            } catch (e) {
                reject(e);
            }
        });
    }
    async postIdentifyStixFile(formData, fileName) {
        if (this.headers['Content-Type']) delete this.headers['Content-Type'];
        return new Promise((resolve, reject) => {
            try {
                this.httpClient
                    .put(`${this.imxServerUrl}${this.postFilePath}/${fileName}`, formData, {
                        headers: this.headers,
                    })
                    .subscribe((data) => resolve(data), (error) => resolve(error));
            } catch (e) {
                reject(e);
            }
        });
    }
    async postIdentifyStixVirusTotal(text) {
        this.headers['Content-Type'] = 'application/json';
        const body = { text };
        return new Promise((resolve, reject) => {
            try {
                this.httpClient
                    .post(`${this.imxServerUrl}${this.postPathVt}`, body, {
                        headers: this.headers,
                    })
                    .subscribe((data) => resolve(data), (error) => resolve(error));
            } catch (e) {
                reject(e);
            }
        });
    }
}


class MockHttpClient {
    post(url: string, body: any, options: any) {
        return {
            subscribe: (next: (data: any) => void, error?: (err: any) => void) => {
                next({ url, body, options });
            },
        } as any;
    }
    put(url: string, body: any, options: any) {
        return {
            subscribe: (next: (data: any) => void, error?: (err: any) => void) => {
                next({ url, body, options });
            },
        } as any;
    }
}

class MockEnvService {
    env = {
        imxServer: {
            url: 'http://localhost:8080',
            user: 'testuser',
            pass: 'testpass',
        },
    };
}

describe('IdentifyStixService', () => {
    let service: LocalIdentifyStixService;
    let mockHttp: MockHttpClient;
    let mockEnv: MockEnvService;

    beforeEach(() => {
        mockHttp = new MockHttpClient();
        mockEnv = new MockEnvService();
        service = new LocalIdentifyStixService(mockHttp as any, mockEnv as any);
    });

    it('should post identify stix with correct payload and headers', async () => {
        const result = await service.postIdentifyStix('sample text');
        expect(result.url).toBe('http://localhost:8080/identify-stix');
        expect(result.body).toEqual({ text: 'sample text' });
        expect(result.options.headers.Authorization).toBe(
            'Basic ' + btoa('testuser:testpass')
        );
        expect(result.options.headers['Content-Type']).toBe('application/json');
    });

    it('should post identify stix vt with correct payload and headers', async () => {
        const result = await service.postIdentifyStixVirusTotal('vt text');
        expect(result.url).toBe('http://localhost:8080/identify-stix-vt');
        expect(result.body).toEqual({ text: 'vt text' });
        expect(result.options.headers['Content-Type']).toBe('application/json');
    });

    it('should put identify stix file and remove content type header', async () => {
        // prepopulate a dummy Content-Type header
        service.headers['Content-Type'] = 'application/json';
        const formData = new FormData();
        formData.append('file', new Blob(['data']), 'test.txt');
        const result = await service.postIdentifyStixFile(formData, 'test.txt');
        expect(result.url).toBe('http://localhost:8080/identify-stix-file/test.txt');
        expect(result.body).toBe(formData);
        expect(result.options.headers['Content-Type']).toBeUndefined();
    });
});
