import { Injectable, inject, Injector, runInInjectionContext, NgZone } from '@angular/core';
import {
  Firestore,
  Timestamp,
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  increment,
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Chat, Message } from '../models/chat.model';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

function normalizeChat(data: Record<string, unknown>, id: string): Chat {
  return {
    ...data,
    id,
    lastMessageAt: toDate(data['lastMessageAt']),
    createdAt:     toDate(data['createdAt']),
  } as Chat;
}

function normalizeMessage(data: Record<string, unknown>, id: string): Message {
  return {
    ...data,
    id,
    createdAt: toDate(data['createdAt']),
  } as Message;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private firestore = inject(Firestore);
  private injector  = inject(Injector);
  private zone      = inject(NgZone);

  private chatsCol() { return collection(this.firestore, 'chats'); }
  private messagesCol(chatId: string) {
    return collection(this.firestore, `chats/${chatId}/messages`);
  }

  private run<T>(fn: () => Promise<T>): Observable<T> {
    return from(runInInjectionContext(this.injector, fn));
  }

  // ── Chats ─────────────────────────────────────────────────────────────────

  /** Get or create a group chat for a trip */
  getOrCreateTripChat(
    tripId: string,
    tripTitle: string,
    currentUid: string,
    currentName: string,
  ): Observable<string> {
    return this.run(async () => {
      const q = query(this.chatsCol(), where('tripId', '==', tripId), where('type', '==', 'group'));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs[0].id;

      const ref = await addDoc(this.chatsCol(), {
        type: 'group',
        tripId,
        tripTitle,
        participantIds: [currentUid],
        participantNames: { [currentUid]: currentName },
        lastMessage: 'Chat created',
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: currentUid,
        unreadCount: {},
        createdAt: serverTimestamp(),
      });
      return ref.id;
    });
  }

  /** Get or create a direct message chat between two users */
  getOrCreateDirectChat(
    myUid: string,
    myName: string,
    theirUid: string,
    theirName: string,
  ): Observable<string> {
    return this.run(async () => {
      // Direct chats use a deterministic ID (sorted UIDs joined)
      const chatId = [myUid, theirUid].sort().join('_');
      const ref = doc(this.firestore, `chats/${chatId}`);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          type: 'direct',
          tripId: null,
          participantIds: [myUid, theirUid],
          participantNames: { [myUid]: myName, [theirUid]: theirName },
          lastMessage: '',
          lastMessageAt: serverTimestamp(),
          lastMessageSenderId: myUid,
          unreadCount: { [myUid]: 0, [theirUid]: 0 },
          createdAt: serverTimestamp(),
        });
      }
      return chatId;
    });
  }

  /** Real-time list of all chats the current user is in */
  getMyChats(uid: string): Observable<Chat[]> {
    return new Observable((observer) => {
      const q = query(
        this.chatsCol(),
        where('participantIds', 'array-contains', uid),
        limit(50),
      );
      const unsub = runInInjectionContext(this.injector, () =>
        onSnapshot(q, (snap) => {
          this.zone.run(() => {
            const chats = snap.docs
              .map((d) => normalizeChat(d.data() as Record<string, unknown>, d.id))
              .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
            observer.next(chats);
          });
        }, (err) => observer.error(err))
      );
      return () => unsub();
    });
  }

  /** Real-time stream of messages in a chat */
  getMessages(chatId: string, pageSize = 50): Observable<Message[]> {
    return new Observable((observer) => {
      const q = query(
        this.messagesCol(chatId),
        orderBy('createdAt', 'asc'),
        limit(pageSize),
      );
      const unsub = runInInjectionContext(this.injector, () =>
        onSnapshot(q, (snap) => {
          this.zone.run(() => {
            const messages = snap.docs.map((d) =>
              normalizeMessage(d.data() as Record<string, unknown>, d.id)
            );
            observer.next(messages);
          });
        }, (err) => observer.error(err))
      );
      return () => unsub();
    });
  }

  // ── Messages ───────────────────────────────────────────────────────────────

  /** Send a text message */
  sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    senderPhotoURL: string | null,
    content: string,
  ): Observable<void> {
    return this.run(async () => {
      const msgRef = await addDoc(this.messagesCol(chatId), {
        chatId,
        senderId,
        senderName,
        senderPhotoURL,
        content,
        type: 'text',
        mediaURL: null,
        createdAt: serverTimestamp(),
        readBy: [senderId],
      });

      // Update last message + increment unread for all other participants
      const chatRef  = doc(this.firestore, `chats/${chatId}`);
      const chatSnap = await getDoc(chatRef);
      const participants: string[] = (chatSnap.data() as Record<string, unknown>)?.['participantIds'] as string[] ?? [];

      const unreadIncrements: Record<string, unknown> = {};
      for (const pid of participants) {
        if (pid !== senderId) unreadIncrements[`unreadCount.${pid}`] = increment(1);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateDoc(chatRef, {
        lastMessage: content,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: senderId,
        ...unreadIncrements,
      } as any);

      return;
    });
  }

  /** Mark all messages in a chat as read by a user */
  markAsRead(chatId: string, uid: string): Observable<void> {
    return this.run(async () => {
      const chatRef = doc(this.firestore, `chats/${chatId}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateDoc(chatRef, { [`unreadCount.${uid}`]: 0 } as any);
    });
  }

  /** Add a participant to a group chat */
  addParticipant(chatId: string, uid: string, name: string): Observable<void> {
    const chatRef = doc(this.firestore, `chats/${chatId}`);
    return this.run(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateDoc(chatRef, {
        participantIds: arrayUnion(uid),
        [`participantNames.${uid}`]: name,
      } as any)
    );
  }
}
