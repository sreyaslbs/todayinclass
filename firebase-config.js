// Firebase Configuration
// Replace these values with your own Firebase project credentials

const firebaseConfig = {
    apiKey: "AIzaSyD4UZUOtt5cDWMDtddL308Gt77gy4pqKZw",
    authDomain: "today-in-class.firebaseapp.com",
    projectId: "today-in-class",
    storageBucket: "today-in-class.firebasestorage.app",
    messagingSenderId: "510521163674",
    appId: "1:510521163674:web:7dab7cfaeebe63aaa70423"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Configure Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
