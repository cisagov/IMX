import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { NavbarService } from './navbar.service';

@Component({
    selector: 'sd-navbar',
    templateUrl: 'navbar.component.html',
})
export class NavbarComponent {
    siteTitle: String = environment.siteTitle;

    constructor(public nav: NavbarService) {}
}
