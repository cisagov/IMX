import { v4 as uuid } from 'uuid';

export class Bundle {
    public objects: any[];
    public type = 'bundle';
    public id = '';

    constructor(objects: any[]) {
        this.objects = objects;
    }
}
