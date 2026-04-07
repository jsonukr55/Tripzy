import { Pipe, PipeTransform } from '@angular/core';

/** Converts Firestore Timestamp or Date to JS Date */
@Pipe({ name: 'firestoreDate', standalone: true })
export class FirestoreDatePipe implements PipeTransform {
  transform(value: Date | { seconds: number } | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    return new Date((value as any).seconds * 1000);
  }
}
