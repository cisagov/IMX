import { Component, OnInit, Input } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StixService } from 'src/app/stix-service.service';
import { faBan, faSave } from '@fortawesome/free-solid-svg-icons';
import { EnvService } from '../env-service/env.service';

@Component({
    selector: 'app-admin-role',
    templateUrl: './admin-role.component.html',
    styleUrls: ['./admin-role.component.css'],
    standalone: false,
})
export class AdminRoleComponent implements OnInit {
    @Input() roleDetailInput: any;
    @Input() roleDetails: any;
    @Input() role: any;
    @Input() collections: any;
    @Input() apiRootsInput: any;
    @Input() apiRootsCollections: any;

    faBan = faBan;
    faSave = faSave;

    currentCollection = null;
    currentCollectionTitle = null;
    currentRoot = null;
    currentRootTitle = null;
    roleDetailPrev = null;
    currentCollectionPrev = null;
    errorMessages = [];
    roleType = 0; // 0: new role, 1: new collection 2: edit role
    collectionsWithRoot = [];
    roleDetail = null;
    apiRoots = [];

    rootsToSave = [];
    collectionsToSave = [];

    collectionPerRolePermission = {
        can_read: true,
        can_write: true,
    };

    private httpHeaders: HttpHeaders;

    constructor(
        public activeModal: NgbActiveModal,
        private readonly httpClient: HttpClient,
        public stixService: StixService,
        private readonly envService: EnvService
    ) {}

    ngOnInit(): void {
        this.httpHeaders = new HttpHeaders()
            .set('Accept', 'application/taxii+json;version=2.1')
            .set('Authorization', `Basic ${btoa(this.envService.env.adminServer.username + ':' + this.envService.env.adminServer.password)}`)
            .set('Content-Type', `application/taxii+json;version=2.1`);

        if (this.roleDetailInput) {
            this.roleDetail = JSON.parse(JSON.stringify(this.roleDetailInput));
        }
        if (this.apiRootsInput) {
            this.apiRoots = JSON.parse(JSON.stringify(this.apiRootsInput));
        }

        if (!this.role && !this.roleDetail) {
            this.roleType = 0;
        } else if (this.role && !this.roleDetail) {
            this.roleType = 1;
        } else if (this.role && this.roleDetail) {
            this.roleType = 2;
            this.roleDetailPrev = { ...this.roleDetail };
        }

        if (!this.roleDetail) {
            this.roleDetail = {};
            this.roleDetail.can_read = false;
            this.roleDetail.can_write = false;
        }

        if (this.roleType == 2) {
            this.currentCollection = this.getCollectionById(this.roleDetail.collection_id);

            if (this.currentCollection) {
                this.currentRootTitle = this.getApiRootDetail(this.roleDetail.api_root).apiRoot.title;
                this.currentCollectionTitle = this.currentCollection.title;

                this.selectApiRoot({ target: { value: this.getApiRootDetail(this.roleDetail.api_root).apiRoot.title } });
                this.selectCollection({ target: { value: this.currentCollectionTitle } });
            }
        }

        this.apiRootsCollections.forEach((r) => {
            r.collections.forEach((c) => {
                if (this.collectionsWithRoot.length > 0) {
                    if (!this.collectionsWithRoot.find((cwr) => cwr.id === c.id)) {
                        this.collectionsWithRoot.push(c);
                    }
                } else {
                    this.collectionsWithRoot.push(c);
                }
            });
        });
    }

    close() {
        this.activeModal.close({ type: 'cancel', role: this.role });
    }

    getCollectionsList() {
        if (this.roleType === 0 || this.roleType === 1) {
            return this.collectionsWithRoot.filter((c) => !this.roleDetails.privileges.some((p) => p.collection_id === c.id));
        }

        return this.collectionsWithRoot;
    }

    getCollectionsListFromRoot() {
        if (this.rootsToSave && this.rootsToSave.length > 0) {
            const root = this.apiRootsCollections.find((r) => r.fragment === this.rootsToSave[0]);

            if (root) {
                if (this.roleType === 0 || this.roleType === 2 || !('privileges' in this.roleDetails)) {
                    return root.collections;
                }

                return root.collections.filter((c) => !this.roleDetails.privileges.some((p) => p.collection_id === c.id));
            }

            return [];
        }

        return this.collections;
    }

    getApiRootDetail(fragment) {
        return this.apiRoots.find((r) => r.fragment === fragment);
    }

    addRoleToCollection(rootOfCollection, cId, role, roleType) {
        let root = null;
        let rw = null;

        root = this.apiRoots.find((r) => r.fragment === rootOfCollection);
        rw = root.rws.find((r) => r.cId === cId);

        if (roleType === 'readers') {
            this.pushReaders(rw, role);
        }

        if (roleType === 'writers') {
            this.pushWriters(rw, role);
        }
    }

    pushReaders(rw, role) {
        if (rw.readers && rw.readers.length > 0) {
            if (!rw.readers.some((r) => r === role)) {
                rw.readers.push(this.role);
            }
        } else {
            rw['readers'] = [this.role];
        }

        return rw;
    }

    pushWriters(rw, role) {
        if (rw.writters && rw.writters.length > 0) {
            if (!rw.writters.some((r) => r === role)) {
                rw.writters.push(this.role);
            }
        } else {
            rw['writers'] = [this.role];
        }

        return rw;
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

    async save() {
        if (this.roleType == 0 || this.roleType == 1 || this.roleType == 2) {
            if (this.roleDetail.can_read) {
                this.rootsToSave.forEach((r, i) => {
                    this.addRoleToCollection(r, this.collectionsToSave[i], this.role, 'readers');
                });
            }

            if (this.roleDetail.can_write) {
                this.rootsToSave.forEach((r, i) => {
                    this.addRoleToCollection(r, this.collectionsToSave[i], this.role, 'writers');
                });
            }

            // For Edit Role readers
            if (this.roleDetailPrev && this.roleDetail && this.roleDetailPrev.can_read && !this.roleDetail.can_read) {
                this.rootsToSave.forEach((r, i) => {
                    this.removeRoleFromCollection(r, this.collectionsToSave[i], this.role, 'readers');
                });
            }

            // For Edit Role writers
            if (this.roleDetailPrev && this.roleDetail && this.roleDetailPrev.can_write && !this.roleDetail.can_write) {
                this.rootsToSave.forEach((r, i) => {
                    this.removeRoleFromCollection(r, this.collectionsToSave[i], this.role, 'writers');
                });
            }
        }

        let addNewCollectionTasks$ = [];
        try {
            for (let r of this.rootsToSave) {
                let fullRoot = this.apiRoots.find((root) => r === root.fragment);

                let payload = {
                    fragment: fullRoot.fragment,
                    apiRoot: fullRoot.apiRoot,
                    rws: fullRoot.rws,
                };

                let url = this.stixService.getBaseURLs().baseAdminURL + 'api-root';
                this.stixService.getCert(this.httpHeaders, async (header: HttpHeaders) => {
                    const addCollectionTask$ = await this.postToRoot(url, payload, header);
                    addNewCollectionTasks$.push(addCollectionTask$);
                });
            }
            console.info(addNewCollectionTasks$);
            this.activeModal.close({ type: 'save', role: this.role, roleDetail: this.roleDetail });
        } catch (err) {
            this.handleError(err, 'Please check role parameters.');
        }
    }

    postToRoot(url, payload, header) {
        return new Promise((resolve, reject) => {
            this.httpClient.post<any>(url, payload, { headers: header, observe: 'response' }).subscribe({
                next: (resp) => {
                    resolve(resp);
                },
                error: (err) => {
                    reject(err);
                },
            });
        });
    }

    handleError(err, defaultMsg = '') {
        if (err.status >= 400 && err.error?.description) {
            this.errorMessages.push('Error: ' + err.error.description);
            setTimeout(() => {
                this.errorMessages = [];
            }, 8000);
        } else {
            this.errorMessages.push('Error: ' + defaultMsg);
            setTimeout(() => {
                this.errorMessages = [];
            }, 8000);
        }
    }

    getCollectionById(cId) {
        return this.collections.find((c) => c.id === cId);
    }

    selectCollection(event) {
        if (event?.target?.value) {
            const collection = this.collections.find((c) => c.title === event.target.value);

            if (collection) {
                this.currentCollection = this.getCollectionById(collection.id);

                if (this.currentCollection) {
                    this.currentCollectionTitle = this.currentCollection.title;

                    this.collectionsToSave = [];
                    this.collectionsToSave.push(this.currentCollection.id);

                    this.collectionPerRolePermission.can_read = this.currentCollection.can_read;
                    this.collectionPerRolePermission.can_write = this.currentCollection.can_write;
                }
            }
        }
    }

    selectApiRoot(event) {
        if (event?.target?.value) {
            const root = this.apiRoots.find((r) => r.apiRoot.title === event.target.value);

            if (root) {
                this.currentRootTitle = root.apiRoot.title;

                if (this.roleType === 0 || this.roleType === 1) {
                    this.currentCollectionTitle = null;
                }

                this.rootsToSave = [];
                this.rootsToSave.push(root.fragment);
            }
        }
    }

    onFocusOutGroup(event) {
        this.role = this.role.split(' ').join('-');
    }

    disableSave() {
        if (
            !this.role ||
            !this.currentRootTitle ||
            !this.currentCollectionTitle ||
            ((this.roleType === 0 || this.roleType === 1) && !this.roleDetail.can_read && !this.roleDetail.can_write)
        ) {
            return true;
        }
        return false;
    }
}
