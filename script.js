document.addEventListener("DOMContentLoaded", () => {
  const URL = "https://vsjrqeaubmoxjzlklzbg.supabase.co",
    KEY = "sb_publishable_jaQjrYZSve2__Pw5594YEg_R_ou42Sm",
    MINIMUM = 100;
  const db = window.supabase?.createClient(URL, KEY),
    money = (n) =>
      new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
      }).format(Number(n) || 0);
  const fallback = [
    ["amazon-350", "Amazon", 350, 70, "Popular"],
    ["amazon-800", "Amazon", 800, 180, "Premium"],
    ["amazon-1800", "Amazon", 1800, 380, "Best value"],
    ["google-350", "Google Play", 350, 80, "Popular"],
    ["google-1000", "Google Play", 1000, 250, "Premium"],
    ["google-2000", "Google Play", 2000, 450, "Best value"],
    ["apple-350", "Apple", 350, 80, "Popular"],
    ["apple-800", "Apple", 800, 200, "Premium"],
    ["apple-1800", "Apple", 1800, 430, "Best value"],
    ["amazon-300", "Amazon", 300, 70, "Starter"],
    ["google-800", "Google Play", 800, 200, "Premium"],
    ["apple-1000", "Apple", 1000, 220, "Popular"],
    ["amazon-400", "Amazon", 400, 90, "Starter"],
    ["google-900", "Google Play", 900, 220, "Popular"],
    ["apple-2000", "Apple", 2000, 450, "Best value"],
  ].map((x, i) => ({
    id: x[0],
    slug: x[0],
    brand: x[1],
    name: `${x[1]} ${money(x[2])}`,
    face_value: x[2],
    price: x[3],
    badge: x[4],
    sort_order: i,
    is_active: true,
  }));
  let products = [],
    cart = loadCart(),
    lastFocus = null;
  const $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)],
    els = {
      grid: $("#productGrid"),
      filters: $("#brandFilters"),
      search: $("#productSearch"),
      badge: $("#cartBadge"),
      cart: $("#cartItems"),
      total: $("#cartTotal"),
      progress: $("#minimumProgress"),
      minimum: $("#minimumOrderMessage"),
      checkout: $("#checkoutBtn"),
      summary: $("#checkoutSummary"),
      form: $("#checkoutForm"),
      toast: $("#toast"),
    };
  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem("gl-cart-v2")) || [];
    } catch {
      return [];
    }
  }
  function saveCart() {
    localStorage.setItem("gl-cart-v2", JSON.stringify(cart));
  }
  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => els.toast.classList.remove("show"), 2600);
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }
  function open(name) {
    lastFocus = document.activeElement;
    const el = $(`#${name}Overlay`);
    el.hidden = false;
    document.body.classList.add("modal-open");
    setTimeout(() => el.querySelector("button,input")?.focus(), 0);
  }
  function close(name) {
    const el = $(`#${name}Overlay`);
    el.hidden = true;
    if (!$$(".overlay:not([hidden])").length)
      document.body.classList.remove("modal-open");
    lastFocus?.focus();
  }
  function slug(s) {
    return s.toLowerCase().replace(/\s+/g, "-");
  }
  async function loadProducts() {
    if (db) {
      const { data, error } = await db
        .from("products")
        .select("id,slug,brand,title,value,price,badge,sort_order,available")
        .eq("available", true)
        .order("sort_order");
      products =
        !error && data?.length
          ? data.map((p) => ({
              ...p,
              name: p.title,
              face_value: p.value,
              is_active: p.available,
            }))
          : fallback;
    } else products = fallback;
    cart = cart.filter((c) =>
      products.some((p) => String(p.id) === String(c.id)),
    );
    renderFilters();
    renderProducts();
    renderCart();
  }
  function renderFilters() {
    const brands = [...new Set(products.map((p) => p.brand))];
    els.filters.innerHTML =
      '<button class="filter active" data-brand="all">All cards</button>' +
      brands
        .map((b) => `<button class="filter" data-brand="${b}">${b}</button>`)
        .join("");
  }
  function renderProducts() {
    const active = $(".filter.active")?.dataset.brand || "all",
      q = els.search.value.trim().toLowerCase(),
      shown = products.filter(
        (p) =>
          (active === "all" || p.brand === active) &&
          `${p.brand} ${p.face_value}`.toLowerCase().includes(q),
      );
    els.grid.innerHTML = shown.length
      ? shown
          .map((p) => {
            const saving = Math.max(
              0,
              Number(p.face_value) - Number(p.price),
            );

            return `<article class="product-card"><div class="product-art ${slug(p.brand)}"><span class="product-badge">${escapeHtml(p.badge || "Available")}</span><span class="product-brand">${escapeHtml(p.brand)}</span><strong>${money(p.face_value)}</strong></div><div class="product-info"><p>Digital gift card · Face value</p><div><div><h3>${escapeHtml(p.name)}</h3><span class="price">${money(p.price)}</span><span class="product-saving">Save ${money(saving)}</span></div><button class="add-button" data-add="${p.id}" aria-label="Add ${escapeHtml(p.name)} to cart">+</button></div></div></article>`;
          })
          .join("")
      : '<div class="empty-products">No cards match your search.</div>';
  }
  function add(id) {
    const p = products.find((x) => String(x.id) === String(id));
    if (!p) return;
    const existing = cart.find((x) => String(x.id) === String(id));
    existing
      ? (existing.quantity = Math.min(10, existing.quantity + 1))
      : cart.push({ id: p.id, quantity: 1 });
    saveCart();
    renderCart();
    toast(`${p.name} added`);
  }
  function total() {
    return cart.reduce((sum, c) => {
      const p = products.find((x) => String(x.id) === String(c.id));
      return sum + (p?.price || 0) * c.quantity;
    }, 0);
  }
  function renderCart() {
    const count = cart.reduce((s, c) => s + c.quantity, 0),
      sum = total();
    els.badge.textContent = count;
    els.total.textContent = money(sum);
    els.progress.style.width = `${Math.min(100, (sum / MINIMUM) * 100)}%`;
    els.minimum.textContent =
      sum >= MINIMUM
        ? "Minimum reached—you can continue."
        : `${money(MINIMUM - sum)} more to reach the minimum.`;
    els.checkout.disabled = !cart.length || sum < MINIMUM;
    els.cart.innerHTML = cart.length
      ? cart
          .map((c) => {
            const p = products.find((x) => String(x.id) === String(c.id));
            if (!p) return "";
            return `<article class="cart-item"><div class="cart-thumb">${p.brand[0]}</div><div><h3>${p.name}</h3><p>${money(p.price)} each</p><div class="quantity"><button data-qty="${p.id}" data-delta="-1" aria-label="Decrease">−</button><strong>${c.quantity}</strong><button data-qty="${p.id}" data-delta="1" aria-label="Increase">+</button></div></div><strong>${money(p.price * c.quantity)}</strong></article>`;
          })
          .join("")
      : '<div class="empty-cart"><strong>Your cart is ready for something good.</strong><p>Add a card from the collection.</p></div>';
    saveCart();
  }
  function changeQty(id, delta) {
    const item = cart.find((x) => String(x.id) === String(id));
    if (!item) return;
    item.quantity += delta;
    if (item.quantity < 1) cart = cart.filter((x) => x !== item);
    if (item.quantity > 10) item.quantity = 10;
    renderCart();
  }
  function renderSummary() {
    els.summary.innerHTML =
      cart
        .map((c) => {
          const p = products.find((x) => String(x.id) === String(c.id));
          return `<div class="summary-row"><span>${p.name} × ${c.quantity}</span><strong>${money(p.price * c.quantity)}</strong></div>`;
        })
        .join("") +
      `<div class="summary-row summary-total"><span>Total</span><strong>${money(total())}</strong></div>`;
  }
  function validate() {
    let ok = true;
    const name = $("#checkoutUsername"),
      email = $("#checkoutEmail"),
      consent = $("#checkoutConsent");
    $("#usernameError").textContent = "";
    $("#emailError").textContent = "";
    if (name.value.trim().length < 2) {
      $("#usernameError").textContent = "Please enter at least 2 characters.";
      ok = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      $("#emailError").textContent = "Enter a valid email address.";
      ok = false;
    }
    if (!consent.checked) {
      toast("Please accept the order terms.");
      ok = false;
    }
    return ok;
  }

  async function notifyDiscord(order, customerName, customerEmail) {
    const items = cart.map((cartItem) => {
      const product = products.find(
        (candidate) => String(candidate.id) === String(cartItem.id),
      );

      return {
        product_id: product?.id,
        product_name: product?.name || "Gift card",
        product_value: Number(product?.face_value) || 0,
        unit_price: Number(product?.price) || 0,
        quantity: cartItem.quantity,
        subtotal: (Number(product?.price) || 0) * cartItem.quantity,
      };
    });

    const notification = {
      id: order.id,
      order_number: order.order_number,
      customer_name: customerName,
      customer_email: customerEmail,
      total: order.total,
      status: order.status || "pending",
      items,
    };

    const { data, error } = await db.functions.invoke("dynamic-handler", {
      body: notification,
    });

    if (error || data?.success === false) {
      console.warn(
        "Order saved, but the Discord notification could not be delivered.",
        error || data,
      );
      return false;
    }

    return true;
  }

  async function submit() {
    if (!validate() || total() < MINIMUM) return;
    const button = $("#checkoutConfirm"),
      error = $("#checkoutError");
    button.disabled = true;
    button.textContent = "Submitting…";
    error.textContent = "";
    try {
      if (!db) throw new Error("Order service is unavailable.");
      const customerName = $("#checkoutUsername").value.trim();
      const customerEmail = $("#checkoutEmail").value.trim();
      const payload = cart.map((c) => ({
        product_id: c.id,
        quantity: c.quantity,
      }));
      const { data, error: rpcError } = await db.rpc("create_order_secure", {
        p_customer_name: customerName,
        p_customer_email: customerEmail,
        p_cart: payload,
      });
      if (rpcError) throw rpcError;
      const result = typeof data === "string" ? JSON.parse(data) : data;
      if (!result?.success)
        throw new Error(result?.error || "The request could not be created.");

      const discordDelivered = await notifyDiscord(
        result,
        customerName,
        customerEmail,
      );

      close("checkout");
      $("#successOrderReference").textContent = result.order_number;
      $("#successOrderTotal").textContent =
        `Verified total: ${money(result.total)}`;
      cart = [];
      renderCart();
      els.form.reset();
      open("success");

      if (!discordDelivered) {
        toast("Order saved. Staff notification is temporarily delayed.");
      }
    } catch (e) {
      console.error(e);
      error.textContent =
        e.message || "We could not submit your request. Please try again.";
    } finally {
      button.disabled = false;
      button.textContent = "Submit request";
    }
  }
  const legal = {
    terms: [
      "Order terms",
      "Submitting creates a request, not an immediate purchase or guarantee of availability. Pricing and availability are verified when the request is created. We may approve, reject, or contact you for clarification. You must provide accurate contact information and use the service lawfully.",
    ],
    privacy: [
      "Privacy notice",
      "We collect the name and email you submit, order contents, timestamps, and operational security information needed to process and protect requests. We use this data for fulfillment, support, fraud prevention, and legal compliance. Contact support to request access or deletion where applicable.",
    ],
    refunds: [
      "Refund policy",
      "Because submission is a pending request, no payment is captured by this website. If a separate approved transaction is completed, its refund eligibility and delivery terms must be confirmed before payment. Digital codes that have been revealed or redeemed are generally non-returnable where permitted by law.",
    ],
  };
  function showLegal(type) {
    const [x, y] = legal[type];
    $("#legalTitle").textContent = x;
    $("#legalContent").innerHTML =
      `<p>Last updated: 16 August 2026</p><p>${y}</p><h3>Questions</h3><p>Email <a href="mailto:grekofinal@gmail.com">grekofinal@gmail.com</a> before submitting if anything is unclear.</p>`;
    open("legal");
  }

  function collapseTimelineEvents(events) {
    const collapsed = [];

    for (const event of events) {
      const previous = collapsed[collapsed.length - 1];
      const eventTime = new Date(event.created_at).getTime();
      const previousTime = previous
        ? new Date(previous.created_at).getTime()
        : 0;

      const sameUpdate =
        previous &&
        previous.status === event.status &&
        Math.abs(eventTime - previousTime) <= 10000;

      if (!sameUpdate) {
        collapsed.push(event);
        continue;
      }

      const currentMessage = String(event.message || "").toLowerCase();
      const previousMessage = String(previous.message || "").toLowerCase();

      const currentIsAdmin = currentMessage.includes("admin dashboard");
      const previousIsAdmin = previousMessage.includes("admin dashboard");

      if (currentIsAdmin && !previousIsAdmin) {
        collapsed[collapsed.length - 1] = event;
      }
    }

    return collapsed;
  }

  async function trackOrder() {
    const reference = $("#trackReference").value.trim().toUpperCase(),
      email = $("#trackEmail").value.trim().toLowerCase(),
      button = $("#trackSubmit"),
      error = $("#trackError"),
      result = $("#trackingResult");
    error.textContent = "";
    result.hidden = true;
    if (!reference || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      error.textContent = "Enter your order reference and the matching email.";
      return;
    }
    button.disabled = true;
    button.textContent = "Looking up…";
    try {
      if (!db) throw new Error("Tracking is temporarily unavailable.");
      const { data, error: rpcError } = await db.rpc("track_order_secure", {
        p_order_number: reference,
        p_customer_email: email,
      });
      if (rpcError) throw rpcError;
      const order = typeof data === "string" ? JSON.parse(data) : data;
      if (!order?.success)
        throw new Error(order?.error || "No matching order was found.");
      const items = Array.isArray(order.items) ? order.items : [],
        history = collapseTimelineEvents(
          Array.isArray(order.history) ? order.history : [],
        );
      result.innerHTML = `<div class="tracking-hero"><div><small>ORDER REFERENCE</small><strong>${escapeHtml(order.order_number)}</strong></div><span class="status-pill">${escapeHtml(order.status)}</span></div><div class="tracking-meta"><div><span>Verified total</span><strong>${money(order.total)}</strong></div><div><span>Submitted</span><strong>${new Date(order.created_at).toLocaleDateString("en-GB")}</strong></div></div><div class="tracking-items"><h3>Order contents</h3>${items.map((i) => `<div class="tracking-line"><span>${escapeHtml(i.product_name)} × ${Number(i.quantity) || 0}</span><strong>${money(i.subtotal)}</strong></div>`).join("")}</div><div class="tracking-timeline"><h3>Status timeline</h3>${history.map((h) => `<div class="timeline-event"><span class="timeline-dot"></span><div><strong>${escapeHtml(h.status).replace(/^./, (x) => x.toUpperCase())}</strong><small>${escapeHtml(h.message || "Status updated")} · ${new Date(h.created_at).toLocaleString("en-GB")}</small></div></div>`).join("")}</div>`;
      result.hidden = false;
    } catch (e) {
      error.textContent =
        e.message === "NO_MATCH"
          ? "No order matched those details. Check both fields and try again."
          : e.message || "Tracking is unavailable right now.";
    } finally {
      button.disabled = false;
      button.textContent = "Find my order";
    }
  }
  els.filters.addEventListener("click", (e) => {
    const b = e.target.closest("[data-brand]");
    if (!b) return;
    $$(".filter").forEach((x) => x.classList.toggle("active", x === b));
    renderProducts();
  });
  els.search.addEventListener("input", renderProducts);
  els.grid.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (b) add(b.dataset.add);
  });
  els.cart.addEventListener("click", (e) => {
    const b = e.target.closest("[data-qty]");
    if (b) changeQty(b.dataset.qty, Number(b.dataset.delta));
  });
  $("#cartBtn").onclick = () => open("cart");
  els.checkout.onclick = () => {
    renderSummary();
    close("cart");
    open("checkout");
  };
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    submit();
  });
  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-close]"),
      l = e.target.closest("[data-legal]");
    if (c) close(c.dataset.close);
    if (l) showLegal(l.dataset.legal);
    if (e.target.classList.contains("overlay"))
      close(e.target.id.replace("Overlay", ""));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const top = $$(".overlay:not([hidden])").pop();
      if (top) close(top.id.replace("Overlay", ""));
    }
  });
  $("#successOrderReference").onclick = async () => {
    await navigator.clipboard?.writeText(
      $("#successOrderReference").textContent,
    );
    toast("Reference copied");
  };
  $("#trackOrderBtn").onclick = $("#trackOrderCta").onclick = () =>
    open("track");
  $("#trackForm").addEventListener("submit", (e) => {
    e.preventDefault();
    trackOrder();
  });
  $("#year").textContent = new Date().getFullYear();
  loadProducts();
});
