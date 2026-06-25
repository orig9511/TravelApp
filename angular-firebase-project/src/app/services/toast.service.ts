import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: "root" })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  show(type: ToastType, message: string, durationMs = 4000): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toast: Toast = { id, type, message };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(message: string): void {
    this.show("success", message);
  }

  error(message: string): void {
    this.show("error", message, 6000);
  }

  info(message: string): void {
    this.show("info", message);
  }

  warning(message: string): void {
    this.show("warning", message);
  }

  dismiss(id: string): void {
    this.toastsSubject.next(
      this.toastsSubject.value.filter((t) => t.id !== id),
    );
  }
}
