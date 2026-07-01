import { Component, OnInit } from '@angular/core';
import { AnnouncementService } from '../announcement-service/announcement-service.service';
import { AdminService } from '../admin-service/admin.service';
import { faAngleDown, faAngleUp, faList, faTrash, faExternalLinkAlt, faPlus, faRetweet } from '@fortawesome/free-solid-svg-icons';
import { EnvService } from '../env-service/env.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MessageDialogComponent } from '../dialogs/message-dialog/message-dialog.component';
import { StixService } from '../stix-service.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
    selector: 'app-admin-users-page',
    standalone: false,
    templateUrl: './admin-users-page.component.html',
    styleUrls: [
        './admin-users-page.component.css',
        '../dashboard/dashboard.component.css',
        '../admin-marking-group/admin-marking-group.component.css',
    ],
})
export class AdminUsersPageComponent implements OnInit {
    users: any[];
    unsortedUsers: any[];

    loading = false;

    faList = faList;
    faTrash = faTrash;
    faAngleDown = faAngleDown;
    faAngleUp = faAngleUp;
    faExternalLinkAlt = faExternalLinkAlt;
    faPlus = faPlus;
    faRecycle = faRetweet;

    sortKey = '';
    col = '';

    modalRef: NgbModalRef;

    constructor(
        private readonly httpClient: HttpClient,
        private announcementService: AnnouncementService,
        public readonly adminService: AdminService,
        private envService: EnvService,
        private modalService: NgbModal,
        private stixService: StixService
    ) {}

    ngOnInit(): void {
        this.refreshUsers();
    }

    refreshUsers() {
        this.loading = true;

        this.getUsers()
            .then((users) => {
                this.users = users;
                this.unsortedUsers = [...users];

                this.sort(this.col);

                this.loading = false;
            })
            .catch((err) => {
                this.announcementService.show(
                    `Error while retrieving users`,
                    `Error occurred while retrieving users. ${err.message ? err.message : JSON.stringify(err)}`,
                    'error',
                    false
                );
                this.users = [];
                this.loading = false;
            });
    }

    getUsers() {
        return new Promise<any[]>(async (resolve, reject) => {
            try {
                const users = await this.adminService.getAllUsers();

                resolve(users);
            } catch (e) {
                reject(e);
            }
        });
    }

    getRoles(user) {
        if (!user.roles || user.roles.length == 0) {
            return '';
        }

        let str = '';

        user.roles.forEach((role) => {
            if (str !== '') {
                str += '\n';
            }

            str += role.trim();
        });

        return str;
    }

    setSortKey(col) {
        this.col = col;

        if (!this.sortKey) {
            this.sortKey = `${col}-asc`;
        } else {
            //Same column
            if (this.sortKey.split('-')[0] == col) {
                const sortMethod = this.sortKey.split('-')[1];
                if (sortMethod == 'asc') {
                    this.sortKey = `${col}-des`;
                } else {
                    this.sortKey = '';
                    this.col = '';
                }
            }
            //Not same column
            else {
                this.sortKey = `${col}-asc`;
            }
        }

        this.sort(col);
    }

    sort(col) {
        if (this.users?.length === 0) {
            return;
        }

        if (!this.sortKey) this.unsort();
        else {
            if (this.sortKey.split('-')[1] == 'asc') {
                this.sortUsers(col);
            } else {
                this.sortUsers(col).reverse();
            }
        }
    }

    unsort() {
        this.sortKey = '';
        this.col = '';
        this.users = [...this.unsortedUsers];
    }

    sortUsers(key) {
        return this.users.sort((a, b) => a[key].toLowerCase().localeCompare(b[key].toLowerCase()));
    }

    openKeycloak(user) {
        const newTab = window.open(
            `${this.envService.env.keycloak.url}/admin/master/console/#/${this.envService.env.keycloak.realm}/users/${user.id}/settings`,
            '_blank'
        );
    }

    confirmRemove(user) {
        this.modalRef = this.modalService.open(MessageDialogComponent);

        this.modalRef.componentInstance.messageObj = {
            title: 'Remove User',
            message: 'Please confirm you would like to remove user: <strong>' + user.user + '</strong>.',
        };

        this.modalRef.result.then((resp) => {
            if (resp !== 'confirm') return;

            this.loading = true;
            const url = this.stixService.getBaseURLs().baseAdminURL + 'user/' + user.user;

            const httpHeaders = new HttpHeaders()
                .set('Accept', 'application/taxii+json;version=2.1')
                .set('Authorization', `Basic ${btoa(this.envService.env.adminServer.username + ':' + this.envService.env.adminServer.password)}`)
                .set('Content-Type', `application/taxii+json;version=2.1`);

            this.httpClient.delete<any>(url, { headers: httpHeaders, observe: 'response' }).subscribe({
                next: (resp: any) => {
                    setTimeout(() => {
                        this.refreshUsers();
                    }, 1000);
                },
                error: (err: any) => {
                    this.announcementService.show('Error', err.error.description ? err.error.description : JSON.stringify(err), 'error', false);
                    this.loading = false;
                },
            });
        });
    }
}
