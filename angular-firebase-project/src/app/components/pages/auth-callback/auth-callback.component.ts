import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "../../../services/auth.service";

@Component({
  standalone: true,
  selector: "app-auth-callback",
  imports: [CommonModule],
  template: `
    <div class="container py-5 text-center">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-3 text-muted">Bejelentkezés folyamatban...</p>
    </div>
  `,
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get("token");
    if (token) {
      this.authService.handleGoogleCallback(token).subscribe({
        next: () => this.router.navigateByUrl("/"),
        error: () => this.router.navigateByUrl("/login"),
      });
    } else {
      this.router.navigateByUrl("/login");
    }
  }
}
