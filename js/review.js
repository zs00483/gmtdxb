/* ==========================================================
   review.js — GMTDXB Product Reviews Logic
   ==========================================================
   Handles:
   ✅ User review submission
   ✅ Star rating system
   ✅ Displaying existing reviews from Firestore
   ✅ Average rating calculation
   ========================================================== */

// Ensure Firebase is loaded
if (typeof firebase === "undefined") {
  console.error("Firebase SDK not found. Make sure firebase.js is loaded first.");
}

/* ------------------------------------------
   🔹 Extract product ID from URL
------------------------------------------ */
function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

/* ------------------------------------------
   🔹 Star Rating UI
------------------------------------------ */
function setupStarRating() {
  const stars = document.querySelectorAll(".star-rating i");
  let selected = 0;

  stars.forEach((star, index) => {
    star.addEventListener("mouseover", () => highlightStars(index + 1));
    star.addEventListener("mouseleave", () => highlightStars(selected));
    star.addEventListener("click", () => {
      selected = index + 1;
      document.getElementById("ratingValue").value = selected;
    });
  });

  function highlightStars(count) {
    stars.forEach((star, idx) => {
      if (idx < count) {
        star.classList.remove("text-gray-500");
        star.classList.add("text-yellow-400");
      } else {
        star.classList.remove("text-yellow-400");
        star.classList.add("text-gray-500");
      }
    });
  }
}

/* ------------------------------------------
   🔹 Submit Review
------------------------------------------ */
async function handleReviewSubmit() {
  const form = document.getElementById("reviewForm");
  if (!form) return;

  const productId = getProductId();
  if (!productId) return alert("❌ Product not found.");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const rating = parseInt(form.rating.value);
    const comment = form.comment.value.trim();
    const userName = localStorage.getItem("userName") || "Anonymous";
    const userEmail = localStorage.getItem("userEmail") || "Guest";
    const userId = localStorage.getItem("userUid") || "guest";

    if (!rating || rating < 1 || rating > 5) {
      alert("⚠️ Please select a star rating before submitting.");
      return;
    }

    const review = {
      productId,
      userId,
      userName,
      userEmail,
      rating,
      comment: comment || "No comment provided.",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    try {
      await firebase.firestore().collection("reviews").add(review);
      alert("✅ Thank you for your feedback!");
      form.reset();
      renderReviews(productId);
    } catch (err) {
      console.error("Review submission error:", err);
      alert("❌ Failed to submit your review. Try again later.");
    }
  });
}

/* ------------------------------------------
   🔹 Render Reviews
------------------------------------------ */
async function renderReviews(productId) {
  const reviewContainer = document.getElementById("reviewContainer");
  const ratingSummary = document.getElementById("ratingSummary");

  if (!reviewContainer) return;
  reviewContainer.innerHTML = `<p class="text-gray-400 text-center py-4">Loading reviews...</p>`;

  try {
    const snap = await firebase
      .firestore()
      .collection("reviews")
      .where("productId", "==", productId)
      .orderBy("createdAt", "desc")
      .get();

    if (snap.empty) {
      reviewContainer.innerHTML = `<p class="text-gray-400 text-center py-4">No reviews yet. Be the first to review this product!</p>`;
      if (ratingSummary) ratingSummary.innerHTML = `⭐ 0.0 (0 Reviews)`;
      return;
    }

    let totalRating = 0;
    let reviewsHTML = "";

    snap.forEach((doc) => {
      const r = doc.data();
      totalRating += r.rating;

      const stars = "⭐".repeat(r.rating) + "☆".repeat(5 - r.rating);

      reviewsHTML += `
        <div class="glass p-4 rounded-xl mb-3">
          <div class="flex justify-between mb-2">
            <h4 class="font-semibold text-white">${r.userName}</h4>
            <span class="text-yellow-400 text-sm">${stars}</span>
          </div>
          <p class="text-gray-300 text-sm mb-2">${r.comment}</p>
          <p class="text-gray-500 text-xs">${formatDate(r.createdAt)}</p>
        </div>
      `;
    });

    const avgRating = (totalRating / snap.size).toFixed(1);
    reviewContainer.innerHTML = reviewsHTML;

    if (ratingSummary)
      ratingSummary.innerHTML = `⭐ ${avgRating} (${snap.size} Review${snap.size > 1 ? "s" : ""})`;
  } catch (err) {
    console.error("Error loading reviews:", err);
    reviewContainer.innerHTML = `<p class="text-red-400 text-center py-4">⚠️ Failed to load reviews.</p>`;
  }
}

/* ------------------------------------------
   🔹 Initialize
------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  const productId = getProductId();
  if (!productId) return;

  setupStarRating();
  handleReviewSubmit();
  renderReviews(productId);
});
