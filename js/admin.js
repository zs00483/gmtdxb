/* ==========================================================
   admin.js — GMTDXB Admin Dashboard Logic
   ==========================================================
   Handles:
   ✅ Product CRUD (Add, Edit, Delete)
   ✅ Orders listing
   ✅ Service Requests listing
   ✅ Image Upload (Firebase or Cloudinary)
   ✅ Admin-only access validation
   ========================================================== */
  const sliderIndexMap = {};

function createSlider(images = [], id) {
  if (!images.length) return "";

  sliderIndexMap[id] = 0;

  return `
    <div class="relative w-24 h-20 flex items-center justify-center">
      
      <img id="slider-${id}" 
           src="${images[0]}" 
           class="w-20 h-16 object-contain bg-black rounded"/>

      <button onclick="prevSlide('${id}', ${JSON.stringify(images)})"
        class="absolute left-0 bg-black/70 text-white px-1">◀</button>

      <button onclick="nextSlide('${id}', ${JSON.stringify(images)})"
        class="absolute right-0 bg-black/70 text-white px-1">▶</button>
    </div>
  `;
}

function nextSlide(id, images) {
  if (!(id in sliderIndexMap)) sliderIndexMap[id] = 0;

  sliderIndexMap[id] = (sliderIndexMap[id] + 1) % images.length;

  document.getElementById(`slider-${id}`).src =
    images[sliderIndexMap[id]];
}
function prevSlide(id, images) {
  if (!(id in sliderIndexMap)) sliderIndexMap[id] = 0;

  sliderIndexMap[id] =
    (sliderIndexMap[id] - 1 + images.length) % images.length;

  document.getElementById(`slider-${id}`).src =
    images[sliderIndexMap[id]];
}
document.getElementById("imageCount").addEventListener("input", function () {
  const count = parseInt(this.value);
  const container = document.getElementById("imageInputs");

  container.innerHTML = "";

  if (count > 10) {
    alert("Max 10 images allowed");
    return;
  }

  for (let i = 0; i < count; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Image URL ${i + 1}`;
    input.className = "w-full p-2 mb-2 bg-gray-800 text-white rounded image-url";

    container.appendChild(input);
  }
});
// Ensure Firebase is initialized
if (typeof firebase === "undefined") {
  console.error("Firebase SDK not found. Make sure firebase.js is loaded first.");
}

/* ------------------------------------------
   🔹 GLOBAL REFERENCES
------------------------------------------ */
const adminUid = localStorage.getItem("userUid");
const adminEmail = localStorage.getItem("userEmail");

const productListElem = document.getElementById("productList");
const orderListElem = document.getElementById("orderList");
const serviceListElem = document.getElementById("serviceList");

/* ------------------------------------------
   🔹 ADMIN ACCESS CHECK
------------------------------------------ */
(async () => {
  if (!adminUid) {
    alert("⚠️ You must log in first!");
    window.location.href = "login.html";
    return;
  }

  const isAdmin = await checkUserRole(adminUid);
  if (!isAdmin) {
    alert("🚫 Access Denied! Admins only.");
    window.location.href = "index.html";
  }
})();

/* ------------------------------------------
   🔹 ADD PRODUCT
------------------------------------------ */
const addForm = document.getElementById("addProductForm");
if (addForm) {
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("productName").value;
    const brand = document.getElementById("productBrand").value;
    const category = document.getElementById("productCategory").value;
    const price = parseFloat(document.getElementById("productPrice").value);
   const imageInputs = document.querySelectorAll(".image-url");

let images = [];

imageInputs.forEach(input => {
  if (input.value.trim() !== "") {
    images.push(input.value.trim());
  }
});
    const description = document.getElementById("productDescription").value;

    const productData = {
      name,
      brand,
      category,
      price,
      images,
      description,
      stock: 10,
      condition: "new",
      displayOrder: Date.now(),
    };

    try {
      await addProduct(productData);
      alert(`✅ Product "${name}" added successfully!`);
      addForm.reset();
      loadProducts();
    } catch (err) {
      console.error("Add product error:", err);
      alert("❌ Failed to add product.");
    }
  });
}

/* ------------------------------------------
   🔹 LOAD PRODUCTS
------------------------------------------ */
async function loadProducts() {
  if (!productListElem) return;

  productListElem.innerHTML =
    `<tr><td colspan="5" class="text-center text-gray-400 py-4">Loading...</td></tr>`;

  try {
    const snapshot = await firebase.firestore()
      .collection("products")
      .get();

    productListElem.innerHTML = "";

    if (snapshot.empty) {
      productListElem.innerHTML =
        `<tr><td colspan="5" class="text-center text-gray-400 py-4">No products found.</td></tr>`;
      return;
    }

    snapshot.forEach((doc) => {
      const p = doc.data();

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>
          ${createSlider(p.images, doc.id)}
          <p>${p.name}</p>
        </td>
        <td>${p.brand || "-"}</td>
        <td>AED ${p.price}</td>
        <td>${p.category}</td>
        <td>
          <button onclick="editProduct('${doc.id}')">Edit</button>
          <button onclick="deleteProductConfirm('${doc.id}')">Delete</button>
        </td>
      `;

      productListElem.appendChild(tr);
    });

  } catch (err) {
    console.error("Load products error:", err);
  }
}

/* ------------------------------------------
   🔹 DELETE PRODUCT
------------------------------------------ */
window.deleteProductConfirm = async function (id) {
  if (confirm("Delete this product?")) {
    try {
      await deleteProduct(id);
      alert("🗑️ Product deleted successfully!");
      loadProducts();
    } catch (err) {
      console.error("Delete product error:", err);
      alert("❌ Failed to delete product.");
    }
  }
};

/* ------------------------------------------
   🔹 EDIT PRODUCT
------------------------------------------ */
window.editProduct = async function (id) {
  try {
    const product = await getProductById(id);
    if (!product) {
      alert("Product not found!");
      return;
    }

    // Prefill form fields
    document.getElementById("productName").value = product.name;
    document.getElementById("productBrand").value = product.brand;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productPrice").value = product.price;
   const container = document.getElementById("imageInputs");
container.innerHTML = "";

product.images.forEach((img, i) => {
  const input = document.createElement("input");
  input.type = "text";
  input.value = img;
  input.className = "image-url";
  container.appendChild(input);
});
    document.getElementById("productDescription").value = product.description;

    // Modify form submission temporarily
    addForm.onsubmit = async (e) => {
      e.preventDefault();
const imageInputs = document.querySelectorAll(".image-url");

let images = [];

imageInputs.forEach(input => {
  if (input.value.trim() !== "") {
    images.push(input.value.trim());
  }
});
      const updates = {
        name: document.getElementById("productName").value,
        brand: document.getElementById("productBrand").value,
        category: document.getElementById("productCategory").value,
        price: parseFloat(document.getElementById("productPrice").value),
       
        description: document.getElementById("productDescription").value,
      };

      try {
        await updateProduct(id, updates);
        alert("✅ Product updated successfully!");
        addForm.reset();
        addForm.onsubmit = null; // reset handler
        loadProducts();
      } catch (err) {
        console.error("Update error:", err);
        alert("❌ Failed to update product.");
      }
    };
  } catch (err) {
    console.error("Edit product error:", err);
  }
};

/* ------------------------------------------
   🔹 LOAD ORDERS
------------------------------------------ */
async function loadOrders() {
  if (!orderListElem) return;

  orderListElem.innerHTML =
    `<tr><td colspan="5" class="text-center text-gray-400 py-4">Loading orders...</td></tr>`;

  try {
    const snap = await firebase.firestore()
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    orderListElem.innerHTML = "";

    if (snap.empty) {
      orderListElem.innerHTML =
        `<tr><td colspan="5" class="text-center text-gray-400 py-4">No orders yet.</td></tr>`;
      return;
    }

    snap.forEach((doc) => {
      const o = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>#${doc.id.slice(0, 6)}</td>
        <td>${o.name || "Unknown"}</td>
        <td>${formatCurrencyAED(o.total)}</td>
        <td>
          <span class="${o.orderStatus === "delivered" ? "text-green-400" : "text-yellow-400"}">
            ${o.orderStatus}
          </span>
        </td>
        <td><button class="text-blue-400 hover:underline" onclick="viewOrder('${doc.id}')">View</button></td>
      `;
      orderListElem.appendChild(tr);
    });
  } catch (err) {
    console.error("Load orders error:", err);
  }
}

/* ------------------------------------------
   🔹 LOAD SERVICE REQUESTS
------------------------------------------ */
async function loadServices() {
  if (!serviceListElem) return;

  serviceListElem.innerHTML =
    `<tr><td colspan="4" class="text-center text-gray-400 py-4">Loading services...</td></tr>`;

  try {
    const snap = await firebase.firestore()
      .collection("serviceRequests")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    serviceListElem.innerHTML = "";

    if (snap.empty) {
      serviceListElem.innerHTML =
        `<tr><td colspan="4" class="text-center text-gray-400 py-4">No service requests found.</td></tr>`;
      return;
    }

    snap.forEach((doc) => {
      const s = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.name || "Unknown"}</td>
        <td>${s.serviceType}</td>
        <td><span class="${s.status === "completed" ? "text-green-400" : "text-yellow-400"}">${s.status}</span></td>
        <td>
          <button class="text-blue-400 hover:underline mr-2" onclick="updateServiceStatus('${doc.id}')">Update</button>
          <button class="text-red-400 hover:underline" onclick="deleteService('${doc.id}')">Delete</button>
        </td>
      `;
      serviceListElem.appendChild(tr);
    });
  } catch (err) {
    console.error("Load services error:", err);
  }
}

/* ------------------------------------------
   🔹 UPDATE SERVICE STATUS
------------------------------------------ */
window.updateServiceStatus = async function (id) {
  const newStatus = prompt("Enter new status (pending / processing / completed):");
  if (!newStatus) return;
  try {
    await firebase.firestore().collection("serviceRequests").doc(id).update({
      status: newStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    alert("✅ Status updated!");
    loadServices();
  } catch (err) {
    console.error("Update service error:", err);
  }
};

/* ------------------------------------------
   🔹 DELETE SERVICE REQUEST
------------------------------------------ */
window.deleteService = async function (id) {
  if (confirm("Delete this service request?")) {
    try {
      await firebase.firestore().collection("serviceRequests").doc(id).delete();
      alert("🗑️ Deleted successfully!");
      loadServices();
    } catch (err) {
      console.error("Delete service error:", err);
    }
  }
};

/* ------------------------------------------
   🔹 VIEW ORDER DETAILS (Modal Placeholder)
------------------------------------------ */
window.viewOrder = async function (id) {
  try {
    const doc = await firebase.firestore().collection("orders").doc(id).get();
    if (!doc.exists) {
      alert("Order not found!");
      return;
    }
    const order = doc.data();
    alert(`
🧾 Order ID: ${id}
👤 Customer: ${order.name}
📦 Items: ${order.items.length}
💰 Total: ${formatCurrencyAED(order.total)}
🚚 Status: ${order.orderStatus}
    `);
  } catch (err) {
    console.error("View order error:", err);
  }
};

/* ------------------------------------------
   🔹 INIT
------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadOrders();
  loadServices();

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await logoutUser();
      alert("👋 Logged out successfully!");
      window.location.href = "login.html";
    });
  }
});
