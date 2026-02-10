// admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8CCXXYrXjGTsycpkL1K5TQqZ28Eg8TWI",
  authDomain: "apk-web-potongayam.firebaseapp.com",
  projectId: "apk-web-potongayam",
  storageBucket: "apk-web-potongayam.firebasestorage.app",
  messagingSenderId: "484675773409",
  appId: "1:484675773409:web:42ea16fad78b62a230a8a0",
  measurementId: "G-3M8ZTMPDP7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Get Firestore instance
const auth = getAuth(app); // Get Auth instance

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const authContainer = document.getElementById('auth-container');
    const dashboardWrapper = document.getElementById('dashboard-wrapper'); // New wrapper for dashboard content
    const adminEmailInput = document.getElementById('admin-email');
    const adminPasswordInput = document.getElementById('admin-password');
    const loginBtn = document.getElementById('login-btn');
    const authErrorMessage = document.getElementById('auth-error-message');
    const logoutBtn = document.getElementById('logout-btn-sidebar');

    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');

    const ordersContainer = document.getElementById('orders-container');
    const summaryContainer = document.getElementById('summary-container');
    const statusFilter = document.getElementById('status-filter');

    // Sidebar Navigation
    const navOrders = document.getElementById('nav-orders');
    const navSummary = document.getElementById('nav-summary');
    const orderListSection = document.getElementById('order-list-section');
    const monthlySummarySection = document.getElementById('monthly-summary-section');

    // Logout timer variables
    let logoutTimer;
    const LOGOUT_TIMEOUT = 30000; // 30 seconds (adjust as needed)

    function showSection(sectionToShow) {
        orderListSection.classList.add('hidden');
        monthlySummarySection.classList.add('hidden');
        sectionToShow.classList.remove('hidden');
        // Close sidebar on navigation item click for mobile
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    }

    navOrders.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(orderListSection);
    });

    navSummary.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(monthlySummarySection);
    });

    // Show orders by default when dashboard loads
    showSection(orderListSection);

    // Sidebar Toggle Logic
    function openSidebar() {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('visible');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('visible');
    }

    if (sidebarToggleBtn && sidebar && sidebarOverlay) {
        sidebarToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from bubbling to document and closing immediately
            if (sidebar.classList.contains('open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });

        // Close sidebar when clicking on the overlay
        sidebarOverlay.addEventListener('click', closeSidebar);

        // Close sidebar when clicking outside on larger screens (if needed) - primarily handled by overlay on small screens
        // This part might not be strictly necessary if sidebar is not 'fixed' on large screens
        document.addEventListener('click', (e) => {
            // Only close if sidebar is open, click is not on toggle button, and click is not inside sidebar
            if (sidebar.classList.contains('open') &&
                !sidebar.contains(e.target) &&
                !sidebarToggleBtn.contains(e.target) &&
                window.innerWidth > 768) { // Only for larger screens where overlay is not present
                closeSidebar();
            }
        });
    }


    let allOrders = [];

    // Login Function
    loginBtn.addEventListener('click', async () => {
        const email = adminEmailInput.value;
        const password = adminPasswordInput.value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            authErrorMessage.textContent = ''; // Clear any previous errors
        } catch (error) {
            console.error('Login Error:', error);
            authErrorMessage.textContent = `Login Gagal: ${error.message}`;
        }
    });

    // Logout Function
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout Error:', error);
            alert('Gagal logout.');
        }
    });

    // Logout handler for visibilitychange event
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            // Page is hidden, start logout timer
            logoutTimer = setTimeout(async () => {
                await signOut(auth);
                console.log('Auto-logged out due to inactivity/page hidden.');
            }, LOGOUT_TIMEOUT);
        } else {
            // Page is visible, clear any pending logout timer
            if (logoutTimer) {
                clearTimeout(logoutTimer);
                logoutTimer = null;
            }
        }
    };

    // Auth State Observer
    onAuthStateChanged(auth, user => {
        if (user) {
            // User is signed in
            body.classList.remove('login-page');
            body.classList.add('dashboard-page');
            authContainer.classList.add('hidden');
            dashboardWrapper.classList.remove('hidden');
            logoutBtn.classList.remove('hidden');
            authErrorMessage.textContent = ''; // Clear error message on successful login
            fetchOrders(); // Fetch orders only when logged in
            // Ensure sidebar toggle button is visible in header for dashboard
            sidebarToggleBtn.classList.remove('hidden');

            // Attach visibilitychange listener when user is logged in
            document.addEventListener('visibilitychange', handleVisibilityChange);
        } else {
            // User is signed out
            body.classList.remove('dashboard-page');
            body.classList.add('login-page');
            authContainer.classList.remove('hidden');
            dashboardWrapper.classList.add('hidden');
            logoutBtn.classList.add('hidden');
            adminEmailInput.value = '';
            adminPasswordInput.value = '';
            // Hide sidebar toggle button if logged out
            sidebarToggleBtn.classList.add('hidden');
            closeSidebar(); // Ensure sidebar is closed if logged out

            // Remove visibilitychange listener when user is logged out
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // Clear any pending logout timer if user manually logs out while page was hidden
            if (logoutTimer) {
                clearTimeout(logoutTimer);
                logoutTimer = null;
            }
        }
    });

    async function fetchOrders() {
        try {
            const ordersCol = collection(db, 'orders');
            const snapshot = await getDocs(ordersCol);
            allOrders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            renderOrders();
            renderMonthlySummary();
        } catch (error) {
            console.error('Error fetching orders from Firestore:', error);
            ordersContainer.innerHTML = '<p>Gagal memuat pesanan dari Firestore.</p>';
            summaryContainer.innerHTML = '<p>Gagal memuat ringkasan dari Firestore.</p>';
        }
    }

    function renderOrders() {
        ordersContainer.innerHTML = '';
        const filteredOrders = allOrders.filter(order => {
            if (statusFilter.value === 'all') {
                return true;
            }
            return order.status === statusFilter.value;
        });

        if (filteredOrders.length === 0) {
            ordersContainer.innerHTML = '<p>Tidak ada pesanan.</p>';
            return;
        }

        filteredOrders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.classList.add('order-card');
            orderCard.innerHTML = `
                <h3>Pesanan #${order.id} - ${new Date(order.date).toLocaleString()}</h3>
                <p><strong>Pembeli:</strong> ${order.customer.nama}</p>
                <p><strong>No. Telepon:</strong> ${order.customer.noTelp}</p>
                <p><strong>Alamat:</strong> ${order.customer.alamat}</p>
                ${order.customer.lokasi ? `<p><strong>Lokasi Peta:</strong> <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer.lokasi)}" target="_blank">Cari di Peta</a></p>` : ''}
                <p><strong>Produk:</strong></p>
                <ul>
                    ${order.items.map(item => `<li>${item.nama} (${item.weight} kg) - Rp ${item.price.toLocaleString('id-ID')}</li>`).join('')}
                </ul>
                <p><strong>Total:</strong> Rp ${order.total.toLocaleString('id-ID')}</p>
                <p><strong>Status:</strong> <span class="order-status ${order.status}">${order.status}</span></p>
                <div class="order-actions">
                    <select class="status-selector" data-id="${order.id}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Selesai</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Dibatalkan</option>
                    </select>
                    <button class="delete-order-btn" data-id="${order.id}">Hapus</button>
                </div>
            `;
            ordersContainer.appendChild(orderCard);
        });

        addEventListenersToOrderActions();
    }

    function addEventListenersToOrderActions() {
        document.querySelectorAll('.status-selector').forEach(selector => {
            // Remove previous event listeners to prevent duplication
            const oldListener = selector.dataset.listener;
            if (oldListener) {
                selector.removeEventListener('change', window[oldListener]);
            }
            const newListener = async (e) => {
                const orderId = e.target.dataset.id;
                const newStatus = e.target.value;
                await updateOrderStatus(orderId, newStatus);
            };
            selector.addEventListener('change', newListener);
            selector.dataset.listener = newListener.name || 'statusChangeListener'; // Store a reference if needed, or simply don't store
        });

        document.querySelectorAll('.delete-order-btn').forEach(button => {
            // Remove previous event listeners to prevent duplication
            const oldListener = button.dataset.listener;
            if (oldListener) {
                button.removeEventListener('click', window[oldListener]);
            }
            const newListener = async (e) => {
                const orderId = e.target.dataset.id;
                if (confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) {
                    await deleteOrder(orderId);
                }
            };
            button.addEventListener('click', newListener);
            button.dataset.listener = newListener.name || 'deleteButtonListener';
        });
    }

    async function updateOrderStatus(orderId, newStatus) {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, { status: newStatus });
            await fetchOrders(); // Re-fetch and re-render orders
        } catch (error) {
            console.error('Error updating order status in Firestore:', error);
            alert('Gagal memperbarui status pesanan di Firestore.');
        }
    }

    async function deleteOrder(orderId) {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await deleteDoc(orderRef);
            await fetchOrders(); // Re-fetch and re-render orders
        } catch (error) {
            console.error('Error deleting order from Firestore:', error);
            alert('Gagal menghapus pesanan dari Firestore.');
        }
    }

    function renderMonthlySummary() {
        summaryContainer.innerHTML = '';
        const monthlyData = {}; // { 'YYYY-MM': { totalRevenue: 0, completedOrders: 0 } }

        const completedOrders = allOrders.filter(order => order.status === 'completed');

        completedOrders.forEach(order => {
            const orderDate = new Date(order.date);
            const monthYear = `${orderDate.getFullYear()}-${(orderDate.getMonth() + 1).toString().padStart(2, '0')}`;

            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { totalRevenue: 0, completedOrdersCount: 0 };
            }
            monthlyData[monthYear].totalRevenue += order.total;
            monthlyData[monthYear].completedOrdersCount++;
        });

        if (Object.keys(monthlyData).length === 0) {
            summaryContainer.innerHTML = '<p>Tidak ada ringkasan bulanan (belum ada pesanan yang selesai).</p>';
            return;
        }

        const summaryList = document.createElement('ul');
        for (const monthYear in monthlyData) {
            const data = monthlyData[monthYear];
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>${monthYear}:</strong> ${data.completedOrdersCount} pesanan selesai, Total Pendapatan: Rp ${data.totalRevenue.toLocaleString('id-ID')}
            `;
            summaryList.appendChild(listItem);
        }
        summaryContainer.appendChild(summaryList);
    }

    // Event Listener for status filter
    statusFilter.addEventListener('change', renderOrders);
});
