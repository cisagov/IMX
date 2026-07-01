import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {
    faArrowDown,
    faArrowsAlt,
    faChevronDown,
    faUser,
    faEye,
    faCode,
    faLink,
    faSearch,
    faFilter,
    faChess,
    faProjectDiagram,
    faBug,
    faExclamationTriangle,
    faQuestionCircle,
    faInfoCircle,
    faBolt,
    faFire,
    faMapMarkerAlt,
    faGlobe,
    faMapPin,
    faLocationArrow,
    faTools,
    faPlus,
    faPlusCircle,
    faClipboardList,
    faMinusCircle,
    faBan,
    faServer,
    faDatabase,
    faCheckCircle,
    faClipboardCheck,
    faCheck,
    faSwatchbook,
    faTags,
    faPaperPlane,
    faTrafficLight,
    faSave,
    faDownload,
    faFileUpload,
    faFolderOpen,
    faAngleDoubleRight,
    faCaretDown,
    faCaretUp,
    faLock,
    faUnlock,
    faHome,
    faUpload,
    faUndo,
} from '@fortawesome/free-solid-svg-icons';
import { StixService } from '../stix-service.service';
import { GuidedService } from '../guided.service';
@Component({
    selector: 'app-guided-menu',
    templateUrl: './guided-menu.component.html',
    styleUrls: ['./guided-menu.component.css'],
    standalone: false,
})
export class GuidedMenuComponent implements OnInit {
    @Input() updateMenuSelection: string;
    @Input() currentMenu;
    @Input() serverSelected: boolean;
    @Input() publishStatus;
    @Output() menuSelection: EventEmitter<any>;
    @Output() menuExpandedChange = new EventEmitter<boolean>();

    faArrowDown = faArrowDown;
    faArrowsAlt = faArrowsAlt;
    faCartArrowDown = faArrowDown;
    faChevronDown = faChevronDown;
    faUser = faUser;
    faEye = faEye;
    faCode = faCode;
    faLink = faLink;
    faSearch = faSearch;
    faFilter = faFilter;
    faChess = faChess;
    faProjectDiagram = faProjectDiagram;
    faBug = faBug;
    faExclamationTriangle = faExclamationTriangle;
    faQuestionCircle = faQuestionCircle;
    faInfoCircle = faInfoCircle;
    faBolt = faBolt;
    faFire = faFire;
    faMapMarkerAlt = faMapMarkerAlt;
    faGlobe = faGlobe;
    faMapPin = faMapPin;
    faLocationArrow = faLocationArrow;
    faTools = faTools;
    faPlus = faPlus;
    faPlusCircle = faPlusCircle;
    faClipboardList = faClipboardList;
    faMinusCircle = faMinusCircle;
    faBan = faBan;
    faServer = faServer;
    faDatabase = faDatabase;
    faCheckCircle = faCheckCircle;
    faClipboardCheck = faClipboardCheck;
    faSwatchbook = faSwatchbook;
    faTags = faTags;
    faPaperPlane = faPaperPlane;
    faTrafficLight = faTrafficLight;
    faSave = faSave;
    faDownload = faDownload;
    faFileUpload = faFileUpload;
    faFolderOpen = faFolderOpen;
    faRight = faAngleDoubleRight;
    faCheck = faCheck;
    faCaretDown = faCaretDown;
    faCaretUp = faCaretUp;
    faLock = faLock;
    faUnlock = faUnlock;
    faHome = faHome;
    faUpload = faUpload;
    faUndo = faUndo;

    pageNameEnum = {
        'indicator-type-1': 1,
        'indicator-type-2': 2,
        'indicator-type-3': 3,
        'additional-info-1': 4,
        'additional-info-2': 5,
        'additional-info-3': 6,
        'who-individual': 7,
        'where-location': 8,
        'how-event-detection': 9,
        'how-observable': 10,
        'how-pattern-builder': 11,
        'how-ttp': 12,
        'how-cwe': 13,
        'what-impact': 16,
        'report-assessment': 19,
        'relationship-1': 20,
        'relationship-2': 21,
        'object-addition': 22,
        'build-review': 23,
        'tlp-type': 24,
        'publish-type-1': 25,
        'publish-type-2': 26,
        'publish-review': 27,
        'publish-success': 28,
    };
    currentPageIndex = 0;
    currentPage: string;
    rootCollectionSelected = false;
    hasUnassignedObjMarkingRefObjects = false;

    isGuidedReport = false;
    expandGrSubmenu = false;
    furtherestVisitedGrPage = null;
    isEditting = false;

    isCollapsed = false;
    isPinnedOpen = true;
    isHovered = false;
    isExpanded = true;

    constructor(
        public stixService: StixService,
        public guidedService: GuidedService
    ) {
        this.menuSelection = new EventEmitter();
        this.currentPage = 'indicator-type-1';
    }

    ngOnInit(): void {
        this.menuSelection.emit(this.currentPage);

        if (this.updateMenuSelection) {
            this.currentPage = this.updateMenuSelection;
        }

        this.isGuidedReport = this.guidedService.isGuidedReport;

        this.stixService.getData().subscribe((data) => {
            if ((data.type === 'page-forward' || data.type === 'page-back') && data.menuSelection) {
                this.isEditting = false;
                this.currentPage = data.menuSelection;
                this.currentPageIndex = this.pageNameEnum[data.menuSelection];

                this.isGuidedReport = false;

                if (this.currentPageIndex >= this.pageNameEnum['who-individual'] && this.currentPageIndex <= this.pageNameEnum['report-assessment']) {
                    this.isGuidedReport = true;

                    if (!this.expandGrSubmenu) {
                        this.expandGrSubmenu = true;
                    }

                    if (!this.furtherestVisitedGrPage) {
                        this.furtherestVisitedGrPage = data.menuSelection;
                    } else {
                        if (this.furtherestVisitedGrPage === 'report-assessment') {
                            this.furtherestVisitedGrPage = 'who-individual';
                        } else if (this.pageNameEnum[this.furtherestVisitedGrPage] < this.pageNameEnum[data.menuSelection]) {
                            this.furtherestVisitedGrPage = data.menuSelection;
                        }
                    }
                }
            }

            if (data.type === 'edit-object' && data.menuSelection) {
                this.isEditting = true;
                this.currentPage = data.menuSelection;
                this.currentPageIndex = this.pageNameEnum[data.menuSelection];
                this.isGuidedReport = true;
                this.expandGrSubmenu = true;
            }

            if (data.type === 'update-object' || data.type === 'cancel-update') {
                this.currentPage = data.menuSelection;
                this.currentPageIndex = this.pageNameEnum[data.menuSelection];
                this.isGuidedReport = false;
                this.expandGrSubmenu = false;
                this.isEditting = false;
            }

            if (data.type === 'is-root-collection-selected') {
                this.rootCollectionSelected = data.value;
            }

            if (data.type === 'update-unassigned-obj-marking-ref-objects' && data.value) {
                this.hasUnassignedObjMarkingRefObjects = data.value.length > 0;
            }
        });
    }

    disableGrSubmenuItem(item) {
        return false;

        if (this.isEditting) {
            return this.pageNameEnum[item] > this.currentPageIndex || this.pageNameEnum[item] < this.currentPageIndex;
        } else {
            return this.pageNameEnum[item] > this.pageNameEnum[this.furtherestVisitedGrPage];
        }
    }

    onSelectMenu(event, changeCurrentPage = true) {
        if (changeCurrentPage) {
            this.currentPage = event;
            this.menuSelection.emit({ event: this.currentPage });
        } else {
            this.menuSelection.emit({ event: event, changeCurrentPage: false });
        }

        window.scrollTo(0, 0);
    }

    disableMenuItem(pageType) {
        return false;

        switch (pageType) {
            case 'indicator-type':
            case 'additional-info':
            case 'relationship':
            case 'object-addition':
            case 'build-review':
                if (this.currentPageIndex >= this.pageNameEnum['tlp-type']) {
                    return true;
                } else if (this.isEditting) {
                    return true;
                }
        }

        switch (pageType) {
            case 'additional-info':
                return (
                    this.currentPageIndex <= this.pageNameEnum['indicator-type-3'] || this.currentPageIndex >= this.pageNameEnum['additional-info-3']
                );
            case 'build-review':
            case 'publish-type':
                if (this.isEditting) return true;
                else return this.currentPageIndex <= this.pageNameEnum['additional-info-3'] && this.stixService.bundle?.objects?.length === 0;
            case 'publish-review':
                return (
                    !this.rootCollectionSelected ||
                    (this.currentPageIndex <= this.pageNameEnum['additional-info-3'] && this.stixService.bundle?.objects?.length === 0)
                );
            case 'publish-success':
                return this.currentPageIndex <= this.pageNameEnum['additional-info-3'];
            case 'tlp-type':
                if (this.isEditting) return true;
                else return !this.hasUnassignedObjMarkingRefObjects;
            default:
                return false;
        }
    }

    grSubMenuHandler() {
        this.expandGrSubmenu = !this.expandGrSubmenu;

        event.stopPropagation();
    }

    updateSideMenu() {
        const selectionEvent = {
            type: 'page-forward',
            menuSelection: 'who-individual',
        };
        this.stixService.sendData(selectionEvent);
    }

    toggleMenu() {
        this.isCollapsed = !this.isCollapsed;
    }

    onMouseEnter() {
        this.isHovered = true;
        this.updateExpandedState();
    }

    onMouseLeave() {
        setTimeout(() => {
            if (!this.isPinnedOpen) {
                this.isHovered = false;
                this.updateExpandedState();
            }
        }, 50);
    }

    togglePinMenu() {
        this.isPinnedOpen = !this.isPinnedOpen;
        this.updateExpandedState();
        console.info(this.isPinnedOpen);
        // event.stopPropagation();
    }

    toggleExpandMenu() {
        if (!this.isPinnedOpen) {
            this.isHovered = !this.isHovered;
            this.updateExpandedState();
        }
        event.stopPropagation();
    }

    updateExpandedState() {
        this.isExpanded = this.isPinnedOpen || this.isHovered;
        this.menuExpandedChange.emit(this.isPinnedOpen);
    }
    getTab(): 'home' | 'build' | 'review' | 'publish' {
        switch (this.currentMenu) {
            case 'build-review':
                return 'review';
            case 'tlp-type':
            case 'publish-type-1':
            case 'publish-type-2':
            case 'publish-review':
            case 'publish-success':
                return 'publish';
            case 'indicator-type-1':
                return 'home';
            default:
                return 'build';
        }
    }

    get isObjectInfoActive(): boolean {
        return (
            this.currentPage.includes('who-individual') ||
            this.currentPage.includes('how-') ||
            this.currentPage.includes('what-impact') ||
            this.currentPage.includes('where-location') ||
            this.currentPage.includes('report-assessment')
        );
    }

    getCartLength(page) {
        length = 0;

        for (const type in this.guidedService.cart[page]) {
            if (type == 'Observed Data') continue;

            length += this.guidedService.cart[page][type].length;
        }

        return length;
    }
}
