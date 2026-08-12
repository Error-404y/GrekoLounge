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
    const checkoutOverlay = document.getElementById('checkoutOverlay');
    const checkoutCancel = document.getElementById('checkoutCancel');
    const checkoutConfirm = document.getElementById('checkoutConfirm');
    const checkoutUsername = document.getElementById('checkoutUsername');
    const checkoutEmail = document.getElementById('checkoutEmail');
    const toastMessage = document.getElementById('toastMessage');

    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty! Please add some cards before checking out.');
            return;
        }
        cartOverlay.classList.remove('active');
        checkoutOverlay.classList.add('active');
    });

    checkoutCancel.addEventListener('click', () => {
        checkoutOverlay.classList.remove('active');
        checkoutUsername.value = '';
        checkoutEmail.value = '';
    });

    checkoutConfirm.addEventListener('click', () => {
        const username = checkoutUsername.value.trim();
        const email = checkoutEmail.value.trim();
        
        if (!username || !email) {
            alert('Please fill in both fields.');
            return;
        }

        // Build cart summary for embed fields
        const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
        const orderLines = cart.map((item, i) =>
            `\`${String(i + 1).padStart(2, '0')}.\`  ${item.title}  ·  **${item.price} EUR**`
        ).join('\n');

        const now = new Date();
        const timestamp = now.toISOString();
        const orderId = `GL-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.random().toString(36).substring(2,7).toUpperCase()}`;

        const separator = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

        const webhookPayload = {
            username: "GrekoLounge",
            embeds: [
                {
                    author: {
                        name: "NEW ORDER  ·  GrekoLounge Gift Card Store"
                    },
                    title: "Order Confirmation Received",
                    description: `${separator}\nA new customer order has been placed and is awaiting review.\nProcess the payment and deliver via the customer's email address.\n${separator}`,
                    color: 0xD4AF37,
                    fields: [
                        {
                            name: "ORDER REFERENCE",
                            value: `\`\`\`${orderId}\`\`\``,
                            inline: false
                        },
                        {
                            name: "CUSTOMER",
                            value: `\`\`\`${username}\`\`\``,
                            inline: true
                        },
                        {
                            name: "EMAIL",
                            value: `\`\`\`${email}\`\`\``,
                            inline: true
                        },
                        {
                            name: "\u200b",
                            value: separator,
                            inline: false
                        },
                        {
                            name: "ORDER ITEMS",
                            value: orderLines || "No items recorded.",
                            inline: false
                        },
                        {
                            name: "\u200b",
                            value: separator,
                            inline: false
                        },
                        {
                            name: "TOTAL CHARGED",
                            value: `**${cartTotal} EUR**`,
                            inline: true
                        },
                        {
                            name: "QTY",
                            value: `**${cart.length}** item${cart.length !== 1 ? 's' : ''}`,
                            inline: true
                        },
                        {
                            name: "STATUS",
                            value: "**Pending Review**",
                            inline: true
                        }
                    ],
                    footer: {
                        text: `GrekoLounge  ·  Secure Gift Card Exchange  ·  ${orderId}`
                    },
                    timestamp: timestamp
                }
            ]
        };

        const WEBHOOK_URL = "https://discord.com/api/webhooks/1537168912339181770/66ZnGYajoPTIyzOkBbWMEIYWBmfNLleWn7U2s_1l_7FizY01JMFYnTRzKcLQrczSRQFw";

        fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(webhookPayload)
        }).catch(err => console.error("Webhook failed:", err));

        // Success — close modal & clear state
        checkoutOverlay.classList.remove('active');
        checkoutUsername.value = '';
        checkoutEmail.value = '';
        
        // Clear cart
        cart = [];
        updateCart();
        
        // Show toast
        toastMessage.classList.add('show');
        setTimeout(() => {
            toastMessage.classList.remove('show');
        }, 4000);
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
