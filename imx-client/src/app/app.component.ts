import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Event, NavigationEnd, Router } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { StixService } from './stix-service.service';
import { AnnouncementService } from './announcement-service/announcement-service.service';
import {
    faAngleDown,
    faAngleLeft,
    faCog,
    faBan,
    faPaperPlane,
    faExclamationTriangle,
    faDownload,
    faEdit,
    faSearch,
    faUser,
    faUserTie,
    faBell,
    faQuestionCircle,
    faEllipsisH,
    faCheckCircle,
    faTimesCircle,
    faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import changelog from './changelog.json';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { EnvService } from './env-service/env.service';
import release_notes from 'src/assets/IMX_release_Notes.json';
import { LoggingService } from './logging-service/logging.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigComponent } from './config/config.component';
import { AdminService } from './admin-service/admin.service';
import { OidcService } from './auth/oidc-service/oidc.service';

export interface MarkdownChangelog {
    version: string;
    date: string;
    sections: { title: string; items: string[] }[];
};

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false,
})
export class AppComponent implements OnInit {
    @ViewChild('toastMessage') spanElement: ElementRef;
    @ViewChild('config', { static: true }) configComponent: ConfigComponent;

    atHome: boolean;
    changelog = changelog;
    changelogkeys = Object.keys(changelog).sort();
    markdownChangelog: MarkdownChangelog[] = [];
    currentPage = '';
    currentUrl = '';
    editorType: string = null;
    environment = this.envService.env;

    faAngleDown = faAngleDown;
    faAngleLeft = faAngleLeft;
    faBan = faBan;
    faCog = faCog;
    faDownload = faDownload;
    faPaperPlane = faPaperPlane;
    faEdit = faEdit;
    faSearch = faSearch;
    faUser = faUser;
    faUserTie = faUserTie;
    faBell = faBell;
    faQuestionCircle = faQuestionCircle;
    faEllipsis = faEllipsisH;
    faCheckCircle = faCheckCircle;
    faTimesCircle = faTimesCircle;
    faExclamationTriangle = faExclamationTriangle;
    faInfoCircle = faInfoCircle;

    showHelp = false;

    initComplete: boolean = false;
    initError: boolean = false;

    isDropdownOpen = false;
    isJsonBodyExpanded = false;
    isGuided: boolean;
    siteTitle: String = this.envService.env.siteTitle;
    userRoles = [];
    release_notes = [];
    note_versions = [];
    current_version = {
        version: '',
        releaseDate: '',
        description: '',
        newFeatures: [],
        video: '',
        video_url: '',
    };
    assetsPath = 'assets';
    videoPath = '';
    isInitialGuided = false;
    support = {
        loading: false,
    };

    // Request Object - stores all attrs for the request
    supportRequest = {
        cachedObjects: null,
        currentBundle: null,
        customObjects: null,
        description: null,
        id: null,
        issueType: null,
        favorites: null,
        labels: null,
        savedBundles: null,
    };
    supportLoading = false;
    supportPage;
    supportLabel = ''; // Label for header in modal
    supportType = ''; // Type of support request this is

    fullScreenMode: boolean = false;

    hideHelp = false;
    showAdmin = false;

    get isAuthenticated(): boolean {
        return this.authService.isAuthenticated;
    }

    async isAdmin() {
        if (this.envService.env.keycloak.enabled === false && this.envService.env.oidc.enabled === false) return true;

        if (this.userRoles.length === 0) return false;

        if (this.envService.env.taxiiServer === undefined) {
            await this.envService.wait('taxiiServer');
        }

        if (this.userRoles.includes(this.envService.env.taxiiServer.adminRoleName)) return true;

        return false;
    }

    constructor(
        public announcementService: AnnouncementService,
        private authService: AuthService,
        private httpClient: HttpClient,
        public stixService: StixService,
        private router: Router,
        public modalService: NgbModal,
        private keycloak: KeycloakService,
        private loggingService: LoggingService,
        public envService: EnvService,
        private adminService: AdminService,
        private readonly oidc: OidcService
    ) {
        this.editorType = 'bundle';
    }

    async ngOnInit(): Promise<void> {
        if (!this.envService.init) {
            await this.envService.waitInit();
        }
        await this.envService.loadApiEnv();

        this.stixService.getData().subscribe((data) => {
            switch (data.type) {
                case 'hide-help':
                    this.hideHelp = true;
            }
        });

        if (!this.envService.apiError && this.envService.env.lastAccess !== '' && this.envService.env.lastAccess !== undefined) {
            //Only show if it hasn't been shown today
            const currentAccess = new Date();
            const lastAccess = new Date(this.envService.env.lastAccess);

            if (
                !(
                    currentAccess.getFullYear() === lastAccess.getFullYear() &&
                    currentAccess.getMonth() === lastAccess.getMonth() &&
                    currentAccess.getDate() === lastAccess.getDate()
                )
            ) {
                this.announcementService.show('IMX Last Access', `Last Access: ${this.envService.env.lastAccess}`, 'success', false);
            }
        }

        this.initComplete = true;

        if (this.envService.apiError === true) return;

        if (localStorage.getItem('isGuided') === null) {
            this.stixService.setGuided(this.envService.env.editorType === 'guided' ? true : false);
            this.isGuided = this.envService.env.editorType === 'guided' ? true : false;
            this.editorType = this.isGuided ? 'guided' : 'bundle';
        } else {
            this.isGuided = this.stixService.getGuided();
            this.editorType = this.isGuided ? 'guided' : 'bundle';
        }

        this.router.events.subscribe((event: Event) => {
            if (event instanceof NavigationEnd) {
                this.currentUrl = event.url;
                let urlArray = this.currentUrl.split('/');

                this.currentPage = '';
                if (urlArray[1]) this.currentPage = `${urlArray[1]}`;
                switch (this.currentPage) {
                    case 'bundle':
                    case 'add-component':
                    case 'custom-object':
                    case 'guided':
                        if (this.currentPage === 'bundle') {
                            this.changeEditor(false);
                            this.isGuided = false;
                        } else if (this.currentPage === 'guided') {
                            this.changeEditor(true);
                            this.isGuided = true;
                        }
                        this.currentPage = 'Bundle Editor';
                        break;
                    case 'query-stix':
                        this.currentPage = 'Search';
                        break;
                    case 'reporting':
                        this.currentPage = 'Analytics';
                        break;
                    case 'home':
                        this.currentPage = 'Home';
                        break;
                    case 'admin-main':
                        this.currentPage = 'Admin Main';
                        break;
                    case 'config':
                        this.currentPage = 'Config';
                        break;
                    case 'my-profile':
                        this.currentPage = 'Profile';
                        break;
                    default:
                        this.currentPage = '';
                }

                this.currentUrl === '/home' || this.currentUrl === '/' ? (this.atHome = true) : (this.atHome = false);
            }
        });

        if (this.envService.env.keycloak.enabled === true) this.userRoles = this.keycloak.getUserRoles();
        if (this.envService.env.oidc.enabled === true) this.userRoles = this.oidc.getRoles();

        this.showAdmin = await this.isAdmin();

        this.stixService.getData().subscribe((data) => {
            switch (data.type) {
                case 'full-screen':
                    this.fullScreenMode = data.value;
                    break;
            }
        });
        this.httpClient.get('assets/CHANGELOG.md', { responseType: 'text'}).subscribe(data => {this.markdownChangelog = this.parseMarkdown(data);} )
        await this.stixService.getAPIRoots();
        this.stixService.updateLatency(this.announcementService);
    }

    changeEditor(event) {
        if (event) {
            this.stixService.setGuided(true);
            this.editorType = 'guided';
            this.router.navigate(['/guided']);
        } else {
            this.stixService.setGuided(false);
            this.editorType = 'bundle';
            this.configComponent.initialize(true);
            this.router.navigate(['/bundle']);
        }

        window.scrollTo(0, 0);
    }

    isSupportSubmitDisabled(): boolean {
        return this.supportType === '' || !this.supportRequest.description || this.support.loading;
    }

    /**
     * Returns appropriate display name based on current TAXII Server url.
     */
    getServerDisplay(): string {
        let ret = '';

        switch (this.stixService.taxiiServerType) {
            case 'a1':
                ret = 'Default (Analyst1)';
                break;
            case 'raw':
                ret = 'Default (Ingest)';
                break;
            case 'default':
            case 'sandbox':
                ret = 'Default';
                break;
            case 'ais':
                ret = 'AIS';
                break;
            case 'custom':
                ret = 'Custom';
                break;
            default:
                return 'Error';
        }

        if (this.stixService.apiRootProcessingError != '') {
            ret = ret + ' - CONNECTION ERROR';
        }

        if (ret.endsWith('CONNECTION ERROR') && this.stixService.showConnectionError) {
            this.announcementService.show('TAXII Server Error', 'IMX has failed to connect to TAXII Server: ' + ret.split('-')[0], 'error', false);
            this.stixService.showConnectionError = false;
        }

        return ret;
    }

    logout(): void {
        localStorage.clear();
        this.stixService.db.clear();

        if (this.envService.env.keycloak.enabled) this.keycloak.logout();
        if (this.envService.env.oidc.enabled) this.oidc.logout();
    }

    resetPassword(): void {
        this.keycloak.resetPassword();
    }

    redirectToAlerts() {
        if (this.router.url !== '/my-profile') {
            this.router.navigateByUrl('/my-profile', { state: { activeTab: 'alerts' } });
        } else {
            this.router.navigateByUrl('/my-profile', { state: { activeTab: 'alerts' } });
        }
    }

    openLargeSubModal(modal) {
        this.modalService.open(modal, { size: 'xl' });
    }

    openSupportModal(modal, type: string) {
        this.supportRequest = {
            cachedObjects: null,
            currentBundle: null,
            customObjects: null,
            description:
                type == 'Submit an Issue'
                    ? 'Please provide details to our team of the problem you are having.'
                    : 'Please provide details to our team of the feature you would like to see added to IMX.',
            id: null,
            issueType: null,
            favorites: null,
            labels: null,
            savedBundles: null,
        };
        this.support.loading = false;
        console.debug(`Support Type Selected: ${type}`);
        this.supportLabel = type;
        this.supportType = type;
        this.modalService.open(modal, { size: 'xl' });
    }

    submitSupportRequest() {
        this.support.loading = true;
        let url = `${this.envService.env.imxServer.url}${this.envService.env.support.path}${this.supportType}/`;
        switch (this.envService.env.environment) {
            case 'local': {
                url += 'local';
                break;
            }
            case 'dev':
            case 'ten-dev': {
                url += 'dev';
                break;
            }
            case 'beta': {
                url += 'beta';
                break;
            }
            case 'guided': {
                url += 'guided';
                break;
            }
            case 'staging': {
                url += 'staging';
                break;
            }
            case 'prod': {
                url += 'prod';
                break;
            }
            default: {
                console.warn(`IMX Server ERROR - Cannot match environment to logging profile: ${this.envService.env.environment}`);
            }
        }

        let postHeaders = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                Authorization: `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`,
            }),
        };

        if (this.supportType == 'Issue') {
            // Grab Cached Objects
            const cachedObjects = this.stixService.bundle;

            // Grab Current Bundle
            const currentBundle = JSON.stringify(this.stixService.bundle);

            // Grab Saved Bundles
            const savedBundles = this.stixService.savedBundles;

            // Grab Favorites
            const favorites = localStorage.getItem('favorite-attributes');

            // Grab Custom Objects
            const customObjects = this.stixService.getCustomObjects();

            this.supportRequest.cachedObjects = cachedObjects ? cachedObjects : '';
            this.supportRequest.currentBundle = currentBundle ? currentBundle : '';
            this.supportRequest.customObjects = customObjects ? customObjects : '';
            this.supportRequest.favorites = favorites ? favorites : '';
            this.supportRequest.id = this.envService.env.support.projectId;
            this.supportRequest.issueType = 'BUG';
            this.supportRequest.labels = this.envService.env.support.bugLabel;

            this.supportRequest.savedBundles = savedBundles ? savedBundles : '';

            console.debug(this.supportRequest);

            console.debug(url);

            this.httpClient
                .post(url, JSON.stringify(this.supportRequest), postHeaders)
                .toPromise()
                .then((result) => {
                    console.debug(result);
                    if (!result.hasOwnProperty('iid'))
                        this.announcementService.show(
                            'Failed to Send Support Request',
                            'Unable to send request. Please check you connection and try again.',
                            'error',
                            false
                        );
                    else
                        this.announcementService.show(
                            'Support Request Sent',
                            `Thank you for your feedback. The DFTA team will look into your request. Check your ticket status out!`,
                            'success',
                            false,
                            null,
                            result['web_url'] ? true : false,
                            result['web_url'] ? result['web_url'] : ''
                        );

                    this.modalService.dismissAll();
                })
                .catch((err) => {
                    console.error('There was an error submitting your request');
                    console.error(err);
                    this.announcementService.show(
                        'Failed to Send Support Request',
                        'Unable to send request. Please check you connection and try again.',
                        'error',
                        false
                    );
                    this.modalService.dismissAll();
                });
        } else if (this.supportType === 'Feature') {
            let featureRequest = {
                description: `User sent request from path: ${this.currentUrl}. ${this.supportRequest.description}`,
                page: this.currentUrl,
                id: this.envService.env.support.projectId,
                issueType: this.supportType.toUpperCase(),
                labels: this.envService.env.support.featureLabel,
            };
            console.debug(this.supportRequest);
            console.debug(url);

            this.httpClient
                .post(url, JSON.stringify(featureRequest), postHeaders)
                .toPromise()
                .then((result) => {
                    console.debug(result);
                    if (!result.hasOwnProperty('iid'))
                        this.announcementService.show(
                            'Failed to Send Support Request',
                            'Unable to send request. Please check you connection and try again.',
                            'error',
                            false
                        );
                    else
                        this.announcementService.show(
                            'Support Request Sent',
                            `Thank you for your feedback. The DFTA team will look into your request. Check your ticket status out!`,
                            'success',
                            false,
                            null,
                            result['web_url'] ? true : false,
                            result['web_url'] ? result['web_url'] : ''
                        );

                    this.modalService.dismissAll();
                })
                .catch((err) => {
                    console.error('There was an error submitting your request');
                    console.error(err);
                    this.announcementService.show(
                        'Failed to Send Support Request',
                        'Unable to send request. Please check you connection and try again.',
                        'error',
                        false
                    );
                    this.modalService.dismissAll();
                })
                .finally(() => {
                    this.supportLabel = '';
                    this.supportType = '';
                    this.support.loading = false;
                });
        } else console.error(`Support type not recognized: ${this.supportType}`);
    }

    selectAll(event: KeyboardEvent): void {
        if ((event.key === 'a' && event.metaKey) || (event.key === 'a' && event.ctrlKey)) {
            const span = this.spanElement.nativeElement;
            const range = document.createRange();
            range.selectNodeContents(span);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            event.preventDefault();
        }
    }

    versionChanged(version) {
        for (let release of this.release_notes) {
            if (release.version === version) {
                this.current_version = release;
                this.videoPath = `./assets/${release.video}`;
                break;
            }
        }
    }

    parseMarkdown(data: string): MarkdownChangelog[] {
        let result: MarkdownChangelog[] = [];
        let versionBlocks = data.split(/^## /gm).slice(1);

        for(let block of versionBlocks) {
            let lines = block.split('\n').map(line => line.trim()).filter(line => line.length > 0);

            let header = lines[0];
            let headerMatch = header.match(/\[(.*?)\].*\((.*?)\)/);
            if(!headerMatch) continue;

            let version = headerMatch[1];
            let date = headerMatch[2];
            let sections: { title: string; items: string[] }[] = [];
            let currentSection: { title: string; items: string[] } | null = null;

            for (const line of lines.slice(1)) {
                let sectionMatch = line.match(/^### (.*)/);
                if(sectionMatch) {
                    if(currentSection) sections.push(currentSection);
                    currentSection = {
                        title: sectionMatch[1],
                        items: []
                    }
                    continue;
                }

                let bulletMatch = line.match(/^\* (.*)/);
                if(bulletMatch && currentSection) {
                    let text = bulletMatch[1];
                    text = text.replace(/\s*\(.*$/, '').trim();
                    currentSection.items.push(text);
                }
            }
            if(currentSection){
                sections.push(currentSection);
            }
            result.push({
                version,
                date,
                sections
            });
        }
        return result;
    }
}
