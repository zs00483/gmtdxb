/* ==========================================================
   services.js — GMTDXB Services Page Logic
   ==========================================================
   Handles:
   ✅ Booking service requests
   ✅ Saving data to Firestore (via saveServiceRequest)
   ✅ User-friendly alerts and validation
   ========================================================== */

// Ensure Firebase is loaded
if (typeof firebase === "undefined") {
  console.error("Firebase SDK not found. Make sure firebase.js is loaded before this file.");
}

/* ------------------------------------------
   🔹 Initialize Form Logic
------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("serviceForm");

  if (!form) {
    console.warn("No service form found on this page.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const serviceType = form.serviceType.value.trim();
    const message = form.message.value.trim();

    // Simple validation
    if (!name || !email || !phone || !serviceType) {
      alert("⚠️ Please fill out all required fields.");
      return;
    }

    const payload = {
      name,
      email,
      phone,
      serviceType,
      message: message || "No details provided",
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    try {
      await saveServiceRequest(payload);

      // Success feedback
      alert(`✅ Thank you, ${name}! Your ${serviceType} request has been submitted successfully.`);

      // Optional: Clear form
      form.reset();

      // Optional: Redirect to home or thank-you page
      // window.location.href = "thankyou.html";
    } catch (err) {
      console.error("Service form error:", err);
      alert("❌ Failed to submit service request. Please try again later.");
    }
  });
});
