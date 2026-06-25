import { Injectable } from "@angular/core";
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

interface ApiWrapper<T> {
  success: boolean;
  data: T;
  timestamp?: string;
}

@Injectable()
export class ApiResponseInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      map((event) => {
        if (event instanceof HttpResponse && event.body?.data !== undefined) {
          return event.clone({
            body: (event.body as ApiWrapper<unknown>).data,
          });
        }
        return event;
      }),
    );
  }
}
