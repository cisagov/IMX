import Dexie, { Table } from 'dexie';
import { Bundle } from './models/bundle';
import { v4 as uuid } from 'uuid';
import { EnvService } from './env-service/env.service';

export interface SavedBundle {
    name: string;
    owner: string;
    bundle: any[];
}

export interface ItemBeingEdited {
    id?: number;
    stixObject: any;
    createdAt?: Date;
}

export interface PublishedObject {
    id: string;
    stixObject: any;
    createdAt?: Date;
}

export class AppDB extends Dexie {
    envService: EnvService;
    imxCache!: Table<any, number>;
    savedBundles!: Table<SavedBundle, number>;
    bundles!: Table<any, number>;
    itemBeingEdited!: Table<ItemBeingEdited, number>;
    publishedObjects!: Table<PublishedObject, string>;

    constructor() {
        super('imx');
        this.version(2).stores({
            savedBundles: '++, &[name+owner]',
            imxCache: '&id, &index',
            bundles: '&publish_time',
            itemBeingEdited: '++',
            publishedObjects: '&id',
        });

        this.on('populate', () => this.populate());
    }

    async populate() {
        if (!this.envService) {
            await this.wait();
        }
        await this.envService.wait('defaultIdentity');
        await db.imxCache.add({ id: this.envService.env.defaultIdentity.id, index: 1, object: this.envService.env.defaultIdentity });
    }

    async wait() {
        return new Promise((resolve, reject) => {
            let interval = setInterval(() => {
                if (this.envService) {
                    resolve(true);
                    clearInterval(interval);
                }
            }, 100);
        });
    }

    async clear() {
        await db.imxCache.clear();
    }

    async saveItemBeingEdited(stixObject: any): Promise<number> {
        return this.itemBeingEdited.put({
            stixObject,
            createdAt: new Date(),
        });
    }

    async getItemBeingEdited(): Promise<any | undefined> {
        const record = await this.itemBeingEdited.toCollection().first();
        return record?.stixObject;
    }

    async clearItemBeingEdited(): Promise<void> {
        await this.itemBeingEdited.clear();
    }

    async savePublishedObject(stixObject: any): Promise<string> {
        return this.publishedObjects.put({
            stixObject,
            id: stixObject.id,
            createdAt: new Date(),
        });
    }

    async getAllPublishedObjects(): Promise<any[]> {
        const records = await this.publishedObjects.toArray();
        return records.map((r) => r.stixObject);
    }

    async clearPublishedObjects(): Promise<void> {
        await this.publishedObjects.clear();
    }
}

export const db = new AppDB();
