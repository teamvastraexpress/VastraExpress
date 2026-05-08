# Firebase Configuration Setup Guide

This document provides step-by-step instructions to configure Firebase for Vastra Express.

## Overview

Vastra Express uses Firebase for phone-based authentication and push notifications:
- **Frontend**: Firebase Phone Authentication (OTP via SMS)
- **Backend**: Firebase Admin SDK (token verification & FCM push notifications)

## Prerequisites

- Firebase project created at https://console.firebase.google.com/
- Google Cloud Project associated with Firebase project
- Node.js 18+ installed locally

---

## Step 1: Enable Phone Sign-In in Firebase Console

1. Go to **Firebase Console** → Select your project
2. Navigate to **Authentication** → **Sign-in method**
3. Find **Phone** in the list
4. Click the toggle to **Enable**
5. Save changes

### For Local Testing (reCAPTCHA)

- Firebase Phone Auth requires reCAPTCHA v3 by default
- For localhost testing, configure:
  1. Go to **Authentication** → **Settings**
  2. Under **Authorized domains**, add:
     - `localhost`
     - `127.0.0.1`
     - (Optional) Your Vercel preview/prod domains
  3. Save

---

## Step 2: Get Firebase Web Configuration

1. In Firebase Console, go to **Project Settings** (gear icon, top-right)
2. Click **Your apps** → Select **Web app** (or create one if not present)
3. Copy the Firebase config object:
   ```javascript
   {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   }
   ```

---

## Step 3: Configure Frontend Web Apps

### Customer Web & Driver Web

For each of these apps (`vastra-express-customer-web` and `vastra-express-driver-web`):

1. Copy `.env.local.example` to `.env.local`
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in the Firebase config values:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=1:your_id:web:your_web_id
   ```

3. Save and restart dev server: `npm run dev`

### Facility Web (Optional)

Facility uses legacy OTP by default. To enable Firebase:
1. Copy `.env.local.example` to `.env.local`
2. Fill in the same Firebase config values as above (or leave blank for legacy OTP)
3. The login page will automatically use Firebase if configured, fallback to OTP otherwise

---

## Step 4: Generate Firebase Admin SDK Service Account

This is required for the **backend** to verify Firebase tokens and send FCM push notifications.

1. In Firebase Console, go to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
   - A JSON file will download locally
   - **KEEP THIS FILE SECURE** - it contains credentials
3. Open the downloaded JSON file
4. Copy the **entire JSON content** (not the file path)

---

## Step 5: Configure Backend

### Option A: Direct JSON Content (Recommended for Local Dev)

1. Open `vastra-express-backend/.env`
2. Find `FIREBASE_SERVICE_ACCOUNT=`
3. Replace with the complete JSON (single line or formatted):
   ```bash
   FIREBASE_SERVICE_ACCOUNT={"type": "service_account", "project_id": "...", ...}
   ```
4. Save and restart backend: `npm run start:dev`

### Option B: File Path (Recommended for Production)

1. Save the downloaded service account JSON to a secure location (e.g., `/etc/secrets/firebase-key.json`)
2. In `vastra-express-backend/.env`:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
   ```
3. Backend will load from file if FIREBASE_SERVICE_ACCOUNT content is empty

**IMPORTANT**: Never commit service account files to version control.

---

## Step 6: Verify Setup

### Local Testing

1. Start all services:
   ```bash
   # In separate terminals:
   # Terminal 1: Backend
   cd vastra-express-backend
   npm run start:dev

   # Terminal 2: Customer Web
   cd vastra-express-customer-web
   npm run dev

   # Terminal 3: Driver Web
   cd vastra-express-driver-web
   npm run dev
   ```

2. Open Customer Web at `http://localhost:3004/login`
3. Click **Get OTP**
   - Firebase is configured: You'll see "Verify with reCAPTCHA" and receive SMS OTP (requires real phone number in beta)
   - Firebase is not configured: You'll see "Using temporary backend OTP mode" + debug OTP in toast

4. Open Driver Web at `http://localhost:3003/login`
   - Same behavior as Customer Web, but role-gated to DRIVER accounts

5. Backend logs should show one of:
   ```
   ✅ Firebase Admin SDK initialized
   // OR (fallback mode)
   🔄 Firebase not configured - OTP verification using backend
   ```
   If neither, check FIREBASE_SERVICE_ACCOUNT configuration.

---

## Step 7: Push Notifications (FCM)

Once Firebase is configured on backend, FCM push notifications will work automatically:
- Backend can send to users with valid FCM tokens (stored in database)
- Frontend FCM token registration happens automatically on login

### Test FCM (Optional)

1. Ensure backend has FIREBASE_SERVICE_ACCOUNT configured
2. Ensure frontend user is logged in (FCM token registered)
3. Use backend admin endpoint or manual test to send notification

---

## Troubleshooting

### "Firebase Web Auth is not configured" Error

- **Cause**: NEXT_PUBLIC_FIREBASE_* env vars missing in web app
- **Fix**: Populate all Firebase config vars in `.env.local` and restart dev server

### "Firebase authentication is not configured" in Backend

- **Cause**: FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH not set
- **Fix**: Provide service account JSON content or file path in backend `.env`

### Phone OTP Not Received (Backend Fallback Mode)

- **Cause**: Firebase SMS OTP requires proper configuration or phone number not in country whitelist
- **Fallback**: Backend uses EXPOSE_OTP_IN_RESPONSE=true to show debug OTP in app toast (beta mode)
- **Fix**: For production, ensure:
  - Phone numbers are valid and country is not restricted
  - Firebase project SMS quota not exceeded
  - reCAPTCHA v3 is properly configured

### "Invalid Firebase Token" in Backend

- **Cause**: Frontend Firebase config doesn't match backend Firebase project
- **Fix**: Ensure all frontend Firebase config values are from the **same** Firebase project as the backend service account

---

## Production Deployment

### Vercel (Web Apps)

1. Go to **Vercel Dashboard** → Project settings → **Environment Variables**
2. Add each NEXT_PUBLIC_FIREBASE_* variable with values from Firebase Console
3. Redeploy

### Backend (Railway or Production Server)

1. Set FIREBASE_SERVICE_ACCOUNT_PATH to production file location (recommended)
2. Ensure service account file is uploaded securely (not via Git)
3. Verify FIREBASE_SERVICE_ACCOUNT_PATH is readable by backend process

---

## References

- [Firebase Phone Authentication](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firebase reCAPTCHA Configuration](https://firebase.google.com/docs/auth/web/phone-auth#enable-app-verification)
- [FCM (Firebase Cloud Messaging)](https://firebase.google.com/docs/cloud-messaging)
