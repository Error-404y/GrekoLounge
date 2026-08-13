document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================
       SUPABASE CONFIGURATION
    ========================================================== */

    const SUPABASE_URL =
        'https://vsjrqeaubmoxjzlklzbg.supabase.co';

    const SUPABASE_PUBLISHABLE_KEY =
        'sb_publishable_jaQjrYZSve2__Pw5594YEg_R_ou42Sm';

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== 'function'
    ) {
        console.error(
            'GrekoLounge: Supabase library could not be loaded.'
        );

        return;
    }

    const supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );


    /* =========================================================
       CONFIGURATION
    ========================================================== */

    const MINIMUM_ORDER = 100;


    /* =========================================================
       STATE
    ========================================================== */

    let cart = [];

    let toastTimeout = null;


    /* =========================================================
       ELEMENTS
    ========================================================== */

    const cartBtn =
        document.getElementById('cartBtn');

    const cartBadge =
        document.getElementById('cartBadge');

    const cartOverlay =
        document.getElementById('cartOverlay');

    const closeCartBtn =
        document.getElementById('closeCart');

    const cartItemsContainer =
        document.getElementById('cartItems');

    const cartTotalEl =
        document.getElementById('cartTotal');

    const cartItemCountEl =
        document.getElementById('cartItemCount');

    const cartSubtitle =
        document.getElementById('cartSubtitle');

    const checkoutBtn =
        document.getElementById('checkoutBtn');

    const checkoutOverlay =
        document.getElementById('checkoutOverlay');

    const checkoutClose =
        document.getElementById('checkoutClose');

    const checkoutCancel =
        document.getElementById('checkoutCancel');

    const checkoutConfirm =
        document.getElementById('checkoutConfirm');

    const checkoutUsername =
        document.getElementById('checkoutUsername');

    const checkoutEmail =
        document.getElementById('checkoutEmail');

    const usernameError =
        document.getElementById('usernameError');

    const emailError =
        document.getElementById('emailError');

    const checkoutError =
        document.getElementById('checkoutError');

    const checkoutSummaryItems =
        document.getElementById('checkoutSummaryItems');

    const checkoutSummaryTotal =
        document.getElementById('checkoutSummaryTotal');

    const checkoutSummaryCount =
        document.getElementById('checkoutSummaryCount');

    const toastMessage =
        document.getElementById('toastMessage');

    const minimumProgress =
        document.getElementById('minimumProgress');

    const minimumOrderMessage =
        document.getElementById('minimumOrderMessage');

    const minimumOrderBox =
        document.querySelector('.minimum-order');

    const minimumOverlay =
        document.getElementById('minimumOverlay');

    const minimumContinue =
        document.getElementById('minimumContinue');

    const minimumCurrentTotal =
        document.getElementById('minimumCurrentTotal');

    const minimumRemaining =
        document.getElementById('minimumRemaining');

    const statusOverlay =
        document.getElementById('statusOverlay');

    const statusClose =
        document.getElementById('statusClose');

    const successOrderReference =
        document.getElementById('successOrderReference');

    const successOrderTotal =
        document.getElementById('successOrderTotal');

    const addToCartBtns =
        document.querySelectorAll('.add-to-cart');


    /* =========================================================
       HELPERS
    ========================================================== */

    function formatEuro(value) {

        const number =
            Number(value) || 0;

        return number.toLocaleString(
            'en-GB',
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );

    }


    function escapeHtml(value) {

        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    }


    function getCartTotal() {

        return cart.reduce(
            (sum, item) => {

                const price =
                    Number(item.price) || 0;

                const quantity =
                    Number(item.quantity) || 0;

                return sum + price * quantity;

            },
            0
        );

    }


    function getCartItemCount() {

        return cart.reduce(
            (sum, item) => {

                return sum +
                    (Number(item.quantity) || 0);

            },
            0
        );

    }


    function generateOrderId() {

        const now =
            new Date();

        const random =
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();

        return (
            `GL-${now.getFullYear()}` +
            `${String(
                now.getMonth() + 1
            ).padStart(2, '0')}` +
            `${String(
                now.getDate()
            ).padStart(2, '0')}-` +
            `${random}`
        );

    }


    function lockBody() {

        document.body.style.overflow =
            'hidden';

    }


    function unlockBody() {

        const activeModal =
            document.querySelector(
                '.cart-overlay.active,' +
                '.checkout-overlay.active,' +
                '.minimum-overlay.active,' +
                '.status-overlay.active'
            );

        if (!activeModal) {

            document.body.style.overflow =
                '';

        }

    }


    /* =========================================================
       TOAST
    ========================================================== */

    function showToast(message) {

        if (!toastMessage) {
            return;
        }

        clearTimeout(toastTimeout);

        toastMessage.textContent =
            message;

        toastMessage.classList.remove(
            'show'
        );

        void toastMessage.offsetWidth;

        toastMessage.classList.add(
            'show'
        );

        toastTimeout =
            setTimeout(() => {

                toastMessage.classList.remove(
                    'show'
                );

            }, 3000);

    }


    /* =========================================================
       MODALS
    ========================================================== */

    function openCart() {

        if (!cartOverlay) {
            return;
        }

        cartOverlay.classList.add(
            'active'
        );

        lockBody();

    }


    function closeCart() {

        if (!cartOverlay) {
            return;
        }

        cartOverlay.classList.remove(
            'active'
        );

        unlockBody();

    }


    function openCheckout() {

        if (!checkoutOverlay) {
            return;
        }

        updateCheckoutSummary();

        checkoutOverlay.classList.add(
            'active'
        );

        lockBody();

        setTimeout(() => {

            if (checkoutUsername) {
                checkoutUsername.focus();
            }

        }, 100);

    }


    function closeCheckout() {

        if (!checkoutOverlay) {
            return;
        }

        checkoutOverlay.classList.remove(
            'active'
        );

        clearCheckoutErrors();

        unlockBody();

    }


    function openMinimumModal() {

        if (!minimumOverlay) {
            return;
        }

        const total =
            getCartTotal();

        const remaining =
            Math.max(
                0,
                MINIMUM_ORDER - total
            );

        if (minimumCurrentTotal) {

            minimumCurrentTotal.textContent =
                formatEuro(total);

        }

        if (minimumRemaining) {

            minimumRemaining.textContent =
                formatEuro(remaining);

        }

        minimumOverlay.classList.add(
            'active'
        );

        lockBody();

    }


    function closeMinimumModal() {

        if (!minimumOverlay) {
            return;
        }

        minimumOverlay.classList.remove(
            'active'
        );

        unlockBody();

    }


    function openStatusModal(
        orderId,
        total
    ) {

        if (!statusOverlay) {
            return;
        }

        if (successOrderReference) {

            successOrderReference.textContent =
                orderId;

        }

        if (successOrderTotal) {

            successOrderTotal.textContent =
                formatEuro(total);

        }

        statusOverlay.classList.add(
            'active'
        );

        lockBody();

    }


    function closeStatusModal() {

        if (!statusOverlay) {
            return;
        }

        statusOverlay.classList.remove(
            'active'
        );

        unlockBody();

    }


    /* =========================================================
       MODAL EVENTS
    ========================================================== */

    if (cartBtn) {

        cartBtn.addEventListener(
            'click',
            openCart
        );

    }


    if (closeCartBtn) {

        closeCartBtn.addEventListener(
            'click',
            closeCart
        );

    }


    if (cartOverlay) {

        cartOverlay.addEventListener(
            'click',
            event => {

                if (
                    event.target ===
                    cartOverlay
                ) {

                    closeCart();

                }

            }
        );

    }


    if (checkoutClose) {

        checkoutClose.addEventListener(
            'click',
            closeCheckout
        );

    }


    if (checkoutCancel) {

        checkoutCancel.addEventListener(
            'click',
            closeCheckout
        );

    }


    if (checkoutOverlay) {

        checkoutOverlay.addEventListener(
            'click',
            event => {

                if (
                    event.target ===
                    checkoutOverlay
                ) {

                    closeCheckout();

                }

            }
        );

    }


    if (minimumContinue) {

        minimumContinue.addEventListener(
            'click',
            closeMinimumModal
        );

    }


    if (minimumOverlay) {

        minimumOverlay.addEventListener(
            'click',
            event => {

                if (
                    event.target ===
                    minimumOverlay
                ) {

                    closeMinimumModal();

                }

            }
        );

    }


    if (statusClose) {

        statusClose.addEventListener(
            'click',
            closeStatusModal
        );

    }


    if (statusOverlay) {

        statusOverlay.addEventListener(
            'click',
            event => {

                if (
                    event.target ===
                    statusOverlay
                ) {

                    closeStatusModal();

                }

            }
        );

    }


    document.addEventListener(
        'keydown',
        event => {

            if (
                event.key !== 'Escape'
            ) {

                return;

            }

            closeCart();
            closeCheckout();
            closeMinimumModal();
            closeStatusModal();

        }
    );


    /* =========================================================
       ADD TO CART
    ========================================================== */

    addToCartBtns.forEach(button => {

        button.addEventListener(
            'click',
            () => {

                const title =
                    button.getAttribute(
                        'data-title'
                    );

                const price =
                    Number(
                        button.getAttribute(
                            'data-price'
                        )
                    );

                const value =
                    Number(
                        button.getAttribute(
                            'data-value'
                        )
                    );


                if (
                    !title ||
                    !Number.isFinite(price) ||
                    price <= 0
                ) {

                    showToast(
                        'This product could not be added to your cart.'
                    );

                    return;

                }


                const existing =
                    cart.find(
                        item =>
                            item.title === title &&
                            Number(item.price) === price
                    );


                if (existing) {

                    existing.quantity += 1;

                } else {

                    cart.push({

                        title:
                            title,

                        price:
                            price,

                        value:
                            Number.isFinite(value)
                                ? value
                                : 0,

                        quantity:
                            1

                    });

                }


                updateCart();

                animateCartBadge();


                const originalText =
                    button.textContent;

                button.textContent =
                    'Added';

                button.classList.add(
                    'added-state'
                );


                setTimeout(() => {

                    button.textContent =
                        originalText;

                    button.classList.remove(
                        'added-state'
                    );

                }, 1200);


                showToast(
                    `${title} added to your cart.`
                );

            }
        );

    });


    /* =========================================================
       UPDATE CART
    ========================================================== */

    function updateCart() {

        const total =
            getCartTotal();

        const itemCount =
            getCartItemCount();


        if (cartBadge) {

            cartBadge.textContent =
                itemCount;

        }


        if (cartSubtitle) {

            cartSubtitle.textContent =
                `${itemCount} ${
                    itemCount === 1
                        ? 'item'
                        : 'items'
                }`;

        }


        if (cartItemCountEl) {

            cartItemCountEl.textContent =
                itemCount;

        }


        if (cartTotalEl) {

            cartTotalEl.textContent =
                formatEuro(total);

        }


        updateMinimumProgress(
            total
        );


        if (checkoutBtn) {

            checkoutBtn.disabled =
                cart.length === 0 ||
                total < MINIMUM_ORDER;

        }


        if (!cartItemsContainer) {
            return;
        }


        if (cart.length === 0) {

            cartItemsContainer.innerHTML = `
                <div class="empty-cart">

                    <div class="empty-cart-title">
                        Your cart is empty
                    </div>

                    <p>
                        Select a gift card to get started.
                    </p>

                </div>
            `;

            return;

        }


        cartItemsContainer.innerHTML =
            '';


        cart.forEach(
            (item, index) => {

                const quantity =
                    Number(item.quantity) || 0;

                const price =
                    Number(item.price) || 0;

                const itemTotal =
                    quantity * price;


                const itemEl =
                    document.createElement(
                        'div'
                    );

                itemEl.className =
                    'cart-item';


                itemEl.innerHTML = `

                    <div class="cart-item-info">

                        <h4>
                            ${escapeHtml(
                                item.title
                            )}
                        </h4>

                        <p>
                            ${formatEuro(
                                itemTotal
                            )} €
                        </p>

                        <div class="cart-item-meta">
                            ${formatEuro(
                                price
                            )} € per item
                        </div>

                        <div class="cart-item-controls">

                            <button
                                class="quantity-btn"
                                data-action="decrease"
                                data-index="${index}"
                                aria-label="Decrease quantity"
                            >
                                −
                            </button>

                            <span class="quantity-value">
                                ${quantity}
                            </span>

                            <button
                                class="quantity-btn"
                                data-action="increase"
                                data-index="${index}"
                                aria-label="Increase quantity"
                            >
                                +
                            </button>

                        </div>

                    </div>

                    <button
                        class="remove-item"
                        data-action="remove"
                        data-index="${index}"
                    >
                        Remove
                    </button>

                `;


                cartItemsContainer.appendChild(
                    itemEl
                );

            }
        );

    }


    /* =========================================================
       CART CONTROLS
    ========================================================== */

    if (cartItemsContainer) {

        cartItemsContainer.addEventListener(
            'click',
            event => {

                const button =
                    event.target.closest(
                        'button'
                    );

                if (!button) {
                    return;
                }


                const index =
                    Number(
                        button.getAttribute(
                            'data-index'
                        )
                    );


                if (
                    !Number.isInteger(index) ||
                    !cart[index]
                ) {

                    return;

                }


                const action =
                    button.getAttribute(
                        'data-action'
                    );


                if (
                    action ===
                    'increase'
                ) {

                    cart[index].quantity += 1;

                    updateCart();

                    animateCartBadge();

                    return;

                }


                if (
                    action ===
                    'decrease'
                ) {

                    cart[index].quantity -= 1;


                    if (
                        cart[index].quantity <= 0
                    ) {

                        cart.splice(
                            index,
                            1
                        );

                    }


                    updateCart();

                    animateCartBadge();

                    return;

                }


                if (
                    action ===
                    'remove'
                ) {

                    const removedItem =
                        cart[index];


                    cart.splice(
                        index,
                        1
                    );


                    updateCart();

                    animateCartBadge();


                    showToast(
                        `${removedItem.title} removed from your cart.`
                    );

                }

            }
        );

    }


    /* =========================================================
       MINIMUM ORDER
    ========================================================== */

    function updateMinimumProgress(total) {

        if (
            !minimumProgress ||
            !minimumOrderMessage ||
            !minimumOrderBox
        ) {

            return;

        }


        const percentage =
            Math.min(
                (total / MINIMUM_ORDER) * 100,
                100
            );


        minimumProgress.style.width =
            `${percentage}%`;


        if (
            total >= MINIMUM_ORDER
        ) {

            minimumProgress.classList.add(
                'complete'
            );

            minimumOrderBox.classList.add(
                'complete'
            );

            minimumOrderMessage.textContent =
                'Minimum order reached. You can proceed to checkout.';

        } else {

            minimumProgress.classList.remove(
                'complete'
            );

            minimumOrderBox.classList.remove(
                'complete'
            );


            const remaining =
                MINIMUM_ORDER - total;


            minimumOrderMessage.textContent =
                `Add ${formatEuro(
                    remaining
                )} € more to reach the minimum order.`;

        }

    }


    /* =========================================================
       CART BADGE ANIMATION
    ========================================================== */

    function animateCartBadge() {

        if (!cartBadge) {
            return;
        }

        cartBadge.classList.remove(
            'bump'
        );

        void cartBadge.offsetWidth;

        cartBadge.classList.add(
            'bump'
        );

    }


    /* =========================================================
       CHECKOUT
    ========================================================== */

    if (checkoutBtn) {

        checkoutBtn.addEventListener(
            'click',
            () => {

                const total =
                    getCartTotal();


                if (
                    cart.length === 0
                ) {

                    showToast(
                        'Your cart is empty.'
                    );

                    return;

                }


                if (
                    total < MINIMUM_ORDER
                ) {

                    openMinimumModal();

                    return;

                }


                closeCart();

                openCheckout();

            }
        );

    }


    /* =========================================================
       CHECKOUT SUMMARY
    ========================================================== */

    function updateCheckoutSummary() {

        if (
            !checkoutSummaryItems ||
            !checkoutSummaryCount ||
            !checkoutSummaryTotal
        ) {

            return;

        }


        checkoutSummaryItems.innerHTML =
            '';


        const itemCount =
            getCartItemCount();

        const total =
            getCartTotal();


        checkoutSummaryCount.textContent =
            `${itemCount} ${
                itemCount === 1
                    ? 'item'
                    : 'items'
            }`;


        checkoutSummaryTotal.textContent =
            formatEuro(total);


        cart.forEach(item => {

            const quantity =
                Number(item.quantity) || 0;

            const price =
                Number(item.price) || 0;

            const itemTotal =
                quantity * price;


            const row =
                document.createElement(
                    'div'
                );

            row.className =
                'checkout-summary-item';


            row.innerHTML = `

                <span>
                    ${escapeHtml(
                        item.title
                    )}
                    ${
                        quantity > 1
                            ? ` × ${quantity}`
                            : ''
                    }
                </span>

                <span>
                    ${formatEuro(
                        itemTotal
                    )} €
                </span>

            `;


            checkoutSummaryItems.appendChild(
                row
            );

        });

    }


    /* =========================================================
       FORM VALIDATION
    ========================================================== */

    function clearCheckoutErrors() {

        if (usernameError) {
            usernameError.textContent = '';
        }

        if (emailError) {
            emailError.textContent = '';
        }

        if (checkoutError) {

            checkoutError.textContent =
                '';

            checkoutError.classList.remove(
                'show'
            );

        }

        if (checkoutUsername) {

            checkoutUsername.classList.remove(
                'input-error'
            );

        }

        if (checkoutEmail) {

            checkoutEmail.classList.remove(
                'input-error'
            );

        }

    }


    function validateCheckout() {

        clearCheckoutErrors();

        const username =
            checkoutUsername.value.trim();

        const email =
            checkoutEmail.value.trim();

        let valid =
            true;


        if (!username) {

            usernameError.textContent =
                'Please enter your username.';

            checkoutUsername.classList.add(
                'input-error'
            );

            valid =
                false;

        } else if (
            username.length < 2
        ) {

            usernameError.textContent =
                'Username must contain at least 2 characters.';

            checkoutUsername.classList.add(
                'input-error'
            );

            valid =
                false;

        } else if (
            username.length > 100
        ) {

            usernameError.textContent =
                'Username is too long.';

            checkoutUsername.classList.add(
                'input-error'
            );

            valid =
                false;

        }


        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!email) {

            emailError.textContent =
                'Please enter your email address.';

            checkoutEmail.classList.add(
                'input-error'
            );

            valid =
                false;

        } else if (
            !emailPattern.test(email)
        ) {

            emailError.textContent =
                'Please enter a valid email address.';

            checkoutEmail.classList.add(
                'input-error'
            );

            valid =
                false;

        } else if (
            email.length > 254
        ) {

            emailError.textContent =
                'Email address is too long.';

            checkoutEmail.classList.add(
                'input-error'
            );

            valid =
                false;

        }


        return valid;

    }


    /* =========================================================
       ORDER PAYLOAD
    ========================================================== */

    function createOrderPayload(
        orderId,
        username,
        email,
        total
    ) {

        const items =
            cart.map(item => ({

                title:
                    String(item.title),

                value:
                    Number(item.value) || 0,

                price:
                    Number(item.price) || 0,

                quantity:
                    Number(item.quantity) || 0,

                item_total:
                    (
                        Number(item.price) || 0
                    ) *
                    (
                        Number(item.quantity) || 0
                    )

            }));


        return {

            order_id:
                orderId,

            username:
                username,

            email:
                email,

            total:
                total,

            items:
                items,

            status:
                'pending'

        };

    }


    /* =========================================================
       SAVE ORDER TO SUPABASE
    ========================================================== */

    async function saveOrderToSupabase(
        orderPayload
    ) {

        const {
            data,
            error
        } =
            await supabaseClient
                .from('orders')
                .insert(
                    orderPayload
                )
                .select()
                .single();


        if (error) {

            console.error(
                'GrekoLounge Supabase order error:',
                error
            );

            throw error;

        }


        return data;

    }


    /* =========================================================
       CHECKOUT SUBMISSION
    ========================================================== */

    if (checkoutConfirm) {

        checkoutConfirm.addEventListener(
            'click',
            async () => {

                if (
                    checkoutConfirm.disabled
                ) {

                    return;

                }


                if (
                    !validateCheckout()
                ) {

                    return;

                }


                if (
                    cart.length === 0
                ) {

                    checkoutError.textContent =
                        'Your cart is empty.';

                    checkoutError.classList.add(
                        'show'
                    );

                    return;

                }


                const total =
                    getCartTotal();


                if (
                    total < MINIMUM_ORDER
                ) {

                    closeCheckout();

                    openMinimumModal();

                    return;

                }


                const username =
                    checkoutUsername.value.trim();

                const email =
                    checkoutEmail.value.trim();


                checkoutConfirm.disabled =
                    true;

                checkoutConfirm.textContent =
                    'Submitting...';

                clearCheckoutErrors();


                const orderId =
                    generateOrderId();


                try {

                    const orderPayload =
                        createOrderPayload(
                            orderId,
                            username,
                            email,
                            total
                        );


                    await saveOrderToSupabase(
                        orderPayload
                    );


                    closeCheckout();


                    checkoutUsername.value =
                        '';

                    checkoutEmail.value =
                        '';


                    cart =
                        [];


                    updateCart();


                    openStatusModal(
                        orderId,
                        total
                    );


                    showToast(
                        'Order submitted successfully.'
                    );


                } catch (error) {

                    console.error(
                        'GrekoLounge: Order submission failed:',
                        error
                    );


                    let errorMessage =
                        'We could not submit your order at this time. Please try again later.';


                    if (
                        error &&
                        error.code === '23505'
                    ) {

                        errorMessage =
                            'This order reference already exists. Please try again.';

                    }


                    if (
                        error &&
                        error.code === '42501'
                    ) {

                        errorMessage =
                            'Database permissions are not configured correctly.';

                    }


                    if (
                        error &&
                        error.code === 'PGRST301'
                    ) {

                        errorMessage =
                            'Your order could not be submitted because the request was not authorized.';

                    }


                    checkoutError.textContent =
                        errorMessage;

                    checkoutError.classList.add(
                        'show'
                    );

                } finally {

                    checkoutConfirm.disabled =
                        false;

                    checkoutConfirm.textContent =
                        'Submit Order';

                }

            }
        );

    }


    /* =========================================================
       ENTER KEY
    ========================================================== */

    [
        checkoutUsername,
        checkoutEmail
    ].forEach(input => {

        if (!input) {
            return;
        }


        input.addEventListener(
            'keydown',
            event => {

                if (
                    event.key === 'Enter'
                ) {

                    event.preventDefault();

                    if (
                        checkoutConfirm &&
                        !checkoutConfirm.disabled
                    ) {

                        checkoutConfirm.click();

                    }

                }

            }
        );

    });


    /* =========================================================
       LIVE FORM VALIDATION
    ========================================================== */

    if (checkoutUsername) {

        checkoutUsername.addEventListener(
            'input',
            () => {

                checkoutUsername.classList.remove(
                    'input-error'
                );

                usernameError.textContent =
                    '';

            }
        );

    }


    if (checkoutEmail) {

        checkoutEmail.addEventListener(
            'input',
            () => {

                checkoutEmail.classList.remove(
                    'input-error'
                );

                emailError.textContent =
                    '';

            }
        );

    }


    /* =========================================================
       PRODUCT CARD GLOW
    ========================================================== */

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


                let color =
                    'rgba(212, 175, 55, 0.15)';


                if (
                    card.classList.contains(
                        'card-google'
                    )
                ) {

                    color =
                        'rgba(61, 220, 132, 0.15)';

                }


                if (
                    card.classList.contains(
                        'card-apple'
                    )
                ) {

                    color =
                        'rgba(255, 255, 255, 0.15)';

                }


                if (
                    card.classList.contains(
                        'card-steam'
                    )
                ) {

                    color =
                        'rgba(102, 192, 244, 0.15)';

                }


                if (
                    card.classList.contains(
                        'card-paysafe'
                    )
                ) {

                    color =
                        'rgba(0, 166, 255, 0.15)';

                }


                glow.style.background =
                    `radial-gradient(
                        circle at ${x}px ${y}px,
                        ${color} 0%,
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


    /* =========================================================
       SUPABASE CONNECTION TEST
    ========================================================== */

    async function testSupabaseConnection() {

        try {

            const {
                error
            } =
                await supabaseClient
                    .from('orders')
                    .select('id')
                    .limit(1);


            if (error) {

                console.warn(
                    'GrekoLounge: Supabase connection/table test:',
                    error.message
                );

                return;

            }


            console.log(
                'GrekoLounge: Supabase connection successful.'
            );

        } catch (error) {

            console.warn(
                'GrekoLounge: Supabase connection test failed:',
                error
            );

        }

    }


    /* =========================================================
       INITIALIZE
    ========================================================== */

    updateCart();

    testSupabaseConnection();

});
