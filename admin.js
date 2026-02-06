document.addEventListener('DOMContentLoaded', () => {
    const ordersContainer = document.getElementById('orders-container');
    const summaryContainer = document.getElementById('summary-container');
    const statusFilter = document.getElementById('status-filter');

    const JSON_SERVER_URL = 'http://localhost:3000/orders';

    let allOrders = [];

    async function fetchOrders() {
        try {
            const response = await fetch(JSON_SERVER_URL);
            allOrders = await response.json();
            renderOrders();
            renderMonthlySummary();
        } catch (error) {
            console.error('Error fetching orders:', error);
            ordersContainer.innerHTML = '<p>Gagal memuat pesanan.</p>';
            summaryContainer.innerHTML = '<p>Gagal memuat ringkasan.</p>';
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
            await fetch(`${JSON_SERVER_URL}/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            await fetchOrders(); // Re-fetch and re-render orders
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Gagal memperbarui status pesanan.');
        }
    }

    async function deleteOrder(orderId) {
        try {
            await fetch(`${JSON_SERVER_URL}/${orderId}`, {
                method: 'DELETE',
            });
            await fetchOrders(); // Re-fetch and re-render orders
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Gagal menghapus pesanan.');
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

    // Initial fetch
    fetchOrders();
});