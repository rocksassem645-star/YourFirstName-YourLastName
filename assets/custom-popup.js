/**
 * Custom Popup & Add to Cart Functionality
 * Vanilla JavaScript (NO jQuery!)
 */

document.addEventListener('DOMContentLoaded', function() {

  // ============================================
  // 1. CREATE POPUP HTML
  // ============================================
  const popupHTML = `
    <div id="product-popup" class="product-popup-overlay" style="display:none;">
      <div class="product-popup">
        <button class="popup-close" aria-label="Close">&times;</button>
        
        <div class="popup-content">
          <div class="popup-product-image">
            <img id="popup-image" src="" alt="Product">
          </div>
          
          <div class="popup-product-info">
            <h2 id="popup-title"></h2>
            <p id="popup-price"></p>
            <p id="popup-description"></p>
            
            <div id="popup-variants" class="popup-variants"></div>
            
            <button id="popup-add-to-cart" class="popup-add-to-cart">
              ADD TO CART
            </button>
            <div id="popup-message" class="popup-message"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', popupHTML);

  // ============================================
  // 2. DOM REFERENCES
  // ============================================
  const popup = document.getElementById('product-popup');
  const closeBtn = document.querySelector('.popup-close');
  const addToCartBtn = document.getElementById('popup-add-to-cart');
  const popupMessage = document.getElementById('popup-message');

  let currentProduct = null;
  let currentVariantId = null;

  // ============================================
  // 3. OPEN POPUP ON "Quick View" CLICK
  // ============================================
  document.querySelectorAll('.view-product-btn').forEach(function(button) {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const productId = this.dataset.productId;
      fetchProductData(productId);
    });
  });

  // ============================================
  // 4. FETCH PRODUCT DATA
  // ============================================
  function fetchProductData(productId) {
    fetch('/products/' + productId + '.js')
      .then(function(response) {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(function(product) {
        currentProduct = product;
        displayPopup(product);
      })
      .catch(function(error) {
        console.error('Error fetching product:', error);
        alert('Error loading product. Please try again.');
      });
  }

  // ============================================
  // 5. DISPLAY PRODUCT IN POPUP
  // ============================================
  function displayPopup(product) {
    // Product Image
    document.getElementById('popup-image').src = product.featured_image || '';
    document.getElementById('popup-image').alt = product.title;

    // Product Title
    document.getElementById('popup-title').textContent = product.title;

    // Product Price
    const price = product.price / 100;
    document.getElementById('popup-price').textContent = '$' + price.toFixed(2);

    // Product Description
    const description = product.description || 'No description available.';
    document.getElementById('popup-description').textContent = stripHtml(description);

    // Product Variants
    const variantsContainer = document.getElementById('popup-variants');
    variantsContainer.innerHTML = '';

    if (product.variants.length > 1) {
      product.variants.forEach(function(variant, index) {
        const variantWrapper = document.createElement('div');
        variantWrapper.className = 'variant-option';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'variant';
        radio.value = variant.id;
        radio.id = 'variant-' + variant.id;
        radio.dataset.variantId = variant.id;

        if (!variant.available) {
          radio.disabled = true;
        }

        if (index === 0 && variant.available) {
          radio.checked = true;
          currentVariantId = variant.id;
        }

        const label = document.createElement('label');
        label.htmlFor = 'variant-' + variant.id;
        label.textContent = variant.title + ' - $' + (variant.price / 100).toFixed(2);

        if (!variant.available) {
          label.style.opacity = '0.5';
          label.style.textDecoration = 'line-through';
        }

        variantWrapper.appendChild(radio);
        variantWrapper.appendChild(label);
        variantsContainer.appendChild(variantWrapper);

        radio.addEventListener('change', function() {
          if (this.checked) {
            currentVariantId = parseInt(this.value);
          }
        });
      });
    } else {
      currentVariantId = product.variants[0].id;
      const singleVariant = document.createElement('p');
      singleVariant.className = 'single-variant-info';
      singleVariant.textContent = 'Variant: ' + product.variants[0].title;
      variantsContainer.appendChild(singleVariant);
    }

    popupMessage.textContent = '';
    popupMessage.className = 'popup-message';

    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // ============================================
  // 6. HELPER: Strip HTML
  // ============================================
  function stripHtml(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  // ============================================
  // 7. CLOSE POPUP
  // ============================================
  function closePopup() {
    popup.style.display = 'none';
    document.body.style.overflow = '';
    popupMessage.textContent = '';
    popupMessage.className = 'popup-message';
  }

  closeBtn.addEventListener('click', closePopup);

  popup.addEventListener('click', function(e) {
    if (e.target === this) {
      closePopup();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closePopup();
    }
  });

  // ============================================
  // 8. ADD TO CART
  // ============================================
  addToCartBtn.addEventListener('click', function() {
    const selectedRadio = document.querySelector('input[name="variant"]:checked');
    
    if (selectedRadio) {
      currentVariantId = parseInt(selectedRadio.value);
    }

    if (!currentVariantId) {
      popupMessage.textContent = 'Please select a variant.';
      popupMessage.className = 'popup-message error';
      return;
    }

    addToCartBtn.disabled = true;
    addToCartBtn.textContent = 'Adding...';
    popupMessage.textContent = '';
    popupMessage.className = 'popup-message';

    fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            id: currentVariantId,
            quantity: 1
          }
        ]
      })
    })
    .then(function(response) {
      if (!response.ok) {
        return response.json().then(function(data) {
          throw new Error(data.description || 'Error adding to cart');
        });
      }
      return response.json();
    })
    .then(function(cart) {
      // Check if variant is Black + Medium
      const selectedVariant = currentProduct.variants.find(function(v) {
        return v.id === currentVariantId;
      });
      
      if (selectedVariant && 
          selectedVariant.title.includes('Black') && 
          selectedVariant.title.includes('Medium')) {
        
        popupMessage.textContent = '✓ Added! Also adding Soft Winter Jacket...';
        popupMessage.className = 'popup-message success';
        
        // ⚠️ REPLACE THIS WITH THE ACTUAL PRODUCT ID
        const softWinterJacketId = 1234567890; // <-- CHANGE THIS!
        addSoftWinterJacket(softWinterJacketId);
        
      } else {
        popupMessage.textContent = '✓ Added to cart!';
        popupMessage.className = 'popup-message success';
      }

      addToCartBtn.disabled = false;
      addToCartBtn.textContent = 'ADD TO CART';
      updateCartCount();

      setTimeout(function() {
        closePopup();
        addToCartBtn.textContent = 'ADD TO CART';
        addToCartBtn.disabled = false;
      }, 2000);
    })
    .catch(function(error) {
      console.error('Error adding to cart:', error);
      popupMessage.textContent = error.message || 'Error adding to cart. Please try again.';
      popupMessage.className = 'popup-message error';
      addToCartBtn.disabled = false;
      addToCartBtn.textContent = 'ADD TO CART';
    });
  });

  // ============================================
  // 9. AUTO-ADD SOFT WINTER JACKET
  // ============================================
  function addSoftWinterJacket(productId) {
    if (!productId || productId === 1234567890) {
      console.warn('⚠️ Soft Winter Jacket ID not configured. Please update the ID.');
      return;
    }

    fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            id: parseInt(productId),
            quantity: 1
          }
        ]
      })
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Error adding Soft Winter Jacket');
      }
      return response.json();
    })
    .then(function() {
      console.log('✅ Soft Winter Jacket added to cart!');
      updateCartCount();
    })
    .catch(function(error) {
      console.error('Error adding Soft Winter Jacket:', error);
    });
  }

  // ============================================
  // 10. UPDATE CART COUNT (FIXED)
  // ============================================
  function updateCartCount() {
    fetch('/cart.js')  // ← THIS WAS MISSING!
      .then(function(response) {
        return response.json();
      })
      .then(function(cart) {
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(function(el) {
          el.textContent = cart.item_count;
        });
      })
      .catch(function(error) {
        console.error('Error updating cart count:', error);
      });
  }

  // ============================================
  // 11. PREVENT CLOSE ON INNER CLICK
  // ============================================
  document.querySelector('.product-popup').addEventListener('click', function(e) {
    e.stopPropagation();
  });

});