import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-preview',
    standalone: false,
    templateUrl: './preview.component.html',
    styleUrl: './preview.component.css',
})
export class PreviewComponent {
    @Input() component;

    objectType: string;
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

    constructor(public dialogRef: NgbActiveModal) {}

    ngOnInit() {
        this.json = JSON.stringify(this.component, null, 2);
        this.objectType = this.component.type;

        setTimeout(() => {
            this.isLoading = false;
        }, 100);
    }

    getObjectType() {
        const arr = this.objectType.split('-');

        return arr.map((elem) => `${elem.charAt(0).toUpperCase() + elem.slice(1)}`).join(' ');
    }

    close() {
        this.dialogRef.close({ action: 'close' });
    }
}
