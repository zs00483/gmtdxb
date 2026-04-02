// firebase.js (compat) - GMTDXB
// Place in: js/firebase.js
// NOTE: Replace firebaseConfig values below with your project's credentials.

if (typeof firebase === "undefined") {
  console.error("Firebase SDK not found. Add Firebase <script> SDKs to your HTML before this file.");
}

// -----------------------------
// Firebase Config - REPLACE
// -----------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCKZj9j1Af9uvAp5iLBvqEmc_UbtZZmNFk",
  authDomain: "gmtdxb-9ea62.firebaseapp.com",
  projectId: "gmtdxb-9ea62",
  storageBucket: "gmtdxb-9ea62.firebasestorage.app",
  messagingSenderId: "651626258450",
  appId: "1:651626258450:web:b67b3cb751079cebb8f8cb",
  measurementId: "G-VLNVT2HHVP"
};

// -----------------------------
// Init (compat style)
// -----------------------------
firebase.initializeApp(firebaseConfig);

// Services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// -----------------------------
// Providers
// -----------------------------
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Action code settings for passwordless/email link sign-in
const actionCodeSettings = {
  // Make sure this is set to a valid URL in your Firebase console authorized domains
  url: window.location.origin + window.location.pathname,
  handleCodeInApp: true
};

// -----------------------------
// Helper: checkUserRole(uid) -> returns boolean (isAdmin)
// -----------------------------
async function checkUserRole(uid) {
  if (!uid) return false;

  try {
    const userDoc = await db.collection("users").doc(uid).get();

    if (userDoc.exists) {
      const data = userDoc.data();
      console.log("USER DATA:", data); // debug

      if (data.role && data.role === "admin") {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error("Role check error:", err);
    return false;
  }
}

// -----------------------------
// Auth Helpers
// -----------------------------
window.signInWithGoogle = async () => {
  try {
    const result = await auth.signInWithPopup(googleProvider);
    const isAdmin = await checkUserRole(result.user.uid);
    // persist email locally for UI convenience
    if (result.user && result.user.email) localStorage.setItem("userEmail", result.user.email);
    return { user: result.user, isNewUser: result.additionalUserInfo?.isNewUser ?? false, isAdmin };
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

window.signUpWithEmailPassword = async (email, password) => {
  try {
    const res = await auth.createUserWithEmailAndPassword(email, password);
    // New users are not admin by default
    localStorage.setItem("userEmail", email);
    return { user: res.user, isNewUser: true, isAdmin: false };
  } catch (error) {
    console.error("Email sign-up error:", error);
    throw error;
  }
};

window.signInWithEmailPassword = async (email, password) => {
  try {
    const res = await auth.signInWithEmailAndPassword(email, password);
    const isAdmin = await checkUserRole(res.user.uid);
    localStorage.setItem("userEmail", email);
    return { user: res.user, isNewUser: false, isAdmin };
  } catch (error) {
    console.error("Email sign-in error:", error);
    throw error;
  }
};

// Passwordless: send sign-in link to email
window.sendPasswordlessLink = async (email) => {
  try {
    await auth.sendSignInLinkToEmail(email, actionCodeSettings);
    localStorage.setItem("emailForSignIn", email);
    console.log("Passwordless link sent to:", email);
  } catch (error) {
    console.error("Send link failed:", error);
    throw error;
  }
};

// Handle incoming sign-in link
window.handlePasswordlessSignIn = async () => {
  if (!auth.isSignInWithEmailLink(window.location.href)) {
    return null;
  }
  let email = localStorage.getItem("emailForSignIn");
  if (!email) {
    email = window.prompt("Please provide your email for confirmation");
    if (!email) throw new Error("Email is required to complete sign-in.");
  }
  try {
    const result = await auth.signInWithEmailLink(email, window.location.href);
    localStorage.removeItem("emailForSignIn");
    localStorage.setItem("userEmail", email);
    const isAdmin = await checkUserRole(result.user.uid);
    return { user: result.user, isNewUser: result.additionalUserInfo?.isNewUser ?? false, isAdmin };
  } catch (error) {
    console.error("Passwordless sign-in failed:", error);
    throw error;
  }
};

// Logout
window.logoutUser = async () => {
  try {
    await auth.signOut();
    localStorage.removeItem("userUid");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userPhone");
    console.log("Logged out");
  } catch (err) {
    console.error("Logout failed:", err);
    throw err;
  }
};

// -----------------------------
// Firestore helpers: Products
// -----------------------------
// getProducts({limit, startAfterDoc, filters})
// filters: { category, brand, minPrice, maxPrice, condition, tags: [] }
window.getProducts = async ({ limit = 12, startAfterDoc = null, filters = {}, orderBy = "createdAt" } = {}) => {
  try {
    let q = db.collection("products");
    // basic filters
    if (filters.category) q = q.where("category", "==", filters.category);
    if (filters.brand) q = q.where("brand", "==", filters.brand);
    if (filters.condition) q = q.where("condition", "==", filters.condition); // new/used/pre-loved
    if (filters.minPrice !== undefined) q = q.where("price", ">=", filters.minPrice);
    if (filters.maxPrice !== undefined) q = q.where("price", "<=", filters.maxPrice);
    // Note: for more complex filters (multiple brands or tags) use 'in' or client-side filtering (watch limits)

    // ordering & pagination
   q = q.orderBy("createdAt", "desc").limit(limit);
    if (startAfterDoc) q = q.startAfter(startAfterDoc);

    const snap = await q.get();
    const docs = [];
    snap.forEach((doc) => docs.push({ id: doc.id, ...doc.data() }));
    const lastVisible = snap.docs[snap.docs.length - 1] || null;
    return { products: docs, lastVisible };
  } catch (error) {
    console.error("getProducts error:", error);
    throw error;
  }
};

window.getProductById = async (id) => {
  try {
    const doc = await db.collection("products").doc(id).get();
    if (!doc.exists) throw new Error("Product not found");
    return { id: doc.id, ...doc.data() };
  } catch (err) {
    console.error("getProductById error:", err);
    throw err;
  }
};

window.addProduct = async (productData) => {
  // productData: { name, brand, price, category, specs, images:[], stock, condition, tags, displayOrder }
  try {
    const docRef = await db.collection("products").add({
      ...productData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  } catch (err) {
    console.error("addProduct error:", err);
    throw err;
  }
};

window.updateProduct = async (id, updates) => {
  try {
    await db.collection("products").doc(id).set({
      ...updates,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error("updateProduct error:", err);
    throw err;
  }
};

window.deleteProduct = async (id) => {
  try {
    await db.collection("products").doc(id).delete();
    return true;
  } catch (err) {
    console.error("deleteProduct error:", err);
    throw err;
  }
};

// -----------------------------
// Orders
// -----------------------------
window.createOrder = async (orderPayload) => {
  // orderPayload example:
  // { userId, items: [{ id, name, price, qty, specs }], subtotal, shipping, tax, total, shippingAddress, paymentMethod }
  if (!orderPayload) throw new Error("Missing order payload");
  try {
    const orderRef = await db.collection("orders").add({
      ...orderPayload,
      orderStatus: "processing",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return orderRef.id;
  } catch (err) {
    console.error("createOrder error:", err);
    throw err;
  }
};

window.getOrdersForUser = async (uid, limit = 20) => {
  if (!uid) return [];
  try {
    const snap = await db.collection("orders").where("userId", "==", uid).orderBy("createdAt", "desc").limit(limit).get();
    const orders = [];
    snap.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
    return orders;
  } catch (err) {
    console.error("getOrdersForUser error:", err);
    throw err;
  }
};

// -----------------------------
// Contact messages & service requests
// -----------------------------
window.saveContactMessage = async (name, email, message) => {
  try {
    await db.collection("contactMessages").add({
      name,
      email,
      message,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error("saveContactMessage error:", err);
    throw err;
  }
};

window.saveServiceRequest = async (payload) => {
  // payload: { name, email, phone, serviceType, message, preferredDate? }
  try {
    await db.collection("serviceRequests").add({
      ...payload,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error("saveServiceRequest error:", err);
    throw err;
  }
};

// -----------------------------
// User profile
// -----------------------------
window.saveUserProfile = async (uid, profileData) => {
  if (!uid || !profileData) throw new Error("Missing uid or profileData");
  try {
    await db.collection("users").doc(uid).set({
      ...profileData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // cache some values locally
    if (profileData.name) localStorage.setItem("userName", profileData.name);
    if (profileData.phone) localStorage.setItem("userPhone", profileData.phone);
    return true;
  } catch (err) {
    console.error("saveUserProfile error:", err);
    throw err;
  }
};

// -----------------------------
// Auth state listener
// -----------------------------
auth.onAuthStateChanged(async (user) => {
  if (user) {
    console.log("Auth: logged in", user.uid, user.email || user.phoneNumber);
    localStorage.setItem("userUid", user.uid);
    if (user.displayName) localStorage.setItem("userName", user.displayName);
    if (user.email) localStorage.setItem("userEmail", user.email);
    if (user.phoneNumber) localStorage.setItem("userPhone", user.phoneNumber);
  } else {
    console.log("Auth: logged out");
    localStorage.removeItem("userUid");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPhone");
  }
});

// -----------------------------
// Optional: Storage helper for uploading images via Firebase Storage
// (If you prefer Cloudinary, keep Cloudinary in admin.js.)
// -----------------------------
window.uploadFileToStorage = async (file, path = "images/") => {
  if (!file) throw new Error("File is required");
  try {
    const filename = `${path}${Date.now()}_${file.name}`;
    const storageRef = storage.ref().child(filename);
    const snapshot = await storageRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();
    return downloadURL;
  } catch (err) {
    console.error("uploadFileToStorage error:", err);
    throw err;
  }
};

// -----------------------------
// Small utility: format price as AED (used by frontend)
// -----------------------------
window.formatCurrencyAED = (amount) => {
  if (isNaN(Number(amount))) return amount;
  return "AED " + Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

// Export for debugging (optional)
window._firebaseHelpers = {
  auth, db, storage, checkUserRole
};
