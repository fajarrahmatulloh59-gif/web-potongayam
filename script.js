document.addEventListener('DOMContentLoaded', () => {
    const heroSlider = document.querySelector('.hero-slider .swiper-wrapper');
    const produkSlider = document.querySelector('.produk-slider .swiper-wrapper');
    const formPembelian = document.getElementById('form-pembelian');
    const orderSummary = document.getElementById('order-summary');
    const summaryNama = document.getElementById('summary-nama');
    const summaryNoTelp = document.getElementById('summary-no-telp');
    const summaryAlamat = document.getElementById('summary-alamat');
    const summaryLokasi = document.getElementById('summary-lokasi');
    const summaryProduk = document.getElementById('summary-produk');
    const summaryTotal = document.getElementById('summary-total');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const btnBatal = document.getElementById('btn-batal');

    const productSelect = document.getElementById('product-select');
    const weightSelect = document.getElementById('weight-select');
    const weightLabel = document.getElementById('weight-label');
    const priceDisplay = document.getElementById('price-display');
    const currentPrice = document.getElementById('current-price');
    const btnAddToCart = document.getElementById('btn-add-to-cart');
    const locationInput = document.getElementById('location');
    const mapPreview = document.getElementById('mapPreview');
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const btnFinishOrder = document.getElementById('btn-finish-order');
    const btnClearCart = document.getElementById('btn-clear-cart');

    let allProducts = []; // To store products fetched from db.json
    let cart = []; // Initialize an empty cart for multiple selections

    const nomorPenjual = '6285719480646'; // Ganti dengan nomor WhatsApp penjual Anda

    const heroImages = [
        { url: 'bg 1.jpg', title: 'Selamat Datang di Jual Ayam Potong', subtitle: 'Kami menyediakan ayam potong segar dan berkualitas' },
        { url: 'bg 4.avif', title: 'Berbagai Macam Pilihan', subtitle: 'Tersedia ayam utuh, dada, paha, dan sayap' },
        { url: 'bg 3.webp', title: 'Praktis dan Hemat', subtitle: 'Pesan sekarang, kami antar ke rumah Anda' }
    ];

    async function fetchProducts() {
        try {
            const response = await fetch('http://localhost:3000/products');
            allProducts = await response.json();
            renderProdukSlider();
            populateProductSelect();
            updatePriceDisplay(); // Initial price display after products are loaded
        } catch (error) {
            console.error('Error fetching products:', error);
            alert('Gagal memuat daftar produk.');
        }
    }

    function renderHeroSlider() {
        heroSlider.innerHTML = '';
        heroImages.forEach(image => {
            const slide = document.createElement('div');
            slide.classList.add('swiper-slide');
            slide.style.backgroundImage = `url('${image.url}')`;
            slide.innerHTML = `
                <div class="hero-content">
                    <h1>${image.title}</h1>
                    <p>${image.subtitle}</p>
                </div>
            `;
            heroSlider.appendChild(slide);
        });
    }

    function renderProdukSlider() {
        produkSlider.innerHTML = '';
        allProducts.forEach(p => { // Use allProducts here
            const slide = document.createElement('div');
            slide.classList.add('swiper-slide');
            slide.innerHTML = `
                <div class="produk-item">
                    <img src="${p.gambar}" alt="${p.nama}">
                    <h3>${p.nama}</h3>
                    <p>Mulai dari Rp ${p.hargaPerKg.toLocaleString('id-ID')}/kg</p>
                </div>
            `;
            produkSlider.appendChild(slide);
        });
    }

    function populateProductSelect() {
        productSelect.innerHTML = '<option value="">-- Pilih Produk --</option>';
        allProducts.forEach(p => { // Use allProducts here
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nama;
            productSelect.appendChild(option);
        });
        // Pre-select the first product if available
        if (allProducts.length > 0) {
            productSelect.value = allProducts[0].id;
            populateWeightSelect();
        }
    }

    function populateWeightSelect() {
        weightSelect.innerHTML = '<option value="">-- Pilih Berat --</option>';
        const selectedProductId = productSelect.value;
        if (selectedProductId) {
            for (let i = 0.25; i <= 5; i += 0.25) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `${i * 1000} gram`;
                if (i >= 1) {
                    option.textContent = `${i} kg`;
                }
                weightSelect.appendChild(option);
            }
            weightLabel.classList.remove('hidden');
            weightSelect.classList.remove('hidden');
        } else {
            weightLabel.classList.add('hidden');
            weightSelect.classList.add('hidden');
            priceDisplay.classList.add('hidden');
        }
        updatePriceDisplay();
    }

    function updatePriceDisplay() {
        const selectedProductId = productSelect.value;
        const selectedWeightKg = parseFloat(weightSelect.value);

        if (selectedProductId && !isNaN(selectedWeightKg) && selectedWeightKg > 0) {
            const selectedProduct = allProducts.find(p => p.id == selectedProductId); // Use allProducts
            if (selectedProduct) {
                const totalPrice = selectedProduct.hargaPerKg * selectedWeightKg;
                currentPrice.textContent = `Rp ${totalPrice.toLocaleString('id-ID')}`;
                priceDisplay.classList.remove('hidden');
            } else {
                priceDisplay.classList.add('hidden');
            }
        } else {
            priceDisplay.classList.add('hidden');
            currentPrice.textContent = 'Rp 0';
        }
    }

    function renderCart() {
        cartItemsDiv.innerHTML = '';
        let totalCartPrice = 0;

        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p>Keranjang kosong.</p>';
            btnFinishOrder.disabled = true;
            btnClearCart.disabled = true;
        } else {
            cart.forEach((item, index) => {
                const cartItem = document.createElement('div');
                cartItem.classList.add('cart-item');
                cartItem.innerHTML = `
                    <span>${item.nama} (${item.weight} kg) - Rp ${item.price.toLocaleString('id-ID')}</span>
                    <button class="remove-from-cart" data-index="${index}">Hapus</button>
                `;
                cartItemsDiv.appendChild(cartItem);
                totalCartPrice += item.price;
            });
            btnFinishOrder.disabled = false;
            btnClearCart.disabled = false;
        }
        cartTotalSpan.textContent = `Rp ${totalCartPrice.toLocaleString('id-ID')}`;
    }

    function addToCart() {
        const selectedProductId = productSelect.value;
        const selectedWeightKg = parseFloat(weightSelect.value);

        if (!selectedProductId || isNaN(selectedWeightKg) || selectedWeightKg <= 0) {
            alert('Silakan pilih produk dan berat.');
            return;
        }

        const selectedProduct = allProducts.find(p => p.id == selectedProductId); // Use allProducts
        if (!selectedProduct) {
            alert('Produk tidak valid.');
            return;
        }

        const itemPrice = selectedProduct.hargaPerKg * selectedWeightKg;
        const newItem = {
            id: selectedProduct.id,
            nama: selectedProduct.nama,
            weight: selectedWeightKg,
            price: itemPrice
        };
        cart.push(newItem);
        renderCart();
    }

    function removeFromCart(index) {
        cart.splice(index, 1);
        renderCart();
    }

    productSelect.addEventListener('change', populateWeightSelect);
    weightSelect.addEventListener('change', updatePriceDisplay);
    btnAddToCart.addEventListener('click', addToCart);

    locationInput.addEventListener('input', () => {
        const alamat = locationInput.value.trim();
        if (alamat.length > 5) {
            const mapURL = `https://www.google.com/maps?q=${encodeURIComponent(alamat)}&output=embed`;
            mapPreview.src = mapURL;
            mapPreview.classList.remove('hidden');
        } else {
            mapPreview.classList.add('hidden');
            mapPreview.src = '';
        }
    });

    cartItemsDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-from-cart')) {
            const indexToRemove = parseInt(e.target.dataset.index);
            removeFromCart(indexToRemove);
        }
    });

    btnFinishOrder.addEventListener('click', () => {
        const nama = document.getElementById('nama').value.trim();
        const noTelp = document.getElementById('no-telp').value.trim();
        const alamat = locationInput.value.trim();

        if (!nama || !noTelp || !alamat) {
            alert('Silakan isi nama, nomor telepon, dan alamat Anda.');
            return;
        }
        if (cart.length === 0) {
            alert('Keranjang belanja Anda kosong.');
            return;
        }

        summaryNama.textContent = `Nama: ${nama}`;
        summaryNoTelp.textContent = `No. Telepon: ${noTelp}`;
        summaryAlamat.textContent = `Alamat: ${alamat}`;
        summaryLokasi.textContent = `Lokasi: ${alamat}`;
        
        summaryProduk.innerHTML = '';
        let totalOrderPrice = 0;
        cart.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.nama} (${item.weight} kg) - Rp ${item.price.toLocaleString('id-ID')}`;
            summaryProduk.appendChild(li);
            totalOrderPrice += item.price;
        });

        summaryTotal.textContent = `Total Belanja: Rp ${totalOrderPrice.toLocaleString('id-ID')}`;

        orderSummary.dataset.nama = nama;
        orderSummary.dataset.noTelp = noTelp;
        orderSummary.dataset.alamat = alamat;
        orderSummary.dataset.lokasi = alamat;
        orderSummary.dataset.pesanan = JSON.stringify(cart);
        orderSummary.dataset.totalHarga = totalOrderPrice;

        const orderData = {
            date: new Date().toISOString(),
            customer: {
                nama: nama,
                noTelp: noTelp,
                alamat: alamat,
                lokasi: alamat
            },
            items: cart,
            total: totalOrderPrice,
            status: 'pending'
        };

        fetch('http://localhost:3000/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Order saved to db.json:', data);
        })
        .catch((error) => {
            console.error('Error saving order to db.json:', error);
            alert('Terjadi kesalahan saat menyimpan pesanan.');
        });

        orderSummary.classList.remove('hidden');
    });

    btnClearCart.addEventListener('click', () => {
        cart = [];
        renderCart();
        alert('Keranjang belanja telah dikosongkan.');
    });

    btnBatal.addEventListener('click', () => {
        orderSummary.classList.add('hidden');
    });

    btnWhatsapp.addEventListener('click', () => {
        const nama = orderSummary.dataset.nama;
        const noTelp = orderSummary.dataset.noTelp;
        const alamat = orderSummary.dataset.alamat;
        const lokasiText = orderSummary.dataset.lokasi;
        const pesanan = JSON.parse(orderSummary.dataset.pesanan);
        const totalHarga = orderSummary.dataset.totalHarga;

        let pesanWhatsApp = `Halo, saya ingin memesan ayam potong:\n\n`;
        pesanWhatsApp += `*Nama:* ${nama}\n`;
        pesanWhatsApp += `*No. Telepon:* ${noTelp}\n`;
        pesanWhatsApp += `*Alamat Pengiriman:* ${alamat}\n`;
        if (lokasiText) {
            const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lokasiText)}`;
            pesanWhatsApp += `*Tautan Peta:* ${mapsLink}\n`;
        }
        pesanWhatsApp += `\n*Pesanan:*\n`;
        pesanan.forEach(item => {
            pesanWhatsApp += `- ${item.nama} (${item.weight} kg) - Rp ${item.price.toLocaleString('id-ID')}\n`;
        });
        pesanWhatsApp += `\n*Total Pembayaran:* Rp ${parseInt(totalHarga).toLocaleString('id-ID')}`;

        const urlWhatsApp = `https://wa.me/${nomorPenjual}?text=${encodeURIComponent(pesanWhatsApp)}`;
        
        window.open(urlWhatsApp, '_blank');
        orderSummary.classList.add('hidden');
    });

    renderHeroSlider(); // Render hero slider immediately
    fetchProducts(); // Fetch products and then render product slider and populate selects
    renderCart(); // Initial render of the cart

    const heroSwiper = new Swiper('.hero-slider', {
        loop: true,
        autoplay: {
            delay: 4000,
            disableOnInteraction: false,
        },
    });

    const produkSwiper = new Swiper('.produk-slider', {
        slidesPerView: 1,
        spaceBetween: 30,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            640: {
                slidesPerView: 2,
                spaceBetween: 20,
            },
            768: {
                slidesPerView: 2,
                spaceBetween: 30,
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 40,
            },
        },
    });
});