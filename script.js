document.addEventListener('DOMContentLoaded', () => {
    let cart = [];
    
    const cartBtn = document.getElementById('cartBtn');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCartBtn = document.getElementById('closeCart');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');
    const addToCartBtns = document.querySelectorAll('.add-to-cart');

    // Toggle Cart Modal
    cartBtn.addEventListener('click', () => {
        cartOverlay.classList.add('active');
    });

    closeCartBtn.addEventListener('click', () => {
        cartOverlay.classList.remove('active');
    });

    cartOverlay.addEventListener('click', (e) => {
        if(e.target === cartOverlay) {
            cartOverlay.classList.remove('active');
        }
    });

    // Add to Cart Functionality
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const title = btn.getAttribute('data-title');
            const price = parseInt(btn.getAttribute('data-price'));
            const value = btn.getAttribute('data-value');
            
            cart.push({ title, price, value });
            updateCart();
            
            // Simple animation for the button
            const originalText = btn.textContent;
            btn.textContent = 'Added!';
            btn.style.background = '#4CAF50';
            btn.style.color = 'white';
            btn.style.borderColor = '#4CAF50';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.style.color = '';
                btn.style.borderColor = '';
            }, 1500);
        });
    });

    function updateCart() {
        cartBtn.textContent = `Cart (${cart.length})`;
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
            cartTotalEl.textContent = '0';
            return;
        }

        cartItemsContainer.innerHTML = '';
        let total = 0;

        cart.forEach((item, index) => {
            total += item.price;
            
            const itemEl = document.createElement('div');
            itemEl.classList.add('cart-item');
            itemEl.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.title}</h4>
                    <p>${item.price} &euro;</p>
                </div>
                <button class="remove-item" data-index="${index}">Remove</button>
            `;
            cartItemsContainer.appendChild(itemEl);
        });

        cartTotalEl.textContent = total;

        // Add event listeners to new remove buttons
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                cart.splice(index, 1);
                updateCart();
            });
        });
    }

    // Checkout Functionality
    const checkoutBtn = document.querySelector('.checkout-btn');
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty! Please add some cards before checking out.');
            return;
        }
        
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        alert(`Thank you for your purchase!\n\nYour order total was ${total} €.\nAn email with your premium Amazon Gift Cards will be sent shortly.`);
        
        // Clear cart
        cart = [];
        updateCart();
        cartOverlay.classList.remove('active');
    });

    // Add a glowing effect that follows mouse on cards
    const cards = document.querySelectorAll('.shop-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const glow = card.querySelector('.card-glow');
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            let color = 'rgba(212, 175, 55, 0.15)'; // Default Amazon Gold
            if (card.classList.contains('card-google')) color = 'rgba(61, 220, 132, 0.15)';
            if (card.classList.contains('card-apple')) color = 'rgba(255, 255, 255, 0.15)';
            if (card.classList.contains('card-steam')) color = 'rgba(102, 192, 244, 0.15)';
            if (card.classList.contains('card-paysafe')) color = 'rgba(0, 166, 255, 0.15)';

            glow.style.background = `radial-gradient(circle at ${x}px ${y}px, ${color} 0%, transparent 60%)`;
        });
        
        card.addEventListener('mouseleave', () => {
            const glow = card.querySelector('.card-glow');
            glow.style.background = `radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%)`;
        });
    });
});
