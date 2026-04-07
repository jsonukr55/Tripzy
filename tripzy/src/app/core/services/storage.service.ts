import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Observable } from 'rxjs';

export interface UploadProgress {
  progress: number;
  downloadURL: string | null;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private storage = inject(Storage);

  uploadFile(path: string, file: File): Observable<UploadProgress> {
    return new Observable((observer) => {
      const storageRef = ref(this.storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          observer.next({ progress, downloadURL: null });
        },
        (error) => observer.error(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          observer.next({ progress: 100, downloadURL });
          observer.complete();
        },
      );
    });
  }

  getProfileImagePath(uid: string, fileName: string): string {
    return `profiles/${uid}/${fileName}`;
  }

  getTripImagePath(tripId: string, fileName: string): string {
    return `trips/${tripId}/${fileName}`;
  }
}
