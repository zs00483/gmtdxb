/* ===============================================
   main.js — GMTDXB Website Logic
   ===============================================
   Handles:
   ✅ Cart management (Add/Remove/Update)
   ✅ User authentication (from firebase.js)
   ✅ Checkout order placement
   ✅ Navbar dynamic updates
   ✅ LocalStorage persistence
   =============================================== */

// Check Firebase is loaded
if (typeof firebase === "undefined") {
  console.error("Firebase SDK not found. Make sure firebase.js is loaded before main.js");
}

/* -------------------------------
   🔹 GLOBALS
--------------------------------*/
const userUid = localStorage.getItem("userUid");
const userName = localStorage.getItem("userName");
const userEmail = localStorage.getItem("userEmail");
let cart = JSON.parse(localStorage.getItem("gmt_cart")) || [];

/* -------------------------------
   🔹 CART FUNCTIONS
--------------------------------*/

// Save cart to localStorage
function saveCart() {
  localStorage.setItem("gmt_cart", JSON.stringify(cart));
  updateCartCount();
}

// Add product to cart
window.addToCart = function (product) {
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  alert(`✅ ${product.name} added to cart!`);
};

// Remove product from cart
window.removeFromCart = function (id) {
  cart = cart.filter((item) => item.id !== id);
  saveCart();
  renderCart();
};

// Update quantity
window.updateQty = function (id, qty) {
  const item = cart.find((i) => i.id === id);
  if (item) item.qty = parseInt(qty);
  saveCart();
  renderCart();
};

// Clear cart
window.clearCart = function () {
  cart = [];
  saveCart();
  renderCart();
};

/* -------------------------------
   🔹 CART RENDERING (cart.html)
--------------------------------*/
function renderCart() {
  const cartContainer = document.getElementById("cartItems");
  const subtotalElem = document.getElementById("subtotal");
  if (!cartContainer) return;

  cartContainer.innerHTML = "";

  if (cart.length === 0) {
    cartContainer.innerHTML = `<p class="text-gray-400 text-center">Your cart is empty.</p>`;
    if (subtotalElem) subtotalElem.textContent = "AED 0";
    return;
  }

  let subtotal = 0;
  cart.forEach((item) => {
    subtotal += item.price * item.qty;
    const div = document.createElement("div");
    div.className = "flex items-center justify-between border-b border-gray-700 py-3";
    div.innerHTML = `
      <div class="flex items-center gap-4">
        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md" />
        <div>
          <h4 class="font-semibold">${item.name}</h4>
          <p class="text-sm text-gray-400">${item.brand || ""}</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-blue-400 font-semibold">AED ${(item.price * item.qty).toFixed(2)}</p>
        <input type="number" value="${item.qty}" min="1" class="w-16 mt-1 bg-gray-800 text-center text-sm" onchange="updateQty('${item.id}', this.value)" />
        <button class="text-red-400 text-xs mt-1 block" onclick="removeFromCart('${item.id}')">Remove</button>
      </div>
    `;
    cartContainer.appendChild(div);
  });

  if (subtotalElem) subtotalElem.textContent = `AED ${subtotal.toFixed(2)}`;
}

// Update cart icon badge
function updateCartCount() {
  const cartCount = document.getElementById("cartCount");
  if (cartCount) cartCount.textContent = cart.length;
}

/* -------------------------------
   🔹 CHECKOUT PAGE
--------------------------------*/
async function handleCheckout() {
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("⚠️ Your cart is empty!");
      return;
    }

    const name = form.name.value;
    const email = form.email.value;
    const phone = form.phone.value;
    const city = form.city.value;
    const address = form.address.value;
    const delivery = form.delivery.value;
    const payment = form.payment.value;

    const subtotal = cart.reduce((t, i) => t + i.price * i.qty, 0);
    const shipping = delivery.includes("Express") ? 50 : 25;
    const tax = subtotal * 0.05;
    const total = subtotal + shipping + tax;

    const orderPayload = {
      userId: userUid || "guest",
      userEmail: email,
      name,
      phone,
      city,
      address,
      delivery,
      paymentMethod: payment,
      items: cart,
      subtotal,
      shipping,
      tax,
      total,
    };

    try {
      const orderId = await createOrder(orderPayload);
      clearCart();
      alert(`✅ Order placed successfully! Order ID: ${orderId}`);
      window.location.href = "index.html";
    } catch (err) {
      console.error("Order error:", err);
      alert("❌ Failed to place order. Try again.");
    }
  });
}

/* -------------------------------
   🔹 NAVBAR LOGIC (USER BUTTON)
--------------------------------*/
function setupNavbar() {
  const userBtn = document.getElementById("userBtn");
  if (!userBtn) return;

  if (userName || userEmail) {
    userBtn.innerHTML = `<i class="fa-solid fa-circle-user text-lg text-blue-400"></i>`;
    userBtn.title = userName || userEmail;
    userBtn.onclick = () => {
      if (confirm("Logout from GMTDXB?")) {
        logoutUser().then(() => (window.location.href = "login.html"));
      }
    };
  } else {
    userBtn.onclick = () => (window.location.href = "login.html");
  }
}

/* -------------------------------
   🔹 CONTACT & SERVICE FORMS
--------------------------------*/
function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.name.value;
    const email = form.email.value;
    const message = form.message.value;

    try {
      await saveContactMessage(name, email, message);
      alert("✅ Message sent successfully!");
      form.reset();
    } catch (err) {
      console.error("Contact error:", err);
      alert("❌ Failed to send message.");
    }
  });
}

function setupServiceForm() {
  const form = document.getElementById("serviceForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      serviceType: form.serviceType.value,
      message: form.message.value,
    };

    try {
      await saveServiceRequest(payload);
      alert("✅ Service request submitted successfully!");
      form.reset();
    } catch (err) {
      console.error("Service request error:", err);
      alert("❌ Failed to send request.");
    }
    
  });
}

/* -------------------------------
   🔹 PAGE INIT
--------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  setupNavbar();
  renderCart();
  handleCheckout();
  setupContactForm();
  setupServiceForm();
});
document.addEventListener("DOMContentLoaded", () => {
  const userBtn = document.getElementById("userBtn");

  if (userBtn) {
    userBtn.addEventListener("click", () => {
      window.location.href = "login.html";
    });
  }
});
