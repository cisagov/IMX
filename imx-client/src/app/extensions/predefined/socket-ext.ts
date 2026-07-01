export class SocketExtension {
    extension_id: string;
    extension_type: string;
    address_family: string;
    is_blocking: string;
    is_listening: string;
    socket_type: string;
    socket_descriptor: number;
    socket_handle: number;
    options: any;

    constructor(
        extension_id?: string,
        extension_type?: string,
        address_family?: string,
        is_blocking?: string,
        is_listening?: string,
        socket_type?: string,
        socket_descriptor?: number,
        socket_handle?: number,
        options?: any
    ) {
        this.extension_id = extension_id || '';
        this.extension_type = extension_type || '';
        this.address_family = address_family || '';
        this.is_blocking = is_blocking || '';
        this.is_listening = is_listening || '';
        this.socket_type = socket_type || '';
        if (socket_descriptor != undefined) this.socket_descriptor = socket_descriptor;
        if (socket_handle != undefined) this.socket_handle = socket_handle;
        this.options = options || new Map();
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.address_family ? selectors.push('address_family') : null;
        this.is_blocking ? selectors.push('is_blocking') : null;
        this.is_listening ? selectors.push('is_listening') : null;
        this.socket_type ? selectors.push('socket_type') : null;
        this.socket_descriptor ? selectors.push('socket_descriptor') : null;
        this.socket_handle ? selectors.push('socket_handle') : null;
        this.options ? selectors.push('options') : null;
        return selectors;
    }
}
