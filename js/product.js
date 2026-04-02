/* ==========================================================
   product.js — GMTDXB Product Details Page
   ==========================================================
   Handles:
   ✅ Fetching a single product from Firestore using ID
   ✅ Displaying product details dynamically
   ✅ Add to Cart / Buy Now actions
   ✅ Related products (optional)
   ========================================================== */

// Ensure Firebase is loaded
if (typeof firebase === "undefined") {
  console.error("Firebase SDK not found. Make sure firebase.js is loaded first.");
}

/* ------------------------------------------
   🔹 Extract product ID from URL
------------------------------------------ */
function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

/* ------------------------------------------
   🔹 Render Product Details
------------------------------------------ */
async function renderProductDetails() {
  const productContainer = document.getElementById("productContainer");
  const productId = getProductIdFromURL();

  if (!productId) {
    productContainer.innerHTML = `<p class="text-center text-gray-400 py-10">❌ Invalid product link.</p>`;
    return;
  }

  try {
    const product = await getProductById(productId);
    if (!product) {
      productContainer.innerHTML = `<p class="text-center text-gray-400 py-10">❌ Product not found.</p>`;
      return;
    }

    // Build product detail HTML
    productContainer.innerHTML = `
      <div class="grid md:grid-cols-2 gap-8">
        <div>
          <img src="${product.image}" alt="${product.name}" class="w-full rounded-xl shadow-lg">
        </div>

        <div>
          <h1 class="text-3xl font-bold mb-2 text-blue-400">${product.name}</h1>
          <p class="text-gray-300 text-sm mb-4">${product.brand || ""}</p>
          <p class="text-gray-400 mb-4">${product.description || "No description available."}</p>

          <p class="text-2xl font-semibold text-white mb-2">${formatCurrencyAED(product.price)}</p>
          <p class="text-sm text-gray-400 mb-6">Category: ${product.category || "—"}</p>

          <div class="flex gap-4">
            <button id="addToCartBtn" class="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-md font-medium">Add to Cart</button>
            <button id="buyNowBtn" class="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-md font-medium">Buy Now</button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    document.getElementById("addToCartBtn").addEventListener("click", () => {
      addToCart({
        id: productId,
        name: product.name,
        price: product.price,
        image: product.image,
        brand: product.brand,
      });
    });

    document.getElementById("buyNowBtn").addEventListener("click", () => {
      addToCart({
        id: productId,
        name: product.name,
        price: product.price,
        image: product.image,
        brand: product.brand,
      });
      window.location.href = "checkout.html";
    });

    // Optional: Show related products
    renderRelatedProducts(product.category, productId);

  } catch (err) {
    console.error("Product load error:", err);
    productContainer.innerHTML = `<p class="text-center text-gray-400 py-10">⚠️ Failed to load product details.</p>`;
  }
}

/* ------------------------------------------
   🔹 Related Products Section
------------------------------------------ */
async function renderRelatedProducts(category, excludeId) {
  const relatedContainer = document.getElementById("relatedProducts");
  if (!relatedContainer || !category) return;

  try {
    const { products } = await getProducts({ limit: 4, filters: { category } });

    const related = products.filter((p) => p.id !== excludeId);
    if (related.length === 0) {
      relatedContainer.innerHTML = `<p class="text-gray-400 text-center">No related products found.</p>`;
      return;
    }

    relatedContainer.innerHTML = `
      <h2 class="text-2xl font-semibold text-blue-400 mb-6">Related Products</h2>
      <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
        ${related
          .map(
            (p) => `
          <div class="glass p-4 rounded-xl hover:scale-105 transition cursor-pointer" onclick="window.location.href='product.html?id=${p.id}'">
            <img src="${p.image}" alt="${p.name}" class="w-full h-40 object-cover rounded-md mb-3">
            <h3 class="text-white font-medium">${p.name}</h3>
            <p class="text-sm text-gray-400">${p.brand || ""}</p>
            <p class="text-blue-400 font-semibold mt-1">${formatCurrencyAED(p.price)}</p>
          </div>`
          )
          .join("")}
      </div>
    `;
  } catch (err) {
    console.error("Related products error:", err);
  }
}

/* ------------------------------------------
   🔹 Initialize Page
------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  renderProductDetails();
});
