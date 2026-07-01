import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../auth.service';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    standalone: false,
})
export class LoginComponent {
    faUser = faUser;
    faLock = faLock;

    isLoading: boolean = false;
    email_address: string = '';
    password: string = '';
    newPassword: string = '';
    newConfirmPassword: string = '';
    errorMessage = '';
    isErrorClosed = true;
    isNewUser: boolean = false;

    @ViewChild('loginErrorAlert', { static: false }) loginErrorAlert: NgbAlert | undefined;

    constructor(
        private readonly authService: AuthService,
        private readonly router: Router
    ) {}

    onSignIn(form: NgForm) {
        let { formIsValid } = this.validForm(form);
        this.isLoading = true;
        this.isErrorClosed = true;

        if (formIsValid) {
            const authenticationStatus = !this.isNewUser
                ? this.authService.login(this.email_address, this.password)
                : this.authService.handleNewPassword(this.newPassword);
        } else {
            console.error('Form not valid', form);
            this.isErrorClosed = false;
            this.errorMessage = 'Invalid username or password';
            this.isLoading = false;
        }
    }

    validForm(form: NgForm): { formIsValid: boolean; formInvalidReason: string } {
        let formIsValid = form.valid;
        let formInvalidReason = 'Please provide a properly formatted email';

        if (this.password.length < 8) {
            formIsValid = false;
            formInvalidReason = 'Password must be at least 8 characters';
        }

        if (this.isNewUser) {
            if (this.newPassword.length < 8) {
                formIsValid = false;
                formInvalidReason = 'New password must be at least 8 characters';
            } else if (this.newPassword !== this.newConfirmPassword) {
                formIsValid = false;
                formInvalidReason = 'Password and Confirm Password does not match';
            }
        }

        return { formIsValid: formIsValid, formInvalidReason: formInvalidReason };
    }
}
