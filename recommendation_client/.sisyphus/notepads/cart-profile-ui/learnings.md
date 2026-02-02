# Learnings - Cart & Profile UI

## Conventions & Patterns

*This file tracks conventions, patterns, and best practices discovered during implementation.*

---

## Initial Setup - 2026-01-30T07:45

### Design System Established
- **Light theme only** for cart and profile pages
- **Primary CTA color**: #CA8A04 (gold)
- **Icons**: lucide-react only (NO emojis)
- **Typography**: Cormorant (headings) + Montserrat (body)
- **Transitions**: 150-300ms for interactions

### Tech Stack Verified
- Next.js 16.1.4 with App Router
- Tailwind CSS v4
- React 19.2.3
- TypeScript 5
- API Client: Axios with token interceptor

### Project Structure
- `src/components/ui/` = Dark theme, glassmorphism, premium
- `src/components/common/` = Light theme, standard, functional
- `src/contexts/` = React Context providers
- `src/app/(user)/` = User-facing pages

---

## Auth Context Interface - 2026-01-30T09:12

- Added `AuthContextType` in `src/types/auth.types.ts` as the shared contract for Cart/Profile teams.
- Interface exposes `user`, `isLoading`, and `isAuthenticated` plus all auth API operations.
- Token strategy documented: store `accessToken`/`refreshToken` (and `user`) in localStorage; apiClient interceptor reads accessToken for Authorization.

---

## Cart Context Interface - 2026-01-30T10:30

- Added `CartContextType` in `src/types/cart.types.ts` as the shared contract for Cart/Profile teams.
- Persistence strategy documented: localStorage key `cart` as primary storage, with API sync when authenticated.
- Optimistic update pattern documented: update UI + localStorage first, then call API; on failure keep local data and surface a toast.

## Types Reorganization - 2026-01-30T14:59

### Domain-Driven Type Split
- Reorganized monolithic `src/types/index.ts` into domain-specific files to enable parallel development without merge conflicts
- Each domain team owns their type file:
  - `auth.types.ts` - User, auth enums, auth DTOs, AuthContextType
  - `cart.types.ts` - Cart, CartItem, cart DTOs, CartContextType  
  - `order.types.ts` - Order, OrderItem, OrderStatus, CartStatus, Address, CreateOrderDto
  - `product.types.ts` - Product catalog, variants, reviews, filters
  - `index.ts` - Barrel file with re-exports (backward compatible)

### Dependency Resolution
- Product types moved to separate file (needed by Cart and Order)
- Order types import Product and Auth types (dependency chain: Auth → Order → Cart)
- Cart types re-export CartStatus from order.types (avoids circular deps)
- All enums organized by domain (GenderType, RoleType in auth; OrderStatus, CartStatus in order)

### Key Decisions
- Used `export type {}` syntax for re-exports to comply with `isolatedModules: true` (TypeScript config)
- Kept ApiResponse and PaginatedResponse in index.ts (shared utilities, no domain)
- Added `user?: User` property to Review interface (matched original type)
- CartContextType remains in cart.types.ts (even though it's a context contract, not a data type) for co-location with Cart type

### Verification
- TypeScript compilation: `npx tsc --noEmit` ✓ passes
- No type definition changes (100% preserve of properties and structure)
- All exports available from index.ts (backward compatibility maintained)

---

## Cart Context Interface Update - 2026-01-30T15:30

- Updated `CartContextType` method names to align with cart API usage: `addToCart`, `updateQuantity`, `removeItem`, `clearCart`, `refreshCart`, `syncWithAPI`.
- Documented persistence strategy with localStorage key `cart:state`, optimistic UI-first updates, and API retry guidance.
- Noted `itemCount` as the derived value for the header cart badge.

## Task 4: Layout Provider Integration - 2026-01-30T08:15

### What Was Done
- Added AuthProvider and CartProvider imports to `src/app/layout.tsx`
- Wrapped {children} with correct provider nesting: `<AuthProvider><CartProvider>{children}</CartProvider></AuthProvider>`
- Preserved all existing layout functionality (fonts, metadata, Toaster)
- Verified with TypeScript compilation and dev server startup

### Key Learnings

#### Provider Nesting Order
- **AuthProvider MUST be outer**: Auth state should be available to Cart operations
- **CartProvider MUST be inner**: Cart can read auth context if needed
- **Toaster positioned after providers**: Notifications work across entire app

#### Layout Component Constraints
- Root layout is a Server Component by default
- Wrapping with 'use client' providers automatically makes it a Client Component
- All existing configuration (fonts, metadata) continue to work normally
- No conflict between Server Component root and Client Component children

#### Integration Pattern
- Providers are already correctly exported as named exports
- Simple wrapper pattern: import -> JSX wrap -> done
- No additional configuration needed for React Context propagation

### Verification
- ✅ TypeScript compilation: `npx tsc --noEmit` passed
- ✅ Dev server start: `npm run dev` started in 1389ms
- ✅ No errors or warnings during build
- ✅ Both providers now globally available to all child components

### Next Steps
- CartProvider and AuthProvider are now globally accessible
- Components can use `useCart()` and `useAuth()` hooks anywhere
- Ready for Phase 2: Component integration tasks

## Task 5: CartContext localStorage Implementation - 2026-01-30

### What Was Done
- Implemented full localStorage persistence logic in `src/contexts/CartContext.tsx`
- Added `useEffect` to load cart from localStorage on mount (key: `cart:state`)
- Implemented all cart methods: `addToCart`, `updateQuantity`, `removeItem`, `clearCart`, `refreshCart`
- All methods use optimistic updates (state first, then localStorage)
- Implemented `calculateItemCount` helper to derive badge count from cart items
- Added `persistCart` helper for safe localStorage operations with error handling

### Key Implementation Details

#### localStorage Strategy
- **Storage key**: `cart:state` (as specified in CartContextType contract)
- **Load on mount**: `useEffect` reads from localStorage once on initial render
- **Persist after mutations**: Every state-changing operation writes to localStorage
- **Error handling**: All localStorage operations wrapped in try-catch to handle quota/permission issues
- **Cleanup**: `clearCart` removes localStorage entry entirely

#### Optimistic Update Pattern
1. Calculate new cart state from existing state
2. Update React state (`setCart`, `setItemCount`)
3. Persist to localStorage
4. Return updated cart (for API sync layer to use later)

#### Cart Item Management
- **Add to cart**: Creates new cart if none exists, otherwise checks if variant already in cart
- **Duplicate variants**: Increments quantity instead of adding duplicate item
- **Temporary IDs**: Uses `Date.now()` for localStorage-only carts (will be replaced by API IDs)
- **Update quantity**: Finds item by ID, updates quantity and recalculates total_price
- **Remove item**: Filters out item by ID, recalculates item_count
- **Clear cart**: Sets cart to null, clears localStorage

#### Type System Resolution
- **CartStatus enum**: Imported directly from `@/types/order.types` (not from index barrel)
- **Reason**: Index barrel exports CartStatus as `export type`, making it type-only (not a value)
- **Solution**: Import enum directly from source file to access enum values like `CartStatus.ACTIVE`

### Verification
- ✅ TypeScript compilation: `npx tsc --noEmit` passed
- ✅ Dev server start: `npm run dev` started in 1021ms
- ✅ No LSP diagnostics errors
- ✅ All cart methods implemented with correct signatures
- ✅ itemCount calculation implemented
- ✅ localStorage persistence working

### Next Steps
- API sync logic (`syncWithAPI`) will be added in later task
- Server-side cart fetching (`refreshCart`) will be enhanced when API is connected
- Current implementation is fully functional for guest cart (localStorage-only mode)

---

## Auth Context Token Management - 2026-01-30

### What Was Done
- Implemented AuthContext methods using `authApi` for login/signup/logout/profile operations.
- Added localStorage persistence for JWT tokens and user data on login/refresh.
- Restored auth state on mount by reading stored tokens and user data.

### Key Learnings
- Primary storage keys for Technova auth data: `technova_access_token`, `technova_refresh_token`, `technova_user`.
- For compatibility with the existing Axios interceptor, mirror tokens/user to legacy keys `accessToken`, `refreshToken`, and `user`.
- `isAuthenticated` should be derived from access token presence; clear stale user data when no token exists.

### Verification
- ✅ LSP diagnostics clean on `AuthContext.tsx`
- ✅ TypeScript compilation: `npx tsc --noEmit` passed
- ✅ Dev server started cleanly with `npm run dev`
