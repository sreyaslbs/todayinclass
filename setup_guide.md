# TodayInClass - Setup Guide

Welcome to **TodayInClass**! This guide will help you set up and deploy the school communication PWA for Chinmaya Vidyalaya Taliparamba.

## Prerequisites

- A Google account
- Basic familiarity with Firebase Console
- Node.js installed (for Firebase CLI)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `todayinclass` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click **"Create project"**

## Step 2: Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click **"Get started"**
3. Click on **"Sign-in method"** tab
4. Enable **Google** sign-in provider:
   - Click on "Google"
   - Toggle "Enable"
   - Select a support email
   - Click "Save"

## Step 3: Create Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in production mode"** (we'll add custom rules)
4. Choose your preferred location (e.g., `asia-south1` for India)
5. Click **"Enable"**

## Step 4: Configure Firestore Security Rules

1. In Firestore Database, go to **"Rules"** tab
2. Copy the content from `firestore.rules` file in your project
3. Paste it into the Firebase Console rules editor
4. Click **"Publish"**

> **Important:** Use `firestore.rules` (NOT `database.rules.json`). The `.rules` file is for Firestore, while `.json` is for Realtime Database.

> **Note:** The security rules ensure:
> - Only authenticated users can access data
> - Admins can create/edit classes
> - Teachers can create/edit their own updates
> - Parents have read-only access

## Step 5: Get Firebase Configuration

1. In Firebase Console, go to **Project settings** (gear icon)
2. Scroll down to **"Your apps"**
3. Click the **Web** icon (`</>`)
4. Register app with nickname: `TodayInClass`
5. **Don't** check "Firebase Hosting" yet
6. Click **"Register app"**
7. Copy the `firebaseConfig` object

## Step 6: Update Firebase Configuration

1. Open `firebase-config.js` in your project
2. Replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 7: Set Up Initial Admin User

Since the app uses role-based access control, you need to manually set the first admin user:

1. Open the app locally (see Step 8)
2. Sign in with your Google account
3. In Firebase Console, go to **Firestore Database**
4. Find the `users` collection
5. Click on your user document (it will be created automatically on first sign-in)
6. Edit the document and change `role` field from `"parent"` to `"admin"`
7. Click **"Update"**
8. Refresh the app - you should now see admin features!

## Step 8: Test Locally

### Option 1: Using Python (Simple HTTP Server)

```bash
cd todayinclass
python -m http.server 8000
```

Then open: `http://localhost:8000`

### Option 2: Using Node.js (http-server)

```bash
npm install -g http-server
cd todayinclass
http-server
```

Then open: `http://localhost:8080`

### Option 3: Using VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

## Step 9: Configure Authorized Domains

When you test the app, you might get an error about unauthorized domains. To fix this:

1. In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
2. Add your domain:
   - For local testing: `localhost`
   - For Firebase Hosting: `your-project-id.web.app` (auto-added)
   - For custom domain: add your domain
3. Click **"Add domain"**

## Step 10: Deploy to Firebase Hosting

### Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Login to Firebase

```bash
firebase login
```

### Initialize Firebase in Your Project

```bash
cd todayinclass
firebase init
```

- Select **"Hosting"**
- Choose your Firebase project
- Set public directory: `.` (current directory)
- Configure as single-page app: **Yes**
- Set up automatic builds: **No**
- Don't overwrite `firebase.json`

### Deploy

```bash
firebase deploy
```

Your app will be live at: `https://your-project-id.web.app`

## Step 11: Assign User Roles

After deployment, you need to assign roles to users:

### Making Someone an Admin (Class Teacher)

1. Go to Firebase Console → Firestore Database
2. Navigate to `users` collection
3. Find the user's document (by email)
4. Edit the `role` field to `"admin"`

### Making Someone a Teacher

Teachers are automatically assigned when you create a class and add them as subject teachers. However, you can also manually set:

1. Go to Firestore Database → `users` collection
2. Find the user's document
3. Edit the `role` field to `"teacher"`

### Parents

By default, all new users are assigned the `"parent"` role automatically.

## Step 12: Create Your First Class

1. Sign in as an admin
2. Go to **"Classes"** tab
3. Click **"Add Class"**
4. Fill in:
   - Grade: `Grade 5`
   - Section: `B`
   - Class Teacher Name: Your name
   - Add subjects with teacher names and emails
5. Click **"Save Class"**

> **Important:** Make sure teacher emails are the exact Google account emails they'll use to sign in!

## Step 13: Test the App

### As Admin:
- ✅ Create classes
- ✅ Add subjects and assign teachers
- ✅ Delete classes
- ✅ View all updates

### As Teacher:
- ✅ Add daily updates for assigned subjects
- ✅ Edit own updates
- ✅ Mark homework
- ✅ View all classes and updates

### As Parent:
- ✅ View all classes
- ✅ View daily updates
- ✅ See homework assignments
- ❌ Cannot create or edit anything

## Mobile Installation (PWA)

### Android (Chrome)

1. Open the app in Chrome
2. Tap the menu (⋮)
3. Tap **"Install app"** or **"Add to Home screen"**
4. Follow the prompts

### iOS (Safari)

1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"**

## Troubleshooting

### "Auth domain not authorized"

**Solution:** Add your domain to Firebase Authentication → Settings → Authorized domains

### "Permission denied" errors

**Solution:** Check Firestore security rules are properly deployed

### Users can't sign in

**Solution:** Ensure Google sign-in is enabled in Firebase Authentication

### Teacher can't see their subjects

**Solution:** 
1. Verify teacher email in class matches their Google account email exactly
2. Check their role is set to "teacher" in Firestore

### Updates not showing

**Solution:**
1. Check date filter is set correctly
2. Verify updates exist for that date
3. Check browser console for errors

## Support

For issues or questions:
- Check Firebase Console for errors
- Review browser console (F12) for JavaScript errors
- Verify Firestore security rules are correct
- Ensure all user roles are properly assigned

## App Features Summary

### Admin Features
- Create and manage classes
- Add subjects to classes
- Assign teachers to subjects
- Delete classes
- View all updates

### Teacher Features
- Add daily updates for assigned subjects
- Edit own updates
- Mark homework assignments
- Add homework descriptions
- View all classes and updates

### Parent Features
- View all classes
- View daily updates by date
- See what was taught
- Check homework assignments
- Filter by date

---

**Congratulations!** 🎉 Your TodayInClass app is now ready to use!
