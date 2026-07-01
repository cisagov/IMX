import { Component, OnInit, HostListener } from '@angular/core';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { StixService } from '../stix-service.service';
import { EnvService } from '../env-service/env.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    standalone: false,
})
export class HomeComponent implements OnInit {
    screenWidth: any;
    userRoles = [];
    editorLink = null;

    @HostListener('window:resize', ['$event'])
    onWindowResize() {
        this.screenWidth = window.innerWidth;
    }

    constructor(
        private keycloak: KeycloakService,
        public stixService: StixService,
        private envService: EnvService
    ) {}

    ngOnInit(): void {
        this.stixService.getUnreadAlerts();
        if (this.stixService.getGuided()) {
            this.editorLink = '/guided';
        } else {
            this.editorLink = '/bundle';
        }

        this.screenWidth = window.innerWidth;

        if (this.envService.env.keycloak === true) this.userRoles = this.keycloak.getUserRoles();
    }

    get isAdmin(): boolean {
        if (this.envService.env.keycloak === false) return true;

        if (this.userRoles.length === 0) return false;

        if (this.userRoles.includes(this.envService.env.taxiiServer.adminRoleName)) return true;

        return false;
    }
}
