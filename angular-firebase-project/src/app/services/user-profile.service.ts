import { Injectable, inject } from "@angular/core";
import { AuthService } from "./auth.service";
import { Observable } from "rxjs";
import { AppUserProfile } from "../models/user.model";

@Injectable({
  providedIn: "root",
})
export class UserProfileService {
  private authService = inject(AuthService);

  currentUserProfile$: Observable<AppUserProfile | null> =
    this.authService.currentUser$;
}
