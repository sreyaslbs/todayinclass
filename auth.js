// Authentication Module for TodayInClass - WITH DEBUG LOGGING

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.onAuthStateChangedCallback = null;
        console.log('🔧 AuthManager: Constructor called');
    }

    // Initialize auth state listener
    init(callback) {
        console.log('🔧 AuthManager: Initializing...');
        this.onAuthStateChangedCallback = callback;

        auth.onAuthStateChanged(async (user) => {
            console.log('🔔 AuthManager: Auth state changed', user ? `User: ${user.email}` : 'No user');

            if (user) {
                console.log('✅ AuthManager: User is signed in:', user.email);

                // User is signed in
                try {
                    console.log('📖 AuthManager: Fetching user document from Firestore...');
                    const userDoc = await db.collection('users').doc(user.uid).get();

                    if (userDoc.exists) {
                        console.log('✅ AuthManager: User document found in Firestore');
                        this.currentUser = {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                            role: userDoc.data().role || 'parent'
                        };
                        console.log('👤 AuthManager: Current user role:', this.currentUser.role);
                    } else {
                        console.log('⚠️ AuthManager: User document not found, creating new one...');
                        // Create new user document with default role
                        this.currentUser = {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                            role: 'parent' // Default role
                        };

                        await db.collection('users').doc(user.uid).set({
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                            role: 'parent',
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        console.log('✅ AuthManager: New user document created');
                    }

                    console.log('📞 AuthManager: Calling callback with user data');
                    if (this.onAuthStateChangedCallback) {
                        this.onAuthStateChangedCallback(this.currentUser);
                    }
                } catch (error) {
                    console.error('❌ AuthManager: Error in auth state handler:', error);
                }
            } else {
                console.log('🚪 AuthManager: User is signed out');
                // User is signed out
                this.currentUser = null;
                if (this.onAuthStateChangedCallback) {
                    this.onAuthStateChangedCallback(null);
                }
            }
        });
    }

    // Sign in with Google (using popup)
    async signInWithGoogle() {
        console.log('🔐 AuthManager: Starting Google Sign-In (popup method)...');
        try {
            const result = await auth.signInWithPopup(googleProvider);
            console.log('✅ AuthManager: Sign-in successful via popup:', result.user.email);

            // Force a page reload to ensure the latest code/assets are loaded 
            // and the cache is cleared for the new session
            window.location.reload();

            return result;
        } catch (error) {
            console.error('❌ AuthManager: Error signing in:', error);
            if (error.code === 'auth/popup-blocked') {
                alert('Sign-in popup was blocked. Please allow popups for localhost.');
            } else {
                alert('Sign-in error: ' + error.message);
            }
            throw error;
        }
    }

    // Get redirect result (called on page load)
    async getRedirectResult() {
        console.log('🔍 AuthManager: Checking for redirect result...');
        try {
            const result = await auth.getRedirectResult();
            if (result.user) {
                console.log('✅ AuthManager: Sign-in successful via redirect:', result.user.email);
            } else {
                console.log('ℹ️ AuthManager: No redirect result (user did not just sign in)');
            }
        } catch (error) {
            console.error('❌ AuthManager: Redirect error:', error);
            alert('Sign-in error: ' + error.message);
        }
    }

    // Sign out
    async signOut() {
        console.log('🚪 AuthManager: Signing out...');
        try {
            await auth.signOut();
            this.currentUser = null;
            console.log('✅ AuthManager: Sign out successful');
        } catch (error) {
            console.error('❌ AuthManager: Error signing out:', error);
            throw error;
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user has role
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    // Check if user is admin
    isAdmin() {
        return this.hasRole('admin');
    }

    // Check if user is teacher
    isTeacher() {
        return this.hasRole('teacher') || this.hasRole('admin');
    }

    // Check if user is parent
    isParent() {
        return this.hasRole('parent');
    }
}

// Create global auth manager instance
console.log('🚀 Creating AuthManager instance...');
const authManager = new AuthManager();
