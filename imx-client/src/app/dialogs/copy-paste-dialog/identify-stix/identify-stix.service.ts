import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EnvService } from 'src/app/env-service/env.service';

@Injectable({
    providedIn: 'root',
})
export class IdentifyStixService {
    // Text files are sent in chunks so neither the browser nor the server holds the whole file at once
    static readonly CHUNK_BYTES = 10 * 1024 * 1024;
    static readonly MAX_TEXT_BYTES = 250 * 1024 * 1024;
    // Binary files are sent whole to Tika, so they are bound by nginx's client_max_body_size
    static readonly MAX_BINARY_BYTES = 50 * 1024 * 1024;
    static readonly BINARY_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'rtf'];
    // More objects than this per import make the IOC list and bundle editor too slow to use
    static readonly MAX_OBJECTS = 5000;

    imxServerUrl = this.envService.env.imxServer.url;
    headers = new HttpHeaders({
        Authorization: `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`,
    });

    postPath = '/identify-stix';
    postPathVt = '/identify-stix-vt';
    postFilePath = '/identify-stix-file';

    constructor(
        private httpClient: HttpClient,
        private envService: EnvService
    ) {}

    async postIdentifyStix(text, signal?: AbortSignal) {
        this.headers['Content-Type'] = 'application/json';
        let body = {
            text: text,
        };

        return new Promise((resolve, reject) => {
            try {
                const sub = this.httpClient.post(`${this.imxServerUrl}${this.postPath}`, body, { headers: this.headers }).subscribe(
                    (data) => resolve(data),
                    (error) => resolve(error)
                );
                signal?.addEventListener(
                    'abort',
                    () => {
                        sub.unsubscribe();
                        resolve({ aborted: true });
                    },
                    { once: true }
                );
            } catch (e) {
                reject(e);
            }
        });
    }

    /** Returns an error message if the file is over the upload limit for its type, otherwise null. */
    validateUploadSize(file: File): string | null {
        const nameSplit = file.name.split('.');
        const postfix = nameSplit[nameSplit.length - 1].toLowerCase();
        const isBinary = IdentifyStixService.BINARY_EXTENSIONS.includes(postfix);
        const max = isBinary ? IdentifyStixService.MAX_BINARY_BYTES : IdentifyStixService.MAX_TEXT_BYTES;

        if (file.size <= max) return null;

        const toMb = (bytes: number) => Math.ceil(bytes / (1024 * 1024));
        const kind = isBinary ? 'PDF/Office/RTF files' : 'text files';
        return `${file.name} is ${toMb(file.size)} MB. The maximum for ${kind} is ${toMb(max)} MB.`;
    }

    /**
     * Parses a text file by sending it to identify-stix in newline-aligned chunks, one request at a time,
     * and merges the results by object id. By default it stops once MAX_OBJECTS unique objects are found
     * and returns { objects, truncated: true, percentRead }. With groupOverLimit, it instead keeps reading
     * the whole file once over MAX_OBJECTS, keeps only IOC values grouped by type (see groupIocsByType)
     * and returns { overLimit: true, iocsByType }. Returns the first error result if any chunk fails, or
     * { aborted: true } if the signal is aborted.
     */
    async postIdentifyStixChunked(
        file: File,
        onProgress?: (percent: number) => void,
        onChunkText?: (text: string) => void,
        signal?: AbortSignal,
        groupOverLimit = false,
        chunkBytes = IdentifyStixService.CHUNK_BYTES
    ): Promise<any> {
        const decoder = new TextDecoder('utf-8');
        const objectsById = new Map<string, any>();
        // Set once over MAX_OBJECTS; full objects are dropped then to keep memory down
        let iocsByType: Map<string, Map<string, any>> | null = null;
        let offset = 0;

        while (offset < file.size) {
            if (signal?.aborted) return { aborted: true };

            let bytes = new Uint8Array(await this.readBlobAsArrayBuffer(file.slice(offset, offset + chunkBytes)));

            // Cut at the last newline so no line is split across chunks. A newline byte never occurs
            // inside a multi-byte UTF-8 character, so this never splits a character either.
            if (offset + bytes.length < file.size) {
                const lastNewline = bytes.lastIndexOf(0x0a);
                if (lastNewline > -1) bytes = bytes.subarray(0, lastNewline + 1);
            }
            offset += bytes.length;

            const text = this.normalizeText(decoder.decode(bytes));
            onChunkText?.(text);

            const result: any = await this.postIdentifyStix(text, signal);
            if (signal?.aborted) return { aborted: true };
            if (!result || !result.objects) return result;

            const percentRead = Math.round((offset / file.size) * 100);

            if (iocsByType) {
                this.groupIocsByType(result.objects, iocsByType);
            } else if (groupOverLimit) {
                for (const obj of result.objects) {
                    if (!objectsById.has(obj.id)) objectsById.set(obj.id, obj);
                }
                if (objectsById.size > IdentifyStixService.MAX_OBJECTS) {
                    iocsByType = this.groupIocsByType(objectsById.values());
                    objectsById.clear();
                }
            } else {
                for (const obj of result.objects) {
                    if (objectsById.size >= IdentifyStixService.MAX_OBJECTS) break;
                    if (!objectsById.has(obj.id)) objectsById.set(obj.id, obj);
                }
                if (objectsById.size >= IdentifyStixService.MAX_OBJECTS && offset < file.size) {
                    return { objects: [...objectsById.values()], truncated: true, percentRead };
                }
            }

            onProgress?.(percentRead);
        }

        if (iocsByType) return { overLimit: true, iocsByType };
        return { objects: [...objectsById.values()] };
    }

    /**
     * Groups objects into type -> (dedupe key -> entry). Files become { name?, hashes }; every other
     * type becomes its identifying string. Entries are deduped by value since object ids aren't always
     * deterministic.
     */
    groupIocsByType(objects: Iterable<any>, into = new Map<string, Map<string, any>>()): Map<string, Map<string, any>> {
        for (const obj of objects) {
            let entry: any;
            let key: string;
            if (obj.type === 'file') {
                entry = obj.name ? { name: obj.name, hashes: obj.hashes } : { hashes: obj.hashes };
                key = JSON.stringify(entry);
            } else {
                entry = this.iocValue(obj);
                key = entry;
            }

            if (!into.has(obj.type)) into.set(obj.type, new Map());
            into.get(obj.type).set(key, entry);
        }
        return into;
    }

    /**
     * Removes duplicate matches, keeping order and the first occurrence. Non-file objects are deduped by
     * type and case-insensitive value, since object ids aren't always deterministic (e.g. processes) and
     * chunked uploads merge results by id. A file with only a name or only hashes is dropped when a named
     * file with those hashes exists; files with the same name but different hashes are kept.
     */
    dedupeObjects(objects: any[]): any[] {
        const hasHashes = (obj) => obj.hashes && Object.keys(obj.hashes).length > 0;
        const namesWithHashes = new Set<string>();
        const namedHashValues = new Set<string>();
        for (const obj of objects) {
            if (obj.type !== 'file' || !obj.name || !hasHashes(obj)) continue;
            namesWithHashes.add(obj.name.toLowerCase());
            for (const hash of Object.values(obj.hashes)) namedHashValues.add(String(hash).toLowerCase());
        }

        const seen = new Set<string>();
        return objects.filter((obj) => {
            let key: string;
            if (obj.type !== 'file') {
                key = `${obj.type}|${this.iocValue(obj).toLowerCase()}`;
            } else if (obj.name && hasHashes(obj)) {
                key = `file|${obj.name.toLowerCase()}|${JSON.stringify(obj.hashes).toLowerCase()}`;
            } else if (obj.name) {
                if (namesWithHashes.has(obj.name.toLowerCase())) return false;
                key = `file|${obj.name.toLowerCase()}`;
            } else if (hasHashes(obj)) {
                if (Object.values(obj.hashes).every((hash) => namedHashValues.has(String(hash).toLowerCase()))) return false;
                key = `file||${JSON.stringify(obj.hashes).toLowerCase()}`;
            } else {
                key = `file|${obj.id}`;
            }

            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    private iocValue(obj: any): string {
        return String(obj.value ?? obj.path ?? obj.key ?? obj.pid ?? obj.number ?? obj.name ?? obj.id);
    }

    /** Builds the downloadable JSON of IOCs grouped by type. */
    buildIocJson(iocsByType: Map<string, Map<string, any>>, sourceName: string): Blob {
        const counts = {};
        const iocs = {};
        let total = 0;
        for (const [type, entries] of iocsByType) {
            counts[type] = entries.size;
            iocs[type] = [...entries.values()];
            total += entries.size;
        }

        const json = { source: sourceName, generated: new Date().toISOString(), total, counts, iocs };
        return new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    }

    private readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
            fileReader.onerror = () => reject(fileReader.error);
            fileReader.readAsArrayBuffer(blob);
        });
    }

    private normalizeText(text: string): string {
        return JSON.stringify(text)
            .replace(/\\n/g, ' ')
            .replace(/\\t/g, ' ')
            .replace(/\\r/g, ' ')
            .replace(/\\\\\\\\/g, ' ')
            .replace(/\\\\/g, '\\');
    }

    async postIdentifyStixFile(formData, fileName) {
        if (this.headers['Content-Type']) delete this.headers['Content-Type'];

        return new Promise((resolve, reject) => {
            try {
                this.httpClient.put(`${this.imxServerUrl}${this.postFilePath}/${fileName}`, formData, { headers: this.headers }).subscribe(
                    (data) => resolve(data),
                    (error) => resolve(error)
                );
            } catch (e) {
                reject(e);
            }
        });
    }

    async postIdentifyStixVirusTotal(text) {
        this.headers['Content-Type'] = 'application/json';
        let body = {
            text: text,
        };

        return new Promise((resolve, reject) => {
            try {
                this.httpClient.post(`${this.imxServerUrl}${this.postPathVt}`, body, { headers: this.headers }).subscribe(
                    (data) => resolve(data),
                    (error) => resolve(error)
                );
            } catch (e) {
                reject(e);
            }
        });
    }
}
