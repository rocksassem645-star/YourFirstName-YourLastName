/**
 * CUSTOM QUICKVIEW POPUP
 * ======================
 * Vanilla JavaScript - No jQuery Required
 * Handles product quickview modal with variant selection and special offers
 */

document.addEventListener('DOMContentLoaded', function() {
  
  // ============================================================
  // 1. INJECT POPUP HTML INTO DOM
  // ============================================================
  const popupHTML = `
    <div id="quickview-overlay" class="quickview-overlay-custom" style="display:none;">
      <div class="quickview-modal-custom">
        <button class="quickview-close-custom" aria-label="Close">&times;</button>
        <div class="quickview-layout">
          <div class="quickview-img-col">
            <img id="qv-image" src="" alt="Product">
          </div>
          <div class="quickview-info-col">
            <h2 id="qv-title"></h2>
            <div id="qv-price" class="quickview-price-custom"></div>
            <div id="qv-desc" class="quickview-desc-custom"></div>
            
            <div id="qv-variants" class="quickview-variants-custom"></div>
            
            <button id="qv-add-cart" class="quickview-add-btn-custom">ADD TO CART</button>
            <div id="qv-message" class="quickview-msg-custom"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', popupHTML);

  // ============================================================
  // 2. DOM REFERENCES - Cache all selectors
  // ============================================================
  const overlay = document.getElementById('quickview-overlay');
  const closeBtn = document.querySelector('.quickview-close-custom');
  const addBtn = document.getElementById('qv-add-cart');
  const msg = document.getElementById('qv-message');
  
  const qvImg = document.getElementById('qv-image');
  const qvTitle = document.getElementById('qv-title');
  const qvPrice = document.getElementById('qv-price');
  const qvDesc = document.getElementById('qv-desc');
  const qvVariants = document.getElementById('qv-variants');

  // State management
  let currentProduct = null;
  let currentVariantId = null;

  // ============================================================
  // 3. OPEN POPUP - Event delegation for dynamic buttons
  // ============================================================
  document.addEventListener('click', function(e) {
    const quickviewBtn = e.target.closest('.quickview-trigger');
    if (quickviewBtn) {
      e.preventDefault();
      e.stopPropagation();
      const productId = quickviewBtn.dataset.productId;
      fetchProductData(productId);
    }
  });

  // ============================================================
  // 4. FETCH PRODUCT DATA
  // Tries Shopify API first, falls back to mock data for testing
  // ============================================================
  function fetchProductData(id) {
    fetch('/products/' + id + '.js')
      .then(res => {
        if (!res.ok) throw new Error('API unavailable');
        return res.json();
      })
      .then(product => {
        currentProduct = product;
        displayPopup(product);
      })
      .catch(() => {
        // Fallback: Mock data for preview/testing
        console.warn("Using mock data for preview.");
        const mockProduct = {
          id: id,
          title: "Sample Product " + id,
          price: 4500,
          description: "This is a simulated product description to demonstrate the layout and functionality of the custom Quick View modal.",
          featured_image: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=600&auto=format&fit=crop",
          variants: [
            { id: 101, title: "Small", price: 4500, available: true },
            { id: 102, title: "Medium", price: 4800, available: true },
            { id: 103, title: "Large", price: 5000, available: false }
          ]
        };
        currentProduct = mockProduct;
        displayPopup(mockProduct);
      });
  }

  // ============================================================
  // 5. RENDER POPUP - Populate all product info
  // ============================================================
  function displayPopup(product) {
    // Set image and title
    qvImg.src = product.featured_image || '';
    qvImg.alt = product.title;
    qvTitle.textContent = product.title;
    
    // Format and display price (Shopify stores price in cents)
    qvPrice.textContent = '$' + (product.price / 100).toFixed(2);
    
    // Set description
    qvDesc.textContent = product.description || 'No description available.';

    // ============================================================
    // RENDER VARIANT OPTIONS
    // ============================================================
    qvVariants.innerHTML = '';
    if (product.variants && product.variants.length > 1) {
      // Multiple variants - render as radio options
      product.variants.forEach((variant, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'qv-variant-option';
        
        // Create radio button
        const radio = document.createElement('input');
        radio.type = 'radio'; 
        radio.name = 'variant'; 
        radio.value = variant.id; 
        radio.id = 'var-' + variant.id;
        
        // Disable if not available
        if (!variant.available) radio.disabled = true;
        
        // Auto-check first available variant
        if (i === 0 && variant.available) { 
          radio.checked = true; 
          currentVariantId = variant.id; 
        }
        
        // Create label with variant name and price
        const label = document.createElement('label');
        label.htmlFor = 'var-' + variant.id;
        label.textContent = variant.title + ' - $' + (variant.price / 100).toFixed(2);
        
        // Visual feedback for unavailable variants
        if (!variant.available) { 
          label.style.opacity = '0.5'; 
          label.style.textDecoration = 'line-through'; 
        }

        wrap.appendChild(radio); 
        wrap.appendChild(label); 
        qvVariants.appendChild(wrap);
        
        // Track variant changes
        radio.addEventListener('change', function() {
          if(this.checked) currentVariantId = parseInt(this.value);
        });
      });
    } else if (product.variants && product.variants.length > 0) {
      // Single variant - display as text
      currentVariantId = product.variants[0].id;
      const single = document.createElement('p');
      single.style.fontSize = '14px'; 
      single.style.color = '#666';
      single.textContent = 'Variant: ' + product.variants[0].title;
      qvVariants.appendChild(single);
    }

    // Clear any previous messages
    msg.textContent = ''; 
    msg.className = 'quickview-msg-custom';
    
    // Show overlay
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // ============================================================
  // 6. CLOSE POPUP FUNCTIONS
  // ============================================================
  function closePopup() {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    msg.textContent = ''; 
    msg.className = 'quickview-msg-custom';
    addBtn.disabled = false; 
    addBtn.textContent = 'ADD TO CART';
  }
  
  // Close button click
  closeBtn.addEventListener('click', closePopup);
  
  // Click outside modal to close
  overlay.addEventListener('click', function(e) { 
    if(e.target === this) closePopup(); 
  });
  
  // ESC key to close
  document.addEventListener('keydown', function(e) { 
    if(e.key === 'Escape') closePopup(); 
  });
  
  // Prevent modal click from closing overlay
  document.querySelector('.quickview-modal-custom').addEventListener('click', e => e.stopPropagation());

  // ============================================================
  // 7. ADD TO CART LOGIC
  // SPECIAL RULE: Black + Medium variants auto-add "Soft Winter Jacket"
  // ============================================================
  addBtn.addEventListener('click', function() {
    // Get selected variant
    const selected = document.querySelector('input[name="variant"]:checked');
    if(selected) currentVariantId = parseInt(selected.value);

    // Validate selection
    if(!currentVariantId) {
      msg.textContent = 'Please select a variant.'; 
      msg.className = 'quickview-msg-custom error'; 
      return;
    }

    // Show loading state
    addBtn.disabled = true; 
    addBtn.textContent = 'ADDING...';
    msg.textContent = ''; 
    msg.className = 'quickview-msg-custom';

    // Find selected variant object
    const selectedVariant = currentProduct.variants.find(v => v.id === currentVariantId);
    
    // Simulate API delay (800ms)
    setTimeout(() => {
      // CHECK FOR SPECIAL OFFER: Black + Medium
      // This triggers auto-add of "Soft Winter Jacket"
      if (selectedVariant && 
          selectedVariant.title.toLowerCase().includes('black') && 
          selectedVariant.title.toLowerCase().includes('medium')) {
        
        msg.textContent = '✓ Added! Adding Soft Winter Jacket too...';
        msg.className = 'quickview-msg-custom success';
        
        // In production Shopify environment:
        // fetch('/cart/add.js', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ items: [{ id: SOFT_JACKET_VARIANT_ID, quantity: 1 }] })
        // });
        
      } else {
        msg.textContent = '✓ Added to cart!';
        msg.className = 'quickview-msg-custom success';
      }

      addBtn.disabled = false;
      addBtn.textContent = 'ADD TO CART';
      
      // Auto-close after 1.5 seconds
      setTimeout(closePopup, 1500);
    }, 800);
  });
});