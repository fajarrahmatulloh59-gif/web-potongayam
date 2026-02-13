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
    // --- Element Selectors ---
    // New UI elements
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const closeSummaryBtn = document.getElementById('btn-close-summary');

    // Existing elements
    const heroSlider = document.querySelector('.hero-slider .swiper-wrapper');
    const produkSlider = document.querySelector('.produk-slider .swiper-wrapper');
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

    // --- State ---
    let allProducts = [];
    let cart = [];
    const nomorPenjual = '6285719480646';

    const heroImages = [
        { url: 'web img/bg 1.jpg', title: 'Daging Ayam Segar Pilihan', subtitle: 'Kualitas terbaik langsung dari peternakan, siap diantar ke dapur Anda.' },
        { url: 'web img/bg 2.jpg', title: 'Siap Diolah, Penuh Nutrisi', subtitle: 'Potongan ayam higienis untuk hidangan keluarga sehat Anda.' },
        { url: 'web img/bg 3.webp', title: 'Pengiriman Cepat & Terpercaya', subtitle: 'Pesan sekarang dan nikmati kesegaran ayam pilihan di hari yang sama.' }
    ];

    // --- Functions ---
    async function fetchProducts() {
        try {
            const productsSnapshot = await db.collection('products').get();
            allProducts = productsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            renderProdukSlider();
            populateProductSelect();
            updatePriceDisplay();
        } catch (error) {
            console.error('Error fetching products from Firestore:', error);
            produkSlider.innerHTML = '<p class="error-message">Gagal memuat produk. Silakan coba lagi nanti.</p>';
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
        // Clear existing content (skeletons)
        produkSlider.innerHTML = ''; 

        allProducts.forEach(p => {
            const slide = document.createElement('div');
            slide.classList.add('swiper-slide');
            slide.innerHTML = `
                <div class="produk-item">
                    <img src="${p.gambar}" alt="${p.nama}">
                    <div class="produk-content">
                        <h3>${p.nama}</h3>
                        <p>Rp ${p.hargaPerKg.toLocaleString('id-ID')}/kg</p>
                    </div>
                </div>
            `;
            produkSlider.appendChild(slide);
        });
        
        // Update the swiper instance after modifying slides
        if (produkSwiper) {
            produkSwiper.update();
        }
    }

    function populateProductSelect() {
        productSelect.innerHTML = '<option value="">-- Pilih Produk --</option>';
        allProducts.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nama;
            productSelect.appendChild(option);
        });
    }

    function populateWeightSelect() {
        weightSelect.innerHTML = '<option value="">-- Pilih Berat --</option>';
        const selectedProductId = productSelect.value;
        if (selectedProductId) {
            for (let i = 0.25; i <= 5; i += 0.25) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i < 1 ? `${i * 1000} gram` : `${i} kg`;
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
            const selectedProduct = allProducts.find(p => p.id == selectedProductId);
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
            cartItemsDiv.innerHTML = '<p class="empty-cart-message">Keranjang masih kosong.</p>';
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

        const selectedProduct = allProducts.find(p => p.id == selectedProductId);
        if (!selectedProduct) {
            alert('Produk tidak valid.');
            return;
        }

        const itemPrice = selectedProduct.hargaPerKg * selectedWeightKg;
        cart.push({
            id: selectedProduct.id,
            nama: selectedProduct.nama,
            weight: selectedWeightKg,
            price: itemPrice
        });
        renderCart();
        // Optional: show a confirmation
        alert(`${selectedProduct.nama} telah ditambahkan ke keranjang.`);
    }

    function removeFromCart(index) {
        cart.splice(index, 1);
        renderCart();
    }
    
    function closeOrderSummary() {
        orderSummary.classList.add('hidden');
        document.body.classList.remove('modal-open');
    }
    
    function openOrderSummary() {
        orderSummary.classList.remove('hidden');
        document.body.classList.add('modal-open');
    }

    function closeMenu() {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    }

    // --- Event Listeners ---
    // New UI Listeners
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    closeSummaryBtn.addEventListener('click', closeOrderSummary);
    btnBatal.addEventListener('click', closeOrderSummary);

    // Existing Listeners
    productSelect.addEventListener('change', () => {
        populateWeightSelect();
        updatePriceDisplay();
    });
    weightSelect.addEventListener('change', updatePriceDisplay);
    btnAddToCart.addEventListener('click', addToCart);

    locationInput.addEventListener('input', () => {
        const alamat = locationInput.value.trim();
        if (alamat.length > 5) {
            mapPreview.src = `https://www.google.com/maps?q=${encodeURIComponent(alamat)}&output=embed`;
            mapPreview.classList.remove('hidden');
        } else {
            mapPreview.classList.add('hidden');
            mapPreview.src = '';
        }
    });

    cartItemsDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-from-cart')) {
            removeFromCart(parseInt(e.target.dataset.index));
        }
    });

    btnFinishOrder.addEventListener('click', async () => {
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

        // Save data to dataset for WhatsApp
        orderSummary.dataset.nama = nama;
        orderSummary.dataset.noTelp = noTelp;
        orderSummary.dataset.alamat = alamat;
        orderSummary.dataset.pesanan = JSON.stringify(cart);
        orderSummary.dataset.totalHarga = totalOrderPrice;

        const orderData = {
            date: new Date().toISOString(),
            customer: { nama, noTelp, alamat },
            items: cart,
            total: totalOrderPrice,
            status: 'pending'
        };

        try {
            await db.collection('orders').add(orderData);
            openOrderSummary();
        } catch (error) {
            console.error('Error saving order to Firestore:', error);
            alert('Terjadi kesalahan saat menyimpan pesanan. Silakan coba lagi.');
        }
    });

    btnClearCart.addEventListener('click', () => {
        if (confirm('Anda yakin ingin mengosongkan keranjang?')) {
            cart = [];
            renderCart();
        }
    });

    btnWhatsapp.addEventListener('click', () => {
        const { nama, noTelp, alamat, pesanan, totalHarga } = orderSummary.dataset;
        const parsedPesanan = JSON.parse(pesanan);

        let pesanWhatsApp = `Halo, saya ingin memesan ayam potong:\n\n`;
        pesanWhatsApp += `*Nama:* ${nama}\n`;
        pesanWhatsApp += `*No. Telepon:* ${noTelp}\n`;
        pesanWhatsApp += `*Alamat Pengiriman:* ${alamat}\n\n`;
        pesanWhatsApp += `*Pesanan:*\n`;
        parsedPesanan.forEach(item => {
            pesanWhatsApp += `- ${item.nama} (${item.weight} kg) - Rp ${item.price.toLocaleString('id-ID')}\n`;
        });
        pesanWhatsApp += `\n*Total Pembayaran:* Rp ${parseInt(totalHarga).toLocaleString('id-ID')}`;

        const urlWhatsApp = `https://wa.me/${nomorPenjual}?text=${encodeURIComponent(pesanWhatsApp)}`;
        
        window.open(urlWhatsApp, '_blank');
        closeOrderSummary();
    });

    // --- Initializations ---
    renderHeroSlider();
    fetchProducts();
    renderCart();

    const heroSwiper = new Swiper('.hero-slider', {
        loop: true,
        effect: 'fade',
        autoplay: {
            delay: 4000,
            disableOnInteraction: false,
        },
    });

    const produkSwiper = new Swiper('.produk-slider', {
        slidesPerView: 1,
        spaceBetween: 16,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            576: { slidesPerView: 2, spaceBetween: 20 },
            768: { slidesPerView: 3, spaceBetween: 30 },
            1024: { slidesPerView: 4, spaceBetween: 30 },
        },
    });
});