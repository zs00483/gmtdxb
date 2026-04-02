/* ==========================================================
   utils.js — GMTDXB Utility Functions
   ==========================================================
   Handles:
   ✅ Reusable helpers for formatting, alerts, and storage
   ✅ Common validation & DOM utilities
   ✅ LocalStorage helpers
   ========================================================== */

/* ------------------------------------------
   🔹 Price Formatting
------------------------------------------ */
window.formatCurrencyAED = (amount) => {
  if (isNaN(Number(amount))) return "AED 0.00";
  return "AED " + Number(amount).toLocaleString("en-AE", { minimumFractionDigits: 2 });
};

/* ------------------------------------------
   🔹 Date Formatting
------------------------------------------ */
window.formatDate = (timestamp) => {
  try {
    if (!timestamp) return "—";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

/* ------------------------------------------
   🔹 Phone Validation (basic UAE)
------------------------------------------ */
window.validatePhone = (phone) => {
  const regex = /^(\+971|0)?[2-9]\d{8}$/;
  return regex.test(phone);
};

/* ------------------------------------------
   🔹 Email Validation
------------------------------------------ */
window.validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/* ------------------------------------------
   🔹 Toast Notification (Custom Alert)
------------------------------------------ */
window.showToast = (msg, type = "info") => {
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  const toast = document.createElement("div");
  toast.className = `fixed bottom-5 right-5 ${colors[type]} text-white px-5 py-3 rounded-lg shadow-lg z-[9999] animate-bounce`;
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0", "transition");
    setTimeout(() => toast.remove(), 500);
  }, 2500);
};

/* ------------------------------------------
   🔹 Loading Spinner
------------------------------------------ */
window.showLoader = (show = true) => {
  let loader = document.getElementById("loaderOverlay");

  if (show) {
    if (!loader) {
      loader = document.createElement("div");
      loader.id = "loaderOverlay";
      loader.className =
        "fixed inset-0 bg-black/70 flex items-center justify-center z-[9998]";
      loader.innerHTML =
        '<div class="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>';
      document.body.appendChild(loader);
    }
  } else {
    if (loader) loader.remove();
  }
};

/* ------------------------------------------
   🔹 Truncate Text (for product cards)
------------------------------------------ */
window.truncateText = (text, length = 80) => {
  if (!text) return "";
  return text.length > length ? text.substring(0, length) + "..." : text;
};

/* ------------------------------------------
   🔹 Local Storage Helpers
------------------------------------------ */
window.saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("LocalStorage save error:", err);
  }
};

window.getFromStorage = (key) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    console.error("LocalStorage get error:", err);
    return null;
  }
};

window.removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error("LocalStorage remove error:", err);
  }
};

/* ------------------------------------------
   🔹 String Sanitizer (basic XSS protection)
------------------------------------------ */
window.sanitizeInput = (str) => {
  if (typeof str !== "string") return str;
  return str.replace(/[&<>"']/g, (match) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[match];
  });
};

/* ------------------------------------------
   🔹 Scroll To Top Utility
------------------------------------------ */
window.scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

/* ------------------------------------------
   🔹 Random ID Generator (for temporary IDs)
------------------------------------------ */
window.generateId = (prefix = "gmt") => {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
};
