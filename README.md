# Tripzy

A social trip-sharing platform where travelers can create, discover, and join group trips.

## Tech Stack

- **Frontend**: Angular 20 (standalone components, Signals)
- **Backend**: Firebase Firestore, Firebase Auth
- **Storage**: Vercel Blob
- **Hosting**: Vercel

## Features

- User authentication (email/password + Google)
- Create and discover trips
- Join trip requests & approval flow
- Real-time chat (trip group chats + direct messages)
- Profile with photo upload
- Trip cover image upload

## Getting Started

### Prerequisites

- Node.js 20+
- Angular CLI 20+

### Install

```bash
cd tripzy
npm install
```

### Environment Setup

Create `src/environments/environment.ts` and `src/environments/environment.prod.ts` with your Firebase config:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: '...',
    authDomain: '...',
    projectId: '...',
    storageBucket: '...',
    messagingSenderId: '...',
    appId: '...',
  },
};
```

Create a `.env` file in `tripzy/`:

```
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### Run (Development)

```bash
# Terminal 1 — API server (handles Vercel Blob uploads)
node dev-api.js

# Terminal 2 — Angular dev server
ng serve
```

Or use VS Code: open the workspace, press **F5** and select **Dev: Full Stack (API + Chrome)**.

### Build (Production)

```bash
ng build
```

### Deploy

Deploy to Vercel — the `vercel.json` config routes `/api/*` to serverless functions in `api/`.
