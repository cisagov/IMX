import { Component, Input } from '@angular/core';
import { StixService } from 'src/app/stix-service.service';
import { faBan, faFileImport, faPlus, faArrowLeft, faArrowRight, faTrash } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuid } from 'uuid';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ExternalReference } from 'src/app/models/external-reference';
import { GranularMarking } from 'src/app/models/granular-marking';
import { Extension } from 'src/app/models/extension';
import { LANGUAGES } from 'src/app/models/languages';
import { EnvService } from 'src/app/env-service/env.service';

interface Note {
    type?: string;
    id?: string;
    spec_version?: string;
    created?: string;
    modified?: string;
    created_by_ref?: string;
    revoked?: boolean;
    labels?: string[];
    confidence?: number;
    lang?: string;
    external_references?: ExternalReference[];
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];
    abstract?: string;
    content?: string;
    authors?: string[];
    object_refs?: string[];
}

@Component({
    selector: 'app-note-dialog-component',
    templateUrl: './note-dialog-component.component.html',
    styleUrl: './note-dialog-component.component.css',
    standalone: false,
})
export class NoteDialogComponent {
    @Input() type: string;
    @Input() notes: Map<string, any>;
    @Input() new_notes: Map<string, any>;
    @Input() deletable_notes: Set<string>;
    @Input() objectId: string;

    faBan = faBan;
    faAddToBundle = faFileImport;
    faPlus = faPlus;
    faArrowLeft = faArrowLeft;
    faArrowRight = faArrowRight;
    faTrash = faTrash;

    pageNum = 1;
    valid = false;

    selectedNote: string = '';
    lang_options: any[] = LANGUAGES;
    ids: any[] = [{ id: this.envService.env.defaultIdentity.id, name: this.envService.env.defaultIdentity.name }];
    authors: string;
    object_refs: string;
    object_ref_list: string[];

    errors: Record<keyof Note, string> = {
        type: '',
        id: '',
        spec_version: '',
        created: '',
        modified: '',
        created_by_ref: '',
        revoked: '',
        labels: '',
        confidence: '',
        lang: '',
        external_references: '',
        object_marking_refs: '',
        granular_markings: '',
        extensions: '',
        abstract: '',
        content: '',
        authors: '',
        object_refs: '',
    };

    note: Note = {};

    constructor(
        public activeModal: NgbActiveModal,
        public stixService: StixService,
        private readonly envService: EnvService
    ) {}

    ngOnInit() {
        this.object_ref_list = this.stixService.bundle.objects.map((elem) => elem.id);
        if (this.notes.size === 0 && this.new_notes.size === 0) {
            this.createNewNote();
        }
    }

    shortenContent(content: string) {
        if (content.length > 20) return content.slice(0, 20) + '...';
        else return content;
    }

    selectNote(id: string) {
        this.selectedNote = id;
    }

    createNewNote() {
        let date = new Date().toISOString();
        this.note.type = 'note';
        this.note.id = `note--${uuid()}`;
        this.note.spec_version = '2.1';
        this.note.created = date;
        this.note.modified = date;
        this.note.object_refs = [this.objectId];
        this.errors.content = 'Content must be filled';
        this.pageNum = 2;
    }

    goPrevious() {
        this.note = {};
        this.selectedNote = '';
        this.errors = {
            type: '',
            id: '',
            spec_version: '',
            created: '',
            modified: '',
            created_by_ref: '',
            revoked: '',
            labels: '',
            confidence: '',
            lang: '',
            external_references: '',
            object_marking_refs: '',
            granular_markings: '',
            extensions: '',
            abstract: '',
            content: '',
            authors: '',
            object_refs: '',
        };
        this.pageNum = 1;
    }

    goNext() {
        if (this.notes.has(this.selectedNote)) {
            this.note = JSON.parse(JSON.stringify(this.notes.get(this.selectedNote)));
        } else if (this.new_notes.has(this.selectedNote)) {
            this.note = JSON.parse(JSON.stringify(this.new_notes.get(this.selectedNote)));
        }
        if (!this.note.object_refs) this.note.object_refs = [];

        if (!this.note.object_refs.includes(this.objectId) && this.objectId) this.note.object_refs.push(this.objectId);

        this.pageNum = 2;
    }

    addString(prop: 'authors' | 'object_refs') {
        if (!this[prop]) return;

        if (!this.note[prop]) this.note[prop] = [];

        if (!this.note[prop].includes(this[prop])) this.note[prop].push(this[prop]);

        this[prop] = '';
    }

    deleteString(prop: 'authors' | 'object_refs', str: string) {
        this.note[prop] = this.note[prop].filter((elem) => elem !== str);

        if (this.note[prop].length === 0) delete this.note[prop];
    }

    addNote() {
        for (const key in this.note) {
            if (
                this.note[key] === undefined ||
                this.note[key] == '' ||
                (Array.isArray(this.note[key]) && this.note[key].length === 0) ||
                JSON.stringify(this.note[key]) == '{}'
            )
                delete this.note[key];
        }

        if (this.notes.has(this.note.id)) {
            this.notes.delete(this.note.id);
        } else {
            this.deletable_notes.add(this.note.id);
        }

        this.new_notes.set(this.note.id, this.note);
        this.close();
    }

    deleteNote(id) {
        this.new_notes.delete(id);
        this.deletable_notes.delete(id);
    }

    isValid() {
        let valid = true;

        if (!this.note.content) {
            this.errors.content = 'Content must be filled';
            valid = false;
        } else {
            this.errors.content = '';
        }

        if (this.note.confidence < 0 || this.note.confidence > 100) {
            this.errors.confidence = 'Confidence must be between 0 and 100';
            valid = false;
        } else {
            this.errors.confidence = '';
        }

        this.valid = valid;
    }

    close() {
        this.activeModal.close();
    }
}
