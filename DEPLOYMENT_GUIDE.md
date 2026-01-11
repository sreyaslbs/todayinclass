# TodayInClass - Deployment Guide

Follow these steps to deploy your application to Firebase Hosting so you can access it on your mobile device.

## Prerequisites
1.  **Firebase CLI**: You already have version 15.1.0 installed.
2.  **Firebase Account**: Ensure you have access to the `today-in-class` project in the Firebase Console.

---

## Step 1: Login to Firebase
Open your terminal and run:
```bash
firebase login
```
This will open a browser window to authenticate your account.

## Step 2: Deploy to Firebase
Run the following command from the `todayinclass` folder:
```bash
firebase deploy
```
This will upload your:
-   **Static Files**: HTML, CSS, Javascript, and Images.
-   **Firestore Rules**: Security rules for your database.
-   **Firestore Indexes**: The composite indexes we created for Reports.

## Step 3: Access on Mobile
Once the deployment is complete, Firebase will provide a URL (usually `https://today-in-class.web.app`).

1.  Open this URL in the browser on your **Mobile Phone**.
2.  **Install as App (PWA)**:
    *   **On Android (Chrome)**: Tap the three dots (⋮) and select "Install app" or "Add to Home screen".
    *   **On iOS (Safari)**: Tap the Share button (square with arrow) and select "Add to Home Screen".
3.  **Sign In**: Sign in with your Google account.

---

## Important Checklist for Mobile
-   **Authorized Domains**: If you get a "Sign-in failed" error on mobile, go to **Firebase Console > Authentication > Settings > Authorized Domains** and ensure `today-in-class.web.app` is listed. (It usually is added automatically).
-   **Firestore Policies**: If you can't see your data, double-check that your Google email is added as a 'teacher' or 'admin' in the `users` collection.
