document.addEventListener('DOMContentLoaded', () => {
    let cart = [];

    const cartBtn             = document.getElementById('cartBtn');
    const cartOverlay         = document.getElementById('cartOverlay');
    const closeCartBtn        = document.getElementById('closeCart');
    const cartItemsContainer  = document.getElementById('cartItems');
    const cartTotalEl         = document.getElementById('cartTotal');
    const addToCartBtns       = document.querySelectorAll('.add-to-cart');

    // ── Cart Modal ───────────────────────────────────────────────────────────
    cartBtn.addEventListener('click', () => cartOverlay.classList.add('active'));
    closeCartBtn.addEventListener('click', () => cartOverlay.classList.remove('active'));
    cartOverlay.addEventListener('click', (e) => {
        if (e.target === cartOverlay) cartOverlay.classList.remove('active');
    });

    // ── Add to Cart ──────────────────────────────────────────────────────────
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const title = btn.getAttribute('data-title');
            const price = parseInt(btn.getAttribute('data-price'));
            const value = btn.getAttribute('data-value');

            cart.push({ title, price, value });
            updateCart();

            const originalText = btn.textContent;
            btn.textContent = 'Added!';
            btn.style.background   = '#4CAF50';
            btn.style.color        = 'white';
            btn.style.borderColor  = '#4CAF50';

            setTimeout(() => {
                btn.textContent       = originalText;
                btn.style.background  = '';
                btn.style.color       = '';
                btn.style.borderColor = '';
            }, 1500);
        });
    });

    // ── Update Cart UI ───────────────────────────────────────────────────────
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

        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                cart.splice(index, 1);
                updateCart();
            });
        });
    }

    // ── Checkout ─────────────────────────────────────────────────────────────
    const checkoutBtn      = document.querySelector('.checkout-btn');
    const checkoutOverlay  = document.getElementById('checkoutOverlay');
    const checkoutCancel   = document.getElementById('checkoutCancel');
    const checkoutConfirm  = document.getElementById('checkoutConfirm');
    const checkoutUsername = document.getElementById('checkoutUsername');
    const checkoutEmail    = document.getElementById('checkoutEmail');
    const toastMessage     = document.getElementById('toastMessage');

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
        checkoutEmail.value    = '';
    });

    checkoutConfirm.addEventListener('click', () => {
        const username = checkoutUsername.value.trim();
        const email    = checkoutEmail.value.trim();

        if (!username || !email) {
            alert('Please fill in both fields.');
            return;
        }

        // ── Order data ───────────────────────────────────────────────────────
        const cartTotal    = cart.reduce((sum, item) => sum + item.price, 0);
        const now          = new Date();
        const timestamp    = now.toISOString();
        const orderId      = `GL-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.random().toString(36).substring(2,7).toUpperCase()}`;
        const readableTime = now.toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        // ── Monospace order breakdown block ──────────────────────────────────
        const W         = 40;
        const itemRows  = cart.map((item, i) => {
            const num   = `  ${String(i+1).padStart(2,'0')}.  `;
            const price = `${item.price} EUR`;
            const name  = item.title.substring(0, W - num.length - price.length - 1);
            const gap   = W - num.length - name.length - price.length;
            return num + name + ' '.repeat(Math.max(1, gap)) + price;
        });
        const divLine    = '  ' + '─'.repeat(W - 2);
        const totalLabel = '  TOTAL';
        const totalVal   = `${cartTotal} EUR`;
        const totalGap   = W - totalLabel.length - totalVal.length;
        const totalRow   = totalLabel + ' '.repeat(Math.max(1, totalGap)) + totalVal;

        const breakdownBlock = '```\n' + [...itemRows, divLine, totalRow].join('\n') + '\n```';

        // ── Header info block ─────────────────────────────────────────────────
        const headerBlock = [
            '```',
            `  ORDER REF    ${orderId}`,
            `  STATUS       Pending Review`,
            `  SUBMITTED    ${readableTime}`,
            '```'
        ].join('\n');

        // ── Discord Webhook Payload ───────────────────────────────────────────
        const WEBHOOK_URL = "https://discord.com/api/webhooks/1537168912339181770/66ZnGYajoPTIyzOkBbWMEIYWBmfNLleWn7U2s_1l_7FizY01JMFYnTRzKcLQrczSRQFw";

        // Encode items for admin panel URL: "Title:price|Title2:price2"
        const itemsSummary = cart.map(item => `${item.title}:${item.price}`).join('|');
        const BASE = 'http://localhost:8080';
        const adminBase = `${BASE}/admin.html?i=${encodeURIComponent(orderId)}&n=${encodeURIComponent(username)}&e=${encodeURIComponent(email)}&t=${cartTotal}&p=${encodeURIComponent(itemsSummary)}`;

        const webhookPayload = {
            username: "GrekoLounge",
            embeds: [
                {
                    color: 0xD4AF37,
                    author: {
                        name: "GREKOLOUNGE  ·  ORDER MANAGEMENT SYSTEM"
                    },
                    title: "New Order Received",
                    description: headerBlock,
                    fields: [
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
                            value: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                            inline: false
                        },
                        {
                            name: "ORDER BREAKDOWN",
                            value: breakdownBlock,
                            inline: false
                        },
                        {
                            name: "\u200b",
                            value: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                            inline: false
                        },
                        {
                            name: "TOTAL CHARGED",
                            value: `**${cartTotal} EUR**`,
                            inline: true
                        },
                        {
                            name: "ITEMS",
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
            ],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 5,
                            label: "Confirm Order",
                            url: `${adminBase}&a=confirm`
                        },
                        {
                            type: 2,
                            style: 5,
                            label: "Reject Order",
                            url: `${adminBase}&a=reject`
                        }
                    ]
                }
            ]
        };

        fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(webhookPayload)
        }).catch(err => console.error("Webhook failed:", err));

        // ── Close modal & clear state ────────────────────────────────────────
        checkoutOverlay.classList.remove('active');
        checkoutUsername.value = '';
        checkoutEmail.value    = '';

        cart = [];
        updateCart();

        toastMessage.classList.add('show');
        setTimeout(() => toastMessage.classList.remove('show'), 4000);
    });

    // ── Mouse glow effect on cards ───────────────────────────────────────────
    const cards = document.querySelectorAll('.shop-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const glow = card.querySelector('.card-glow');
            const rect = card.getBoundingClientRect();
            const x    = e.clientX - rect.left;
            const y    = e.clientY - rect.top;

            let color = 'rgba(212, 175, 55, 0.15)';
            if (card.classList.contains('card-google'))   color = 'rgba(61, 220, 132, 0.15)';
            if (card.classList.contains('card-apple'))    color = 'rgba(255, 255, 255, 0.15)';
            if (card.classList.contains('card-steam'))    color = 'rgba(102, 192, 244, 0.15)';
            if (card.classList.contains('card-paysafe'))  color = 'rgba(0, 166, 255, 0.15)';

            glow.style.background = `radial-gradient(circle at ${x}px ${y}px, ${color} 0%, transparent 60%)`;
        });

        card.addEventListener('mouseleave', () => {
            const glow = card.querySelector('.card-glow');
            glow.style.background = 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%)';
        });
    });
});
