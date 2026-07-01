import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
    faList,
    faTrash,
    faTrashAlt,
    faPlusSquare,
    faAngleDown,
    faAngleUp,
    faPlus,
    faPlusCircle,
    faAngleDoubleRight,
    faUser,
    faUserFriends,
    faServer,
    faBook,
    faStopCircle,
    faSync,
    faCaretDown,
    faCaretUp,
} from '@fortawesome/free-solid-svg-icons';
import { EnvService } from '../env-service/env.service';
import { MessageDialogComponent } from '../dialogs/message-dialog/message-dialog.component';
import { StixService } from 'src/app/stix-service.service';
import { AdminRoleComponent } from '../admin-role/admin-role.component';
import { AnnouncementService } from '../announcement-service/announcement-service.service';
import { UserCertComponent } from '../user-cert/user-cert.component';
import { AdminService } from '../admin-service/admin.service';

@Component({
    selector: 'app-admin-main',
    templateUrl: './admin-main.component.html',
    styleUrls: ['./admin-main.component.css', '../bundle/bundle.component.css'],
    standalone: false,
})
export class AdminMainComponent implements OnInit {
    collections: any[] = [];
    collectionsShown: any[] = [];
    users: any[];
    apiRoots: any[];
    apiRootsCollections: any[] = [];
    activeTab: string;
    roles: any[] = [];
    roleDetails: any = [];

    init = false;

    faList = faList;
    faTrash = faTrash;
    faTrashAlt = faTrashAlt;
    faPlusSquare = faPlusSquare;
    faAngleUp = faAngleUp;
    faAngleDown = faAngleDown;
    faPlus = faPlus;
    faPlusCircle = faPlusCircle;
    faRight = faAngleDoubleRight;
    faUser = faUser;
    faUserFriends = faUserFriends;
    faServer = faServer;
    faBook = faBook;
    faStop = faStopCircle;
    faSync = faSync;
    faCaretDown = faCaretDown;
    faCaretUp = faCaretUp;

    currentCollection = null;
    currentApiRoot = null;
    currentRole = null;
    errorMessages = [];
    modalRef: any;
    unassignedCollection: string;

    sortKey: string = undefined;
    unsortedTable = [];

    autoConfirm = false;
    kibanaDashboardURL = null;
    expandSidebar = false;

    roleExpanded = false;

    private httpHeaders: HttpHeaders;
    private imxHttpHeaders: HttpHeaders;

    constructor(
        private readonly httpClient: HttpClient,
        public modalService: NgbModal,
        public stixService: StixService,
        private readonly _router: Router,
        public announcementService: AnnouncementService,
        private readonly envService: EnvService,
        public readonly adminService: AdminService
    ) {
        this.activeTab = 'apiRoots';

        this.unassignedCollection = '<UNASSIGNED COLLECTION>';
    }

    ngOnInit() {
        this.httpHeaders = new HttpHeaders()
            .set('Accept', 'application/taxii+json;version=2.1')
            .set('Authorization', `Basic ${btoa(this.envService.env.adminServer.username + ':' + this.envService.env.adminServer.password)}`)
            .set('Content-Type', `application/taxii+json;version=2.1`);

        this.imxHttpHeaders = new HttpHeaders()
            .set('Accept', 'application/json')
            .set('Authorization', `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`)
            .set('Content-Type', `application/json`);

        this.getCollections();

        this.getUsers();

        this.getApiRoots();

        this.getRoles();

        this.kibanaDashboardURL = this.envService.env.kibana.dashboard;
    }

    sort(col, table) {
        if (this.exitSort(table)) return;

        if (!this.sortKey) this.setUnsortedTable(table);

        if (this.sortKey === '') {
            this.sortDes(col, table);
        } else {
            let keyArr = this.sortKey.split('-');
            if (col === keyArr[0] && keyArr[1] === 'des') {
                this.sortAsc(col, table);
            } else if (col === keyArr[0] && keyArr[1] === 'asc') {
                this.unsort(table);
            } else {
                this.sortDes(col, table);
            }
        }
    }

    exitSort(table) {
        if (table === 'collections' && this.collectionsShown.length === 0) return true;
        if (table === 'api-roots' && this.apiRoots.length === 0) return true;
        if (table === 'users' && this.users.length === 0) return true;
        if (table === 'roles' && this.roleDetails.privileges?.length === 0) return true;

        return false;
    }

    setUnsortedTable(table) {
        this.sortKey = '';
        this.unsortedTable = [];
        if (table === 'collections') {
            for (let obj of this.collectionsShown) this.unsortedTable.push(obj);
        } else if (table === 'api-roots') {
            for (let obj of this.apiRoots) this.unsortedTable.push(obj);
        } else if (table === 'users') {
            for (let obj of this.users) this.unsortedTable.push(obj);
        } else if (table === 'roles') {
            for (let obj of this.roleDetails.privileges) this.unsortedTable.push(obj);
        }
    }

    sortDes(col, table) {
        if (table === 'collections') this.collectionsShown = this.sortResultsDes(col, this.collectionsShown, table);
        if (table === 'api-roots') this.apiRoots = this.sortResultsDes(col, this.apiRoots, table);
        if (table === 'users') this.users = this.sortResultsDes(col, this.users, table);
        if (table === 'roles') this.roleDetails.privileges = this.sortResultsDes(col, this.roleDetails.privileges, table);

        this.sortKey = `${col}-des`;
    }

    sortAsc(col, table) {
        if (table === 'collections') this.collectionsShown = this.sortResultsAsc(col, this.collectionsShown, table);
        if (table === 'api-roots') this.apiRoots = this.sortResultsAsc(col, this.apiRoots, table);
        if (table === 'users') this.users = this.sortResultsAsc(col, this.users, table);
        if (table === 'roles') this.roleDetails.privileges = this.sortResultsAsc(col, this.roleDetails.privileges, table);

        this.sortKey = `${col}-asc`;
    }

    unsort(table) {
        if (table === 'collections') this.collectionsShown = this.unsortedTable;
        if (table === 'api-roots') this.apiRoots = this.unsortedTable;
        if (table === 'users') this.users = this.unsortedTable;
        if (table === 'roles') this.roleDetails.privileges = this.unsortedTable;

        this.sortKey = '';
    }

    private sortToLowercase(a, b, mode) {
        if (typeof a === 'string') a = a.toLowerCase();
        if (typeof b === 'string') b = b.toLowerCase();

        if (a < b) return mode === 'asc' ? 1 : -1;
        else if (a > b) return mode === 'asc' ? -1 : 1;
        else return 0;
    }

    sortResultsDes(col: string, tableArray: any[], table) {
        if (col !== 'fragment' && table === 'api-roots') return this.objectSortDes(col, tableArray, 'apiRoot');

        if (col === 'roles') {
            return tableArray.sort((a, b) => this.sortToLowercase(a[col][0], b[col][0], 'des'));
        } else {
            return tableArray.sort((a, b) => this.sortToLowercase(a[col], b[col], 'des'));
        }
    }

    sortResultsAsc(col: string, tableArray: any[], table) {
        if (col !== 'fragment' && table === 'api-roots') return this.objectSortAsc(col, tableArray, 'apiRoot');

        if (col === 'roles') {
            return tableArray.sort((a, b) => this.sortToLowercase(a[col][0], b[col][0], 'asc'));
        } else {
            return tableArray.sort((a, b) => this.sortToLowercase(a[col], b[col], 'asc'));
        }
    }

    objectSortDes(col, tableArray, obj) {
        if (col === 'versions') {
            return tableArray.sort((a, b) => this.sortToLowercase(a[obj][col][0], b[obj][col][0], 'des'));
        } else {
            return tableArray.sort((a, b) => this.sortToLowercase(a[obj][col], b[obj][col], 'des'));
        }
    }

    objectSortAsc(col, tableArray, obj) {
        if (col === 'versions') {
            return tableArray.sort((a, b) => this.sortToLowercase(a[obj][col][0], b[obj][col][0], 'asc'));
        } else {
            return tableArray.sort((a, b) => this.sortToLowercase(a[obj][col], b[obj][col], 'asc'));
        }
    }

    getApiRootsCollectionsIds() {
        let ids = [];
        this.apiRootsCollections.forEach((ar) => {
            ar.collections.forEach((c) => {
                ids.push(c.id);
            });
        });

        return ids;
    }

    getApiRootDetail(fragment) {
        return this.apiRoots.find((r) => r.fragment === fragment);
    }

    onAPIRootChanged(event: any = null) {
        this.currentApiRoot = null;
        if (event?.target?.value) {
            if (this.collections && event.target.value === '--unassigned--') {
                const apiCollectionIds = this.getApiRootsCollectionsIds();
                this.collectionsShown = this.collections.filter((c) => !apiCollectionIds.some((apiC) => apiC === c.id));
            } else {
                this.currentApiRoot = event.target.value;
                const apiRootObj = this.apiRootsCollections.find((a) => a.fragment === this.currentApiRoot);
                if (apiRootObj?.collections) {
                    this.collectionsShown = apiRootObj.collections;
                } else {
                    this.collectionsShown = [];
                }
            }
        } else {
            this.collectionsShown = [];
        }
    }

    onRoleChange(event: any = null) {
        if (event?.target?.value) {
            this.currentRole = event.target.value;
            this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
                this.httpClient
                    .get<any>(this.stixService.getBaseURLs().baseAdminURL + 'role/' + this.currentRole, { headers: header, observe: 'response' })
                    .subscribe((resp) => {
                        this.roleDetails = resp.body;
                    });
            });
        } else {
            this.roleDetails = [];
        }
    }

    getRoles() {
        this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
            this.httpClient
                .get<any>(this.stixService.getBaseURLs().baseAdminURL + 'roles', { headers: header, observe: 'response' })
                .subscribe((resp) => {
                    this.roles = resp.body;
                });
        });
    }

    getCollections() {
        this.sortKey = undefined;

        this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
            this.httpClient
                .get<any>(this.stixService.getBaseURLs().baseAdminURL + 'collections', { headers: header, observe: 'response' })
                .subscribe((resp) => {
                    this.collections = resp.body;
                });
        });
    }

    getUsers() {
        this.sortKey = undefined;

        this.adminService
            .getAllUsers()
            .then((res) => {
                console.info(res);
                this.users = res;
            })
            .catch((err) => {
                this.announcementService.show(
                    `Error while retrieving users`,
                    `Error occurred while retrieving users. ${err.message ? err.message : JSON.stringify(err)}`,
                    'error',
                    false
                );
                this.users = [];
            });
    }

    getApiRoots() {
        this.sortKey = undefined;
        this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
            this.httpClient
                .get<any>(this.stixService.getBaseURLs().baseAdminURL + 'api-roots', { headers: header, observe: 'response' })
                .subscribe((resp) => {
                    this.apiRoots = resp.body;

                    this.apiRootsCollections = [];
                    this.getCollectionsList(header);
                });
        });
    }

    getCollectionsList(header) {
        this.apiRoots.forEach((apiRoot) => {
            this.httpClient
                .get<any>(this.stixService.getBaseURLs().baseAdminURL + 'api-root/' + apiRoot.fragment + '/collections/', {
                    headers: header,
                    observe: 'response',
                })
                .subscribe((resp) => {
                    if (resp.body.collections) {
                        let apiRootObj: any = {};
                        apiRootObj['fragment'] = apiRoot.fragment;
                        apiRootObj['collections'] = resp.body['collections'];
                        apiRootObj['collections'].forEach((c) => {
                            delete c.readers;
                            delete c.writers;
                        });
                        apiRootObj.collections = apiRootObj.collections.sort((a, b) => a.title - b.title);
                        this.apiRootsCollections.push(apiRootObj);
                    }

                    this.getCollections();
                });
        });
    }

    getCollectionInAPIRoot(apiRootName, cid = null) {
        if (this.apiRootsCollections && this.apiRootsCollections.length > 0 && apiRootName) {
            if (cid) {
                let apiRootObj = this.apiRootsCollections.find((a) => a.fragment === apiRootName);
                if (apiRootObj?.collections) {
                    return apiRootObj.collections.find((c) => c.id === cid);
                }
            } else {
                return this.apiRootsCollections.find((a) => a.fragment === apiRootName);
            }
        }
        return [];
    }

    addCollection() {
        this.currentCollection = {};
    }

    editCollection(collection) {
        this.currentCollection = collection;
    }

    getCollectionPerRolePermission(roleDetail, type) {
        const collection = this.collections.find((c) => c.id === roleDetail.collection_id);
        if (type === 'read') {
            if (collection?.can_read) {
                return roleDetail.can_read;
            } else {
                return collection.can_read;
            }
        }

        if (type === 'write') {
            if (collection?.can_write) {
                return roleDetail.can_write;
            } else {
                return collection.can_write;
            }
        }
    }

    editRole(roleName = null, roleDetail = null) {
        this.modalRef = this.modalService.open(AdminRoleComponent);
        this.modalRef.componentInstance.roleDetail = JSON.parse(JSON.stringify(roleDetail));
        this.modalRef.componentInstance.roleDetails = this.roleDetails;
        this.modalRef.componentInstance.role = roleName;
        this.modalRef.componentInstance.collections = this.collections;
        this.modalRef.componentInstance.apiRoots = this.apiRoots;
        this.modalRef.componentInstance.apiRootsCollections = this.apiRootsCollections;

        this.modalRef.result.then((resp) => {
            switch (resp.type) {
                case 'save': {
                    setTimeout(() => {
                        if (this.roleDetails?.privileges?.length === 1 && !resp.roleDetail.can_read && !resp.roleDetail.can_write) {
                            this.getRoles();
                            this.onRoleChange({ target: { value: null } });
                            this.currentRole = null;
                            this.roleDetails = [];
                        } else {
                            this.onRoleChange({ target: { value: roleName } });
                        }
                    }, 1000);
                    break;
                }
                case 'cancel': {
                    break;
                }
                default:
                    break;
            }
        });
    }

    newRole() {
        this.modalRef = this.modalService.open(AdminRoleComponent);
        this.modalRef.componentInstance.roleDetails = this.roleDetails;
        this.modalRef.componentInstance.collections = this.collections;
        this.modalRef.componentInstance.apiRoots = this.apiRoots;
        this.modalRef.componentInstance.apiRootsCollections = this.apiRootsCollections;

        this.modalRef.result.then((resp) => {
            switch (resp.type) {
                case 'save': {
                    setTimeout(() => {
                        this.getRoles();
                        this.onRoleChange({ target: { value: resp.role } });
                    }, 1000);
                    break;
                }
                case 'cancel': {
                    break;
                }
                default:
                    break;
            }
        });
    }

    addCollectionToRole() {
        this.editRole(this.currentRole);
    }

    addApiRoot() {
        this.currentApiRoot = {};
    }

    editApiRoot(apiRoot) {
        this.currentApiRoot = apiRoot;
    }

    backToMain(event) {
        switch (event.type) {
            case 'save-collection': {
                this.onAPIRootChanged();
                this.collectionsShown = [];

                setTimeout(() => {
                    this.getApiRoots();
                }, 1000);
                break;
            }
            case 'save-user': {
                const index = this.users.findIndex((c) => c.user === event.data.user);
                if (index !== -1) {
                    this.users[index] = event.data;
                } else {
                    this.users.push(event.data);
                }
                this.activeTab = 'users';
                this.adminService.currentUser = null;
                break;
            }
            case 'save-api-root': {
                setTimeout(() => {
                    this.getApiRoots();
                }, 1000);
                break;
            }
            default: {
                this.collectionsShown = [];
                this.resetCurrentSelections();
                this.getApiRoots();

                setTimeout(() => {
                    this.onAPIRootChanged();
                }, 1000);
            }
        }

        this.currentCollection = null;
        this.adminService.currentUser = null;
        this.currentApiRoot = null;
    }

    resetCurrentSelections() {
        this.currentCollection = null;
        this.adminService.currentUser = null;
        this.currentApiRoot = null;
    }

    setTab(tab) {
        this.sortKey = undefined;

        this.envService.checkAuth('/admin');

        switch (tab) {
            case 'kibana-dashboard': {
                this.activeTab = 'kibana-dashboard';
                window.open(this.kibanaDashboardURL, '_blank');
                break;
            }
            case 'users': {
                this.activeTab = 'users';
                this.getUsers();
                break;
            }
            case 'apiRoots': {
                this.activeTab = 'apiRoots';
                this.getApiRoots();
                break;
            }
            case 'roles': {
                this.activeTab = 'roles';
                this.currentRole = null;
                this.onRoleChange(null);
                this.getRoles();
                break;
            }
            case 'groups': {
                this.activeTab = 'groups';
                break;
            }
            case 'taxii-settings': {
                this.activeTab = 'taxii-settings';
                break;
            }
            case 'taxii-sync': {
                this.activeTab = 'taxii-sync';
                break;
            }
            default: {
                this.activeTab = 'collections';
                this.onAPIRootChanged();
            }
        }
        this.resetCurrentSelections();
    }

    removeRoleFromCollection(rootOfCollection, cId, role, roleType) {
        let root = null;
        let rw = null;

        root = this.apiRoots.find((r) => r.fragment === rootOfCollection);
        rw = root.rws.find((r) => r.cId === cId);

        if (roleType === 'readers') {
            if (rw.readers && rw.readers.length > 0) {
                const index = rw.readers.findIndex((r) => r === role);
                if (index !== -1) {
                    rw.readers.splice(index, 1);
                }
            }
        }

        if (roleType === 'writers') {
            if (rw.writers && rw.writers.length > 0) {
                const index = rw.writers.findIndex((r) => r === role);
                if (index !== -1) {
                    rw.writers.splice(index, 1);
                }
            }
        }
    }

    removeRole() {
        this.removeObject('role', this.currentRole);
    }

    removeObject(type, object) {
        this.errorMessages = [];
        let messageData = {};

        this.modalRef = this.modalService.open(MessageDialogComponent);

        switch (type) {
            case 'collection': {
                messageData = {
                    title: 'Remove Collection',
                    message: 'Please confirm you would like to remove collection: <strong>' + object.title + '</strong>.',
                };
                break;
            }
            case 'user': {
                messageData = {
                    title: 'Remove User',
                    message: 'Please confirm you would like to remove user: <strong>' + object.user + '</strong>.',
                };
                break;
            }
            case 'api-root': {
                messageData = {
                    title: 'Remove API Root',
                    message: 'Please confirm you would like to remove api root: <strong>' + object.fragment + '</strong>.',
                };
                break;
            }
            case 'role-collection': {
                messageData = {
                    title: 'Remove Role',
                    message:
                        'Please confirm you would like to remove group <strong>' +
                        this.currentRole +
                        '</strong> from collection <strong>' +
                        this.getCollectionById(object.collection_id).title +
                        '</strong> in root <strong>' +
                        object.api_root +
                        '</strong>.',
                    autoConfirm: this.autoConfirm,
                };
                break;
            }
            case 'role': {
                messageData = {
                    title: 'Remove Role',
                    message: 'Please confirm you would like to remove group: <strong>' + object + '</strong>.',
                };
                break;
            }
        }

        this.modalRef.componentInstance.messageObj = messageData;
        this.modalRef.result.then((resp) => {
            if (resp !== 'confirm') return;

            let url = '';
            switch (type) {
                case 'collection': {
                    url = this.stixService.getBaseURLs().baseAdminURL + 'collection/' + object.id;
                    break;
                }
                case 'user': {
                    url = this.stixService.getBaseURLs().baseAdminURL + 'user/' + object.user;
                    break;
                }
                case 'api-root': {
                    url = this.stixService.getBaseURLs().baseAdminURL + 'api-root/' + object.fragment;
                    break;
                }
                case 'role': {
                    url = this.stixService.getBaseURLs().baseAdminURL + 'role/' + object;
                    this.currentRole = null;
                    break;
                }
                case 'role-collection': {
                    this.removeRoleFromCollection(object.api_root, object.collection_id, this.currentRole, 'readers');
                    this.removeRoleFromCollection(object.api_root, object.collection_id, this.currentRole, 'writers');

                    let fullRoot = this.apiRoots.find((r) => r.fragment === object.api_root);

                    let payload = {
                        fragment: fullRoot.fragment,
                        apiRoot: fullRoot.apiRoot,
                        rws: fullRoot.rws,
                    };

                    // need to post to api root with RW removed for that collection.
                    let url = this.stixService.getBaseURLs().baseAdminURL + 'api-root';
                    this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
                        this.httpClient.post<any>(url, payload, { headers: header, observe: 'response' }).subscribe({
                            next: (results) => {
                                console.info(results);
                                this.updateRoles();
                            },
                            error: (err) => {
                                this.handleError(err, 'Delete failed. Please check role parameters.');
                            },
                        });
                    });
                    break;
                }
            }

            if (type !== 'role-collection') {
                this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
                    this.httpClient.delete<any>(url, { headers: header, observe: 'response' }).subscribe({
                        next: (resp: any) => {
                            switch (type) {
                                case 'collection': {
                                    let index = this.findIndex(this.collections, 'id', resp);
                                    this.collections.splice(index, 1);

                                    index = this.findIndex(this.collectionsShown, 'id', resp);
                                    this.collectionsShown.splice(index, 1);
                                    break;
                                }
                                case 'user': {
                                    let index = this.findIndex(this.users, 'user', resp);
                                    this.users.splice(index, 1);
                                    break;
                                }
                                case 'api-root': {
                                    let index = this.findIndex(this.apiRoots, 'fragment', resp);
                                    this.apiRoots.splice(index, 1);
                                    break;
                                }
                                case 'role': {
                                    this.updateRoles2();
                                    break;
                                }
                            }
                        },
                        error: (err: any) => {
                            this.handleError(err, 'Please check Collection assignment to API Root.');
                        },
                    });
                });
            }
        });
    }

    findIndex(target, field, resp) {
        return target.findIndex((x) => x[field] === resp.body[field]);
    }

    updateRoles() {
        this.getRoles();
        setTimeout(() => {
            if (this.roleDetails?.privileges?.length === 1) {
                this.getRoles();
                this.onRoleChange({ target: { value: null } });
                this.currentRole = null;
                this.roleDetails = [];
            } else {
                this.onRoleChange({ target: { value: this.currentRole } });
            }
        }, 1000);
    }

    updateRoles2() {
        setTimeout(() => {
            this.getRoles();
            if (this.roles && this.roles.length > 0) {
                this.onRoleChange({ target: { value: null } });
                this.roleDetails = [];
            }
        }, 1000);
    }

    removeCollection(collection) {
        this.errorMessages = [];

        this.modalRef = this.modalService.open(MessageDialogComponent);

        const messageData = {
            title: 'Remove Collection',
            message: 'Please confirm you would like to remove collection: ' + collection.title,
        };
        this.modalRef.componentInstance.messageObj = messageData;

        this.modalRef.result.then((resp) => {
            if (resp === 'confirm') {
                const url = this.stixService.getBaseURLs().baseAdminURL + 'collection/' + collection.id;
                this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
                    this.httpClient.delete<any>(url, { headers: header, observe: 'response' }).subscribe({
                        next: (resp: any) => {
                            if (resp.status >= 400) {
                                this.errorMessages.push(resp.statusText);
                            } else {
                                this.getCollections();
                            }
                        },
                        error: (err: any) => {
                            this.handleError(err, 'Please check Collection assignment to API Root.');
                        },
                    });
                });
            }
        });
    }

    handleError(err, defaultMsg = '') {
        if (err.status >= 400 && err.error?.description) {
            this.announcementService.show('Error', err.error.description, 'error', false);
        } else {
            this.announcementService.show('Error', defaultMsg, 'error', false);
        }
    }

    getCollectionById(cId) {
        return this.collections.find((c) => c.id === cId);
    }

    enableSidebar() {
        this.expandSidebar = true;
    }

    disableSidebar() {
        this.expandSidebar = false;
    }

    uploadCert() {
        this.modalService.open(UserCertComponent);
    }

    clickRoles(event) {
        event.stopPropagation();

        if (!this.expandSidebar) {
            this.expandSidebar = true;
            this.roleExpanded = true;
        } else {
            this.roleExpanded = !this.roleExpanded;
        }
    }
}
