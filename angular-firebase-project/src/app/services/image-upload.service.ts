import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, from } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class ImageUploadService {
  private readonly uploadUrl = `${environment.apiUrl}/upload/image`;

  constructor(private http: HttpClient) {}

  uploadImage(file: File, folder = "offers"): Observable<string> {
    return from(this.compressImage(file)).pipe(
      switchMap((compressed) => {
        const formData = new FormData();
        formData.append("file", compressed);

        const token = localStorage.getItem("access_token");
        const headers = token
          ? new HttpHeaders({ Authorization: `Bearer ${token}` })
          : undefined;

        return this.http
          .post<{ url: string }>(
            `${this.uploadUrl}?folder=${folder}`,
            formData,
            { headers },
          )
          .pipe(map((res) => res.url));
      }),
    );
  }

  private async compressImage(
    file: File,
    maxDimension = 1600,
    quality = 0.78,
  ): Promise<File> {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    let targetWidth = width;
    let targetHeight = height;

    if (width > maxDimension || height > maxDimension) {
      if (width >= height) {
        targetWidth = maxDimension;
        targetHeight = Math.round((height * maxDimension) / width);
      } else {
        targetHeight = maxDimension;
        targetWidth = Math.round((width * maxDimension) / height);
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    return new Promise<File>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image compression failed"));
            return;
          }
          const name = file.name.replace(/\.[^.]+$/, ".webp");
          resolve(new File([blob], name, { type: "image/webp" }));
        },
        "image/webp",
        quality,
      );
    });
  }
}
