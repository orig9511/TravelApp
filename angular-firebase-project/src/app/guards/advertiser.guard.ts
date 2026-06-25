import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { map, take } from "rxjs/operators";
import { UserProfileService } from "../services/user-profile.service";

export const advertiserGuard: CanActivateFn = () => {
  const router = inject(Router);
  const userProfileService = inject(UserProfileService);

  return userProfileService.currentUserProfile$.pipe(
    take(1),
    map((userProfile) => {
      if (userProfile?.role === "advertiser" || userProfile?.role === "admin") {
        return true;
      }

      return router.createUrlTree(["/"]);
    }),
  );
};
