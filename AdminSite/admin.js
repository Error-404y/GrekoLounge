document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================
       SUPABASE CONFIGURATION
    ========================================================== */

    const SUPABASE_URL =
        'https://vsjrqeaubmoxjzlklzbg.supabase.co';

    const SUPABASE_PUBLISHABLE_KEY =
        'sb_publishable_jaQjrYZSve2__Pw5594YEg_R_ou42Sm';


    /* =========================================================
       ADMIN CONFIGURATION
    ========================================================== */

    // Authorization is verified by the database, never by a public UID.


    /* =========================================================
       SUPABASE CLIENT
    ========================================================== */

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== 'function'
    ) {

        console.error(
            'GrekoLounge Admin: Supabase library failed to load.'
        );

        return;

    }


    const supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );


    /* =========================================================
       ELEMENTS
    ========================================================== */

    const loginScreen =
        document.getElementById('loginScreen');

    const dashboard =
        document.getElementById('dashboard');

    const loginForm =
        document.getElementById('loginForm');

    const loginEmail =
        document.getElementById('loginEmail');

    const loginPassword =
        document.getElementById('loginPassword');

    const loginButton =
        document.getElementById('loginButton');

    const loginError =
        document.getElementById('loginError');

    const logoutButton =
        document.getElementById('logoutButton');

    const adminEmail =
        document.getElementById('adminEmail');

    const refreshButton =
        document.getElementById('refreshButton');

    const searchInput =
        document.getElementById('searchInput');

    const statusFilter =
        document.getElementById('statusFilter');

    const ordersTableBody =
        document.getElementById('ordersTableBody');

    const statTotalOrders =
        document.getElementById('statTotalOrders');

    const statPending =
        document.getElementById('statPending');

    const statApproved =
        document.getElementById('statApproved');

    const statTotalValue =
        document.getElementById('statTotalValue');

    const toast =
        document.getElementById('toast');


    /* =========================================================
       STATE
    ========================================================== */

    let orders = [];

    let filteredOrders = [];

    let currentUser = null;

    let toastTimeout = null;


    /* =========================================================
       HELPERS
    ========================================================== */

    function escapeHtml(value) {

        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    }


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


    function formatDate(value) {

        if (!value) {
            return '—';
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return '—';

        }


        return date.toLocaleString(
            'en-GB',
            {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }
        );

    }


    function showToast(
        message,
        type = 'success'
    ) {

        if (!toast) {
            return;
        }


        clearTimeout(
            toastTimeout
        );


        toast.textContent =
            message;


        toast.className =
            'toast show ' +
            type;


        toastTimeout =
            setTimeout(
                () => {

                    toast.classList.remove(
                        'show'
                    );

                },
                3500
            );

    }


    function showLoginError(
        message
    ) {

        if (!loginError) {
            return;
        }


        loginError.textContent =
            message;


        loginError.classList.add(
            'show'
        );

    }


    function clearLoginError() {

        if (!loginError) {
            return;
        }


        loginError.textContent =
            '';


        loginError.classList.remove(
            'show'
        );

    }


    /* =========================================================
       ADMIN CHECK
    ========================================================== */

    async function isAdmin(
        user
    ) {

        if (!user) {
            return false;
        }


        const { data, error } =
            await supabaseClient.rpc('is_admin');

        return !error && data === true;

    }


    /* =========================================================
       SHOW LOGIN
    ========================================================== */

    function showLogin() {

        currentUser =
            null;


        if (loginScreen) {

            loginScreen.style.display =
                'flex';

        }


        if (dashboard) {

            dashboard.classList.remove(
                'active'
            );

        }


        if (adminEmail) {

            adminEmail.textContent =
                '—';

        }

    }


    /* =========================================================
       SHOW DASHBOARD
    ========================================================== */

    function showDashboard(
        user
    ) {

        currentUser =
            user;


        if (loginScreen) {

            loginScreen.style.display =
                'none';

        }


        if (dashboard) {

            dashboard.classList.add(
                'active'
            );

        }


        if (adminEmail) {

            adminEmail.textContent =
                user.email || 'Admin';

        }


        loadOrders();

    }


    /* =========================================================
       LOGIN
    ========================================================== */

    if (loginForm) {

        loginForm.addEventListener(
            'submit',
            async event => {

                event.preventDefault();


                clearLoginError();


                const email =
                    loginEmail.value.trim();

                const password =
                    loginPassword.value;


                if (!email || !password) {

                    showLoginError(
                        'Please enter your email and password.'
                    );

                    return;

                }


                loginButton.disabled =
                    true;

                loginButton.textContent =
                    'Signing in...';


                try {

                    const {
                        data,
                        error
                    } =
                        await supabaseClient
                            .auth
                            .signInWithPassword({
                                email,
                                password
                            });


                    if (error) {
                        throw error;
                    }


                    if (
                        !data ||
                        !data.user
                    ) {

                        throw new Error(
                            'Login failed.'
                        );

                    }


                    if (
                        !(await isAdmin(
                            data.user
                        ))
                    ) {

                        await supabaseClient
                            .auth
                            .signOut();


                        throw new Error(
                            'This account is not authorized to access the admin panel.'
                        );

                    }


                    loginPassword.value =
                        '';


                    showDashboard(
                        data.user
                    );


                    showToast(
                        'Welcome back, Admin.'
                    );


                } catch (error) {

                    console.error(
                        'Admin login error:',
                        error
                    );


                    let message =
                        'Login failed. Please check your credentials.';


                    if (
                        error &&
                        error.message
                    ) {

                        if (
                            error.message
                                .toLowerCase()
                                .includes(
                                    'invalid login credentials'
                                )
                        ) {

                            message =
                                'Invalid email or password.';

                        } else {

                            message =
                                error.message;

                        }

                    }


                    showLoginError(
                        message
                    );

                } finally {

                    loginButton.disabled =
                        false;

                    loginButton.textContent =
                        'Sign In';

                }

            }
        );

    }


    /* =========================================================
       AUTH STATE
    ========================================================== */

    supabaseClient
        .auth
        .onAuthStateChange(
            async (
                event,
                session
            ) => {

                if (
                    session &&
                    session.user
                ) {

                    if (
                        await isAdmin(
                            session.user
                        )
                    ) {

                        showDashboard(
                            session.user
                        );

                    } else {

                        await supabaseClient
                            .auth
                            .signOut();

                        showLogin();

                    }

                } else {

                    showLogin();

                }

            }
        );


    /* =========================================================
       CHECK CURRENT SESSION
    ========================================================== */

    async function checkCurrentSession() {

        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .getSession();


            if (error) {
                throw error;
            }


            const session =
                data?.session;


            if (
                session &&
                session.user
            ) {

                if (
                    await isAdmin(
                        session.user
                    )
                ) {

                    showDashboard(
                        session.user
                    );

                } else {

                    await supabaseClient
                        .auth
                        .signOut();

                    showLogin();

                }

            } else {

                showLogin();

            }

        } catch (error) {

            console.error(
                'Session check failed:',
                error
            );


            showLogin();

        }

    }


    /* =========================================================
       LOGOUT
    ========================================================== */

    if (logoutButton) {

        logoutButton.addEventListener(
            'click',
            async () => {

                logoutButton.disabled =
                    true;

                logoutButton.textContent =
                    'Logging out...';


                try {

                    const {
                        error
                    } =
                        await supabaseClient
                            .auth
                            .signOut();


                    if (error) {
                        throw error;
                    }


                    orders =
                        [];

                    filteredOrders =
                        [];


                    showLogin();

                    showToast(
                        'You have been logged out.'
                    );


                } catch (error) {

                    console.error(
                        'Logout error:',
                        error
                    );


                    showToast(
                        'Logout failed.',
                        'error'
                    );

                } finally {

                    logoutButton.disabled =
                        false;

                    logoutButton.textContent =
                        'Logout';

                }

            }
        );

    }


    /* =========================================================
       LOAD ORDERS
    ========================================================== */

    async function loadOrders() {

        if (!ordersTableBody) {
            return;
        }


        ordersTableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="table-message loading"
                >
                    Loading orders...
                </td>

            </tr>

        `;


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from('orders')
                    .select('*')
                    .order(
                        'created_at',
                        {
                            ascending: false
                        }
                    );


            if (error) {
                throw error;
            }


            orders =
                Array.isArray(data)
                    ? data
                    : [];


            updateStatistics();

            applyFilters();


        } catch (error) {

            console.error(
                'Load orders error:',
                error
            );


            ordersTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="table-message"
                    >
                        Could not load orders.
                    </td>

                </tr>

            `;


            if (
                error &&
                error.code === '42501'
            ) {

                showToast(
                    'Permission denied. Check your admin RLS policies.',
                    'error'
                );

            } else {

                showToast(
                    'Could not load orders.',
                    'error'
                );

            }

        }

    }


    /* =========================================================
       STATISTICS
    ========================================================== */

    function updateStatistics() {

        const totalOrders =
            orders.length;


        const pendingCount =
            orders.filter(
                order =>
                    String(
                        order.status || ''
                    ).toLowerCase() ===
                    'pending'
            ).length;


        const approvedCount =
            orders.filter(
                order =>
                    String(
                        order.status || ''
                    ).toLowerCase() ===
                    'approved'
            ).length;


        const totalValue =
            orders.reduce(
                (
                    sum,
                    order
                ) => {

                    return sum +
                        (
                            Number(
                                order.total
                            ) || 0
                        );

                },
                0
            );


        if (statTotalOrders) {

            statTotalOrders.textContent =
                totalOrders;

        }


        if (statPending) {

            statPending.textContent =
                pendingCount;

        }


        if (statApproved) {

            statApproved.textContent =
                approvedCount;

        }


        if (statTotalValue) {

            statTotalValue.textContent =
                `${formatEuro(
                    totalValue
                )} €`;

        }

    }


    /* =========================================================
       FILTERS
    ========================================================== */

    function applyFilters() {

        const search =
            (
                searchInput?.value || ''
            )
                .trim()
                .toLowerCase();


        const status =
            statusFilter?.value ||
            'all';


        filteredOrders =
            orders.filter(
                order => {

                    const orderId =
                        String(
                            order.order_id || ''
                        )
                            .toLowerCase();


                    const username =
                        String(
                            order.username || ''
                        )
                            .toLowerCase();


                    const email =
                        String(
                            order.email || ''
                        )
                            .toLowerCase();


                    const orderStatus =
                        String(
                            order.status || ''
                        )
                            .toLowerCase();


                    const matchesSearch =
                        !search ||
                        orderId.includes(search) ||
                        username.includes(search) ||
                        email.includes(search);


                    const matchesStatus =
                        status === 'all' ||
                        orderStatus === status;


                    return (
                        matchesSearch &&
                        matchesStatus
                    );

                }
            );


        renderOrders();

    }


    if (searchInput) {

        searchInput.addEventListener(
            'input',
            applyFilters
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            'change',
            applyFilters
        );

    }


    /* =========================================================
       ITEMS FORMATTER
    ========================================================== */

    function formatItems(
        items
    ) {

        if (!items) {
            return '—';
        }


        let parsed =
            items;


        if (
            typeof items === 'string'
        ) {

            try {

                parsed =
                    JSON.parse(items);

            } catch {

                return escapeHtml(
                    items
                );

            }

        }


        if (
            !Array.isArray(parsed) ||
            parsed.length === 0
        ) {

            return '—';

        }


        return parsed
            .map(
                item => {

                    const title =
                        escapeHtml(
                            item.title ||
                            'Gift Card'
                        );


                    const quantity =
                        Number(
                            item.quantity
                        ) || 1;


                    return (
                        `${title}` +
                        ` × ${quantity}`
                    );

                }
            )
            .join('<br>');

    }


    /* =========================================================
       STATUS CLASS
    ========================================================== */

    function getStatusClass(
        status
    ) {

        const normalized =
            String(
                status || 'pending'
            )
                .toLowerCase();


        if (
            normalized ===
            'approved'
        ) {

            return 'status-approved';

        }


        if (
            normalized ===
            'rejected'
        ) {

            return 'status-rejected';

        }


        return 'status-pending';

    }


    /* =========================================================
       RENDER ORDERS
    ========================================================== */

    function renderOrders() {

        if (!ordersTableBody) {
            return;
        }


        if (
            filteredOrders.length === 0
        ) {

            ordersTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="table-message"
                    >
                        No orders found.
                    </td>

                </tr>

            `;

            return;

        }


        ordersTableBody.innerHTML =
            '';


        filteredOrders.forEach(
            order => {

                const row =
                    document.createElement(
                        'tr'
                    );


                const status =
                    String(
                        order.status ||
                        'pending'
                    )
                        .toLowerCase();


                const statusClass =
                    getStatusClass(
                        status
                    );


                const orderId =
                    escapeHtml(
                        order.order_id ||
                        order.id ||
                        '—'
                    );


                const username =
                    escapeHtml(
                        order.username ||
                        '—'
                    );


                const email =
                    escapeHtml(
                        order.email ||
                        '—'
                    );


                const itemsHtml =
                    formatItems(
                        order.items
                    );


                const total =
                    formatEuro(
                        order.total
                    );


                const date =
                    formatDate(
                        order.created_at
                    );


                row.innerHTML = `

                    <td>

                        <div class="order-id">
                            ${orderId}
                        </div>

                    </td>


                    <td>

                        <div class="customer-name">
                            ${username}
                        </div>

                        <div class="customer-email">
                            ${email}
                        </div>

                    </td>


                    <td>

                        <div class="items-cell">
                            ${itemsHtml}
                        </div>

                    </td>


                    <td>

                        <div class="total-cell">
                            ${total} €
                        </div>

                    </td>


                    <td>

                        <span
                            class="
                                status-badge
                                ${statusClass}
                            "
                        >
                            ${escapeHtml(
                                capitalizeStatus(
                                    status
                                )
                            )}
                        </span>

                    </td>


                    <td>

                        <div class="date-cell">
                            ${date}
                        </div>

                    </td>


                    <td>

                        <div class="action-group">

                            ${
                                status !== 'approved'
                                    ? `
                                        <button
                                            class="
                                                action-button
                                                approve-button
                                            "
                                            data-action="approve"
                                            data-id="${escapeHtml(
                                                order.id
                                            )}"
                                        >
                                            Approve
                                        </button>
                                      `
                                    : ''
                            }


                            ${
                                status !== 'rejected'
                                    ? `
                                        <button
                                            class="
                                                action-button
                                                reject-button
                                            "
                                            data-action="reject"
                                            data-id="${escapeHtml(
                                                order.id
                                            )}"
                                        >
                                            Reject
                                        </button>
                                      `
                                    : ''
                            }


                            <button
                                class="
                                    action-button
                                    delete-button
                                "
                                data-action="delete"
                                data-id="${escapeHtml(
                                    order.id
                                )}"
                            >
                                Archive
                            </button>

                        </div>

                    </td>

                `;


                ordersTableBody.appendChild(
                    row
                );

            }
        );

    }


    function capitalizeStatus(
        status
    ) {

        if (!status) {
            return 'Pending';
        }


        return (
            status.charAt(0).toUpperCase() +
            status.slice(1)
        );

    }


    /* =========================================================
       ORDER ACTIONS
    ========================================================== */

    if (ordersTableBody) {

        ordersTableBody.addEventListener(
            'click',
            async event => {

                const button =
                    event.target.closest(
                        'button[data-action]'
                    );


                if (!button) {
                    return;
                }


                const action =
                    button.dataset.action;


                const orderId =
                    button.dataset.id;


                if (!orderId) {
                    return;
                }


                if (
                    action ===
                    'approve'
                ) {

                    await updateOrderStatus(
                        orderId,
                        'approved'
                    );

                    return;

                }


                if (
                    action ===
                    'reject'
                ) {

                    await updateOrderStatus(
                        orderId,
                        'rejected'
                    );

                    return;

                }


                if (
                    action ===
                    'delete'
                ) {

                    await deleteOrder(
                        orderId
                    );

                }

            }
        );

    }


    /* =========================================================
       UPDATE ORDER STATUS
    ========================================================== */

    async function updateOrderStatus(
        orderId,
        newStatus
    ) {

        if (
            !currentUser ||
            !(await isAdmin(
                currentUser
            ))
        ) {

            showToast(
                'You are not authorized.',
                'error'
            );

            return;

        }


        const actionText =
            newStatus === 'approved'
                ? 'approve'
                : 'reject';


        const confirmed =
            window.confirm(
                `Are you sure you want to ${actionText} this order?`
            );


        if (!confirmed) {
            return;
        }


        try {

            const { error } =
                await supabaseClient.rpc(
                    'admin_update_order_status',
                    {
                        p_order_id: orderId,
                        p_status: newStatus,
                        p_message:
                            `Order ${newStatus} from admin dashboard`
                    }
                );


            if (error) {
                throw error;
            }


            const localOrder =
                orders.find(
                    order =>
                        String(
                            order.id
                        ) ===
                        String(orderId)
                );


            if (localOrder) {

                localOrder.status =
                    newStatus;

            }


            updateStatistics();

            applyFilters();


            showToast(
                `Order ${newStatus}.`
            );


        } catch (error) {

            console.error(
                'Update order error:',
                error
            );


            showToast(
                'Could not update the order.',
                'error'
            );

        }

    }


    /* =========================================================
       DELETE ORDER
    ========================================================== */

    async function deleteOrder(
        orderId
    ) {

        if (
            !currentUser ||
            !(await isAdmin(
                currentUser
            ))
        ) {

            showToast(
                'You are not authorized.',
                'error'
            );

            return;

        }


        const confirmed =
            window.confirm(
                'Archive this order? It will be marked as cancelled and kept for audit history.'
            );


        if (!confirmed) {
            return;
        }


        try {

            const { error } =
                await supabaseClient.rpc(
                    'admin_update_order_status',
                    {
                        p_order_id: orderId,
                        p_status: 'cancelled',
                        p_message:
                            'Order archived from admin dashboard'
                    }
                );


            if (error) {
                throw error;
            }


            const archivedOrder =
                orders.find(
                    order =>
                        String(order.id) ===
                        String(orderId)
                );

            if (archivedOrder) {
                archivedOrder.status =
                    'cancelled';
            }


            updateStatistics();

            applyFilters();


            showToast(
                'Order archived.'
            );


        } catch (error) {

            console.error(
                'Archive order error:',
                error
            );


            showToast(
                'Could not archive the order.',
                'error'
            );

        }

    }


    /* =========================================================
       REFRESH
    ========================================================== */

    if (refreshButton) {

        refreshButton.addEventListener(
            'click',
            async () => {

                refreshButton.disabled =
                    true;

                refreshButton.textContent =
                    'Refreshing...';


                await loadOrders();


                refreshButton.disabled =
                    false;

                refreshButton.textContent =
                    '↻ Refresh';

            }
        );

    }


    /* =========================================================
       INITIALIZE
    ========================================================== */

    checkCurrentSession();

});
