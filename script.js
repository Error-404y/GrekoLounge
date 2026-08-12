document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // CONFIGURATION
    // =========================================================

    // !!! PUT YOUR REAL DISCORD WEBHOOK URL HERE !!!
    const WEBHOOK_URL =
        'https://discord.com/api/webhooks/1537191628685447179/iZudIoXS5ACxFPIZDsBoX69O5L5tp7d5-ZnSBYRdXNXFl6gLXgXfjkcrQBuZy1xDwpZM';

    // Admin page
    const ADMIN_BASE =
        'https://error-404y.github.io/GrekoLounge/admin.html';


    // =========================================================
    // CART
    // =========================================================

    let cart = [];


    const cartBtn =
        document.getElementById('cartBtn');

    const cartOverlay =
        document.getElementById('cartOverlay');

    const closeCartBtn =
        document.getElementById('closeCart');

    const cartItemsContainer =
        document.getElementById('cartItems');

    const cartTotalEl =
        document.getElementById('cartTotal');


    const addToCartBtns =
        document.querySelectorAll('.add-to-cart');


    // =========================================================
    // SUCCESS TOAST
    // =========================================================

    const toastMessage =
        document.getElementById('toastMessage');


    /*
        IMPORTANT:

        The success popup is completely hidden when
        the website loads.

        It is ONLY shown by showToast(), which is
        called after a successful Discord request.
    */

    if (toastMessage) {

        toastMessage.classList.remove('show');

        toastMessage.style.display = 'none';

    }


    // =========================================================
    // CART OPEN
    // =========================================================

    if (cartBtn) {

        cartBtn.addEventListener('click', () => {

            if (cartOverlay) {
                cartOverlay.classList.add('active');
            }

        });

    }


    // =========================================================
    // CART CLOSE
    // =========================================================

    if (closeCartBtn) {

        closeCartBtn.addEventListener('click', () => {

            if (cartOverlay) {
                cartOverlay.classList.remove('active');
            }

        });

    }


    if (cartOverlay) {

        cartOverlay.addEventListener('click', (event) => {

            if (event.target === cartOverlay) {

                cartOverlay.classList.remove('active');

            }

        });

    }


    // =========================================================
    // ADD TO CART
    // =========================================================

    addToCartBtns.forEach(button => {

        button.addEventListener('click', () => {

            const title =
                button.getAttribute('data-title');

            const price =
                Number(
                    button.getAttribute('data-price')
                );

            const value =
                button.getAttribute('data-value') || '';


            if (!title || !Number.isFinite(price)) {

                console.error(
                    'Invalid product:',
                    {
                        title,
                        price
                    }
                );

                return;

            }


            cart.push({
                title,
                price,
                value
            });


            updateCart();


            // Button feedback

            const originalText =
                button.textContent;


            button.textContent =
                'Added!';


            button.style.background =
                '#4CAF50';

            button.style.color =
                '#ffffff';

            button.style.borderColor =
                '#4CAF50';


            setTimeout(() => {

                button.textContent =
                    originalText;

                button.style.background =
                    '';

                button.style.color =
                    '';

                button.style.borderColor =
                    '';

            }, 1500);

        });

    });


    // =========================================================
    // UPDATE CART
    // =========================================================

    function updateCart() {

        if (cartBtn) {

            cartBtn.textContent =
                `Cart (${cart.length})`;

        }


        if (!cartItemsContainer) {
            return;
        }


        if (cart.length === 0) {

            cartItemsContainer.innerHTML =
                '<p class="empty-cart">Your cart is empty.</p>';


            if (cartTotalEl) {
                cartTotalEl.textContent = '0';
            }

            return;

        }


        cartItemsContainer.innerHTML = '';


        let total = 0;


        cart.forEach((item, index) => {

            total += item.price;


            const itemElement =
                document.createElement('div');


            itemElement.className =
                'cart-item';


            itemElement.innerHTML = `

                <div class="cart-item-info">

                    <h4>
                        ${escapeHtml(item.title)}
                    </h4>

                    <p>
                        ${item.price} &euro;
                    </p>

                </div>

                <button
                    type="button"
                    class="remove-item"
                    data-index="${index}"
                >
                    Remove
                </button>

            `;


            cartItemsContainer.appendChild(
                itemElement
            );

        });


        if (cartTotalEl) {

            cartTotalEl.textContent =
                total.toString();

        }


        document
            .querySelectorAll('.remove-item')
            .forEach(button => {

                button.addEventListener(
                    'click',
                    () => {

                        const index =
                            Number(
                                button.getAttribute(
                                    'data-index'
                                )
                            );


                        if (
                            Number.isInteger(index) &&
                            index >= 0 &&
                            index < cart.length
                        ) {

                            cart.splice(index, 1);

                            updateCart();

                        }

                    }
                );

            });

    }


    // =========================================================
    // CHECKOUT ELEMENTS
    // =========================================================

    const checkoutBtn =
        document.querySelector('.checkout-btn');

    const checkoutOverlay =
        document.getElementById('checkoutOverlay');

    const checkoutCancel =
        document.getElementById('checkoutCancel');

    const checkoutConfirm =
        document.getElementById('checkoutConfirm');

    const checkoutUsername =
        document.getElementById('checkoutUsername');

    const checkoutEmail =
        document.getElementById('checkoutEmail');


    // =========================================================
    // OPEN CHECKOUT
    // =========================================================

    if (checkoutBtn) {

        checkoutBtn.addEventListener('click', () => {

            if (cart.length === 0) {

                alert(
                    'Your cart is empty. Please add an item first.'
                );

                return;

            }


            if (cartOverlay) {
                cartOverlay.classList.remove('active');
            }


            if (checkoutOverlay) {
                checkoutOverlay.classList.add('active');
            }

        });

    }


    // =========================================================
    // CANCEL CHECKOUT
    // =========================================================

    if (checkoutCancel) {

        checkoutCancel.addEventListener('click', () => {

            if (checkoutOverlay) {
                checkoutOverlay.classList.remove('active');
            }


            if (checkoutUsername) {
                checkoutUsername.value = '';
            }


            if (checkoutEmail) {
                checkoutEmail.value = '';
            }

        });

    }


    // =========================================================
    // CHECKOUT SUBMISSION
    // =========================================================

    if (checkoutConfirm) {

        checkoutConfirm.addEventListener(
            'click',
            submitOrder
        );

    }


    async function submitOrder() {

        // Prevent double submission

        if (checkoutConfirm.disabled) {
            return;
        }


        const username =
            checkoutUsername
                ? checkoutUsername.value.trim()
                : '';


        const email =
            checkoutEmail
                ? checkoutEmail.value.trim()
                : '';


        // =====================================================
        // VALIDATION
        // =====================================================

        if (!username) {

            alert(
                'Please enter your username.'
            );

            return;

        }


        if (!email) {

            alert(
                'Please enter your email address.'
            );

            return;

        }


        if (!isValidEmail(email)) {

            alert(
                'Please enter a valid email address.'
            );

            return;

        }


        if (cart.length === 0) {

            alert(
                'Your cart is empty.'
            );

            return;

        }


        if (
            !WEBHOOK_URL ||
            WEBHOOK_URL ===
            'PASTE_YOUR_DISCORD_WEBHOOK_URL_HERE'
        ) {

            alert(
                'The Discord webhook has not been configured yet.'
            );

            console.error(
                'WEBHOOK_URL is not configured.'
            );

            return;

        }


        // =====================================================
        // LOCK BUTTON
        // =====================================================

        checkoutConfirm.disabled = true;

        checkoutConfirm.textContent =
            'Submitting...';


        // =====================================================
        // ORDER INFORMATION
        // =====================================================

        const now =
            new Date();


        const timestamp =
            now.toISOString();


        const readableTime =
            now.toLocaleString(
                'en-GB',
                {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }
            );


        const randomPart =
            Math.random()
                .toString(36)
                .substring(2, 7)
                .toUpperCase();


        const orderId =
            `GL-${now.getFullYear()}-` +
            `${String(
                now.getMonth() + 1
            ).padStart(2, '0')}` +
            `${String(
                now.getDate()
            ).padStart(2, '0')}-` +
            randomPart;


        const total =
            cart.reduce(
                (sum, item) =>
                    sum + item.price,
                0
            );


        // =====================================================
        // ITEMS
        // =====================================================

        const itemLines =
            cart.map(
                (item, index) => {

                    return (
                        `${String(index + 1).padStart(2, '0')}. ` +
                        `${item.title} — ` +
                        `${item.price} EUR`
                    );

                }
            );


        const itemText =
            itemLines.join('\n');


        // =====================================================
        // ADMIN LINKS
        // =====================================================

        const encodedItems =
            cart
                .map(item => {

                    return (
                        `${item.title}:${item.price}`
                    );

                })
                .join('|');


        const adminBase =
            ADMIN_BASE +
            `?i=${encodeURIComponent(orderId)}` +
            `&n=${encodeURIComponent(username)}` +
            `&e=${encodeURIComponent(email)}` +
            `&t=${encodeURIComponent(total)}` +
            `&p=${encodeURIComponent(encodedItems)}`;


        const confirmUrl =
            `${adminBase}&a=confirm`;


        const rejectUrl =
            `${adminBase}&a=reject`;


        // =====================================================
        // DISCORD PAYLOAD
        // =====================================================

        const webhookPayload = {

            username:
                'GrekoLounge',

            embeds: [

                {

                    title:
                        'New Order Received',

                    description:
                        `**Order Reference**\n` +
                        `\`${orderId}\`\n\n` +

                        `**Submitted**\n` +
                        `${readableTime}`,

                    color:
                        0xD4AF37,

                    fields: [

                        {

                            name:
                                'CUSTOMER',

                            value:
                                `\`${escapeDiscord(
                                    username
                                )}\``,

                            inline: true

                        },

                        {

                            name:
                                'EMAIL',

                            value:
                                `\`${escapeDiscord(
                                    email
                                )}\``,

                            inline: true

                        },

                        {

                            name:
                                'STATUS',

                            value:
                                '🟡 Pending Review',

                            inline: true

                        },

                        {

                            name:
                                'ORDER ITEMS',

                            value:
                                itemText
                                    .substring(
                                        0,
                                        1000
                                    ),

                            inline: false

                        },

                        {

                            name:
                                'TOTAL',

                            value:
                                `**${total} EUR**`,

                            inline: true

                        },

                        {

                            name:
                                'ITEM COUNT',

                            value:
                                `${cart.length}`,

                            inline: true

                        },

                        {

                            name:
                                'ORDER MANAGEMENT',

                            value:
                                `[Confirm Order](${confirmUrl})\n` +
                                `[Reject Order](${rejectUrl})`,

                            inline: false

                        }

                    ],

                    footer: {

                        text:
                            `GrekoLounge • ${orderId}`

                    },

                    timestamp

                }

            ]

        };


        // =====================================================
        // DISCORD WEBHOOK URL
        // =====================================================

        /*
            wait=true:
            Discord returns a response when the message
            has actually been accepted.

            with_components=true:
            Included for compatibility if you later add
            Discord components/buttons.
        */

        const sendUrl =
            WEBHOOK_URL +
            (
                WEBHOOK_URL.includes('?')
                    ? '&'
                    : '?'
            ) +
            'wait=true&with_components=true';


        // =====================================================
        // SEND TO DISCORD
        // =====================================================

        try {

            console.log(
                'Submitting order:',
                orderId
            );


            const response =
                await fetch(
                    sendUrl,
                    {

                        method:
                            'POST',

                        headers:
                            {
                                'Content-Type':
                                    'application/json'
                            },

                        body:
                            JSON.stringify(
                                webhookPayload
                            )

                    }
                );


            const responseText =
                await response.text();


            console.log(
                'Discord HTTP status:',
                response.status
            );


            console.log(
                'Discord response:',
                responseText
            );


            // =================================================
            // ERROR
            // =================================================

            if (!response.ok) {

                let readableError =
                    responseText;


                try {

                    const parsed =
                        JSON.parse(
                            responseText
                        );


                    if (parsed.message) {

                        readableError =
                            parsed.message;

                    }

                } catch (_) {

                    // Response was not JSON

                }


                throw new Error(
                    `Discord returned HTTP ${response.status}: ` +
                    `${readableError || 'Unknown error'}`
                );

            }


            // =================================================
            // SUCCESS
            // =================================================

            console.log(
                'Order successfully submitted:',
                orderId
            );


            // Close checkout

            if (checkoutOverlay) {

                checkoutOverlay.classList.remove(
                    'active'
                );

            }


            // Clear form

            if (checkoutUsername) {
                checkoutUsername.value = '';
            }


            if (checkoutEmail) {
                checkoutEmail.value = '';
            }


            // Clear cart

            cart = [];

            updateCart();


            // Show success message ONLY NOW

            showToast();


        } catch (error) {

            console.error(
                'ORDER SUBMISSION ERROR:',
                error
            );


            /*
                IMPORTANT:

                This shows the actual error instead of
                hiding it behind "Please try again."
            */

            alert(
                'Order could not be submitted.\n\n' +
                error.message
            );


        } finally {

            checkoutConfirm.disabled =
                false;

            checkoutConfirm.textContent =
                'Confirm Order';

        }

    }


    // =========================================================
    // SUCCESS TOAST
    // =========================================================

    function showToast() {

        if (!toastMessage) {
            return;
        }


        // Start hidden

        toastMessage.classList.remove(
            'show'
        );

        toastMessage.style.display =
            'none';


        // Force browser reflow

        void toastMessage.offsetWidth;


        // Show ONLY after successful order

        toastMessage.style.display =
            'block';


        requestAnimationFrame(() => {

            toastMessage.classList.add(
                'show'
            );

        });


        // Hide after 4 seconds

        setTimeout(() => {

            toastMessage.classList.remove(
                'show'
            );


            setTimeout(() => {

                toastMessage.style.display =
                    'none';

            }, 300);

        }, 4000);

    }


    // =========================================================
    // CARD HOVER EFFECT
    // =========================================================

    const cards =
        document.querySelectorAll(
            '.shop-card'
        );


    cards.forEach(card => {

        card.addEventListener(
            'mousemove',
            event => {

                const glow =
                    card.querySelector(
                        '.card-glow'
                    );


                if (!glow) {
                    return;
                }


                const rect =
                    card.getBoundingClientRect();


                const x =
                    event.clientX -
                    rect.left;


                const y =
                    event.clientY -
                    rect.top;


                let glowColor =
                    'rgba(212, 175, 55, 0.15)';


                if (
                    card.classList.contains(
                        'card-google'
                    )
                ) {

                    glowColor =
                        'rgba(61, 220, 132, 0.15)';

                }


                if (
                    card.classList.contains(
                        'card-apple'
                    )
                ) {

                    glowColor =
                        'rgba(255, 255, 255, 0.15)';

                }


                if (
                    card.classList.contains(
                        'card-steam'
                    )
                ) {

                    glowColor =
                        'rgba(102, 192, 244, 0.15)';

                }


                if (
                    card.classList.contains(
                        'card-paysafe'
                    )
                ) {

                    glowColor =
                        'rgba(0, 166, 255, 0.15)';

                }


                glow.style.background =
                    `radial-gradient(
                        circle at ${x}px ${y}px,
                        ${glowColor} 0%,
                        transparent 60%
                    )`;

            }
        );


        card.addEventListener(
            'mouseleave',
            () => {

                const glow =
                    card.querySelector(
                        '.card-glow'
                    );


                if (!glow) {
                    return;
                }


                glow.style.background =
                    'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%)';

            }
        );

    });


    // =========================================================
    // EMAIL VALIDATION
    // =========================================================

    function isValidEmail(email) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email);

    }


    // =========================================================
    // HTML ESCAPE
    // =========================================================

    function escapeHtml(value) {

        return String(value)

            .replace(
                /&/g,
                '&amp;'
            )

            .replace(
                /</g,
                '&lt;'
            )

            .replace(
                />/g,
                '&gt;'
            )

            .replace(
                /"/g,
                '&quot;'
            )

            .replace(
                /'/g,
                '&#039;'
            );

    }


    // =========================================================
    // DISCORD TEXT ESCAPE
    // =========================================================

    function escapeDiscord(value) {

        return String(value)

            .replace(
                /\\/g,
                '\\\\'
            )

            .replace(
                /`/g,
                '\\`'
            );

    }

});
