/* ==========================================================
   compare.js — GMTDXB Product Comparison Logic
   ==========================================================
   Handles:
   ✅ Add / Remove products for comparison
   ✅ Store comparison data in localStorage
   ✅ Render comparison table dynamically
   ✅ View Compare page (compare.html)
   ========================================================== */

// Ensure utils.js & firebase.js are loaded
if (typeof firebase === "undefined") {
  console.error("Firebase SDK not found. Make sure firebase.js is loaded before this file.");
}

/* ------------------------------------------
   🔹 Globals
------------------------------------------ */
let compareList = JSON.parse(localStorage.getItem("gmt_compare")) || [];

/* ------------------------------------------
   🔹 Save to LocalStorage
------------------------------------------ */
function saveCompareList() {
  localStorage.setItem("gmt_compare", JSON.stringify(compareList));
  updateCompareBadge();
}

/* ------------------------------------------
   🔹 Add Product to Compare
------------------------------------------ */
window.addToCompare = function (product) {
  // Prevent duplicates
  if (compareList.find((p) => p.id === product.id)) {
    showToast("⚠️ Already in comparison list!", "warning");
    return;
  }

  if (compareList.length >= 3) {
    showToast("⚠️ You can only compare up to 3 products!", "error");
    return;
  }

  compareList.push({
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: product.price,
    category: product.category,
    condition: product.condition || "new",
    image: product.image,
    description: product.description || "",
  });

  saveCompareList();
  showToast(`✅ Added ${product.name} to compare list!`, "success");
};

/* ------------------------------------------
   🔹 Remove Product from Compare
------------------------------------------ */
window.removeFromCompare = function (id) {
  compareList = compareList.filter((p) => p.id !== id);
  saveCompareList();
  renderCompareTable();
};

/* ------------------------------------------
   🔹 Update Compare Badge (Navbar)
------------------------------------------ */
function updateCompareBadge() {
  const compareCount = document.getElementById("compareCount");
  if (compareCount) compareCount.textContent = compareList.length;
}

/* ------------------------------------------
   🔹 Render Compare Table (compare.html)
------------------------------------------ */
function renderCompareTable() {
  const container = document.getElementById("compareTable");
  if (!container) return;

  container.innerHTML = "";

  if (compareList.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-400 py-10">
        <p>No products selected for comparison.</p>
        <a href="shop.html" class="text-blue-400 hover:underline">Browse products</a>
      </div>
    `;
    return;
  }

  // Generate comparison headers
  const headers = ["Feature", ...compareList.map((p) => p.name)];

  // Rows: Image, Brand, Price, Category, Condition, Description
  const rows = [
    ["Image", ...compareList.map((p) => `<img src="${p.image}" class="w-28 h-28 object-cover rounded-md mx-auto">`)],
    ["Brand", ...compareList.map((p) => p.brand || "—")],
    ["Price", ...compareList.map((p) => formatCurrencyAED(p.price))],
    ["Category", ...compareList.map((p) => p.category || "—")],
    ["Condition", ...compareList.map((p) => p.condition || "New")],
    ["Description", ...compareList.map((p) => truncateText(p.description, 80))],
    [
      "Remove",
      ...compareList.map(
        (p) => `<button class="text-red-400 hover:underline" onclick="removeFromCompare('${p.id}')">Remove</button>`
      ),
    ],
  ];

  // Render table
  let html = `
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse text-center">
        <thead>
          <tr class="border-b border-gray-700">
            ${headers.map((h, i) =>
              i === 0
                ? `<th class="text-left py-3 px-3 text-blue-400">${h}</th>`
                : `<th class="py-3 px-3 text-white">${h}</th>`
            ).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr class="border-b border-gray-800 hover:bg-[#1b1e23]/40">
              ${row
                .map(
                  (col, i) =>
                    `<td class="py-3 px-3 ${i === 0 ? "text-left font-medium text-blue-400" : "text-gray-300"}">${col}</td>`
                )
                .join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

/* ------------------------------------------
   🔹 View Compare Page (Button)
------------------------------------------ */
window.viewComparePage = function () {
  if (compareList.length === 0) {
    showToast("⚠️ Add at least 2 products to compare.", "warning");
    return;
  }
  window.location.href = "compare.html";
};

/* ------------------------------------------
   🔹 Init Compare Page
------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  updateCompareBadge();
  renderCompareTable();
});
