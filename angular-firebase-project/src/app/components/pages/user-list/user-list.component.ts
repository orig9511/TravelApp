import { AppUserProfile, UserRole } from "./../../../models/user.model";
import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { UserService } from "../../../services/user.service";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-user-list",
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: "./user-list.component.html",
  styleUrl: "./user-list.component.scss",
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);

  users: AppUserProfile[] = [];
  loading = true;
  errorMessage = "";
  successMessage = "";

  roles: UserRole[] = ["admin", "advertiser", "customer"];

  ngOnInit(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = "Nem sikerült betölteni a felhasználókat.";
        this.loading = false;
      },
    });
  }

  async updateRole(user: AppUserProfile, newRole: string): Promise<void> {
    if (!user.id) return;

    this.errorMessage = "";
    this.successMessage = "";

    try {
      await firstValueFrom(
        this.userService.updateUserRole(user.id, newRole as UserRole),
      );
      user.role = newRole as UserRole;
      this.successMessage = `${user.email} jogosultsága frissítve lett.`;
    } catch (error) {
      console.error(error);
      this.errorMessage = "Hiba történt a szerepkör mentésekor.";
    }
  }

  trackByUserId(index: number, user: AppUserProfile): string {
    return user.id ?? index.toString();
  }
}
