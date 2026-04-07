import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface UploadProgress {
  progress: number;
  downloadURL: string | null;
}

@Injectable({ providedIn: 'root' })
export class StorageService {

  /**
   * Upload a file via our server-side API.
   * Sends raw binary bytes — no base64, no JSON body-size limits.
   * Path is passed via the x-blob-path header.
   */
  uploadFile(path: string, file: File): Observable<UploadProgress> {
    return new Observable((observer) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          observer.next({ progress: pct, downloadURL: null });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText) as { url: string };
          observer.next({ progress: 100, downloadURL: result.url });
          observer.complete();
        } else {
          try {
            const err = JSON.parse(xhr.responseText) as { error: string };
            observer.error(new Error(err.error));
          } catch {
            observer.error(new Error(`Upload failed (${xhr.status})`));
          }
        }
      });

      xhr.addEventListener('error', () => observer.error(new Error('Network error during upload')));

      xhr.open('POST', `/api/blob/upload?path=${encodeURIComponent(path)}`);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  getProfileImagePath(uid: string, fileName: string): string {
    return `profiles/${uid}/${fileName}`;
  }

  getTripImagePath(tripId: string, fileName: string): string {
    return `trips/${tripId}/${fileName}`;
  }
}
