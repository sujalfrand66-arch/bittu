/* ==========================================================================
   BITTU TELECOM WHOLESALER — Products Page Logic
   Search, Category Filter, Price Sort, DeoDap-Style Dense Grid Rendering
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  const productGrid = document.getElementById('product-grid');
  if (!productGrid) return;

  // Make sure productGrid has the dense styling class
  productGrid.className = 'product-density-grid';

  // State
  let currentCategory = 'all';
  let currentSearch = '';
  let currentSort = 'featured';
  let currentPage = 1;
  const perPage = 20;

  // DOM refs
  const searchInput = document.getElementById('product-search');
  const categoryFilter = document.getElementById('category-filter');
  const sortSelect = document.getElementById('sort-select');
  const resultsCount = document.getElementById('results-count');
  const loadMoreBtn = document.getElementById('load-more');

  // Check URL query parameters (e.g. products.html?search=drone&category=drones)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('search')) {
    currentSearch = urlParams.get('search').trim().toLowerCase();
    if (searchInput) searchInput.value = currentSearch;
  }
  if (urlParams.has('category')) {
    currentCategory = urlParams.get('category');
  }

  // Check URL hash (e.g. products.html#solar-lights)
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const matchingCat = PRODUCT_CATEGORIES.find(c => c.slug === hash || c.id === hash);
    if (matchingCat) {
      currentCategory = matchingCat.id;
    }
  }

  // Populate Categories
  populateCategoryFilter();
  if (categoryFilter && currentCategory !== 'all') {
    categoryFilter.value = currentCategory;
  }

  // Initial Render
  renderProducts();

  // Search input event
  if (searchInput) {
    searchInput.addEventListener('input', debounce(function () {
      currentSearch = this.value.trim().toLowerCase();
      currentPage = 1;
      renderProducts();
    }, 250));
  }

  // Category filter event
  if (categoryFilter) {
    categoryFilter.addEventListener('change', function () {
      currentCategory = this.value;
      currentPage = 1;
      renderProducts();
    });
  }

  // Sort select event
  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      currentSort = this.value;
      currentPage = 1;
      renderProducts();
    });
  }

  // Load more
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function () {
      currentPage++;
      renderProducts(true);
    });
  }

  /* ---------- Populate Category Filter ---------- */
  function populateCategoryFilter() {
    if (!categoryFilter) return;
    PRODUCT_CATEGORIES.forEach(function (cat) {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      categoryFilter.appendChild(option);
    });
  }

  /* ---------- Get Filtered & Sorted Products ---------- */
  function getFilteredProducts() {
    let filtered = [...PRODUCTS];

    // Category filter
    if (currentCategory !== 'all') {
      filtered = filtered.filter(p => p.category === currentCategory);
    }

    // Search filter
    if (currentSearch) {
      filtered = filtered.filter(function (p) {
        const searchStr = (p.name + ' ' + (p.sku || '') + ' ' + p.description + ' ' + p.category).toLowerCase();
        return searchStr.includes(currentSearch);
      });
    }

    // Sort options
    switch (currentSort) {
      case 'featured':
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      case 'price-asc':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-desc':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'category':
        filtered.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }

    return filtered;
  }

  /* ---------- Render Products ---------- */
  function renderProducts(append) {
    const filtered = getFilteredProducts();
    const paged = filtered.slice(0, currentPage * perPage);

    // Update count display
    if (resultsCount) {
      resultsCount.innerHTML = `Showing <strong>${paged.length}</strong> of <strong>${filtered.length}</strong> wholesale products in catalog`;
    }

    // Show/hide load more
    if (loadMoreBtn) {
      loadMoreBtn.style.display = paged.length < filtered.length ? 'inline-flex' : 'none';
    }

    if (!append) {
      productGrid.innerHTML = '';
    }

    if (filtered.length === 0) {
      productGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h3 style="font-size:16px;color:#0b2239;margin-bottom:8px;">No wholesale products match your search</h3>
          <p style="font-size:13px;color:#64748b;margin-bottom:16px;">Try adjusting your keywords, price filters, or category selection.</p>
          <button class="btn-promo-primary" onclick="document.getElementById('product-search').value='';document.getElementById('category-filter').value='all';location.href='products.html';" style="display:inline-flex;padding:8px 16px;font-size:12px;">Reset All Filters</button>
        </div>
      `;
      return;
    }

    const start = append ? (currentPage - 1) * perPage : 0;
    const end = currentPage * perPage;
    const toRender = filtered.slice(start, end);

    toRender.forEach(function (product) {
      productGrid.appendChild(createDeoDapProductCard(product));
    });

    // Update wishlist active states
    updateWishlistUI();
  }
});

/* ---------- Render Category Cards for categories.html ---------- */
function renderCategoryCards(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  PRODUCT_CATEGORIES.forEach(function (cat) {
    const productCount = PRODUCTS.filter(p => p.category === cat.id).length;
    const card = document.createElement('a');
    card.href = `products.html#${cat.id}`;
    card.className = 'category-circle-card';
    card.style.cssText = 'padding: 16px; min-height: 170px; justify-content: center; background: #fff;';
    card.innerHTML = `
      <div class="category-thumb-wrapper" style="width: 76px; height: 76px; margin-bottom: 10px;">
        <img src="${cat.image || 'assets/placeholder.jpg'}" alt="${cat.name}" class="category-thumb-img" loading="lazy">
      </div>
      <h3 class="category-circle-name" style="font-size: 13px; font-weight: 700; height: auto; margin-bottom: 4px;">${cat.name}</h3>
      <span class="category-circle-count" style="font-size: 11px; color: #ea580c; font-weight: 600;">${productCount} items available</span>
    `;
    container.appendChild(card);
  });
}

