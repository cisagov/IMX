import { Component, ElementRef, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StixService } from 'src/app/stix-service.service';

@Component({
    selector: 'app-visualizer-modal',
    templateUrl: './visualizer-modal.component.html',
    styleUrls: ['./visualizer-modal.component.css'],
    standalone: false,
})
export class VisualizerModalComponent {
    @Input() getStixPreview;

    constructor(
        public stixService: StixService,
        public activeModal: NgbActiveModal,
        private readonly element: ElementRef
    ) {}

    screenChange(enable: boolean) {
        console.info(this.element.nativeElement);
        let node = this.element.nativeElement;
        while (node && node.tagName !== 'NGB-MODAL-WINDOW') {
            console.info(node);
            node = node.parentElement;
        }

        console.info(node);

        if (enable) {
            node.classList.add('fullscreen-mode');
        } else {
            node.classList.remove('fullscreen-mode');
        }
    }
}
