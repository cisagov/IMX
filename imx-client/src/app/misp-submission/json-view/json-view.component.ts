import { Component, DOCUMENT, Inject, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-json-view',
    templateUrl: './json-view.component.html',
    styleUrls: ['./json-view.component.css', '../../dashboard/dashboard.component.css', '../../app.component.css'],
    standalone: false,
})
export class JsonViewComponent implements OnInit {
    @Input() misp;
    @Input() stix;
    @Input() docName;

    editorOptions = {
        theme: 'vs',
        language: 'json',
        minimap: {
            enabled: false,
        },
        readOnly: true,
        overviewRulerLanes: 0,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
    };
    json: string;
    isLoading = true;

    view: 'misp' | 'stix' = 'misp';

    constructor(
        public dialogRef: NgbActiveModal,
        @Inject(DOCUMENT) private readonly document: any
    ) {}

    ngOnInit() {
        this.json = JSON.stringify(JSON.parse(this.misp), null, 2);
        setTimeout(() => {
            this.isLoading = false;
        }, 100);
    }

    changeView(view) {
        this.view = view;
    }

    download() {
        event.stopPropagation();

        const a = this.document.createElement('a');

        const file = new Blob([this.view == 'misp' ? this.misp : this.stix], { type: 'application/json' });
        a.href = URL.createObjectURL(file);

        a.download = `${this.docName}${this.view == 'misp' ? '_misp' : '_stix'}.json`;

        setTimeout(() => {
            a.click();
        }, 400);
    }

    close() {
        this.dialogRef.close();
    }
}
