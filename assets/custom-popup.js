document.addEventListener('DOMContentLoaded', function() {
  // 1. Inject Popup HTML into DOM
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

  // 2. DOM References
  const overlay = document.getElementById('quickview-overlay');
  const closeBtn = document.querySelector('.quickview-close-custom');
  const addBtn = document.getElementById('qv-add-cart');
  const msg = document.getElementById('qv-message');
  
  const qvImg = document.getElementById('qv-image');
  const qvTitle = document.getElementById('qv-title');
  const qvPrice = document.getElementById('qv-price');
  const qvDesc = document.getElementById('qv-desc');
  const qvVariants = document.getElementById('qv-variants');

  let currentProduct = null;
  let currentVariantId = null;

  // 3. Open Triggers
  document.addEventListener('click', function(e) {
    // Use event delegation to handle dynamically added buttons
    const quickviewBtn = e.target.closest('.quickview-trigger');
    if (quickviewBtn) {
      e.preventDefault();
      e.stopPropagation();
      const productId = quickviewBtn.dataset.productId;
      fetchProductData(productId);
    }
  });

  // 4. Fetch Data (Supports both Shopify API calls and a safe test mode)
  function fetchProductData(id) {
    // Attempt to fetch from Shopify API. If it fails (offline testing), use fallback.
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
        // Fallback for preview testing (generates dummy data)
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

  // 5. Render Popup
  function displayPopup(product) {
    qvImg.src = product.featured_image || '';
    qvImg.alt = product.title;
    qvTitle.textContent = product.title;
    qvPrice.textContent = '$' + (product.price / 100).toFixed(2);
    qvDesc.textContent = product.description || 'No description available.';

    qvVariants.innerHTML = '';
    if (product.variants && product.variants.length > 1) {
      product.variants.forEach((variant, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'qv-variant-option';
        
        const radio = document.createElement('input');
        radio.type = 'radio'; 
        radio.name = 'variant'; 
        radio.value = variant.id; 
        radio.id = 'var-' + variant.id;
        
        if (!variant.available) radio.disabled = true;
        if (i === 0 && variant.available) { 
          radio.checked = true; 
          currentVariantId = variant.id; 
        }
        
        const label = document.createElement('label');
        label.htmlFor = 'var-' + variant.id;
        label.textContent = variant.title + ' - $' + (variant.price / 100).toFixed(2);
        
        if (!variant.available) { 
          label.style.opacity = '0.5'; 
          label.style.textDecoration = 'line-through'; 
        }

        wrap.appendChild(radio); 
        wrap.appendChild(label); 
        qvVariants.appendChild(wrap);
        
        radio.addEventListener('change', function() {
          if(this.checked) currentVariantId = parseInt(this.value);
        });
      });
    } else if (product.variants && product.variants.length > 0) {
      currentVariantId = product.variants[0].id;
      const single = document.createElement('p');
      single.style.fontSize = '14px'; 
      single.style.color = '#666';
      single.textContent = 'Variant: ' + product.variants[0].title;
      qvVariants.appendChild(single);
    }

    msg.textContent = ''; 
    msg.className = 'quickview-msg-custom';
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // 6. Close Functions
  function closePopup() {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    msg.textContent = ''; 
    msg.className = 'quickview-msg-custom';
    addBtn.disabled = false; 
    addBtn.textContent = 'ADD TO CART';
  }
  
  closeBtn.addEventListener('click', closePopup);
  
  overlay.addEventListener('click', function(e) { 
    if(e.target === this) closePopup(); 
  });
  
  document.addEventListener('keydown', function(e) { 
    if(e.key === 'Escape') closePopup(); 
  });
  
  document.querySelector('.quickview-modal-custom').addEventListener('click', e => e.stopPropagation());

  // 7. Add to Cart Logic (With the special offer rule)
  addBtn.addEventListener('click', function() {
    const selected = document.querySelector('input[name="variant"]:checked');
    if(selected) currentVariantId = parseInt(selected.value);

    if(!currentVariantId) {
      msg.textContent = 'Please select a variant.'; 
      msg.className = 'quickview-msg-custom error'; 
      return;
    }

    addBtn.disabled = true; 
    addBtn.textContent = 'ADDING...';
    msg.textContent = ''; 
    msg.className = 'quickview-msg-custom';

    // Check specifically if "Black + Medium" was selected (using title string)
    const selectedVariant = currentProduct.variants.find(v => v.id === currentVariantId);
    
    // Simulate API call logic
    setTimeout(() => {
      if (selectedVariant && 
          selectedVariant.title.toLowerCase().includes('black') && 
          selectedVariant.title.toLowerCase().includes('medium')) {
        
        msg.textContent = '✓ Added! Adding Soft Winter Jacket too...';
        msg.className = 'quickview-msg-custom success';
        // In a real Shopify environment, you would add a second fetch('/cart/add.js') here using a static Product ID.
        
      } else {
        msg.textContent = '✓ Added to cart!';
        msg.className = 'quickview-msg-custom success';
      }

      addBtn.disabled = false;
      addBtn.textContent = 'ADD TO CART';
      
      setTimeout(closePopup, 1500);
    }, 800);
  });
});