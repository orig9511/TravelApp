import { Component } from "@angular/core";
import { Toast, ToastService } from "../../../services/toast.service";

@Component({
  selector: "app-toast",
  template: `
    <div
      class="toast-container position-fixed bottom-0 end-0 p-3"
      style="z-index: 9999"
    >
      <div
        *ngFor="let t of toastService.toasts$ | async; trackBy: trackById"
        class="toast show align-items-center border-0"
        [ngClass]="{
          'text-bg-success': t.type === 'success',
          'text-bg-danger': t.type === 'error',
          'text-bg-info': t.type === 'info',
          'text-bg-warning': t.type === 'warning',
        }"
        role="alert"
      >
        <div class="d-flex">
          <div class="toast-body">{{ t.message }}</div>
          <button
            type="button"
            class="btn-close btn-close-white me-2 m-auto"
            (click)="toastService.dismiss(t.id)"
          ></button>
        </div>
      </div>
    </div>
  `,
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  trackById(_: number, t: Toast): string {
    return t.id;
  }
}
