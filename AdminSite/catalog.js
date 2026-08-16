document.addEventListener("DOMContentLoaded", () => {
  const SUPABASE_URL = "https://vsjrqeaubmoxjzlklzbg.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_jaQjrYZSve2__Pw5594YEg_R_ou42Sm";

  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
  );

  let products = [];
  let editingProduct = null;

  const gate = document.getElementById("gate");
  const app = document.getElementById("app");
  const rows = document.getElementById("productRows");
  const searchInput = document.getElementById("searchInput");
  const brandFilter = document.getElementById("brandFilter");
  const availabilityFilter = document.getElementById("availabilityFilter");
  const overlay = document.getElementById("productOverlay");
  const form = document.getElementById("productForm");
  const toastElement = document.getElementById("toast");

  const fields = {
    id: document.getElementById("productId"),
    brand: document.getElementById("brandInput"),
    title: document.getElementById("titleInput"),
    value: document.getElementById("valueInput"),
    price: document.getElementById("priceInput"),
    badge: document.getElementById("badgeInput"),
    inventory: document.getElementById("inventoryInput"),
    description: document.getElementById("descriptionInput"),
    sort: document.getElementById("sortInput"),
    available: document.getElementById("availableInput"),
  };

  function euro(value) {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function makeSlug(brand, value) {
    return `${brand}-${Number(value)}`
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function showToast(message) {
    toastElement.textContent = message;
    toastElement.classList.add("show");

    clearTimeout(showToast.timeout);

    showToast.timeout = setTimeout(
      () => toastElement.classList.remove("show"),
      2600,
    );
  }

  async function requireAdmin() {
    const { data: sessionData } = await client.auth.getSession();

    if (!sessionData?.session?.user) {
      window.location.href = "admin.html";
      return false;
    }

    const { data, error } = await client.rpc("is_admin");

    if (error || data !== true) {
      await client.auth.signOut();
      window.location.href = "admin.html";
      return false;
    }

    gate.style.display = "none";
    app.hidden = false;
    return true;
  }

  async function loadProducts() {
    rows.innerHTML =
      '<tr><td colspan="7" class="table-message">Loading catalog…</td></tr>';

    const { data, error } = await client
      .from("products")
      .select("*")
      .order("sort_order")
      .order("id");

    if (error) {
      rows.innerHTML = `<tr><td colspan="7" class="table-message">${escapeHtml(error.message)}</td></tr>`;
      return;
    }

    products = Array.isArray(data) ? data : [];

    renderBrandFilter();
    renderStatistics();
    renderProducts();
  }

  function renderBrandFilter() {
    const selected = brandFilter.value;
    const brands = [
      ...new Set(products.map((product) => product.brand)),
    ].sort();

    brandFilter.innerHTML =
      '<option value="all">All brands</option>' +
      brands
        .map(
          (brand) =>
            `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`,
        )
        .join("");

    if (brands.includes(selected)) {
      brandFilter.value = selected;
    }
  }

  function renderStatistics() {
    const active = products.filter((product) => product.available);

    const brands = new Set(active.map((product) => product.brand));

    const value = active.reduce(
      (sum, product) => sum + Number(product.value || 0),
      0,
    );

    const average = active.length
      ? active.reduce((sum, product) => sum + Number(product.price || 0), 0) /
        active.length
      : 0;

    document.getElementById("activeStat").textContent = String(active.length);
    document.getElementById("brandStat").textContent = String(brands.size);
    document.getElementById("valueStat").textContent = euro(value);
    document.getElementById("averageStat").textContent = euro(average);
  }

  function filteredProducts() {
    const query = searchInput.value.trim().toLowerCase();
    const brand = brandFilter.value;
    const availability = availabilityFilter.value;

    return products.filter((product) => {
      const matchesQuery = `${product.title} ${product.brand} ${product.value}`
        .toLowerCase()
        .includes(query);

      const matchesBrand = brand === "all" || product.brand === brand;

      const matchesAvailability =
        availability === "all" ||
        (availability === "active" && product.available) ||
        (availability === "archived" && !product.available);

      return matchesQuery && matchesBrand && matchesAvailability;
    });
  }

  function renderProducts() {
    const visible = filteredProducts();

    if (!visible.length) {
      rows.innerHTML =
        '<tr><td colspan="7" class="table-message">No products match these filters.</td></tr>';
      return;
    }

    rows.innerHTML = visible
      .map((product) => {
        const saving = Number(product.value) - Number(product.price);

        return `
                <tr>
                    <td>
                        <div class="product-cell">
                            <span class="product-avatar">${escapeHtml(product.brand[0])}</span>
                            <div>
                                <strong>${escapeHtml(product.title)}</strong>
                                <span>${escapeHtml(product.brand)} · ${escapeHtml(product.slug)}</span>
                            </div>
                        </div>
                    </td>
                    <td>${euro(product.value)}</td>
                    <td><strong>${euro(product.price)}</strong></td>
                    <td class="saving">${euro(saving)}</td>
                    <td>${product.inventory == null ? "Unlimited" : Number(product.inventory)}</td>
                    <td>
                        <span class="status ${product.available ? "" : "archived"}">
                            ${product.available ? "Active" : "Archived"}
                        </span>
                    </td>
                    <td>
                        <div class="row-actions">
                            <button data-edit="${product.id}">Edit</button>
                            <button data-toggle="${product.id}">
                                ${product.available ? "Archive" : "Restore"}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
      })
      .join("");
  }

  function openModal(product = null) {
    editingProduct = product;
    form.reset();

    document.getElementById("modalTitle").textContent = product
      ? "Edit product"
      : "Add product";

    fields.id.value = product?.id || "";
    fields.brand.value = product?.brand || "";
    fields.title.value = product?.title || "";
    fields.value.value = product?.value || "";
    fields.price.value = product?.price || "";
    fields.badge.value = product?.badge || "";
    fields.inventory.value = product?.inventory ?? "";
    fields.description.value = product?.description || "";
    fields.sort.value = product?.sort_order ?? 100;
    fields.available.checked = product?.available ?? true;
    document.getElementById("formError").textContent = "";

    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    fields.brand.focus();
  }

  function closeModal() {
    overlay.hidden = true;
    document.body.style.overflow = "";
    editingProduct = null;
  }

  async function saveProduct() {
    const errorElement = document.getElementById("formError");
    const button = document.getElementById("saveProductButton");
    const value = Number(fields.value.value);
    const price = Number(fields.price.value);

    errorElement.textContent = "";

    if (!fields.brand.value.trim() || !fields.title.value.trim()) {
      errorElement.textContent = "Brand and title are required.";
      return;
    }

    if (value <= 0 || price <= 0) {
      errorElement.textContent = "Value and price must be greater than zero.";
      return;
    }

    if (price >= value) {
      errorElement.textContent =
        "Purchase price should be below the displayed face value.";
      return;
    }

    const record = {
      brand: fields.brand.value.trim(),
      title: fields.title.value.trim(),
      value,
      price,
      badge: fields.badge.value.trim() || null,
      inventory:
        fields.inventory.value === "" ? null : Number(fields.inventory.value),
      description: fields.description.value.trim() || null,
      sort_order: Number(fields.sort.value) || 0,
      available: fields.available.checked,
      slug: editingProduct?.slug || makeSlug(fields.brand.value, value),
    };

    button.disabled = true;
    button.textContent = "Saving…";

    try {
      let response;

      if (editingProduct) {
        response = await client
          .from("products")
          .update(record)
          .eq("id", editingProduct.id)
          .select()
          .single();
      } else {
        response = await client
          .from("products")
          .insert(record)
          .select()
          .single();
      }

      if (response.error) {
        throw response.error;
      }

      const wasEditing = Boolean(editingProduct);
      closeModal();
      showToast(wasEditing ? "Product updated" : "Product created");
      await loadProducts();
    } catch (error) {
      errorElement.textContent =
        error.message || "The product could not be saved.";
    } finally {
      button.disabled = false;
      button.textContent = "Save product";
    }
  }

  async function toggleProduct(product) {
    const next = !product.available;

    const { error } = await client
      .from("products")
      .update({ available: next })
      .eq("id", product.id);

    if (error) {
      showToast(error.message);
      return;
    }

    product.available = next;
    renderStatistics();
    renderProducts();
    showToast(next ? "Product restored" : "Product archived");
  }

  rows.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit]");
    const toggleButton = event.target.closest("[data-toggle]");

    if (editButton) {
      const product = products.find(
        (item) => String(item.id) === editButton.dataset.edit,
      );
      if (product) openModal(product);
    }

    if (toggleButton) {
      const product = products.find(
        (item) => String(item.id) === toggleButton.dataset.toggle,
      );
      if (product) toggleProduct(product);
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveProduct();
  });

  searchInput.addEventListener("input", renderProducts);
  brandFilter.addEventListener("change", renderProducts);
  availabilityFilter.addEventListener("change", renderProducts);

  document.getElementById("newProductButton").onclick = () => openModal();
  document.getElementById("closeModal").onclick = closeModal;
  document.getElementById("cancelModal").onclick = closeModal;
  document.getElementById("refreshButton").onclick = loadProducts;

  document.getElementById("logoutButton").onclick = async () => {
    await client.auth.signOut();
    window.location.href = "admin.html";
  };

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closeModal();
  });

  async function start() {
    if (await requireAdmin()) {
      await loadProducts();
    }
  }

  start();
});
