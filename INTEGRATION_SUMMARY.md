# Backend-Client Integration Summary

## ✅ Completed Integration

The Next.js client has been successfully wired to the Express backend with full TypeScript type safety.

### Files Created/Modified

#### 1. TypeScript Types (`src/types/index.ts`)
- Complete type definitions for all backend entities
- Enums: `GenderType`, `RoleType`, `CartStatus`, `OrderStatus`, `PaymentStatus`, `PaymentMethod`
- Entities: `User`, `Product`, `ProductVariant`, `ProductImage`, `Category`, `Brand`, `Cart`, `CartItem`, `Order`, `OrderItem`, `Review`
- DTOs: `LoginDto`, `SignupDto`, `UpdateProfileDto`, `AddToCartDto`, `CreateOrderDto`, `CreateReviewDto`, etc.
- Response types: `ApiResponse`, `PaginatedResponse`, `AuthResponse`

#### 2. API Client (`src/lib/api/apiClient.ts`)
- Configured axios instance with base URL
- Request interceptor: Automatically adds JWT token from localStorage
- Response interceptor: Unwraps `response.data.data` for clean API calls
- 401 handling: Auto-logout and redirect to login
- Typed wrapper methods for GET, POST, PUT, DELETE, PATCH

#### 3. API Services
All services located in `src/lib/api/`:

**`auth.api.ts`**
- `register(userData)` - User registration
- `login(credentials)` - User login
- `logout()` - User logout
- `refreshToken(token)` - Refresh access token
- `getProfile()` - Get current user profile
- `updateProfile(data)` - Update user profile
- `uploadAvatar(file)` - Upload avatar image
- `getAllUsers(params)` - Get all users (admin)
- `deleteAccount(userId)` - Delete account
- `deleteUserById(userId)` - Delete user by ID (admin)
- `updateUserById(userId, data)` - Update user by ID (admin)

**`product.api.ts`**
- `getAllProducts(options)` - Get products with filters (category, brand, price, search, sort, pagination)
- `getProductById(id)` - Get single product by ID
- `getProductBySlug(slug)` - Get single product by slug
- `getFeaturedProducts(limit)` - Get featured products
- `getRelatedProducts(productId, limit)` - Get related products
- `searchProducts(query, limit)` - Search products with suggestions

**`category.api.ts`**
- `getAllCategories()` - Get all categories
- `getCategoryById(id)` - Get category by ID
- `getCategoryBySlug(slug)` - Get category by slug
- `getRootCategories()` - Get root-level categories
- `getCategoryTree()` - Get hierarchical category tree

**`cart.api.ts`**
- `getCart()` - Get current user's cart
- `addToCart(data)` - Add item to cart
- `updateCartItem(itemId, data)` - Update cart item quantity
- `removeCartItem(itemId)` - Remove item from cart
- `clearCart()` - Clear entire cart

**`order.api.ts`**
- `createOrder(data)` - Create new order
- `getUserOrders()` - Get current user's orders
- `getOrderById(orderId)` - Get single order
- `cancelOrder(orderId)` - Cancel an order

**`review.api.ts`**
- `getProductReviews(productId)` - Get reviews for a product
- `createReview(data)` - Create a new review
- `getUserReviews()` - Get current user's reviews
- `markReviewHelpful(productId, reviewId)` - Mark review as helpful

#### 4. Main API Export (`src/lib/api/index.ts`)
```typescript
export { authApi } from './auth.api';
export { productApi } from './product.api';
export { categoryApi } from './category.api';
export { cartApi } from './cart.api';
export { orderApi } from './order.api';
export { reviewApi } from './review.api';
export { default as apiClient } from './apiClient';
```

#### 5. Environment Variables
**Client (`.env.local`)**
```
NEXT_PUBLIC_API_BASE=http://localhost:5000/api/v1
```

**Server (`.env`)**
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=fashion_user
DB_PASSWORD=fashion_pass
DB_NAME=fashion_ecommerce
```

#### 6. Configuration Updates
**`tsconfig.json`**
- Updated path mapping from `@/* => ./*` to `@/* => ./src/*`
- Fixed import resolution for TypeScript

## Usage Examples

### Authentication
```typescript
import { authApi } from '@/lib/api';

// Login
const { accessToken, refreshToken, user } = await authApi.login({
  email: 'user@example.com',
  password: 'password123'
});

// Store tokens
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Get profile (token auto-added by interceptor)
const profile = await authApi.getProfile();
```

### Products
```typescript
import { productApi } from '@/lib/api';

// Get filtered products
const { data, total, page, limit } = await productApi.getAllProducts({
  category_id: 1,
  min_price: 100000,
  max_price: 500000,
  sort: 'price_asc',
  page: 1,
  limit: 20
});

// Search products
const { data: results, suggestions } = await productApi.searchProducts('áo khoác');

// Get featured products
const featured = await productApi.getFeaturedProducts(8);
```

### Cart Operations
```typescript
import { cartApi } from '@/lib/api';

// Add to cart
const cart = await cartApi.addToCart({
  variant_id: 123,
  quantity: 2
});

// Update quantity
await cartApi.updateCartItem(cartItemId, { quantity: 5 });

// Remove item
await cartApi.removeCartItem(cartItemId);
```

### Orders
```typescript
import { orderApi, PaymentMethod } from '@/lib/api';

// Create order
const order = await orderApi.createOrder({
  cart_id: 1,
  shipping_address: {
    fullname: 'Nguyễn Văn A',
    phone: '0123456789',
    address: '123 Đường ABC',
    city: 'Hà Nội',
  },
  billing_address: { /* same structure */ },
  payment_method: PaymentMethod.COD,
  notes: 'Giao giờ hành chính'
});

// Get user's orders
const orders = await orderApi.getUserOrders();

// Cancel order
await orderApi.cancelOrder(orderId);
```

### Reviews
```typescript
import { reviewApi } from '@/lib/api';

// Create review
const review = await reviewApi.createReview({
  order_item_id: 123,
  rating: 5,
  title: 'Sản phẩm rất tốt',
  content: 'Chất lượng vượt mong đợi...'
});

// Get product reviews
const reviews = await reviewApi.getProductReviews(productId);
```

## Backend Routes Mapped

All routes follow the format: `http://localhost:5000/api/v1/[route]`

| Endpoint | Methods | Auth Required |
|----------|---------|---------------|
| `/auth/register` | POST | No |
| `/auth/login` | POST | No |
| `/auth/logout` | POST | Yes |
| `/auth/refresh-token` | POST | No |
| `/auth/profile` | GET, PUT | Yes |
| `/auth/users` | GET | Yes (Admin) |
| `/products` | GET | No |
| `/products/:id` | GET | No |
| `/products/slug/:slug` | GET | No |
| `/products/featured` | GET | No |
| `/products/:id/related` | GET | No |
| `/products/search` | GET | No |
| `/categories` | GET | No |
| `/categories/:id` | GET | No |
| `/categories/slug/:slug` | GET | No |
| `/categories/tree` | GET | No |
| `/cart` | GET, DELETE | Yes |
| `/cart/add` | POST | Yes |
| `/cart/items/:itemId` | PUT, DELETE | Yes |
| `/orders` | GET, POST | Yes |
| `/orders/:id` | GET | Yes |
| `/orders/:id/cancel` | POST | Yes |
| `/reviews/product/:productId` | GET | No |
| `/reviews` | POST | Yes |
| `/reviews/my-reviews` | GET | Yes |

## Type Safety Features

1. **Full type inference**: All API calls have complete TypeScript type checking
2. **Compile-time validation**: Invalid API calls will fail at build time
3. **IDE autocomplete**: Full IntelliSense support for all API methods and types
4. **Type guards**: Enums ensure valid values for status, payment methods, etc.

## Next Steps

1. **Error Handling**: Add toast notifications for API errors
2. **Loading States**: Implement loading indicators for async operations
3. **React Query/SWR**: Consider adding for caching and optimistic updates
4. **Form Validation**: Add client-side validation before API calls
5. **Unit Tests**: Write tests for API services

## Running the Application

1. **Start Backend**:
   ```bash
   cd recommendation_server
   npm run dev
   ```
   Server runs on: http://localhost:5000

2. **Start Frontend**:
   ```bash
   cd recommendation_client
   npm run dev
   ```
   Client runs on: http://localhost:3000

3. **Database**: Ensure MySQL is running with the configured credentials

## Testing the Integration

```bash
# In recommendation_client directory
npm run build  # Should compile without errors
npx tsc --noEmit  # Type check - should pass with 0 errors
```

All TypeScript checks pass ✅
