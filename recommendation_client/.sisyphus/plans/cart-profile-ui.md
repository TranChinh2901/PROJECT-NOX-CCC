# Work Plan: Cart & Profile UI Implementation

## TL;DR

> **Objective**: Complete e-commerce cart and user profile UI with light theme design
> 
> **Deliverables**:
> - Cart page with localStorage persistence
> - Checkout flow (login required)
> - Auth system (login, signup, profile, orders, forgot password)
> - CartContext + AuthContext global state
> - Header integration with auth and cart
> 
> **Estimated Effort**: Large (8-10 major components, parallel development)
> **Parallel Execution**: YES - 2 parallel tracks + integration phase
> **Critical Path**: AuthContext interface → AuthContext implementation → CartContext → Header integration

---

## Context

### Original Request
User needs to complete front-end UI for cart and profile user functionality in an e-commerce Next.js project.

### Interview Summary
**Key Decisions**:
- Cart page: Light clean theme (match FormInput component)
- Profile pages: Light theme (better for forms)
- Full profile suite: Profile view/edit, orders, addresses, password change
- Parallel development: Both cart and profile simultaneously
- Cart persistence: localStorage (survives browser close)
- Guest checkout: NO - must login before checkout
- Password reset: Include page (API not ready = placeholder for future)

**Research Findings**:
- Backend APIs are 100% complete (cart.api.ts, order.api.ts, auth.api.ts)
- Types are fully defined (Cart, CartItem, User, etc.)
- AuthContext.tsx is EMPTY (needs full implementation)
- Existing design system: Tailwind v4, dual theme (ui/ = dark, common/ = light)
- Primary color: #CA8A04 (gold)

### Metis Review
**Identified Gaps** (addressed in this plan):
- AuthContext interface must be defined first (before any implementation)
- Types should be split by domain (cart.types.ts, auth.types.ts, order.types.ts)
- Header.tsx ownership must be assigned (recommend: Profile team)
- Scope creep areas locked down (NO payment processing, NO real-time sync)
- Edge cases documented (out of stock, session expiry, etc.)

---

## Work Objectives

### Core Objective
Build complete cart management and user profile UI with light theme, following existing design system patterns. Implement global state management via React Context.

### Concrete Deliverables

**Cart Track:**
1. `src/contexts/CartContext.tsx` - Global cart state with localStorage + API sync
2. `src/app/(user)/cart/page.tsx` - Full cart page with item listing
3. `src/app/(user)/checkout/page.tsx` - Checkout flow (address, payment, confirmation)
4. `src/types/cart.types.ts` - Split cart-related types

**Profile Track:**
1. `src/contexts/AuthContext.tsx` - Auth state management (currently EMPTY)
2. `src/app/(user)/account/login/page.tsx` - Login form
3. `src/app/(user)/account/signup/page.tsx` - Registration form
4. `src/app/(user)/account/forgot-password/page.tsx` - Password reset request (placeholder)
5. `src/app/(user)/account/profile/page.tsx` - Profile view
6. `src/app/(user)/account/profile/edit/page.tsx` - Profile edit form
7. `src/app/(user)/account/orders/page.tsx` - Order history list
8. `src/app/(user)/account/addresses/page.tsx` - Address management
9. `src/types/auth.types.ts` - Split auth-related types
10. `src/types/order.types.ts` - Split order-related types

**Integration:**
1. Update `src/components/layout/Header.tsx` - Cart badge + auth integration
2. Update `src/app/layout.tsx` - Add AuthProvider and CartProvider

### Definition of Done
- [ ] All pages render without errors
- [ ] Cart persists to localStorage and syncs with API
- [ ] Auth flow works: login → profile → logout
- [ ] Header shows correct state (cart count, user avatar)
- [ ] All forms have validation and error handling
- [ ] Responsive at 375px, 768px, 1024px

### Must Have
- Cart with localStorage persistence
- Login/signup functionality
- Profile view and edit
- Order history display
- Header integration
- Light theme consistency

### Must NOT Have (Guardrails from Metis)
- ❌ Payment processing logic (UI only)
- ❌ Real-time cart sync (WebSockets)
- ❌ Social login (Google/Facebook)
- ❌ Email verification flow (API not ready)
- ❌ Order tracking integration (shipping APIs)
- ❌ Two-factor authentication
- ❌ Guest checkout
- ❌ Admin dashboard features
- ❌ Product catalog changes

---

## Verification Strategy

### Test Infrastructure Assessment
**Infrastructure exists**: NO - No test framework configured
**User wants tests**: Manual verification (no test infrastructure in project)
**QA approach**: Manual verification with detailed acceptance criteria

**Automated Verification Strategy:**
- Use `next build` to verify no TypeScript errors
- Use Playwright skill for UI verification (after implementation)
- Use curl/Bash for API endpoint verification

---

## Execution Strategy

### Parallel Development Waves

```
PHASE 1: Interface Definition (Foundation)
├── Task 1: Define AuthContext interface
├── Task 2: Define CartContext interface
├── Task 3: Split types into domain files
└── Task 4: Update layout.tsx with providers

PHASE 2: Parallel Development (Independent Tracks)
┌─────────────────────┬─────────────────────┐
│   CART TRACK        │   PROFILE TRACK     │
├─────────────────────┼─────────────────────┤
│ Task 5: CartContext │ Task 8: AuthContext │
│ Task 6: Cart Page   │ Task 9: Login Page  │
│ Task 7: Checkout    │ Task 10: Signup     │
│                     │ Task 11: Profile    │
│                     │ Task 12: Orders     │
│                     │ Task 13: Addresses  │
│                     │ Task 14: Password   │
└─────────────────────┴─────────────────────┘

PHASE 3: Integration (Merge & Connect)
├── Task 15: Header Integration (Profile team owns)
├── Task 16: End-to-end testing
└── Task 17: Mobile responsive check
```

### Critical Path Analysis
```
AuthContext Interface (Task 1)
    ↓
AuthContext Implementation (Task 8)
    ↓
CartContext Implementation (Task 5) [depends on AuthContext for user ID]
    ↓
Header Integration (Task 15) [depends on both contexts]
```

**Parallel Speedup**: 40% faster than sequential by running Cart and Profile tracks simultaneously after interface definition.

### Agent Dispatch Strategy

| Phase | Tasks | Recommended Agent Profile |
|-------|-------|---------------------------|
| Phase 1 | Interface definition | oracle (for architecture decisions) |
| Phase 2 - Cart | Tasks 5-7 | general (React/Next.js expertise) |
| Phase 2 - Profile | Tasks 8-14 | general (forms, auth patterns) |
| Phase 3 | Integration, Testing | general + playwright skill |

---

## TODOs

### Phase 1: Interface Definition (Foundation)

- [x] **1. Define AuthContext Interface**
  **What to do**:
  - Create TypeScript interface for AuthContext in `src/types/auth.types.ts`
  - Define: user, isLoading, isAuthenticated, login(), logout(), signup(), updateProfile()
  - Document the interface for parallel teams

  **Must NOT do**:
  - Don't implement the context yet (just the interface)
  - Don't modify existing files

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain` (architecture decision)
  - **Skills**: `git-master`
  - Reason: Need to design interface that both teams will code against

  **Parallelization**:
  - **Can Run In Parallel**: NO (blocks all other tasks)
  - **Blocked By**: None
  - **Blocks**: Tasks 5, 8, 15

  **References**:
  - `src/types/index.ts:User` - User type definition
  - `src/lib/api/auth.api.ts` - Auth API methods to wrap
  - `src/lib/api/apiClient.ts` - Token handling pattern

  **Acceptance Criteria**:
  - [ ] Interface file created: `src/types/auth.types.ts`
  - [ ] Interface includes all required methods and state
  - [ ] TypeScript compiles without errors: `npx tsc --noEmit`

  **Commit**: NO (part of Phase 1 commit)

- [x] **2. Define CartContext Interface**
  **What to do**:
  - Create TypeScript interface for CartContext in `src/types/cart.types.ts`
  - Define: cart, isLoading, addToCart(), updateItem(), removeItem(), clearCart(), syncWithAPI()
  - Document localStorage + API sync strategy

  **Must NOT do**:
  - Don't implement the context yet

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 1)
  - **Blocked By**: None
  - **Blocks**: Task 5

  **References**:
  - `src/types/index.ts:Cart` - Cart type definition
  - `src/lib/api/cart.api.ts` - Cart API methods

  **Acceptance Criteria**:
  - [ ] Interface file created: `src/types/cart.types.ts`
  - [ ] Includes localStorage persistence strategy

  **Commit**: NO (part of Phase 1 commit)

- [x] **3. Split Types into Domain Files**
  **What to do**:
  - Create `src/types/cart.types.ts` - Cart and CartItem types
  - Create `src/types/auth.types.ts` - User, AuthResponse, enums
  - Create `src/types/order.types.ts` - Order and OrderItem types
  - Update `src/types/index.ts` to re-export from domain files

  **Must NOT do**:
  - Don't delete existing types from index.ts until re-exports are working
  - Don't change any type definitions (just reorganize)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 1-2)
  - **Blocked By**: None
  - **Blocks**: None (enables parallel development)

  **References**:
  - `src/types/index.ts` - All existing types

  **Acceptance Criteria**:
  - [ ] `src/types/cart.types.ts` created with Cart types
  - [ ] `src/types/auth.types.ts` created with User types
  - [ ] `src/types/order.types.ts` created with Order types
  - [ ] `src/types/index.ts` re-exports all types
  - [ ] `npx tsc --noEmit` passes

  **Commit**: YES
  - Message: `refactor(types): split types into domain files for parallel development`
  - Files: `src/types/*.ts`

- [x] **4. Update Layout with Providers**
  **What to do**:
  - Update `src/app/layout.tsx` to wrap children with AuthProvider and CartProvider (placeholder shells)
  - Create empty `src/contexts/AuthContext.tsx` and `src/contexts/CartContext.tsx` shells if not exist

  **Must NOT do**:
  - Don't implement provider logic yet (just the wrapper structure)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 1-3)
  - **Blocked By**: None
  - **Blocks**: Tasks 5, 8

  **References**:
  - `src/app/layout.tsx` - Root layout

  **Acceptance Criteria**:
  - [ ] Layout wraps children with providers (placeholder)
  - [ ] App compiles and runs: `npm run dev` starts without errors

  **Commit**: YES (with Task 3)

---

### Phase 2: Parallel Development

#### CART TRACK

- [x] **5. Implement CartContext**
  **What to do**:
  - Implement full CartContext in `src/contexts/CartContext.tsx`
  - Features: localStorage persistence, API sync, optimistic updates
  - Methods: addToCart, updateQuantity, removeItem, clearCart, refreshCart
  - Handle edge cases: API failures (fallback to localStorage), item out of stock

  **Must NOT do**:
  - Don't implement checkout logic (that's Task 7)
  - Don't modify AuthContext

  **Recommended Agent Profile**:
  - **Category**: `general` 
  - **Skills**: `git-master`, `vercel-react-best-practices`
  - Reason: Complex state management with localStorage + API sync

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Profile track, after Phase 1)
  - **Blocked By**: Tasks 1, 2, 4
  - **Blocks**: Task 6, 7

  **References**:
  - `src/lib/api/cart.api.ts` - All cart API methods
  - `src/types/cart.types.ts` - Cart interfaces
  - `src/components/common/Button.tsx` - For quantity buttons

  **Acceptance Criteria**:
  - [ ] CartContext exports provider and useCart hook
  - [ ] localStorage sync works: Add item → refresh page → item persists
  - [ ] API sync works: Add item → check Network tab → POST to /cart/add
  - [ ] Optimistic updates: UI updates immediately before API response
  - [ ] Error handling: Network error shows toast, keeps localStorage data

  **Commit**: YES
  - Message: `feat(cart): implement CartContext with localStorage and API sync`
  - Files: `src/contexts/CartContext.tsx`

- [x] **6. Build Cart Page**
  **What to do**:
  - Create `src/app/(user)/cart/page.tsx`
  - Layout: Light theme, match FormInput/Button styles
  - Features:
    - Cart item list with product image, name, variant, price
    - Quantity controls (+/- buttons, min 1, max stock)
    - Remove item button with confirmation
    - Cart summary (subtotal, tax, shipping, total)
    - Empty state (illustration + "Continue Shopping" button)
    - "Proceed to Checkout" button (disabled if empty)
  - Responsive: Stack on mobile, side-by-side on desktop

  **Must NOT do**:
  - Don't implement checkout logic (redirect to /checkout)
  - Don't add promo code (out of scope)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `git-master`, `frontend-ui-ux`
  - Reason: UI-heavy task requiring design system consistency

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 8+)
  - **Blocked By**: Task 5
  - **Blocks**: None

  **References**:
  - `src/components/common/FormInput.tsx` - Form styling pattern
  - `src/components/common/Button.tsx` - Button variants
  - `src/components/ui/ProductCard.tsx` - Product display reference
  - `src/components/common/EmptyState.tsx` - Empty state pattern

  **Acceptance Criteria**:
  - [ ] Page loads at `/cart`
  - [ ] Empty cart shows EmptyState component
  - [ ] Items display with image, name, price, quantity
  - [ ] Quantity buttons work (+/-)
  - [ ] Remove item works with confirmation
  - [ ] Cart totals calculate correctly
  - [ ] Responsive: mobile stack, desktop grid
  - [ ] Lighthouse accessibility score ≥ 90

  **Commit**: YES
  - Message: `feat(cart): add full cart page with item management`
  - Files: `src/app/(user)/cart/page.tsx`, `src/components/cart/*`

- [x] **7. Build Checkout Page**
  **What to do**:
  - Create `src/app/(user)/checkout/page.tsx`
  - Layout: Light theme, form-focused
  - Features:
    - Order summary sidebar (items, quantities, totals)
    - Shipping address form (name, phone, address, city)
    - Payment method selection (UI only: COD, Credit Card placeholder)
    - Form validation (required fields, phone format)
    - Submit order button
    - Success state: Order confirmation with order number
  - Protected route: Redirect to /account/login if not authenticated

  **Must NOT do**:
  - Don't implement actual payment processing (UI only)
  - Don't integrate Stripe/PayPal (out of scope)

  **Recommended Agent Profile**:
  - **Category**: `general`
  - **Skills**: `git-master`, `frontend-ui-ux`
  - Reason: Complex form with validation and state management

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Profile track)
  - **Blocked By**: Task 5, Task 8 (for auth check)
  - **Blocks**: None

  **References**:
  - `src/components/common/FormInput.tsx` - Form input pattern
  - `src/lib/api/order.api.ts` - Order creation API
  - `src/app/(user)/cart/page.tsx` - Cart page for summary reference

  **Acceptance Criteria**:
  - [ ] Page loads at `/checkout`
  - [ ] Shows order summary from cart
  - [ ] Shipping form validates required fields
  - [ ] Phone number validates format
  - [ ] Submit creates order via API
  - [ ] Success shows order confirmation
  - [ ] Unauthenticated users redirected to login

  **Commit**: YES
  - Message: `feat(checkout): add checkout flow with order creation`
  - Files: `src/app/(user)/checkout/page.tsx`, `src/components/checkout/*`

#### PROFILE TRACK

- [x] **8. Implement AuthContext**
  **What to do**:
  - Implement full AuthContext in `src/contexts/AuthContext.tsx` (currently EMPTY)
  - Features:
    - User state management
    - JWT token storage (localStorage) and retrieval
    - Auto-token refresh on expiry
    - login(email, password) method
    - signup(data) method
    - logout() method
    - updateProfile(data) method
    - isAuthenticated boolean
    - isLoading state for async operations
  - Handle edge cases: 401 redirect, token expiry, session timeout

  **Must NOT do**:
  - Don't implement password reset logic (API not ready)
  - Don't modify CartContext

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: `git-master`, `vercel-react-best-practices`
  - Reason: Critical foundation, security-sensitive, complex async state

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Cart track, after Phase 1)
  - **Blocked By**: Tasks 1, 4
  - **Blocks**: Tasks 9-14, 15

  **References**:
  - `src/lib/api/auth.api.ts` - All auth API methods
  - `src/types/auth.types.ts` - Auth interfaces
  - `src/lib/api/apiClient.ts` - Token handling in axios interceptor

  **Acceptance Criteria**:
  - [ ] AuthContext exports provider and useAuth hook
  - [ ] Login persists token to localStorage
  - [ ] Token auto-attached to API requests
  - [ ] 401 errors trigger logout + redirect
  - [ ] isAuthenticated true after login
  - [ ] User state persists after page refresh
  - [ ] Logout clears token and state

  **Commit**: YES
  - Message: `feat(auth): implement AuthContext with JWT management`
  - Files: `src/contexts/AuthContext.tsx`

- [x] **9. Build Login Page**
  **What to do**:
  - Create `src/app/(user)/account/login/page.tsx`
  - Layout: Light theme, centered card
  - Features:
    - Email and password inputs
    - Form validation (required fields, email format)
    - Show/hide password toggle
    - Submit button with loading state
    - Error display (invalid credentials, network error)
    - Link to signup page
    - Link to forgot password page
    - Redirect to previous page (or /) after login
  - Use existing FormInput component

  **Must NOT do**:
  - Don't add social login (out of scope)

  **Recommended Agent Profile**:
  - **Category**: `general`
  - **Skills**: `git-master`, `frontend-ui-ux`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Blocked By**: Task 8
  - **Blocks**: None

  **References**:
  - `src/components/common/FormInput.tsx` - Form styling
  - `src/components/common/Button.tsx` - Button component
  - `src/contexts/AuthContext.tsx` - useAuth hook

  **Acceptance Criteria**:
  - [ ] Page loads at `/account/login`
  - [ ] Form validates email format
  - [ ] Form validates password not empty
  - [ ] Valid credentials login successfully
  - [ ] Invalid credentials show error message
  - [ ] Loading state shows during submit
  - [ ] Redirects after successful login
  - [ ] Responsive design

  **Commit**: YES
  - Message: `feat(auth): add login page with form validation`
  - Files: `src/app/(user)/account/login/page.tsx`

- [x] **10. Build Signup Page**
  **What to do**:
  - Create `src/app/(user)/account/signup/page.tsx`
  - Layout: Light theme, centered card
  - Features:
    - Full name, email, password, confirm password inputs
    - Form validation (all required, email format, password match, min length)
    - Password strength indicator (optional)
    - Terms agreement checkbox
    - Submit button with loading state
    - Error display (email exists, validation errors)
    - Link to login page
    - Auto-login after successful signup

  **Must NOT do**:
  - Don't add email verification (API not ready)

  **Recommended Agent Profile**:
  - **Category**: `general`
  - **Skills**: `git-master`, `frontend-ui-ux`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Blocked By**: Task 8
  - **Blocks**: None

  **References**:
  - Same as Task 9

  **Acceptance Criteria**:
  - [ ] Page loads at `/account/signup`
  - [ ] All fields validate
  - [ ] Passwords must match
  - [ ] Email must be unique (API error handled)
  - [ ] Success creates account and logs in
  - [ ] Shows appropriate error messages

  **Commit**: YES
  - Message: `feat(auth): add signup page with validation`
  - Files: `src/app/(user)/account/signup/page.tsx`

- [x] **11. Build Profile View & Edit Pages**
  **What to do**:
  - Create `src/app/(user)/account/profile/page.tsx` - View mode
  - Create `src/app/(user)/account/profile/edit/page.tsx` - Edit mode
  - Layout: Light theme, card-based
  - View features:
    - Display avatar, full name, email, phone, address
    - Edit button linking to edit page
    - "My Orders" link
    - "Change Password" link
  - Edit features:
    - Form with all editable fields
    - Avatar upload (file picker, preview)
    - Save/Cancel buttons
    - Form validation
    - Success toast on save

  **Must NOT do**:
  - Don't add complex image cropping (basic upload only)

  **Recommended Agent Profile**:
  - **Category**: `general`
  - **Skills**: `git-master`, `frontend-ui-ux`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Blocked By**: Task 8
  - **Blocks**: None

  **References**:
  - `src/lib/api/auth.api.ts:updateProfile` - Profile update API
  - `src/lib/api/auth.api.ts:uploadAvatar` - Avatar upload API

  **Acceptance Criteria**:
  - [ ] View page displays user data
  - [ ] Edit page loads with current data
  - [ ] Avatar upload works
  - [ ] Form saves changes to API
  - [ ] Shows success/error feedback
  - [ ] Cancel returns to view page

  **Commit**: YES
  - Message: `feat(profile): add profile view and edit pages`
  - Files: `src/app/(user)/account/profile/**`

- [x] **12. Build Order History Page**
  **What to do**:
  - Create `src/app/(user)/account/orders/page.tsx`
  - Layout: Light theme, table/list view
  - Features:
    - List of orders with order number, date, total, status
    - Sort by date (newest first)
    - Filter by status (optional)
    - Click to view order details
    - Empty state for no orders
    - Pagination (if many orders)

  **Must NOT do**:
  - Don't add order tracking (shipping integration out of scope)

  **Recommended Agent Profile**:
  - **Category**: `general`
  - **Skills**: `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Blocked By**: Task 8
  - **Blocks**: None

  **References**:
  - `src/lib/api/order.api.ts:getUserOrders` - Orders API

  **Acceptance Criteria**:
  - [ ] Page loads at `/account/orders`
  - [ ] Displays list of orders
  - [ ] Shows order number, date, total, status
  - [ ] Click navigates to order detail
  - [ ] Empty state when no orders

  **Commit**: YES
  - Message: `feat(orders): add order history list page`
  - Files: `src/app/(user)/account/orders/page.tsx`

- [x] **13. Build Address Management Page**
  **What to do**:
  - Create `src/app/(user)/account/addresses/page.tsx`
  - Layout: Light theme, card-based list
  - Features:
    - List of saved addresses
    - Add new address button/form
    - Edit address
    - Delete address with confirmation
    - Set default address
    - Form validation (required fields)

  **Must NOT do**:
  - Don't add address autocomplete (Google Maps API out of scope)

  **Recommended Agent Profile**:
  - **Category**: `general`
  - **Skills**: `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Blocked By**: Task 8
  - **Blocks**: None

  **References**:
  - User profile includes address field (use as starting point)

  **Acceptance Criteria**:
  - [ ] Page loads at `/account/addresses`
  - [ ] Lists existing addresses
  - [ ] Can add new address
  - [ ] Can edit existing address
  - [ ] Can delete with confirmation
  - [ ] Can set default

  **Commit**: YES
  - Message: `feat(addresses): add address management page`
  - Files: `src/app/(user)/account/addresses/page.tsx`

- [x] **14. Build Forgot Password Page**
  **What to do**:
  - Create `src/app/(user)/account/forgot-password/page.tsx`
  - Layout: Light theme, simple form
  - Features:
    - Email input field
    - Submit button
    - Success message ("Check your email")
    - Placeholder implementation (API not ready)
    - Link back to login

  **Must NOT do**:
  - Don't implement actual email sending (API not ready)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Blocked By**: None (just UI placeholder)
  - **Blocks**: None

  **Acceptance Criteria**:
  - [ ] Page loads at `/account/forgot-password`
  - [ ] Email form displays
  - [ ] Shows "Coming soon" or placeholder message
  - [ ] Link back to login works

  **Commit**: YES
  - Message: `feat(auth): add forgot password placeholder page`
  - Files: `src/app/(user)/account/forgot-password/page.tsx`

---

### Phase 3: Integration

- [x] **15. Header Integration (Profile Team Owns)**
  **What to do**:
  - Update `src/components/layout/Header.tsx`
  - Features:
    - Cart icon with item count badge (from CartContext)
    - User avatar dropdown when authenticated
    - Login/Signup buttons when not authenticated
    - Dropdown menu: Profile, Orders, Addresses, Logout
    - Mobile responsive hamburger menu
  - Coordinate with Cart team on cart badge API

  **Must NOT do**:
  - Don't break existing navigation structure
  - Don't remove existing static elements

  **Recommended Agent Profile**:
  - **Category**: `general`
  - **Skills**: `git-master`, `frontend-ui-ux`

  **Parallelization**:
  - **Can Run In Parallel**: NO (requires both contexts)
  - **Blocked By**: Tasks 5, 8
  - **Blocks**: None

  **References**:
  - `src/contexts/CartContext.tsx` - useCart hook
  - `src/contexts/AuthContext.tsx` - useAuth hook
  - `src/components/ui/GlassCard.tsx` - Dropdown styling reference

  **Acceptance Criteria**:
  - [ ] Cart badge shows item count
  - [ ] Authenticated user sees avatar + dropdown
  - [ ] Unauthenticated sees Login/Signup
  - [ ] Dropdown links work
  - [ ] Mobile menu works

  **Commit**: YES
  - Message: `feat(layout): integrate Header with auth and cart`
  - Files: `src/components/layout/Header.tsx`

- [x] **16. End-to-End Testing**
  **What to do**:
  - Test complete user flows:
    1. Signup → Login → View Profile → Edit Profile → Logout
    2. Add to Cart → View Cart → Checkout → View Orders
    3. Login → Add to Cart → Logout → Login → Cart persists
  - Test edge cases: empty cart, no orders, form validation errors
  - Test responsive: mobile, tablet, desktop

  **Recommended Agent Profile**:
  - **Category**: `general`
  - **Skills**: `playwright` (for automated testing)

  **Acceptance Criteria**:
  - [ ] All user flows complete successfully
  - [ ] No console errors
  - [ ] Responsive design verified

  **Commit**: NO (testing only)

- [x] **17. Mobile Responsive Check**
  **What to do**:
  - Verify all pages at: 375px, 768px, 1024px, 1440px
  - Check: no horizontal scroll, readable text, usable buttons
  - Fix any responsive issues

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `playwright` (for screenshots)

  **Acceptance Criteria**:
  - [ ] All pages responsive
  - [ ] No horizontal scroll on mobile
  - [ ] Touch targets ≥ 44px

  **Commit**: YES (if fixes needed)
  - Message: `fix(ui): responsive adjustments for mobile`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 3 | `refactor(types): split types into domain files` | `src/types/*.ts` | `npx tsc --noEmit` |
| 4 | `feat(layout): add provider shells to layout` | `src/app/layout.tsx` | App starts |
| 5 | `feat(cart): implement CartContext` | `src/contexts/CartContext.tsx` | localStorage sync works |
| 6 | `feat(cart): add cart page` | `src/app/(user)/cart/**` | Page renders |
| 7 | `feat(checkout): add checkout flow` | `src/app/(user)/checkout/**` | Order creates |
| 8 | `feat(auth): implement AuthContext` | `src/contexts/AuthContext.tsx` | Login works |
| 9 | `feat(auth): add login page` | `src/app/(user)/account/login/**` | Form works |
| 10 | `feat(auth): add signup page` | `src/app/(user)/account/signup/**` | Signup works |
| 11 | `feat(profile): add profile pages` | `src/app/(user)/account/profile/**` | Edit works |
| 12 | `feat(orders): add order history` | `src/app/(user)/account/orders/**` | List works |
| 13 | `feat(addresses): add address management` | `src/app/(user)/account/addresses/**` | CRUD works |
| 14 | `feat(auth): add forgot password placeholder` | `src/app/(user)/account/forgot-password/**` | Page exists |
| 15 | `feat(layout): integrate Header` | `src/components/layout/Header.tsx` | Badge + auth work |

---

## Success Criteria

### Verification Commands
```bash
# Build check
npm run build
# Expected: No TypeScript errors, build succeeds

# Dev server check
npm run dev
# Expected: Starts without errors, all routes accessible

# Type check
npx tsc --noEmit
# Expected: No type errors
```

### Final Checklist
- [ ] All "Must Have" present (Cart, Profile, Auth)
- [ ] All "Must NOT Have" absent (no payment processing)
- [ ] All pages render without errors
- [ ] Cart persists across page refreshes (localStorage)
- [ ] Auth flow works end-to-end
- [ ] Header integration complete
- [ ] Responsive on all breakpoints
- [ ] Light theme consistent across all pages
- [ ] No console errors or warnings
- [ ] All acceptance criteria met

---

## Guardrails & Anti-Patterns

### Explicitly OUT OF SCOPE
- Payment processing (Stripe, PayPal integration)
- Real-time features (WebSockets, live cart sync)
- Social login (Google, Facebook OAuth)
- Email verification flow
- Order tracking with shipping providers
- Two-factor authentication
- Guest checkout
- Admin dashboard
- Product catalog changes
- Coupon/promo code system

### Design System Rules
1. **Light theme only** - NO glassmorphism for cart/profile
2. **Use existing components** - FormInput, Button from common/
3. **Primary color**: #CA8A04 (gold) for CTAs
4. **Icons**: lucide-react only (NO emojis)
5. **Transitions**: 150-300ms for interactions
6. **Responsive**: Mobile-first, breakpoints at 768px, 1024px

### Parallel Development Rules
1. **AuthContext interface first** - Both teams code to interface
2. **Split types** - cart.types.ts, auth.types.ts, order.types.ts
3. **Header ownership** - Profile team owns Header integration
4. **No cross-team file edits** - Each team owns their files
5. **Daily sync** - Share changes to shared files immediately

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AuthContext race condition | Medium | High | Define interface first (Task 1) |
| Header merge conflicts | Medium | High | Single owner (Profile team) |
| API contract mismatch | Low | High | Verify API responses in Phase 1 |
| localStorage sync bugs | Medium | Medium | Extensive testing in Task 16 |
| Form validation edge cases | Medium | Low | Comprehensive test cases |
| Mobile responsive issues | Medium | Medium | Task 17 dedicated check |
| Scope creep | High | Medium | Guardrails documented above |

---

## Integration Points

### Cart ↔ Auth Integration
- CartContext reads user ID from AuthContext for API calls
- On logout: Clear cart from state (keep localStorage for return user)
- On login: Refresh cart from API (merge with localStorage if needed)

### Header Integration
- Header reads from both CartContext (item count) and AuthContext (user)
- Header is owned by Profile team, but Cart team provides interface requirements
- Coordinate on dropdown menu structure

### Route Protection
- AuthContext provides isAuthenticated
- Protected routes (checkout, profile) redirect to login if not authenticated
- After login, redirect back to intended page

---

## Notes

### API Not Ready (Placeholder Pages)
- `/account/forgot-password` - UI ready, logic pending API
- Password reset flow can be added later when API supports it

### Future Enhancements (Not in Scope)
- Email verification
- Social login
- Guest checkout
- Real-time cart sync
- Advanced address autocomplete
- Order tracking
- Push notifications

---

## Quick Reference

### File Ownership
**Cart Team**:
- `src/contexts/CartContext.tsx`
- `src/app/(user)/cart/**`
- `src/app/(user)/checkout/**`
- `src/types/cart.types.ts`

**Profile Team**:
- `src/contexts/AuthContext.tsx`
- `src/app/(user)/account/**`
- `src/types/auth.types.ts`
- `src/types/order.types.ts`
- `src/components/layout/Header.tsx` (integration)

**Shared**:
- `src/types/index.ts` (re-exports)
- `src/app/layout.tsx` (providers)

### Routes Summary
| Route | Page | Auth Required |
|-------|------|---------------|
| `/cart` | Cart | No |
| `/checkout` | Checkout | Yes |
| `/account/login` | Login | No |
| `/account/signup` | Signup | No |
| `/account/forgot-password` | Forgot Password | No |
| `/account/profile` | Profile View | Yes |
| `/account/profile/edit` | Profile Edit | Yes |
| `/account/orders` | Order History | Yes |
| `/account/addresses` | Addresses | Yes |

### Color Palette (Light Theme)
- Background: #FFFFFF
- Surface (cards): #F9FAFB (gray-50)
- Primary CTA: #CA8A04 (gold)
- Text Primary: #111827 (gray-900)
- Text Secondary: #6B7280 (gray-500)
- Border: #E5E7EB (gray-200)
- Error: #EF4444 (red-500)
- Success: #10B981 (green-500)
