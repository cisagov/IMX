import { Component } from '@angular/core';
import { EnvService } from '../env-service/env.service';

@Component({
    selector: 'app-taxii-settings',
    templateUrl: './taxii-settings.component.html',
    styleUrl: './taxii-settings.component.css',
    standalone: false,
})
export class TaxiiSettingsComponent {
    active: string = 'disabled-taxii';
    env: any = '';

    constructor(private readonly envService: EnvService) {
        this.env = this.envService.env;
    }
}
