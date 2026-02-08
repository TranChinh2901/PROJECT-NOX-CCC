
import axios from 'axios';

// Configuration
const API_BASE = 'http://localhost:5000/api/v1';
const EMAIL = 'test-' + Date.now() + '@example.com';
const PASSWORD = 'password123';
const PRODUCT_ID = 1; // Assuming product with ID 1 exists

async function runTest() {
  try {
    console.log('--- Wishlist E2E Test ---');

    // 1. Register/Login User
    console.log('1. Authenticating...');
    let token = '';

    try {
        // Try to register first
        const registerRes = await axios.post(`${API_BASE}/auth/register`, {
            email: EMAIL,
            password: PASSWORD,
            first_name: 'Test',
            last_name: 'User',
            phone: '1234567890'
        });
        token = registerRes.data.data.token;
        console.log('   Registered new user.');
    } catch (e: any) {
        // If registration fails (e.g., user exists), try login
        // But for this test we use a unique email so registration should work
        console.error('   Registration failed:', JSON.stringify(e.response?.data || e.message));
        return;
    }

    const authHeaders = {
        headers: { Authorization: `Bearer ${token}` }
    };

    // 2. Check initial wishlist
    console.log('2. Checking initial wishlist...');
    const listRes = await axios.get(`${API_BASE}/wishlists`, authHeaders);
    const initialItems = listRes.data.data;
    console.log(`   Initial items count: ${initialItems.length}`);

    // 3. Add item to wishlist
    console.log(`3. Adding product ${PRODUCT_ID} to wishlist...`);
    // Assuming the backend endpoint for adding item is POST /wishlists/items
    // And it takes { variant_id: number } in body
    // Wait, the controller code says: const { variant_id, notes, priority, wishlist_id } = req.body;
    // And "add" method.

    // We need to make sure we have a valid variant_id.
    // Ideally we should fetch a product and get its variant.
    // Let's assume product_id 1 has variant_id 1 for simplicity, or we can fetch it.

    // Let's fetch product 1 first to get a real variant ID
    let variantId = 1;
    try {
        const productRes = await axios.get(`${API_BASE}/products/${PRODUCT_ID}`);
        if (productRes.data.data.variants && productRes.data.data.variants.length > 0) {
            variantId = productRes.data.data.variants[0].id;
            console.log(`   Found variant ID ${variantId} for product ${PRODUCT_ID}`);
        } else {
             console.log(`   No variants found for product ${PRODUCT_ID}, using ID 1 as fallback`);
        }
    } catch(e) {
        console.log(`   Could not fetch product ${PRODUCT_ID}, using ID 1 as fallback`);
    }

    const addRes = await axios.post(`${API_BASE}/wishlists/items`, {
        variant_id: variantId
    }, authHeaders);

    console.log('   Add response status:', addRes.status);
    const newItem = addRes.data.data;
    console.log('   New item ID:', newItem.id);

    // 4. Verify item is in wishlist
    console.log('4. Verifying item in wishlist...');
    const listRes2 = await axios.get(`${API_BASE}/wishlists`, authHeaders);
    const updatedItems = listRes2.data.data;
    const found = updatedItems.find((item: any) => item.id === newItem.id);

    if (found) {
        console.log('   SUCCESS: Item found in wishlist.');
    } else {
        console.error('   FAILURE: Item NOT found in wishlist.');
        process.exit(1);
    }

    // 5. Remove item from wishlist
    console.log('5. Removing item from wishlist...');
    await axios.delete(`${API_BASE}/wishlists/items/${newItem.id}`, authHeaders);
    console.log('   Item removed.');

    // 6. Verify removal
    console.log('6. Verifying removal...');
    const listRes3 = await axios.get(`${API_BASE}/wishlists`, authHeaders);
    const finalItems = listRes3.data.data;
    const foundAfterDelete = finalItems.find((item: any) => item.id === newItem.id);

    if (!foundAfterDelete) {
        console.log('   SUCCESS: Item successfully removed.');
    } else {
        console.error('   FAILURE: Item still present in wishlist.');
        process.exit(1);
    }

    console.log('--- Test Completed Successfully ---');

  } catch (error: any) {
    console.error('Test Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTest();
