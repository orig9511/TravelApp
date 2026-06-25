import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "../../../services/auth.service";
import { environment } from "../../../../environments/environment";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: "./profile.component.html",
  styleUrl: "./profile.component.scss",
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  isEditMode = false;
  isSaving = false;
  errorMessage = "";
  successMessage = "";

  profileForm = this.fb.group({
    first_name: ["", [Validators.required]],
    last_name: ["", [Validators.required]],
    username: ["", [Validators.required]],
    email: [{ value: "", disabled: true }],
    date_of_birth: [""],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    const user = this.authService.currentUser;
    if (!user) {
      this.errorMessage = "Nincs bejelentkezett felhasználó.";
      return;
    }

    this.profileForm.patchValue({
      first_name: user.firstName ?? "",
      last_name: user.lastName ?? "",
      username: user.username ?? "",
      email: user.email ?? "",
      date_of_birth: user.dateOfBirth
        ? String(user.dateOfBirth).substring(0, 10)
        : "",
    });
  }

  enableEdit(): void {
    this.isEditMode = true;
    this.successMessage = "";
    this.errorMessage = "";
    this.profileForm.get("first_name")?.enable();
    this.profileForm.get("last_name")?.enable();
    this.profileForm.get("username")?.enable();
    this.profileForm.get("date_of_birth")?.enable();
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.errorMessage = "";
    this.successMessage = "";
    this.loadProfile();
  }

  async saveProfile(): Promise<void> {
    this.errorMessage = "";
    this.successMessage = "";

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const user = this.authService.currentUser;
    if (!user) {
      this.errorMessage = "Nincs bejelentkezett felhasználó.";
      return;
    }

    this.isSaving = true;

    try {
      const formValue = this.profileForm.value;

      const updatedUser = await this.http
        .patch<any>(`${environment.apiUrl}/users/${user.id}`, {
          firstName: formValue.first_name ?? "",
          lastName: formValue.last_name ?? "",
          username: formValue.username ?? "",
          dateOfBirth: formValue.date_of_birth || null,
        })
        .toPromise();

      this.isEditMode = false;
      this.successMessage = "Profil sikeresen mentve.";
    } catch (error) {
      console.error(error);
      this.errorMessage = "Hiba történt mentés közben.";
    } finally {
      this.isSaving = false;
    }
  }
}
