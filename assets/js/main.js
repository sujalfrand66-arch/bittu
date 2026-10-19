/* ==========================================================================
   BITTU WHOLESALER — B2B Wholesale Core Engine
   Quotation Cart, Card Quantity Steppers, WhatsApp Order Builder,
   3-Layer Navbar, Mobile Drawer, and Micro-Animations
   ========================================================================== */

const QUOTE_STORAGE_KEY = 'bittu_wholesale_quote_cart';
const WISHLIST_STORAGE_KEY = 'bittu_wholesale_wishlist';
const DEFAULT_GLOBAL_MOQ = 20; // Wholesale minimum order rule: 20 pcs

/* ---------- Quotation Cart Storage Helpers ---------- */
function getQuoteCart() {
  try {
    const raw = localStorage.getItem(QUOTE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveQuoteCart(cart) {
  try {
    localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(cart));
    updateQuoteCartUI();
  } catch (e) {
    console.error('Error saving wholesale quote cart', e);
  }
}

function getWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveWishlist(list) {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(list));
    updateWishlistUI();
  } catch (e) {
    console.error('Error saving wishlist', e);
  }
}

/* ---------- Product Card Quantity Controls (Live Line Subtotal) ---------- */
function stepCardQty(productId, step) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const input = document.getElementById(`qty-input-${productId}`);
  if (!input) return;

  const min = product.moqQty || DEFAULT_GLOBAL_MOQ;
  let currentVal = parseInt(input.value, 10) || min;
  let newVal = currentVal + step;

  // Never allow quantity below MOQ (minimum 20 pieces)
  if (newVal < min) {
    newVal = min;
    showToast(`Wholesale minimum order is ${min} pieces`);
  }

  input.value = newVal;
  validateAndUpdateCardSubtotal(productId);
}

function validateAndUpdateCardSubtotal(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const input = document.getElementById(`qty-input-${productId}`);
  const subtotalEl = document.getElementById(`subtotal-${productId}`);
  if (!input) return;

  const min = product.moqQty || DEFAULT_GLOBAL_MOQ;
  let val = parseInt(input.value, 10);

  if (isNaN(val) || val < min) {
    val = min;
    input.value = min;
  }

  // Ensure whole number
  val = Math.floor(val);
  input.value = val;

  // Recalculate line subtotal
  if (subtotalEl) {
    if (typeof product.price === 'number' && product.price > 0) {
      const lineSubtotal = product.price * val;
      subtotalEl.textContent = `₹${lineSubtotal.toLocaleString('en-IN')}`;
    } else {
      subtotalEl.textContent = 'Confirm on WhatsApp';
    }
  }
}

function addCardToQuote(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const input = document.getElementById(`qty-input-${productId}`);
  const min = product.moqQty || DEFAULT_GLOBAL_MOQ;
  let qty = input ? parseInt(input.value, 10) : min;

  if (isNaN(qty) || qty < min) {
    qty = min;
    if (input) input.value = min;
  }

  addToQuoteCart(productId, qty);
}

/* ---------- Quotation Cart Operations ---------- */
function addToQuoteCart(productId, qty) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const min = product.moqQty || DEFAULT_GLOBAL_MOQ;
  const orderQty = Math.max(min, parseInt(qty, 10) || min);

  let cart = getQuoteCart();
  const existingIndex = cart.findIndex(i => i.id === productId);

  if (existingIndex > -1) {
    cart[existingIndex].qty += orderQty;
  } else {
    cart.push({
      id: product.id,
      sku: product.sku || '',
      name: product.name,
      price: product.price || 0,
      mrp: product.mrp || 0,
      image: product.image,
      unit: product.unit || 'piece',
      moqQty: min,
      qty: orderQty
    });
  }

  saveQuoteCart(cart);
  openQuoteDrawer();
  triggerCartBadgeAnimation();
  showToast(`Added ${orderQty} pcs of ${product.name.substring(0, 24)}... to Quote`);
}

function updateQuoteItemQty(productId, newQty) {
  let cart = getQuoteCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  const min = item.moqQty || DEFAULT_GLOBAL_MOQ;
  let qty = parseInt(newQty, 10);

  if (isNaN(qty) || qty < min) {
    qty = min;
    showToast(`Wholesale minimum order is ${min} pieces`);
  }

  item.qty = qty;
  saveQuoteCart(cart);
  renderQuoteDrawer();
}

function stepQuoteItemQty(productId, step) {
  let cart = getQuoteCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  const min = item.moqQty || DEFAULT_GLOBAL_MOQ;
  let newQty = item.qty + step;

  if (newQty < min) {
    newQty = min;
    showToast(`Wholesale minimum order is ${min} pieces`);
  }

  item.qty = newQty;
  saveQuoteCart(cart);
  renderQuoteDrawer();
}

function removeQuoteItem(productId) {
  let cart = getQuoteCart();
  cart = cart.filter(i => i.id !== productId);
  saveQuoteCart(cart);
  renderQuoteDrawer();
  showToast('Product removed from wholesale quote');
}

function clearQuoteCart() {
  if (confirm('Clear all items from your wholesale quotation draft?')) {
    saveQuoteCart([]);
    renderQuoteDrawer();
    showToast('Wholesale quotation draft cleared');
  }
}

/* ---------- Wishlist Operations ---------- */
function toggleWishlist(productId) {
  let list = getWishlist();
  const index = list.indexOf(productId);
  let added = false;

  if (index > -1) {
    list.splice(index, 1);
  } else {
    list.push(productId);
    added = true;
  }

  saveWishlist(list);
  showToast(added ? 'Saved to Wholesale Wishlist' : 'Removed from Wishlist');
  return added;
}

function isWishlisted(productId) {
  return getWishlist().includes(productId);
}

/* ---------- UI Synchronization ---------- */
function updateQuoteCartUI() {
  const cart = getQuoteCart();
  const totalItems = cart.length;
  const totalPieces = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
  const totalAmount = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 0)), 0);

  // Update header badges
  document.querySelectorAll('.quote-count-badge').forEach(el => {
    el.textContent = totalItems;
  });

  document.querySelectorAll('.quote-pieces-badge').forEach(el => {
    el.textContent = totalPieces;
  });

  document.querySelectorAll('.quote-subtotal-display').forEach(el => {
    el.textContent = totalAmount > 0 ? `₹${totalAmount.toLocaleString('en-IN')}` : '₹0';
  });

  // Re-render drawer if open
  renderQuoteDrawer();
}

function updateWishlistUI() {
  const list = getWishlist();
  document.querySelectorAll('.wishlist-count-badge').forEach(el => {
    el.textContent = list.length;
  });

  document.querySelectorAll('[data-wishlist-id]').forEach(btn => {
    const id = btn.dataset.wishlistId;
    if (list.includes(id)) {
      btn.classList.add('in-wishlist');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('in-wishlist');
      btn.setAttribute('aria-pressed', 'false');
    }
  });
}

function triggerCartBadgeAnimation() {
  document.querySelectorAll('.quote-count-badge').forEach(badge => {
    badge.classList.remove('badge-pulse');
    void badge.offsetWidth; // trigger reflow
    badge.classList.add('badge-pulse');
  });
}

/* ---------- Render Wholesale Quotation Drawer ---------- */
function renderQuoteDrawer() {
  const container = document.getElementById('quote-items-container');
  if (!container) return;

  const cart = getQuoteCart();
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalPieces = cart.reduce((sum, item) => sum + item.qty, 0);

  // Total summary labels
  const totalDisplay = document.getElementById('quote-total-amount');
  const countDisplay = document.getElementById('quote-total-pieces');
  if (totalDisplay) totalDisplay.textContent = `₹${totalAmount.toLocaleString('en-IN')}`;
  if (countDisplay) countDisplay.textContent = `${totalPieces} pieces (${cart.length} wholesale lines)`;

  const submitBtn = document.getElementById('btn-send-quote-whatsapp');

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-message">
        <div class="cart-empty-icon">📋</div>
        <h4 style="font-size:15px;color:#0f172a;margin-bottom:6px;font-weight:700;">Your Wholesale Quote is Empty</h4>
        <p style="font-size:12px;color:#64748b;margin-bottom:16px;">Add bulk lots (min. 20 pieces per item) to prepare your formal WhatsApp quotation enquiry.</p>
        <button class="btn-promo-primary" onclick="closeQuoteDrawer();" style="display:inline-flex;padding:9px 18px;font-size:12px;">Explore Wholesale Catalog</button>
      </div>
    `;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
      submitBtn.style.pointerEvents = 'none';
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.style.pointerEvents = 'auto';
  }

  let html = '';
  cart.forEach(item => {
    const min = item.moqQty || DEFAULT_GLOBAL_MOQ;
    const hasItemPrice = typeof item.price === 'number' && item.price > 0;
    const lineTotal = hasItemPrice ? item.price * item.qty : null;
    html += `
      <div class="cart-item-row" data-quote-id="${item.id}">
        <img src="${item.image || 'assets/images/placeholder.svg'}" onerror="this.onerror=null;this.src='assets/images/placeholder.svg';" alt="${item.name}" class="cart-item-thumb" width="60" height="60">
        <div class="cart-item-details">
          <h5 class="cart-item-name" title="${item.name}">${item.name}</h5>
          <div class="cart-item-rate">
            <span>${hasItemPrice ? `₹${item.price.toLocaleString('en-IN')} / ${item.unit}` : 'Wholesale Price on Request'}</span>
            <span class="cart-item-moq-tag">MOQ: ${min} pcs</span>
          </div>
          <div class="cart-item-controls">
            <div class="qty-stepper">
              <button type="button" class="qty-stepper-btn" onclick="stepQuoteItemQty('${item.id}', -10);" aria-label="Decrease quantity">−</button>
              <input type="number" class="qty-stepper-input" value="${item.qty}" min="${min}" step="5" onchange="updateQuoteItemQty('${item.id}', this.value);" aria-label="Quantity">
              <button type="button" class="qty-stepper-btn" onclick="stepQuoteItemQty('${item.id}', 10);" aria-label="Increase quantity">+</button>
            </div>
            <span class="cart-item-subtotal-val">= ${hasItemPrice ? `₹${lineTotal.toLocaleString('en-IN')}` : 'Price on Request'}</span>
          </div>
        </div>
        <button type="button" class="cart-item-remove-btn" onclick="removeQuoteItem('${item.id}');" title="Remove Item" aria-label="Remove item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
}

/* ---------- Quote Drawer Open / Close ---------- */
function openQuoteDrawer() {
  const drawer = document.getElementById('quote-drawer');
  const overlay = document.getElementById('quote-drawer-overlay');
  if (drawer && overlay) {
    renderQuoteDrawer();
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeQuoteDrawer() {
  const drawer = document.getElementById('quote-drawer');
  const overlay = document.getElementById('quote-drawer-overlay');
  if (drawer && overlay) {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* ---------- WhatsApp Wholesale Quotation Generator ---------- */
function sendQuoteWhatsApp() {
  const cart = getQuoteCart();
  if (cart.length === 0) {
    alert('Please add wholesale items (min 20 pcs) to your quotation draft first.');
    return;
  }

  const totalAmount = cart.reduce((sum, item) => sum + ((item.price || 0) * item.qty), 0);
  const totalPieces = cart.reduce((sum, item) => sum + item.qty, 0);

  let msg = `*WHOLESALE QUOTATION ENQUIRY*\n`;
  msg += `Business: BITTU WHOLESALER\n`;
  msg += `Location: Goniana Mandi, Bathinda District, Punjab\n`;
  msg += `Date: ${new Date().toLocaleDateString('en-IN')}\n`;
  msg += `----------------------------------------\n`;

  cart.forEach((item, index) => {
    const hasItemPrice = typeof item.price === 'number' && item.price > 0;
    const lineTotal = hasItemPrice ? item.price * item.qty : null;
    msg += `${index + 1}. [${item.sku || 'SKU'}] ${item.name}\n`;
    msg += `   • Rate: ${hasItemPrice ? `₹${item.price.toLocaleString('en-IN')} / ${item.unit}` : 'Wholesale Price on Request'}\n`;
    msg += `   • Requested Qty: ${item.qty} ${item.unit}s\n`;
    msg += `   • Line Subtotal: ${hasItemPrice ? `₹${lineTotal.toLocaleString('en-IN')}` : 'Price on Request (Confirm with store)'}\n`;
  });

  msg += `----------------------------------------\n`;
  msg += `*Total Wholesale Lines:* ${cart.length}\n`;
  msg += `*Total Order Units:* ${totalPieces} pieces\n`;
  if (totalAmount > 0) {
    msg += `*Estimated Quotation Total:* ₹${totalAmount.toLocaleString('en-IN')}\n`;
  } else {
    msg += `*Estimated Quotation Total:* Wholesale Price on Request\n`;
  }
  msg += `----------------------------------------\n`;
  msg += `Hi Bittu Wholesaler, I am a retailer/reseller and would like to confirm wholesale stock availability, GST invoice terms, and delivery timeline to my store. Thank you!`;

  const waUrl = getWhatsAppUrl(msg);
  window.open(waUrl, '_blank');
}

/* ---------- Mobile Slide-Out Navigation Drawer ---------- */
function initMobileNavigationDrawer() {
  const trigger = document.getElementById('mobile-menu-trigger');
  const drawer = document.getElementById('mobile-nav-drawer');
  const overlay = document.getElementById('mobile-drawer-overlay');
  const closeBtn = document.getElementById('mobile-drawer-close');

  if (!trigger || !drawer) return;

  function openDrawer() {
    drawer.classList.add('active');
    if (overlay) overlay.classList.add('active');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  trigger.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (drawer.classList.contains('active')) closeDrawer();
      closeQuoteDrawer();
      closeQuickView();
    }
  });
}

/* ---------- Layer 3 Category Navigation & Animated Indicator ---------- */
function initCategoryNavIndicator() {
  const navList = document.getElementById('wholesale-category-nav');
  if (!navList) return;

  const links = navList.querySelectorAll('.wholesale-nav-link');
  const indicator = document.getElementById('nav-active-indicator');

  function updateIndicator(targetEl) {
    if (!indicator || !targetEl) return;
    const navRect = navList.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const leftOffset = targetRect.left - navRect.left + navList.scrollLeft;
    indicator.style.width = `${targetRect.width}px`;
    indicator.style.transform = `translateX(${leftOffset}px)`;
    indicator.style.opacity = '1';
  }

  const activeLink = navList.querySelector('.wholesale-nav-link.active') || links[0];
  if (activeLink) {
    setTimeout(() => updateIndicator(activeLink), 150);
  }

  links.forEach(link => {
    link.addEventListener('click', function () {
      links.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      updateIndicator(this);
    });

    link.addEventListener('mouseenter', function () {
      updateIndicator(this);
    });
  });

  navList.addEventListener('mouseleave', function () {
    const curActive = navList.querySelector('.wholesale-nav-link.active') || links[0];
    if (curActive) updateIndicator(curActive);
  });
}

/* ---------- Instant Header Product & Category Search ---------- */
function initHeaderSearch() {
  const searchInput = document.getElementById('header-search-input');
  const catSelect = document.getElementById('header-search-category');
  const dropdown = document.getElementById('header-search-results');
  const form = document.getElementById('header-search-form');

  if (!searchInput || !dropdown) return;

  function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    const cat = catSelect ? catSelect.value : 'all';

    if (query.length < 2) {
      dropdown.classList.remove('active');
      dropdown.innerHTML = '';
      return;
    }

    let results = PRODUCTS.filter(p => {
      const matchCat = cat === 'all' || p.category === cat || p.navGroup === cat;
      const matchText = (p.name + ' ' + (p.sku || '') + ' ' + p.description + ' ' + p.category).toLowerCase().includes(query);
      return matchCat && matchText;
    });

    if (results.length === 0) {
      dropdown.innerHTML = `
        <div style="padding:16px;text-align:center;font-size:12px;color:#64748b;">
          No wholesale items found for "<strong>${escapeHtml(query)}</strong>"
        </div>
      `;
      dropdown.classList.add('active');
      return;
    }

    let html = '';
    results.slice(0, 6).forEach(p => {
      const min = p.moqQty || DEFAULT_GLOBAL_MOQ;
      html += `
        <a href="javascript:void(0);" onclick="openQuickView('${p.id}');dropdownClose();" class="search-result-item">
          <img src="${p.image || 'assets/placeholder.jpg'}" alt="${p.name}" class="search-result-thumb">
          <div class="search-result-info">
            <div class="search-result-title">${highlightMatch(p.name, query)}</div>
            <div class="search-result-meta">
              <span class="search-result-price">₹${p.price.toLocaleString('en-IN')}/pc</span>
              <span class="search-result-moq">Min. ${min} pcs</span>
              <span style="font-size:10px;color:#0066FF;font-weight:700;">Wholesale Lot</span>
            </div>
          </div>
        </a>
      `;
    });

    dropdown.innerHTML = html;
    dropdown.classList.add('active');
  }

  searchInput.addEventListener('input', debounce(performSearch, 200));
  if (catSelect) catSelect.addEventListener('change', performSearch);

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const query = searchInput.value.trim();
      const cat = catSelect ? catSelect.value : 'all';
      window.location.href = `products.html?search=${encodeURIComponent(query)}&category=${encodeURIComponent(cat)}`;
    });
  }

  document.addEventListener('click', function (e) {
    if (!form.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });
}

function dropdownClose() {
  const dropdown = document.getElementById('header-search-results');
  if (dropdown) dropdown.classList.remove('active');
}

function highlightMatch(text, query) {
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark style="background:#fef08a;color:#854d0e;padding:0 2px;">$1</mark>');
}

function escapeHtml(string) {
  return String(string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- Mega Menu Dropdown ---------- */
function initMegaMenu() {
  const trigger = document.getElementById('all-categories-btn');
  const menu = document.getElementById('mega-category-menu');
  if (!trigger || !menu) return;

  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    menu.classList.toggle('active');
    trigger.classList.toggle('active');
  });

  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target) && !trigger.contains(e.target)) {
      menu.classList.remove('active');
      trigger.classList.remove('active');
    }
  });
}

/* ---------- BITTU WHOLESALER Card Generator (Live Line Subtotal & MOQ) ---------- */
function createWholesaleProductCard(product) {
  const category = PRODUCT_CATEGORIES.find(c => c.id === product.category);
  const catName = category ? category.name : product.category;
  const minMoq = product.moqQty || DEFAULT_GLOBAL_MOQ;
  const hasPrice = typeof product.price === 'number' && product.price > 0;
  const initialSubtotal = hasPrice ? product.price * minMoq : null;
  const wishlisted = isWishlisted(product.id);
  const discount = hasPrice ? getDiscountPercentage(product) : 0;

  const card = document.createElement('article');
  card.className = 'wholesale-product-card';
  card.setAttribute('itemscope', '');
  card.setAttribute('itemtype', 'https://schema.org/Product');

  card.innerHTML = `
    <div class="card-media-wrapper">
      <img src="${product.image || 'assets/images/placeholder.svg'}" 
           onerror="this.onerror=null;this.src='assets/images/placeholder.svg';" 
           alt="${product.name} — B2B wholesale Goniana Mandi" 
           class="card-product-img" 
           width="300" 
           height="300" 
           loading="lazy" 
           itemprop="image">
      
      <div class="card-badge-container">
        <span class="moq-wholesale-badge">MOQ: ${minMoq} PCS</span>
        ${discount > 0 ? `<span class="wholesale-save-badge">${discount}% MARGIN</span>` : ''}
        ${product.bestSeller ? `<span class="bestseller-tag">HOT SELLER</span>` : ''}
      </div>

      <div class="card-quick-actions">
        <button type="button" class="card-action-icon-btn ${wishlisted ? 'in-wishlist' : ''}" 
                data-wishlist-id="${product.id}" 
                onclick="toggleWishlist('${product.id}');" 
                title="Save to Wishlist" 
                aria-label="Wishlist">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="${wishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        </button>
        <button type="button" class="card-action-icon-btn" 
                onclick="openQuickView('${product.id}');" 
                title="View Specifications" 
                aria-label="Quick View">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
    </div>

    <div class="card-content">
      <div class="card-category-row">
        <span class="card-category-label">${catName}</span>
        <span class="card-sku-label">SKU: ${product.sku || 'BW-PROD'}</span>
      </div>

      <h3 class="card-product-title" itemprop="name">
        <a href="javascript:void(0);" onclick="openQuickView('${product.id}');">${product.name}</a>
      </h3>

      <div class="card-pricing-block">
        <div class="price-row-main">
          ${hasPrice ? `
            <span class="card-wholesale-unit-price">₹${product.price.toLocaleString('en-IN')}</span>
            <span class="card-unit-label">/ ${product.unit || 'piece'}</span>
            ${product.mrp && product.mrp > product.price ? `<span class="card-mrp-price">MRP ₹${product.mrp.toLocaleString('en-IN')}</span>` : ''}
          ` : `
            <span class="card-wholesale-unit-price" style="font-size:12px;color:var(--c-electric-blue);font-weight:700;">Wholesale Price on Request</span>
          `}
        </div>
      </div>

      <!-- Quantity Selector with Live Subtotal (Rule 4) -->
      <div class="product-qty-row">
        <span class="qty-field-label">Order Quantity (Min ${minMoq}):</span>
        <div class="card-qty-control">
          <button type="button" class="card-qty-btn" onclick="stepCardQty('${product.id}', -10);" aria-label="Decrease quantity">−</button>
          <input type="number" 
                 class="card-qty-input" 
                 id="qty-input-${product.id}" 
                 value="${minMoq}" 
                 min="${minMoq}" 
                 step="5" 
                 onchange="validateAndUpdateCardSubtotal('${product.id}');" 
                 oninput="validateAndUpdateCardSubtotal('${product.id}');" 
                 aria-label="Wholesale quantity">
          <button type="button" class="card-qty-btn" onclick="stepCardQty('${product.id}', 10);" aria-label="Increase quantity">+</button>
        </div>
      </div>

      <div class="card-subtotal-row">
        <span class="subtotal-label">Line Subtotal:</span>
        <strong class="subtotal-val" id="subtotal-${product.id}">${hasPrice ? `₹${initialSubtotal.toLocaleString('en-IN')}` : 'Confirm on WhatsApp'}</strong>
      </div>

      <div class="card-stock-status">
        <span class="stock-indicator-dot"></span>
        <span>${product.availability || 'Available for Bulk Order — Goniana Mandi'}</span>
      </div>

      <div class="card-actions-wrapper">
        <button type="button" class="btn-add-quote" onclick="addCardToQuote('${product.id}');" aria-label="Add ${product.name} to Wholesale Quote">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
          ADD TO WHOLESALE QUOTE
        </button>
      </div>
    </div>
  `;

  return card;
}

// Backward compatible alias
const createDeoDapProductCard = createWholesaleProductCard;

/* ---------- Render Category Tiles ---------- */
function renderCategoryTiles(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  PRODUCT_CATEGORIES.forEach(cat => {
    const count = PRODUCTS.filter(p => p.category === cat.id).length;
    const card = document.createElement('a');
    card.href = `products.html#${cat.id}`;
    card.className = 'category-tile-card';
    card.innerHTML = `
      <div class="category-tile-thumb">
        <img src="${cat.image || 'assets/placeholder.jpg'}" alt="${cat.name}" class="category-tile-img" loading="lazy">
      </div>
      <div class="category-tile-info">
        <h3 class="category-tile-title">${cat.name}</h3>
        <span class="category-tile-count">${count} Wholesale Lots</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// Backward compatible alias
const renderCircularCategories = renderCategoryTiles;

/* ---------- Render Filtered Collections ---------- */
function renderProductCollection(containerId, filterType) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  let filtered = [...PRODUCTS];

  if (filterType === 'drones') {
    filtered = PRODUCTS.filter(p => p.navGroup === 'drones' || p.category === 'drones');
  } else if (filterType === 'led-neon') {
    filtered = PRODUCTS.filter(p => p.navGroup === 'led-neon' || p.category === 'led-lights' || p.category === 'neon-lights' || p.category === 'decorative-lighting');
  } else if (filterType === 'solar') {
    filtered = PRODUCTS.filter(p => p.navGroup === 'solar' || p.category === 'solar-lights');
  } else if (filterType === 'electrical') {
    filtered = PRODUCTS.filter(p => p.navGroup === 'electrical' || p.category === 'electrical-accessories' || p.category === 'induction-cooktops' || p.category === 'small-appliances');
  } else if (filterType === 'gadgets') {
    filtered = PRODUCTS.filter(p => p.navGroup === 'gadgets' || p.category === 'home-gadgets' || p.category === 'mobile-gadgets' || p.category === 'other');
  } else if (filterType === 'under99') {
    filtered = PRODUCTS.filter(p => p.price < 100);
  } else if (filterType === 'under299') {
    filtered = PRODUCTS.filter(p => p.price >= 100 && p.price < 300);
  } else if (filterType === 'under499') {
    filtered = PRODUCTS.filter(p => p.price >= 300 && p.price < 500);
  } else if (filterType === 'bestSeller') {
    filtered = PRODUCTS.filter(p => p.bestSeller);
  } else if (filterType === 'justArrived') {
    filtered = PRODUCTS.filter(p => p.justArrived);
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:36px;color:#64748b;background:#fff;border-radius:8px;border:1px solid #e2e8f0;">No wholesale items currently available in this collection.</div>`;
    return;
  }

  filtered.forEach(p => {
    container.appendChild(createWholesaleProductCard(p));
  });
}

/* ---------- Quick View Modal ---------- */
function openQuickView(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('quick-view-modal-container');
  const overlay = document.getElementById('quick-view-overlay');
  if (!modal || !overlay) return;

  const category = PRODUCT_CATEGORIES.find(c => c.id === product.category);
  const catName = category ? category.name : product.category;
  const minMoq = product.moqQty || DEFAULT_GLOBAL_MOQ;
  const discount = getDiscountPercentage(product);

  let specsRows = '';
  if (product.specs && Object.keys(product.specs).length > 0) {
    specsRows = Object.entries(product.specs).map(([k, v]) => `
      <tr>
        <th style="width:40%;">${k}</th>
        <td>${v}</td>
      </tr>
    `).join('');
  }

  modal.innerHTML = `
    <button type="button" class="quick-view-close" onclick="closeQuickView();" aria-label="Close modal">&times;</button>
    <div class="quick-view-img-box">
      <img src="${product.image || 'assets/images/placeholder.svg'}" 
           onerror="this.onerror=null;this.src='assets/images/placeholder.svg';" 
           alt="${product.name}" 
           class="quick-view-img" 
           width="350" 
           height="350">
    </div>
    <div class="quick-view-body">
      <span class="qv-category">${catName}</span>
      <h3 class="qv-title">${product.name}</h3>
      <div class="qv-sku-stock">
        <span>SKU: <strong>${product.sku || 'BW-PROD'}</strong></span>
        <span>•</span>
        <span style="color:#0066FF;font-weight:700;">🟢 ${product.availability}</span>
      </div>

      <div class="qv-price-box">
        <div style="display:flex;align-items:baseline;gap:8px;">
          ${typeof product.price === 'number' && product.price > 0 ? `
            <span class="qv-main-price">₹${product.price.toLocaleString('en-IN')}</span>
            <span style="font-size:12px;color:#64748b;font-weight:600;">/ ${product.unit || 'piece'}</span>
            ${product.mrp && product.mrp > product.price ? `<span class="qv-mrp-price">MRP ₹${product.mrp.toLocaleString('en-IN')}</span>` : ''}
            ${discount > 0 ? `<span class="qv-save-badge">${discount}% Retail Margin</span>` : ''}
          ` : `
            <span class="qv-main-price" style="font-size:15px;color:#0066FF;font-weight:700;">Wholesale Price on Request</span>
          `}
        </div>
        <div style="font-size:11px;color:#0f172a;margin-top:6px;font-weight:600;">
          Wholesale Rule: Minimum Order Quantity is ${minMoq} pieces.
        </div>
      </div>

      <!-- Quick View Quantity Stepper -->
      <div style="margin: 12px 0;">
        <span style="font-size:12px;font-weight:700;color:#0f172a;display:block;margin-bottom:6px;">Select Quantity (Min ${minMoq} pcs):</span>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="qty-stepper">
            <button type="button" class="qty-stepper-btn" onclick="stepCardQty('${product.id}', -10);" style="width:34px;height:34px;">−</button>
            <input type="number" class="qty-stepper-input" id="qty-input-${product.id}" value="${minMoq}" min="${minMoq}" step="5" onchange="validateAndUpdateCardSubtotal('${product.id}');" style="width:64px;height:34px;text-align:center;font-weight:700;">
            <button type="button" class="qty-stepper-btn" onclick="stepCardQty('${product.id}', 10);" style="width:34px;height:34px;">+</button>
          </div>
          <span style="font-size:12px;color:#64748b;">Subtotal: <strong id="subtotal-${product.id}" style="color:#0066FF;font-size:14px;">${typeof product.price === 'number' && product.price > 0 ? `₹${(product.price * minMoq).toLocaleString('en-IN')}` : 'Confirm on WhatsApp'}</strong></span>
        </div>
      </div>

      ${specsRows ? `
        <div style="margin-bottom:14px;">
          <table class="qv-tier-table">
            <tbody>${specsRows}</tbody>
          </table>
        </div>
      ` : ''}

      <p class="qv-desc">${product.description}</p>

      <div class="qv-actions">
        <button type="button" class="btn-add-quote" onclick="addCardToQuote('${product.id}');closeQuickView();" style="padding:12px 16px;font-size:13px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
          ADD TO WHOLESALE QUOTE
        </button>
        <a href="${getProductWhatsAppUrl(product.name)}" target="_blank" rel="noopener noreferrer" class="btn-card-whatsapp" style="padding:12px 16px;font-size:13px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.11.546 4.094 1.504 5.822L0 24l6.335-1.463A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-1.844 0-3.607-.504-5.145-1.41l-.37-.217-3.825.884.962-3.697-.24-.38A9.778 9.778 0 012.182 12c0-5.422 4.396-9.818 9.818-9.818 5.422 0 9.818 4.396 9.818 9.818 0 5.422-4.396 9.818-9.818 9.818z"/></svg>
          Direct WhatsApp Enquiry
        </a>
      </div>
    </div>
  `;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeQuickView() {
  const overlay = document.getElementById('quick-view-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* ---------- FAQ Accordion ---------- */
function initFAQAccordion() {
  document.querySelectorAll('.faq-accordion-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const item = this.closest('.faq-accordion-item');
      const body = item.querySelector('.faq-accordion-body');
      const isOpen = item.classList.contains('open');

      item.parentElement.querySelectorAll('.faq-accordion-item.open').forEach(openItem => {
        if (openItem !== item) {
          openItem.classList.remove('open');
          openItem.querySelector('.faq-accordion-body').style.maxHeight = null;
        }
      });

      if (isOpen) {
        item.classList.remove('open');
        body.style.maxHeight = null;
      } else {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
}

/* ---------- Toast Notification ---------- */
function showToast(msg) {
  let toast = document.getElementById('wholesale-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'wholesale-toast';
    toast.className = 'wholesale-toast-msg';
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.classList.add('active');

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove('active');
  }, 2400);
}

/* ---------- Utility Debounce ---------- */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ---------- Global DOM Ready Initializations ---------- */
document.addEventListener('DOMContentLoaded', function () {
  updateQuoteCartUI();
  updateWishlistUI();
  initHeaderSearch();
  initMegaMenu();
  initMobileNavigationDrawer();
  initCategoryNavIndicator();
  initFAQAccordion();

  // Populate search category dropdown
  const catSelect = document.getElementById('header-search-category');
  if (catSelect && catSelect.children.length <= 1) {
    PRODUCT_CATEGORIES.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      catSelect.appendChild(opt);
    });
  }

  // Populate mega menu list
  const megaMenuList = document.getElementById('mega-menu-list');
  if (megaMenuList && megaMenuList.children.length === 0) {
    PRODUCT_CATEGORIES.forEach(c => {
      const count = PRODUCTS.filter(p => p.category === c.id).length;
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="products.html#${c.id}" class="mega-menu-link">
          <span class="mega-menu-item-left">
            <span class="mega-menu-icon">${c.icon}</span>
            <span>${c.name}</span>
          </span>
          <span class="mega-menu-count">${count}</span>
        </a>
      `;
      megaMenuList.appendChild(li);
    });
  }

  // Set current year
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
});
