/* ==========================================================
   shop.js — GMTDXB Shop Page Logic
   ==========================================================
   Handles:
   ✅ Fetching products dynamically from Firestore
   ✅ Category & brand filters
   ✅ Search functionality
   ✅ Pagination (Load more)
   ✅ Add to Cart
   ========================================================== */

// Ensure Firebase is loaded
if (typeof firebase === "undefined") {
  console.error("Firebase SDK not found. Make sure firebase.js is loaded before this file.");
}

/* ------------------------------------------
   🔹 Global Variables
------------------------------------------ */
let lastVisible = null;
let currentFilters = {};
let loadingProducts = false;

/* ------------------------------------------
   🔹 Fetch & Render Products
------------------------------------------ */
async function loadProducts(reset = false) {
  const container = document.getElementById("product-grid")
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  if (!container) return;
  if (loadingProducts) return;

  loadingProducts = true;
  if (reset) {
    container.innerHTML = `<p class="text-gray-400 text-center col-span-full py-6">Loading products...</p>`;
    lastVisible = null;
  } else {
    loadMoreBtn.innerText = "Loading...";
  }

  try {
    const { products, lastVisible: newLast } = await getProducts({
      limit: 12,
      startAfterDoc: reset ? null : lastVisible,
      filters: currentFilters,
    });

    if (reset) container.innerHTML = "";

    if (products.length === 0 && reset) {
      container.innerHTML = `<p class="text-gray-400 text-center col-span-full py-6">No products found.</p>`;
      loadMoreBtn.style.display = "none";
      return;
    }

    products.forEach((p) => {
      const card = document.createElement("div");
      card.className =
        "glass rounded-2xl p-4 hover:scale-105 transition cursor-pointer";
      card.innerHTML = `
        <img src="${p.images?.[0] || ''}" alt="${p.name}" class="w-full h-48 object-cover rounded-lg mb-3" onclick="viewProduct('${p.id}')">
        <h3 class="font-semibold text-white text-lg">${p.name}</h3>
        <p class="text-sm text-gray-400">${p.brand || ""}</p>
        <p class="text-blue-400 font-semibold mt-1">${formatCurrencyAED(p.price)}</p>
        <button onclick="addToCart(${JSON.stringify(p).replaceAll('"', '&quot;')})"
          class="bg-blue-500 hover:bg-blue-600 mt-3 w-full py-2 rounded-md text-white font-medium">
          Add to Cart
        </button>
      `;
      container.appendChild(card);
    });

    // Pagination handling
    lastVisible = newLast;
    loadMoreBtn.style.display = newLast ? "block" : "none";
    loadMoreBtn.innerText = "Load More";
  } catch (err) {
    console.error("Error loading products:", err);
    container.innerHTML = `<p class="text-red-400 text-center col-span-full py-6">⚠️ Failed to load products.</p>`;
  } finally {
    loadingProducts = false;
  }
}

/* ------------------------------------------
   🔹 View Product
------------------------------------------ */
window.viewProduct = function (id) {
  window.location.href = `product.html?id=${id}`;
};

/* ------------------------------------------
   🔹 Filter by Category
------------------------------------------ */
function setupCategoryFilters() {
  const buttons = document.querySelectorAll("[data-category]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const category = btn.getAttribute("data-category");
      currentFilters = category ? { category } : {};
      buttons.forEach((b) =>
        b.classList.remove("bg-blue-500", "text-white")
      );
      btn.classList.add("bg-blue-500", "text-white");
      loadProducts(true);
    });
  });
}

/* ------------------------------------------
   🔹 Search Products
------------------------------------------ */
function setupSearchBar() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", async (e) => {
    const query = e.target.value.trim().toLowerCase();

    if (query.length === 0) {
      loadProducts(true);
      return;
    }

    const { products } = await getProducts({ limit: 50 });
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.brand && p.brand.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
    );

    const container = document.getElementById("productGrid");
    container.innerHTML = "";

    if (filtered.length === 0) {
      container.innerHTML = `<p class="text-gray-400 text-center col-span-full py-6">No matching products found.</p>`;
      return;
    }

    filtered.forEach((p) => {
      const card = document.createElement("div");
      card.className = "glass rounded-2xl p-4 hover:scale-105 transition cursor-pointer";
      card.innerHTML = `
        <img src="${p.images?.[0] || ''}" alt="${p.name}" class="w-full h-48 object-cover rounded-lg mb-3" onclick="viewProduct('${p.id}')">
        <h3 class="font-semibold text-white text-lg">${p.name}</h3>
        <p class="text-sm text-gray-400">${p.brand || ""}</p>
        <p class="text-blue-400 font-semibold mt-1">${formatCurrencyAED(p.price)}</p>
        <button onclick="addToCart(${JSON.stringify(p).replaceAll('"', '&quot;')})"
          class="bg-blue-500 hover:bg-blue-600 mt-3 w-full py-2 rounded-md text-white font-medium">
          Add to Cart
        </button>
      `;
      container.appendChild(card);
    });
  });
}

/* ------------------------------------------
   🔹 Load More Button
------------------------------------------ */
function setupLoadMore() {
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  if (!loadMoreBtn) return;
  loadMoreBtn.addEventListener("click", () => loadProducts(false));
}

/* ------------------------------------------
   🔹 Init Shop Page
------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  loadProducts(true);
  setupCategoryFilters();
  setupSearchBar();
  setupLoadMore();
});
