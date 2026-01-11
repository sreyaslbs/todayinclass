# 📋 Firestore Index Setup Instructions

The app is currently stuck because certain database queries require custom indexes. I've already created the `firestore.indexes.json` file for you, but you need to apply it to your Firebase project.

There are two ways to do this:

## Option 1: Using the Firebase CLI (Recommended)

If you have the Firebase CLI installed and are logged in, run this command in your terminal:

```bash
firebase deploy --only firestore:indexes
```

## Option 2: Manual Creation (Via Browser)

If you're not using the CLI, you can create them manually by clicking these links (while logged into your Firebase Console):

1.  **Index for Classes**: [Click here to create](https://console.firebase.google.com/v1/r/project/today-in-class/firestore/indexes?create_composite=Ck5wcm9qZWN0cy90b2RheS1pbi1jbGFzcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvY2xhc3Nlcy9pbmRleGVzL18QARoJCgVncmFkZRABGgsKB3NlY3Rpb24QARoMCghfX25hbWVfXxAB)
2.  **Index for Daily Updates**: [Click here to create](https://console.firebase.google.com/v1/r/project/today-in-class/firestore/indexes?create_composite=ClNwcm9qZWN0cy90b2RheS1pbi1jbGFzcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZGFpbHlVcGRhdGVzL2luZGV4ZXMvXxABGggKBGRhdGUQAhoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC)

### ⏳ Important Note:
- Once you click "Create", it will take about **3-5 minutes** for Firestore to build the indexes.
- You can monitor the progress in the **"Composite"** tab of the Firestore Indexes page.
- **Wait until they are "Enabled" before refreshing your app.**

---

### 🛡️ About the COOP Warning
The warning `Cross-Origin-Opener-Policy policy would block the window.closed call` is a standard notice from Chrome/Edge when using Firebase Auth popups. It **does not** prevent the app from working. The main issue was the missing indexes!
