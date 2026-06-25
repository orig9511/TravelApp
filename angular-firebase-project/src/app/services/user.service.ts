import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { AppUserProfile, UserRole } from "../models/user.model";
import { ApiService } from "../core/api.service";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private api = inject(ApiService);

  getUsers(): Observable<AppUserProfile[]> {
    return this.api.get<AppUserProfile[]>("users");
  }

  updateUserRole(userId: string, role: UserRole): Observable<AppUserProfile> {
    return this.api.patch<AppUserProfile>(`users/${userId}/role`, { role });
  }
}
