import { Component } from "@angular/core";
import {
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../../services/auth.service";

@Component({
  selector: "app-registration",
  templateUrl: "./registration.component.html",
  styleUrls: ["./registration.component.scss"],
})
export class RegistrationComponent {
  registrationError: string | null = null;
  isLoading = false;
  showSuccessModal = false;
  private navigationTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  registrationForm = this.fb.group(
    {
      lastName: ["", Validators.required],
      firstName: ["", Validators.required],
      birthDate: ["", Validators.required],
      username: ["", [Validators.required, Validators.minLength(3)]],
      email: ["", [Validators.required, Validators.email]],
      password: [
        "",
        [
          Validators.required,
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
        ],
      ],
      confirmPassword: ["", Validators.required],
    },
    { validators: this.passwordMatchValidator },
  );

  // ===== GETTERS a template-hez =====

  get lastName() {
    return this.registrationForm.get("lastName");
  }

  get firstName() {
    return this.registrationForm.get("firstName");
  }

  get birthDate() {
    return this.registrationForm.get("birthDate");
  }

  get username() {
    return this.registrationForm.get("username");
  }

  get email() {
    return this.registrationForm.get("email");
  }

  get password() {
    return this.registrationForm.get("password");
  }

  get confirmPassword() {
    return this.registrationForm.get("confirmPassword");
  }

  // ===== JELSZÓ ELLENŐRZÉS =====

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get("password")?.value;
    const confirmPassword = control.get("confirmPassword")?.value;

    if (!password || !confirmPassword) return null;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // ===== REGISZTRÁCIÓ =====

  async register() {
    this.registrationError = null;

    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    const {
      lastName,
      firstName,
      birthDate,
      username,
      email,
      password,
      confirmPassword,
    } = this.registrationForm.value;

    if (password !== confirmPassword) {
      this.registrationError = "A jelszavak nem egyeznek meg";
      return;
    }

    this.isLoading = true;

    this.authService
      .registerUser({
        firstName: firstName!,
        lastName: lastName!,
        dateOfBirth: birthDate!,
        username: username!,
        email: email!,
        password: password!,
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.showSuccessModal = true;

          if (this.navigationTimer) {
            clearTimeout(this.navigationTimer);
          }

          // Keep UX snappy: modal appears immediately, auto-redirect after a short delay.
          this.navigationTimer = setTimeout(() => {
            this.closeSuccessModal();
          }, 1800);
        },
        error: (err: any) => {
          const status = err?.status;
          if (status === 409) {
            this.registrationError =
              "Ez az email cím vagy felhasználónév már foglalt";
          } else if (status === 422) {
            this.registrationError = "Érvénytelen adatok";
          } else {
            this.registrationError = "Sikertelen regisztráció";
          }
          this.isLoading = false;
        },
      });
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    if (this.navigationTimer) {
      clearTimeout(this.navigationTimer);
      this.navigationTimer = null;
    }
    this.router.navigateByUrl("/");
  }
}
