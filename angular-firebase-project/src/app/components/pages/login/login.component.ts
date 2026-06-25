import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../../../services/auth.service";
import { Subscription } from "rxjs";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  standalone: true,
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
})
export class LoginComponent implements OnInit, OnDestroy {
  private sub?: Subscription;

  loginForm!: FormGroup;
  loginError: string | null = null;
  isLoading = false;
  isGoogleLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get emailCtrl() {
    return this.loginForm.get("email");
  }

  get passwordCtrl() {
    return this.loginForm.get("password");
  }

  async login() {
    this.loginError = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const { email, password } = this.loginForm.value;

    this.sub = this.authService.loginWithEmail(email!, password!).subscribe({
      next: () => {
        this.router.navigateByUrl("/");
      },
      error: (err: any) => {
        const status = err?.status;
        if (status === 401) {
          this.loginError = "Hibás felhasználónév vagy jelszó.";
        } else if (status === 404) {
          this.loginError = "A felhasználó nem található.";
        } else {
          this.loginError = "Sikertelen bejelentkezés.";
        }
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  loginWithGoogle() {
    this.isGoogleLoading = true;
    this.authService.loginWithGoogle();
  }
}
