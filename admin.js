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
const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore(); // Get Firestore instance

document.addEventListener('DOMContentLoaded', () => {
    const ordersContainer = document.getElementById('orders-container');
    const summaryContainer = document.getElementById('summary-container');
    const statusFilter = document.getElementById('status-filter');

    // Auth related elements
    const authContainer = document.getElementById('auth-container');
    const adminEmailInput = document.getElementById('admin-email');
    const adminPasswordInput = document.getElementById('admin-password');
    const loginBtn = document.getElementById('login-btn');
    const authErrorMessage = document.getElementById('auth-error-message');
    const adminContentDiv = document.getElementById('admin-content');
    const logoutBtn = document.getElementById('logout-btn');

    let allOrders = [];

    // Firebase Auth instance
    const auth = firebase.auth();

    // Login Function
    loginBtn.addEventListener('click', async () => {
        const email = adminEmailInput.value;
        const password = adminPasswordInput.value;

        try {
            await auth.signInWithEmailAndPassword(email, password);
            authErrorMessage.textContent = ''; // Clear any previous errors
        } catch (error) {
            console.error('Login Error:', error);
            authErrorMessage.textContent = `Login Gagal: ${error.message}`;
        }
    });

    // Logout Function
    logoutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Logout Error:', error);
            alert('Gagal logout.');
        }
    });

    // Auth State Observer
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            authContainer.classList.add('hidden');
            adminContentDiv.classList.remove('hidden');
            logoutBtn.classList.remove('hidden');
            authErrorMessage.textContent = ''; // Clear error message on successful login
            fetchOrders(); // Fetch orders only when logged in
        } else {
            // User is signed out
            authContainer.classList.remove('hidden');
            adminContentDiv.classList.add('hidden');
            logoutBtn.classList.add('hidden');
            adminEmailInput.value = '';
            adminPasswordInput.value = '';
        }
    });

    async function fetchOrders() {
        try {
            const snapshot = await db.collection('orders').get();
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
            selector.addEventListener('change', async (e) => {
                const orderId = e.target.dataset.id;
                const newStatus = e.target.value;
                await updateOrderStatus(orderId, newStatus);
            });
        });

        document.querySelectorAll('.delete-order-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const orderId = e.target.dataset.id;
                if (confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) {
                    await deleteOrder(orderId);
                }
            });
        });
    }

    async function updateOrderStatus(orderId, newStatus) {
        try {
            await db.collection('orders').doc(orderId).update({ status: newStatus });
            await fetchOrders(); // Re-fetch and re-render orders
        } catch (error) {
            console.error('Error updating order status in Firestore:', error);
            alert('Gagal memperbarui status pesanan di Firestore.');
        }
    }

    async function deleteOrder(orderId) {
        try {
            await db.collection('orders').doc(orderId).delete();
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