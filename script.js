let allProducts = [];
let currentPage = 1;
const productsPerPage = 20;
let totalPages = 0;
const API_URL = 'https://script.google.com/macros/s/AKfycbyHsgLM26nvSEsg3GpuVj76l_MC01HYnnYXDS-jTyWWqEAbznUJ5B5epSzwcFJoXz7k/exec';

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeMenu();
    
    // Check if we're on the products page
    if (window.location.pathname.includes('product.html')) {
        initializeProductPage();
    } else if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        loadFeaturedPhones();
    }
});

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
}

function initializeMenu() {
    const menuIcon = document.getElementById('menuIcon');
    const navLinks = document.getElementById('navLinks');
    
    if (menuIcon && navLinks) {
        menuIcon.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

async function loadFeaturedPhones() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data && data.data) {
            const phonesByCompany = data.data.reduce((acc, phone) => {
                if (!acc[phone.Company]) acc[phone.Company] = [];
                acc[phone.Company].push(phone);
                return acc;
            }, {});

            const featuredPhones = Object.values(phonesByCompany).map(phones => 
                phones.reduce((max, phone) => phone.Price > max.Price ? phone : max)
            );

            displayFeaturedPhones(featuredPhones);
        }
    } catch (error) {
        console.error('Error loading featured phones:', error);
        const slider = document.getElementById('featuredPhones');
        if (slider) {
            slider.innerHTML = `<p class="error">Failed to load featured phones</p>`;
        }
    }
}

function initializeFilters() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const companyFilter = document.getElementById('companyFilter');
    const priceRange = document.getElementById('priceRange');
    const inStockOnly = document.getElementById('inStockOnly');
    const sortBy = document.getElementById('sortBy');
    const resetFilters = document.getElementById('resetFilters');

    searchInput?.addEventListener('input', filterAndSortProducts);
    searchBtn?.addEventListener('click', filterAndSortProducts);
    companyFilter?.addEventListener('change', filterAndSortProducts);
    priceRange?.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        document.getElementById('priceValue').textContent = `₹${value.toLocaleString()}`;
        filterAndSortProducts();
    });
    inStockOnly?.addEventListener('change', filterAndSortProducts);
    sortBy?.addEventListener('change', filterAndSortProducts);

    resetFilters?.addEventListener('click', () => {
        searchInput.value = '';
        companyFilter.value = '';
        priceRange.value = priceRange.max;
        document.getElementById('priceValue').textContent = `₹${parseInt(priceRange.max).toLocaleString()}`;
        inStockOnly.checked = false;
        sortBy.value = 'default';
        filterAndSortProducts();
    });
}

function initializeProductPage() {
    initializeFilters();
    fetchProducts();
}

async function fetchProducts() {
    const productsContainer = document.getElementById('products');
    if (!productsContainer) return;

    try {
        productsContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p class="loading-text">Loading products...</p>
            </div>
        `;
        
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data && data.data) {
            allProducts = data.data;
            updateTotalResults(allProducts.length);
            setupFilters(allProducts);
            currentPage = 1;
            displayProducts(allProducts);
        }
    } catch (error) {
        console.error('Error:', error);
        productsContainer.innerHTML = `
            <p class="error">Failed to load products: ${error.message}</p>
        `;
    }
}

function displayProducts(products) {
    const productsContainer = document.getElementById('products');
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    const paginatedProducts = products.slice(start, end);
    totalPages = Math.ceil(products.length / productsPerPage);

    if (!productsContainer) return;

    // Update total results
    updateTotalResults(products.length);
    
    // Generate products HTML
    const productsHTML = paginatedProducts.map(product => `
        <div class="product-card ${product.Stock === 'O' ? 'out-of-stock' : ''}">
            <div class="product-image-container">
                <img src="${product.imagelink}" alt="${product.Model}" class="product-image">
                ${product.Offer > 0 ? 
                    `<div class="offer-badge">-${product.Offer * 100}%</div>` : 
                    ''}
            </div>
            <div class="product-info">
                <h3 class="product-model">${product.Model}</h3>
                <h4 class="product-company">${product.Company}</h4>
                <div class="price-container">
                    <p class="product-price">₹${product.Price.toLocaleString()}</p>
                    ${product.Original > product.Price ? 
                        `<p class="original-price">₹${product.Original.toLocaleString()}</p>` : 
                        ''}
                </div>
                ${getStockStatus(product.Stock)}
                <button class="add-to-cart-btn" 
                        ${product.Stock === 'O' ? 'disabled' : ''}
                        onclick="addToCart('${product.Model}')">
                    ${product.Stock === 'A' ? 
                        '<i class="fas fa-cart-plus"></i> Add to Cart' : 
                        '<i class="fas fa-clock"></i> Out of Stock'}
                </button>
            </div>
        </div>
    `).join('');

    // Add pagination controls
    const paginationHTML = `
        <div class="pagination-controls">
            <button class="page-button" onclick="changePage(1)" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-angle-double-left"></i>
            </button>
            <button class="page-button" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-angle-left"></i>
            </button>
            <span class="page-info">Page ${currentPage} of ${totalPages}</span>
            <button class="page-button" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-angle-right"></i>
            </button>
            <button class="page-button" onclick="changePage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-angle-double-right"></i>
            </button>
        </div>
    `;

    productsContainer.innerHTML = productsHTML + paginationHTML;
}

function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    displayProducts(allProducts);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateTotalResults(count) {
    const totalResults = document.getElementById('totalResults');
    if (totalResults) {
        totalResults.textContent = `${count} (Page ${currentPage} of ${totalPages})`;
    }
}

function setupFilters(products) {
    const companies = [...new Set(products.map(product => product.Company))];
    const companyFilter = document.getElementById('companyFilter');
    
    if (companyFilter) {
        companyFilter.innerHTML = '<option value="">All Companies</option>' +
            companies.map(company => 
                `<option value="${company}">${company}</option>`
            ).join('');
    }

    const maxPrice = Math.min(Math.max(...products.map(p => p.Price)), 150000);
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
        priceRange.max = maxPrice;
        priceRange.value = maxPrice;
        document.getElementById('priceValue').textContent = 
            `₹${maxPrice.toLocaleString()}`;
    }
}

function filterAndSortProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedCompany = document.getElementById('companyFilter').value;
    const maxPrice = parseInt(document.getElementById('priceRange').value);
    const inStockOnly = document.getElementById('inStockOnly').checked;
    const sortBy = document.getElementById('sortBy').value;

    let filtered = [...allProducts].filter(product => {
        const matchesSearch = !searchTerm || 
            product.Model.toLowerCase().includes(searchTerm) ||
            product.Company.toLowerCase().includes(searchTerm);
        const matchesCompany = !selectedCompany || product.Company === selectedCompany;
        const matchesPrice = product.Price <= maxPrice;
        const matchesStock = !inStockOnly || product.Stock === 'A';

        return matchesSearch && matchesCompany && matchesPrice && matchesStock;
    });

    // Sort products
    switch(sortBy) {
        case 'priceAsc':
            filtered.sort((a, b) => a.Price - b.Price);
            break;
        case 'priceDesc':
            filtered.sort((a, b) => b.Price - a.Price);
            break;
        case 'nameAsc':
            filtered.sort((a, b) => a.Model.localeCompare(b.Model));
            break;
        case 'nameDesc':
            filtered.sort((a, b) => b.Model.localeCompare(a.Model));
            break;
    }

    currentPage = 1;
    displayProducts(filtered);
    updateTotalResults(filtered.length);
}

function addToCart(productModel) {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = parseInt(cartCount.textContent) + 1;
    }
    showNotification(`${productModel} added to cart!`);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

function getStockStatus(status) {
    return status === 'A' ? 
        '<span class="stock-status in-stock"><i class="fas fa-check-circle"></i> In Stock</span>' : 
        '<span class="stock-status out-of-stock"><i class="fas fa-times-circle"></i> Out of Stock</span>';
}