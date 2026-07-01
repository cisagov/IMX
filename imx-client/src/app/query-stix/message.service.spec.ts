import { TestBed } from '@angular/core/testing';

import { MessageService } from './message.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

describe('MessageService', () => {
    let service: MessageService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule, FontAwesomeModule, ReactiveFormsModule],
        });
        service = TestBed.inject(MessageService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
