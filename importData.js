const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const dbJsonData = require('./db.json');
    // Inisialisasi Firebase Admin SDK
admin.initializeApp({
credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
async function importProducts() {
console.log('Memulai import data produk ke Firestore...');
const productsCollectionRef = db.collection('products');
for (const product of dbJsonData.products) {
      try {
      await productsCollectionRef.doc(String(product.id)).set(product);
         console.log(`Produk "${product.nama}" (ID: ${product.id}) berhasil
      ditambahkan.`);
        } catch (error) {
          console.error(`Gagal menambahkan produk "${product.nama}" (ID:
      ${product.id}):`, error);
        }
      }
   console.log('Selesai import data produk.');
     process.exit();
   }
   importProducts();

   importProducts();

