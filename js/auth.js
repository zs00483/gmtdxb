/* ==========================================================
   auth.js — GMTDXB Authentication Logic
   ==========================================================
   Handles:
   ✅ Email & Password Login
   ✅ Email & Password Register
   ✅ Google Login / Register
   ✅ Password Reset
   ✅ User Redirect & Local Caching
   ========================================================== */

// Ensure Firebase is loaded
if (typeof firebase === "undefined") {
  console.error("Firebase SDK not found. Make sure firebase.js is loaded first.");
}

/* ------------------------------------------
   🔹 Helper: Redirect after login
------------------------------------------ */
function redirectAfterLogin(isAdmin = false) {
  if (isAdmin) {
    window.location.href = "admin.html";
  } else {
    window.location.href = "index.html";
  }
}

/* ------------------------------------------
   🔹 LOGIN PAGE LOGIC
------------------------------------------ */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
      alert("⚠️ Please enter both email and password.");
      return;
    }

    try {
      const { user, isAdmin } = await signInWithEmailPassword(email, password);
      alert(`✅ Welcome back, ${user.email}!`);
      redirectAfterLogin(isAdmin);
    } catch (err) {
      console.error("Login error:", err);
      alert("❌ " + err.message);
    }
  });
}

/* ------------------------------------------
   🔹 REGISTER PAGE LOGIC
------------------------------------------ */
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (!name || !email || !password || !confirmPassword) {
      alert("⚠️ All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      alert("⚠️ Passwords do not match!");
      return;
    }

    try {
      const { user } = await signUpWithEmailPassword(email, password);

      // Save user profile to Firestore
      await saveUserProfile(user.uid, {
        name,
        email,
        role: "user",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      alert(`🎉 Welcome to GMTDXB, ${name}!`);
      redirectAfterLogin(false);
    } catch (err) {
      console.error("Register error:", err);
      alert("❌ Failed to create account. Try again.");
    }
  });
}

/* ------------------------------------------
   🔹 GOOGLE LOGIN (for login.html & register.html)
------------------------------------------ */
const googleLoginBtn = document.getElementById("googleLoginBtn");
const googleSignupBtn = document.getElementById("googleSignupBtn");

async function handleGoogleSignIn() {
  try {
    const { user, isNewUser, isAdmin } = await signInWithGoogle();

    if (isNewUser) {
      await saveUserProfile(user.uid, {
        name: user.displayName,
        email: user.email,
        role: "user",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      alert(`🎉 Welcome to GMTDXB, ${user.displayName}!`);
    } else {
      alert(`✅ Welcome back, ${user.displayName}!`);
    }

    redirectAfterLogin(isAdmin);
  } catch (err) {
    console.error("Google login error:", err);
    alert("❌ Google sign-in failed. Try again.");
  }
}

if (googleLoginBtn) googleLoginBtn.addEventListener("click", handleGoogleSignIn);
if (googleSignupBtn) googleSignupBtn.addEventListener("click", handleGoogleSignIn);

/* ------------------------------------------
   🔹 PASSWORD RESET (Optional)
------------------------------------------ */
const forgotLink = document.querySelector('a[href="#"]'); // "Forgot Password?" link
if (forgotLink && document.getElementById("loginEmail")) {
  forgotLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();

    if (!email) {
      alert("⚠️ Enter your email to reset password.");
      return;
    }

    try {
      await firebase.auth().sendPasswordResetEmail(email);
      alert("📩 Password reset link sent! Check your inbox.");
    } catch (err) {
      console.error("Password reset error:", err);
      alert("❌ Failed to send password reset email.");
    }
  });
}

/* ------------------------------------------
   🔹 PASSWORDLESS LOGIN (optional future feature)
------------------------------------------ */
// Uncomment below if you plan to enable email link sign-in later:
//
// if (window.location.href.includes("mode=signIn")) {
//   handlePasswordlessSignIn().then((result) => {
//     if (result) redirectAfterLogin(result.isAdmin);
//   });
// }

/* ------------------------------------------
   🔹 LOGOUT (global)
------------------------------------------ */
window.logoutUserNow = async function () {
  try {
    await logoutUser();
    alert("👋 Logged out successfully!");
    window.location.href = "login.html";
  } catch (err) {
    console.error("Logout error:", err);
  }
};
console.log("IS ADMIN:", isAdmin);
