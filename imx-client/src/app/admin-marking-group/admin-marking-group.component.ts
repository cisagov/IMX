import { Component, OnInit } from '@angular/core';
import { EnvService } from '../env-service/env.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StixService } from '../stix-service.service';
import { AnnouncementService } from '../announcement-service/announcement-service.service';
import { faCheck, faExclamationTriangle, faPlus } from '@fortawesome/free-solid-svg-icons';
import { KeycloakService } from '../auth/keycloak-service/keycloak.service';
import { AdminService } from '../admin-service/admin.service';

type Group = {
    name: string;
    markings: any[];
    users: any[];
};

@Component({
    selector: 'app-admin-marking-group',
    templateUrl: './admin-marking-group.component.html',
    styleUrls: ['./admin-marking-group.component.css', '../dashboard/dashboard.component.css'],
    standalone: false,
})
export class AdminMarkingGroupComponent implements OnInit {
    faExclamationTriangle = faExclamationTriangle;
    faCheck = faCheck;
    faPlus = faPlus;

    imxHttpHeaders;
    taxiiHttpHeaders;

    api = '';
    collection = null;

    apiRoots = [];
    collections = new Map<string, any[]>();

    enabled = false;

    loading = false;
    saving = false;

    groups: Group[] = [];

    page = 1;

    editing = false;
    editingGroup: Group = null;

    nextMarkingDef = null;
    markingDefinitions = [];
    users = [];

    unfilteredUnaddedMarkingDefs = [];
    unfilteredUnaddedUsers = [];

    unfilteredAddedMarkingDefs = [];
    unfilteredAddedUsers = [];

    unaddedMarkingDefs = [];
    unaddedUsers = [];

    selectedMarkingDefs = [];
    selectedUsers = [];

    selectedAddedUsers = [];
    selectedAddedMarkingDefs = [];

    constructor(
        private readonly envService: EnvService,
        private readonly httpClient: HttpClient,
        public readonly stixService: StixService,
        private readonly announcementService: AnnouncementService,
        private readonly adminService: AdminService
    ) {}

    ngOnInit() {
        this.imxHttpHeaders = new HttpHeaders()
            .set('Accept', 'application/json')
            .set('Authorization', `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`)
            .set('Content-Type', `application/json`);

        this.taxiiHttpHeaders = new HttpHeaders()
            .set('Accept', 'application/taxii+json;version=2.1')
            .set('Authorization', `Basic ${btoa(this.envService.env.adminServer.username + ':' + this.envService.env.adminServer.password)}`)
            .set('Content-Type', `application/taxii+json;version=2.1`);

        this.initialize();
    }

    async initialize() {
        await this.envService.checkAuth('/admin');

        this.loading = true;

        await this.getApiRoots();

        const found = await this.getDestinationRootCollection();

        if (found) {
            this.enabled = true;

            await this.getGroups();
            await this.getUsers();
            this.markingDefinitions = await this.getCUI();
        }

        this.loading = false;
    }

    /**
     * Search whether IMX has been configured to assign API Root and Collection for CUI.
     * @returns Promise that resolves with boolean value of whether API Root and Collection has been saved preivously or not
     */
    async getDestinationRootCollection() {
        try {
            const result = await this.stixService.getCuiRootAndCollections();

            if (result.api && result.collection) {
                const foundCollection = this.collections.get(result.api)?.find((coll) => coll.id == result.collection.id);

                if (this.apiRoots?.includes(result.api) && foundCollection) {
                    this.api = result.api;
                    this.collection = foundCollection;

                    return true;
                }
            }

            return false;
        } catch (e) {
            return false;
        }
    }

    /**
     * Searches all available API Roots and pushes it to apiRoots array
     * @returns Promise that returns boolean value whether API Roots has been able to be retrieved or not.
     */
    getApiRoots() {
        return new Promise(async (resolve, reject) => {
            try {
                this.apiRoots = [];
                this.collections = new Map();

                this.httpClient
                    .get<any>(this.stixService.getBaseURLs().baseAdminURL + 'api-roots', { headers: this.taxiiHttpHeaders, observe: 'response' })
                    .subscribe({
                        next: async (resp) => {
                            try {
                                resp.body;

                                for (const apiRoot of resp.body) {
                                    this.apiRoots.push(apiRoot.fragment);
                                    await this.getCollections(apiRoot.fragment);
                                }

                                return resolve(true);
                            } catch (err) {
                                this.announcementService.show(
                                    'Failed to retrieve API Roots',
                                    `Something went wrong when trying to retrieve API Roots, please refresh and try again. Error: ${err}`,
                                    'error',
                                    false
                                );
                                return resolve(false);
                            }
                        },
                        error: (err) => {
                            this.announcementService.show(
                                'Failed to retrieve API Roots',
                                `Something went wrong when trying to retrieve API Roots, please refresh and try again. Error: ${err.message ? err.message : JSON.stringify(err)}`,
                                'error',
                                false
                            );
                            return resolve(false);
                        },
                    });
            } catch (err) {
                this.announcementService.show(
                    'Failed to retrieve API Roots',
                    `Something went wrong when trying to retrieve API Roots, please refresh and try again. Error: ${err.message ? err.message : JSON.stringify(err)}`,
                    'error',
                    false
                );
                return resolve(false);
            }
        });
    }

    /**
     * Searches within API Root for all collections, and maps it to collections map.
     * @param apiRoot Fragment name of the API Root
     * @returns Promise with boolean value whether Collection has been found or not.
     */
    getCollections(apiRoot) {
        return new Promise(async (resolve, reject) => {
            try {
                this.httpClient
                    .get(`${this.stixService.getBaseURLs().baseAdminURL}api-root/${apiRoot}/collections`, {
                        headers: this.taxiiHttpHeaders,
                        observe: 'response',
                    })
                    .subscribe({
                        next: (result: any) => {
                            this.collections.set(apiRoot, result?.body?.collections ? result.body.collections : []);
                            return resolve(true);
                        },
                        error: (err) => {
                            return resolve(true);
                        },
                    });
            } catch (err) {
                return resolve(true);
            }
        });
    }

    /**
     * When API Root is changed, reset the selected collection to null
     * @param event
     */
    setApiRoot(event) {
        this.collection = null;
    }

    /**
     * Set API Root and Collection destination where CUI Marking Definition objects are stored.
     */
    async setApiCollectionDestination() {
        await this.envService.checkAuth('/admin');
        this.loading = true;
        this.saving = true;

        const body = {
            api: this.api,
            collection: this.collection,
        };

        this.httpClient.post(`${this.envService.env.imxServer.url}/cui`, body, { headers: this.imxHttpHeaders }).subscribe({
            next: async (resp: any) => {
                try {
                    this.loading = false;
                    this.saving = false;
                    this.enabled = true;

                    await this.getGroups();

                    this.markingDefinitions = await this.getCUI();

                    this.announcementService.show(
                        'Saved API Root and Collection',
                        `Saved destination API Root and Collection for CUI Marking Definitions`,
                        'success',
                        false
                    );
                } catch (err) {
                    this.announcementService.show(
                        'Failed to assign API Root and Collection',
                        `Something went wrong when trying to assign API Root and Collection for all future CUI marking-definition objects. Error: ${err.message ? err.message : JSON.stringify(err)}`,
                        'error',
                        false
                    );
                    this.loading = false;
                    this.saving = false;
                }
            },
            error: (err) => {
                this.announcementService.show(
                    'Failed to assign API Root and Collection',
                    `Something went wrong when trying to assign API Root and Collection for all future CUI marking-definition objects. Error: ${err.message ? err.message : JSON.stringify(err)}`,
                    'error',
                    false
                );
                this.loading = false;
                this.saving = false;
            },
        });
    }

    async getGroups() {
        return new Promise(async (resolve, reject) => {
            const url = `${this.stixService.getBaseURLs().baseAdminURL}groups`;

            this.httpClient.get(url, { headers: this.taxiiHttpHeaders }).subscribe({
                next: (result: any) => {
                    if (Array.isArray(result)) this.groups = result;
                    else this.groups = [];

                    return resolve(true);
                },
                error: (err) => {
                    this.announcementService.show(
                        'Could not retrieve groups',
                        `Failed to retrieve groups. ${err.message ? err.message : JSON.stringify(err)}`,
                        'error',
                        false
                    );
                    this.groups = [];
                    return resolve(false);
                },
            });
        });
    }

    getUsers() {
        return new Promise(async (resolve, reject) => {
            try {
                await this.envService.checkAuth('/admin');

                const url = `${this.stixService.getBaseURLs().baseAdminURL}users`;

                this.httpClient.get(url, { headers: this.taxiiHttpHeaders }).subscribe({
                    next: async (result: any) => {
                        const userSet = new Set();

                        if (Array.isArray(result)) {
                            this.users = result;

                            this.users.forEach((usr) => {
                                if (typeof usr === 'string') userSet.add(usr);
                                else userSet.add(usr.user);
                            });
                        } else this.users = [];

                        const keycloakUsers = await this.adminService.getKeycloakUsers();

                        keycloakUsers.forEach((kcUser) => {
                            if (!userSet.has(kcUser)) this.users.push(kcUser);
                        });

                        return resolve(true);
                    },
                    error: (err) => {
                        this.announcementService.show(
                            'Could not retrieve users',
                            `Failed to retrieve users. ${err.message ? err.message : JSON.stringify(err)}`,
                            'error',
                            false
                        );
                        this.users = [];
                        return resolve(false);
                    },
                });
            } catch (e) {
                this.announcementService.show(
                    'Could not retrieve users',
                    `Failed to retrieve users. ${e.message ? e.message : JSON.stringify(e)}`,
                    'error',
                    false
                );
                this.users = [];
                return resolve(false);
            }
        });
    }

    getCUI(next = null) {
        return new Promise<any[]>(async (resolve, reject) => {
            try {
                await this.envService.checkAuth('/admin');

                const headers = new HttpHeaders()
                    .set('Accept', 'application/taxii+json;version=2.1')
                    .set('Authorization', `Basic ${btoa(this.stixService.taxiiServer.username + ':' + this.stixService.taxiiServer.password)}`);

                let url;

                if (next) {
                    url = `${this.stixService.getBaseURLs().baseTaxiiURL}${this.api}/collections/${this.collection.id}/objects/?match[type]=marking-definition&limit=64&next=${next}`;
                } else {
                    url = `${this.stixService.getBaseURLs().baseTaxiiURL}${this.api}/collections/${this.collection.id}/objects/?match[type]=marking-definition&limit=64`;
                }

                this.httpClient.get(url, { headers: headers }).subscribe({
                    next: async (result: any) => {
                        try {
                            if (result.hasMore && result.next) {
                                this.nextMarkingDef = result.next;
                            } else {
                                this.nextMarkingDef = null;
                            }

                            if (!result.objects) return resolve([]);

                            const returnArr = result.objects.filter(
                                (elem) => elem.extensions?.['extension-definition--dff17fb3-edcb-4f99-ad1b-4b751c95738a']
                            );
                            return resolve(returnArr);
                        } catch (e) {
                            this.announcementService.show(
                                'Failed to retrieve Marking Definitions',
                                `Something went wrong when trying to retrieve Marking Definitions, please refresh and try again. Error: ${e.message ? e.message : JSON.stringify(e)}`,
                                'error',
                                false
                            );
                            return resolve([]);
                        }
                    },
                    error: (err) => {
                        this.announcementService.show(
                            'Failed to retrieve Marking Definitions',
                            `Something went wrong when trying to retrieve Marking Definitions, please refresh and try again. Error: ${err.message ? err.message : JSON.stringify(err)}`,
                            'error',
                            false
                        );
                        return resolve([]);
                    },
                });
            } catch (e) {
                this.announcementService.show(
                    'Failed to retrieve Marking Definitions',
                    `Something went wrong when trying to retrieve Marking Definitions, please refresh and try again. Error: ${e.message ? e.message : JSON.stringify(e)}`,
                    'error',
                    false
                );
                return resolve([]);
            }
        });
    }

    async getNextMarkingDef() {
        const markDefs = await this.getCUI(this.nextMarkingDef);

        this.markingDefinitions = [...this.markingDefinitions, ...markDefs];
        this.unaddedMarkingDefs = this.markingDefinitions.filter((md) => !this.editingGroup.markings.includes(md.id));
    }

    async nextPage(editing = false, index = null) {
        await this.envService.checkAuth('/admin');
        this.editing = editing;

        if (editing) {
            this.editingGroup = this.groups[index];

            this.unaddedMarkingDefs = this.markingDefinitions.filter((md) => !this.editingGroup.markings.includes(md.id));
            this.unaddedUsers = this.users.filter((user) => !this.editingGroup.users.includes(typeof user === 'string' ? user : user.user));
        } else {
            this.editingGroup = {
                name: '',
                markings: [],
                users: [],
            };

            this.unaddedMarkingDefs = [...this.markingDefinitions];

            this.unaddedUsers = [...this.users];
        }

        this.page = 2;
    }

    async prevPage() {
        await this.getGroups();
        this.page = 1;
        this.resetValues();
    }

    resetValues() {
        this.editingGroup = null;
        this.editing = false;
    }

    selectUnaddedUser(user) {
        if (this.selectedUsers.includes(user)) {
            this.selectedUsers = this.selectedUsers.filter((usr) => usr !== user);
        } else {
            this.selectedUsers.push(user);
        }
    }

    selectAddedUser(user) {
        if (this.selectedAddedUsers.includes(user)) {
            this.selectedAddedUsers = this.selectedAddedUsers.filter((usr) => usr !== user);
        } else {
            this.selectedAddedUsers.push(user);
        }
    }

    selectUnaddedMarkingDef(markingDef) {
        if (this.selectedMarkingDefs.includes(markingDef)) {
            this.selectedMarkingDefs = this.selectedMarkingDefs.filter((mdef) => mdef !== markingDef);
        } else {
            this.selectedMarkingDefs.push(markingDef);
        }
    }

    selectAddedMarkingDef(markingDef) {
        if (this.selectedAddedMarkingDefs.includes(markingDef)) {
            this.selectedAddedMarkingDefs = this.selectedAddedMarkingDefs.filter((mdef) => mdef !== markingDef);
        } else {
            this.selectedAddedMarkingDefs.push(markingDef);
        }
    }

    selectUser(user, users) {
        if (users.includes(user)) {
            users = users.filter((usr) => usr !== user);
        } else {
            users.push(user);
        }
    }

    addUsers() {
        this.editingGroup.users = [...this.editingGroup.users, ...this.selectedUsers];

        this.unaddedUsers = this.unaddedUsers.filter((user) => !this.selectedUsers.includes(user));

        this.selectedUsers = [];
        this.selectedAddedUsers = [];
    }

    addAllUsers() {
        this.editingGroup.users = [...this.editingGroup.users, ...this.unaddedUsers];
        this.unaddedUsers = [];

        this.selectedUsers = [];
        this.selectedAddedUsers = [];
    }

    removeAllUsers() {
        this.unaddedUsers = [...this.unaddedUsers, ...this.editingGroup.users];
        this.editingGroup.users = [];

        this.selectedUsers = [];
        this.selectedAddedUsers = [];
    }

    removeUsers() {
        this.unaddedUsers = [...this.unaddedUsers, ...this.selectedAddedUsers];

        this.editingGroup.users = this.editingGroup.users.filter((user) => !this.selectedAddedUsers.includes(user));

        this.selectedUsers = [];
        this.selectedAddedUsers = [];
    }

    selectMarkingDef(markDef, markDefs) {
        if (markDefs.includes(markDef)) {
            markDefs = markDefs.filter((mdef) => mdef !== markDef);
        } else {
            markDefs.push(markDef);
        }
    }

    addMarkingDefs() {
        this.editingGroup.markings = [...this.editingGroup.markings, ...this.selectedMarkingDefs];

        this.unaddedMarkingDefs = this.unaddedMarkingDefs.filter((mdef) => !this.selectedMarkingDefs.includes(mdef));

        this.selectedMarkingDefs = [];
        this.selectedAddedMarkingDefs = [];
    }

    addAllMarkingDefs() {
        this.editingGroup.markings = [...this.editingGroup.markings, ...this.unaddedMarkingDefs];
        this.unaddedMarkingDefs = [];

        this.selectedMarkingDefs = [];
        this.selectedAddedMarkingDefs = [];
    }

    removeAllMarkingDefs() {
        this.unaddedMarkingDefs = [...this.unaddedMarkingDefs, ...this.editingGroup.markings];
        this.editingGroup.markings = [];

        this.selectedMarkingDefs = [];
        this.selectedAddedMarkingDefs = [];
    }

    removeMarkingDefs() {
        this.unaddedMarkingDefs = [...this.unaddedMarkingDefs, ...this.selectedAddedMarkingDefs];

        this.editingGroup.markings = this.editingGroup.markings.filter((mdef) => !this.selectedAddedMarkingDefs.includes(mdef));

        this.selectedMarkingDefs = [];
        this.selectedAddedMarkingDefs = [];
    }

    enableSave() {
        if (!this.editingGroup.name) return false;

        return true;
    }

    getDisplayCui(markingDef) {
        if (typeof markingDef === 'string') {
            return markingDef;
        }

        return this.stixService.getCuiDisplay(markingDef.extensions['extension-definition--dff17fb3-edcb-4f99-ad1b-4b751c95738a'], markingDef.id);
    }

    getDisplayUser(user) {
        if (typeof user === 'string') return user;

        return user.user;
    }

    saveGroup() {
        return new Promise(async (resolve, reject) => {
            try {
                const url = `${this.stixService.getBaseURLs().baseAdminURL}group`;

                const body = {
                    name: this.editingGroup.name,
                    markings: [],
                    users: [],
                };

                this.editingGroup.users.forEach((user) => {
                    if (typeof user === 'string') {
                        body.users.push(user);
                    } else body.users.push(user.user);
                });

                this.editingGroup.markings.forEach((mdef) => {
                    if (typeof mdef === 'string') body.markings.push(mdef);
                    else body.markings.push(mdef.id);
                });

                this.httpClient.post(url, body, { headers: this.taxiiHttpHeaders }).subscribe({
                    next: (result: any) => {
                        this.announcementService.show(
                            `Successfully ${this.editing ? 'saved' : 'created'} group`,
                            `Group ${this.editingGroup.name} has been ${this.editing ? 'saved' : 'created'}`,
                            'success',
                            false
                        );

                        this.prevPage();
                        return resolve(true);
                    },
                    error: (err) => {
                        this.announcementService.show(
                            "Could not ${this.editing ? 'save' : 'create'} group",
                            `Failed to ${this.editing ? 'save' : 'create'} group. ${err.message ? err.message : JSON.stringify(err)}`,
                            'error',
                            false
                        );
                        return resolve(true);
                    },
                });
            } catch (err) {
                this.announcementService.show(
                    "Could not ${this.editing ? 'save' : 'create'} group",
                    `Failed to ${this.editing ? 'save' : 'create'} group. ${err.message ? err.message : JSON.stringify(err)}`,
                    'error',
                    false
                );
                return resolve(true);
            }
        });
    }

    deleteGroup() {
        return new Promise(async (resolve, reject) => {
            try {
                const url = `${this.stixService.getBaseURLs().baseAdminURL}group/${this.editingGroup.name}`;

                this.httpClient.delete(url, { headers: this.taxiiHttpHeaders }).subscribe({
                    next: (result: any) => {
                        this.announcementService.show(
                            'Successfully deleted group',
                            `Group ${this.editingGroup.name} has been deleted`,
                            'success',
                            false
                        );

                        this.prevPage();

                        return resolve(true);
                    },
                    error: (err) => {
                        this.announcementService.show(
                            'Could not delete group',
                            `Failed to delete group. ${err.message ? err.message : JSON.stringify(err)}`,
                            'error',
                            false
                        );
                        return resolve(true);
                    },
                });
            } catch (err) {
                this.announcementService.show(
                    'Could not delete group',
                    `Failed to delete group. ${err.message ? err.message : JSON.stringify(err)}`,
                    'error',
                    false
                );
                return resolve(true);
            }
        });
    }
}
