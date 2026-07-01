export class UnixAccountExtension {
    extension_id: string;
    extension_type: string;
    gid: number;
    home_dir: string;
    shell: string;
    groups: string[];

    constructor(extension_id?: string, extension_type?: string, gid?: number, home_dir?: string, shell?: string, groups?: string[]) {
        this.extension_id = extension_id || '';
        this.extension_type = extension_type || '';
        if (gid != undefined) this.gid = gid;
        this.home_dir = home_dir || '';
        this.shell = shell || '';
        this.groups = groups || [];
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.gid ? selectors.push('gid') : null;
        this.home_dir ? selectors.push('home_dir') : null;
        this.shell ? selectors.push('shell') : null;
        this.groups ? selectors.push('groups') : null;
        return selectors;
    }
}
