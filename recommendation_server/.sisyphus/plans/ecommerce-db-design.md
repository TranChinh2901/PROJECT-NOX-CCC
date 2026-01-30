# E-Commerce Database Design with AI Recommendations

## TL;DR

> **Quick Summary**: Design a complete TypeORM entity schema for a fashion e-commerce site featuring multi-variant products, multi-warehouse inventory, full order lifecycle, reviews/wishlist/promotions, and AI recommendation data tables for third-party API integration.
> 
> **Deliverables**: 
> - 12+ TypeORM entity files with proper relationships
> - Database migration files
> - Entity validation test files (TDD approach)
> - Entity relationship diagram reference
> 
> **Estimated Effort**: Large (3-4 hours with TDD)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Core Entities → Order System → AI Tables

---

## Context

### Original Request
Design database for an e-commerce website with integrated recommendation AI. Fashion/clothing focus with size, color, material variants.

### Interview Summary
**Key Discussions**:
- **Recommendation type**: Complete AI Suite (similar products, personalized, trending, complementary items)
- **Processing strategy**: Batch + Cache (pre-computed, periodically updated)
- **Features scope**: Core + Reviews + Wishlist + Promotions + Multi-warehouse
- **AI integration**: Third-party API (AWS Personalize, Google Recommendations AI, etc.)
- **Testing approach**: TDD (entity tests first)

**Research Findings**:
- E-commerce schemas need normalization (3NF) with strategic denormalization for performance
- AI recommendation systems require: user behavior tracking, product metadata, recommendation caching
- TypeORM with MySQL supports all required features including JSON columns for flexible attributes

### Metis Review (Self-Analysis)
**Identified Gaps** (addressed in plan):
- **Gap**: Soft delete strategy needed for products/orders → Added `deleted_at` columns
- **Gap**: Product search/indexing not addressed → Added `product_search_keywords` table
- **Gap**: Image handling beyond URL → Added `product_images` with alt text, sort order
- **Gap**: Order status history tracking → Added `order_status_history` table
- **Gap**: Inventory movement audit trail → Added `inventory_logs` table
- **Gap**: User session tracking for AI → Added `user_sessions` table

---

## Work Objectives

### Core Objective
Create a production-ready TypeORM entity schema for fashion e-commerce with integrated AI recommendation data structures.

### Concrete Deliverables
- **src/modules/products/entity/**: Product, Category, Brand, ProductVariant, ProductImage entities
- **src/modules/inventory/entity/**: Warehouse, Inventory, InventoryLog entities
- **src/modules/orders/entity/**: Cart, CartItem, Order, OrderItem, OrderStatusHistory entities
- **src/modules/reviews/entity/**: Review, ReviewHelpful entities
- **src/modules/wishlist/entity/**: WishlistItem entity
- **src/modules/promotions/entity/**: Promotion, PromotionUsage entities
- **src/modules/ai/entity/**: UserBehaviorLog, UserSession, ProductFeature, RecommendationCache entities
- **src/migrations/**: Database migration files
- **src/**/**/*.spec.ts**: Entity validation tests

### Definition of Done
- [ ] All entities created with proper TypeORM decorators
- [ ] All entity relationships defined (OneToMany, ManyToOne, ManyToMany)
- [ ] All migration files generated and runnable
- [ ] All tests pass: `bun test` or `npm test`
- [ ] Migration applies cleanly: `npm run migration:run`

### Must Have
- Product catalog with size/color/material variants
- Multi-warehouse inventory tracking
- Shopping cart and order management
- Review and rating system
- Wishlist functionality
- Promotion/discount support
- User behavior tracking for AI
- Recommendation caching tables
- Proper indexing for query performance

### Must NOT Have (Guardrails)
- NO payment gateway integration logic (just tables)
- NO actual ML model training code
- NO real-time WebSocket updates
- NO third-party API client implementations
- NO admin dashboard UI
- NO frontend components
- NO business logic beyond basic validation

---

## Verification Strategy (TDD Enabled)

### Test Infrastructure
- **Framework**: Jest (already configured in project)
- **Approach**: RED-GREEN-REFACTOR for each entity
- **Pattern**: Each entity gets a `.spec.ts` file with validation tests

### TDD Workflow Per Entity
1. **RED**: Write failing test that asserts entity structure
   - Test file: `[entity].spec.ts`
   - Test command: `bun test [file]` or `npm test -- [file]`
   - Expected: FAIL (entity doesn't exist yet)
2. **GREEN**: Create minimum entity to pass tests
   - Define columns, types, relationships
   - Command: `npm test -- [file]`
   - Expected: PASS
3. **REFACTOR**: Add indexes, constraints, improve structure
   - Command: `npm test -- [file]`
   - Expected: PASS (still green)

### Existing Test Infrastructure
- **Config**: `jest.config.js` exists
- **Command**: `npm test` available
- **Pattern**: `[filename].spec.ts` files

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - Core Foundation):
├── Task 1: Product & Category Entities (no dependencies)
├── Task 2: Brand Entity (no dependencies)
├── Task 3: Warehouse Entity (no dependencies)
└── Task 4: User Session Entity (extends existing User)

Wave 2 (After Wave 1 - Dependent Core):
├── Task 5: Product Variant Entity (depends: Product)
├── Task 6: Product Image Entity (depends: Product)
├── Task 7: Inventory Entity (depends: ProductVariant, Warehouse)
└── Task 8: Cart & CartItem Entities (depends: ProductVariant)

Wave 3 (After Wave 2 - Order & Features):
├── Task 9: Order & OrderItem Entities (depends: Cart, ProductVariant)
├── Task 10: Order Status History (depends: Order)
├── Task 11: Review & Rating Entities (depends: OrderItem, Product)
├── Task 12: Wishlist Entity (depends: ProductVariant)
└── Task 13: Promotion Entities (depends: Order)

Wave 4 (After Wave 1 - AI Tables - Parallel with Waves 2-3):
├── Task 14: User Behavior Log Entity (depends: User, Product)
├── Task 15: Product Feature Entity (depends: Product)
└── Task 16: Recommendation Cache Entity (depends: Product)

Wave 5 (Final Integration):
├── Task 17: Inventory Log Entity (depends: Inventory)
└── Task 18: Generate Migrations & Integration Tests
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 (Products) | None | 5, 6, 11, 14, 15 | 2, 3, 4 |
| 2 (Brands) | None | 1 | 1, 3, 4 |
| 3 (Warehouses) | None | 7 | 1, 2, 4 |
| 4 (User Sessions) | None | 14 | 1, 2, 3 |
| 5 (Variants) | 1 | 7, 8, 9, 11, 12 | 6 |
| 6 (Images) | 1 | None | 5 |
| 7 (Inventory) | 3, 5 | 17 | 8 |
| 8 (Cart) | 5 | 9 | 7 |
| 9 (Orders) | 8 | 10, 11, 13 | None |
| 10 (Order History) | 9 | None | 11, 12, 13 |
| 11 (Reviews) | 1, 9 | None | 10, 12, 13 |
| 12 (Wishlist) | 5 | None | 10, 11, 13 |
| 13 (Promotions) | 9 | None | 10, 11, 12 |
| 14 (Behavior Log) | 1, 4 | None | 15, 16 |
| 15 (Product Features) | 1 | None | 14, 16 |
| 16 (Recommendations) | 1 | None | 14, 15 |
| 17 (Inventory Log) | 7 | 18 | None |
| 18 (Migrations) | 17 | None | None (final) |

### Critical Path
Task 1 → Task 5 → Task 8 → Task 9 → Task 18

---

## TODOs

---

### Task 1: Product & Category Entities

**What to do**:
- Create `Category` entity with hierarchical structure (parent/child categories)
- Create `Product` entity with base product information
- Define OneToMany/ManyToOne relationships between them
- Write tests first (TDD)

**Must NOT do**:
- NO product variants in this task (separate entity)
- NO inventory logic here
- NO pricing logic beyond base_price

**Recommended Agent Profile**:
- **Category**: `unspecified-high` (complex entity relationships)
- **Skills**: N/A (basic TypeORM task)
- **Rationale**: Standard TypeORM entity creation with relationship mapping

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1
- **Blocks**: Task 5 (Product Variants), Task 6 (Product Images), Task 11 (Reviews), Task 14-16 (AI tables)
- **Blocked By**: None (can start immediately)

**References**:
- **Pattern**: `src/modules/users/entity/user.entity.ts` - Follow existing entity structure pattern
- **Pattern**: `src/config/database.config.ts` - MySQL/TypeORM configuration reference
- **Best Practice**: Use `timestamptz` equivalent (MySQL datetime) for time columns
- **Best Practice**: Use int8 (MySQL BIGINT) for primary keys - already in user entity

**Acceptance Criteria**:

**RED Phase**:
- [ ] Test file: `src/modules/products/entity/category.spec.ts` created
- [ ] Test file: `src/modules/products/entity/product.spec.ts` created
- [ ] Tests define expected columns: id, name, slug, description, etc.
- [ ] `npm test -- category.spec.ts` → FAIL (entities don't exist)

**GREEN Phase**:
- [ ] Category entity created with fields:
  - id: number (PK, auto-increment)
  - name: string (100 chars, unique)
  - slug: string (100 chars, unique, indexed)
  - description: text (nullable)
  - parent_id: number (FK to category, nullable, self-referential)
  - image_url: string (255, nullable)
  - sort_order: number (default 0)
  - is_active: boolean (default true)
  - created_at, updated_at, deleted_at: timestamps
- [ ] Product entity created with fields:
  - id: number (PK, auto-increment)
  - category_id: number (FK to category)
  - brand_id: number (FK to brand - nullable for now)
  - name: string (200 chars)
  - slug: string (200 chars, unique, indexed)
  - sku: string (100 chars, unique)
  - description: text
  - short_description: string (500, nullable)
  - base_price: decimal(10,2)
  - compare_at_price: decimal(10,2, nullable) - for showing discounts
  - cost_price: decimal(10,2, nullable) - for margin calculations
  - weight_kg: decimal(8,3, nullable)
  - is_active: boolean (default true)
  - is_featured: boolean (default false)
  - meta_title, meta_description: SEO fields (nullable)
  - created_at, updated_at, deleted_at: timestamps
- [ ] Relationships defined:
  - Category → Products: OneToMany
  - Product → Category: ManyToOne
  - Category → Parent Category: ManyToOne (self-referential)
  - Category → Child Categories: OneToMany (self-referential)
- [ ] `npm test -- category.spec.ts` → PASS
- [ ] `npm test -- product.spec.ts` → PASS

**REFACTOR Phase**:
- [ ] Add indexes: slug (unique), category_id, brand_id, is_active, is_featured
- [ ] Add check constraints: base_price >= 0
- [ ] `npm test` → All tests still pass

**Commit**: YES
- Message: `feat(products): add Category and Product entities with relationships`
- Files: 
  - `src/modules/products/entity/category.ts`
  - `src/modules/products/entity/product.ts`
  - `src/modules/products/entity/category.spec.ts`
  - `src/modules/products/entity/product.spec.ts`
- Pre-commit: `npm test -- category.spec.ts product.spec.ts`

---

### Task 2: Brand Entity

**What to do**:
- Create simple `Brand` entity for product manufacturers
- Link to Product entity

**Must NOT do**:
- NO brand hierarchy (flat list only)
- NO brand-specific categories

**Recommended Agent Profile**:
- **Category**: `quick` (simple entity)
- **Skills**: N/A

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1
- **Blocks**: Task 1 (referenced by Product)
- **Blocked By**: None

**Acceptance Criteria**:

**RED Phase**:
- [ ] Test: `src/modules/products/entity/brand.spec.ts` created
- [ ] Tests fail (entity doesn't exist)

**GREEN Phase**:
- [ ] Brand entity fields:
  - id, name (100, unique), slug (100, unique), description (text, nullable)
  - logo_url (255, nullable), website_url (255, nullable)
  - is_active (default true), created_at, updated_at, deleted_at
- [ ] Update Product entity to add Brand relationship
- [ ] Tests pass

**REFACTOR Phase**:
- [ ] Add indexes on slug
- [ ] Tests still pass

**Commit**: YES (grouped with Task 1)
- Message: `feat(products): add Brand entity`

---

### Task 3: Warehouse Entity

**What to do**:
- Create `Warehouse` entity for multi-location inventory

**Must NOT do**:
- NO complex warehouse zones/bin locations (flat structure)
- NO warehouse transfer logic (just location tracking)

**Recommended Agent Profile**:
- **Category**: `quick`

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1
- **Blocks**: Task 7 (Inventory)
- **Blocked By**: None

**Acceptance Criteria**:

**RED Phase**:
- [ ] Test: `src/modules/inventory/entity/warehouse.spec.ts` created
- [ ] Tests fail

**GREEN Phase**:
- [ ] Warehouse entity fields:
  - id, name (100), code (20, unique), address (255)
  - city (100), country (100, default 'Vietnam')
  - contact_name, contact_phone, contact_email
  - is_active (default true), is_default (default false)
  - created_at, updated_at, deleted_at
- [ ] Tests pass

**REFACTOR Phase**:
- [ ] Add unique constraint: only one warehouse can be is_default=true
- [ ] Tests still pass

**Commit**: YES (grouped with Task 1)
- Message: `feat(inventory): add Warehouse entity`

---

### Task 4: User Session Entity

**What to do**:
- Extend user tracking with `UserSession` for AI behavior analysis
- Links to existing User entity

**Must NOT do**:
- NO session authentication (just tracking for recommendations)
- NO device fingerprinting complexity

**Recommended Agent Profile**:
- **Category**: `quick`

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1
- **Blocks**: Task 14 (User Behavior Log)
- **Blocked By**: None (extends existing User)

**Acceptance Criteria**:

**RED Phase**:
- [ ] Test: `src/modules/users/entity/user-session.spec.ts` created
- [ ] Tests fail

**GREEN Phase**:
- [ ] UserSession entity fields:
  - id, user_id (FK to users, nullable for guest sessions)
  - session_token: string (255, unique, indexed) - for anonymous tracking
  - ip_address: string (45, nullable) - supports IPv6
  - user_agent: string (500, nullable)
  - device_type: enum ('desktop', 'mobile', 'tablet', 'unknown')
  - started_at, ended_at: timestamps
  - is_active: boolean (default true)
  - created_at, updated_at
- [ ] Add relationship: UserSession → User: ManyToOne
- [ ] Add relationship: User → UserSessions: OneToMany
- [ ] Tests pass

**REFACTOR Phase**:
- [ ] Add index on session_token, user_id, is_active
- [ ] Tests still pass

**Commit**: YES (grouped with Task 1)
- Message: `feat(users): add UserSession entity for behavior tracking`

---

### Task 5: Product Variant Entity

**What to do**:
- Create `ProductVariant` for size/color/material combinations
- Each variant has its own SKU, price override, inventory

**Must NOT do**:
- NO variant images (handled in ProductImage with variant_id)
- NO dynamic attribute system (fixed: size, color, material)

**Recommended Agent Profile**:
- **Category**: `unspecified-high` (complex relationships)

**Parallelization**:
- **Can Run In Parallel**: YES (after Task 1)
- **Parallel Group**: Wave 2
- **Blocks**: Task 7 (Inventory), Task 8 (Cart), Task 9 (Orders), Task 11 (Reviews), Task 12 (Wishlist)
- **Blocked By**: Task 1 (Product)

**Acceptance Criteria**:

**RED Phase**:
- [ ] Test: `src/modules/products/entity/product-variant.spec.ts` created
- [ ] Tests define expected variant structure

**GREEN Phase**:
- [ ] ProductVariant entity fields:
  - id, product_id (FK to Product)
  - sku: string (100, unique)
  - size: string (50, nullable) - e.g., "S", "M", "L", "XL", "42", "43"
  - color: string (50, nullable) - e.g., "Red", "Blue", "Black"
  - color_code: string (7, nullable) - hex color for display (#FF0000)
  - material: string (50, nullable) - e.g., "Cotton", "Polyester", "Leather"
  - price_adjustment: decimal(10,2, default 0) - relative to base_price
  - final_price: decimal(10,2) - calculated: base_price + price_adjustment
  - weight_kg: decimal(8,3, nullable) - override product weight
  - barcode: string (100, nullable, unique)
  - is_active: boolean (default true)
  - sort_order: number (default 0)
  - created_at, updated_at, deleted_at
- [ ] Relationship: ProductVariant → Product: ManyToOne
- [ ] Relationship: Product → ProductVariants: OneToMany
- [ ] Tests pass

**REFACTOR Phase**:
- [ ] Add indexes: product_id, sku (unique), barcode (unique), is_active
- [ ] Add check constraint: final_price >= 0
- [ ] Tests still pass

**Commit**: YES
- Message: `feat(products): add ProductVariant entity for size/color/material`

---

### Task 6: Product Image Entity

**What to do**:
- Create `ProductImage` for multiple images per product/variant

**Must NOT do**:
- NO image upload logic (just URL storage)
- NO CDN configuration (just URL fields)

**Recommended Agent Profile**:
- **Category**: `quick`

**Parallelization**:
- **Can Run In Parallel**: YES (after Task 1)
- **Parallel Group**: Wave 2
- **Blocks**: None
- **Blocked By**: Task 1 (Product)

**Acceptance Criteria**:

**RED Phase**:
- [ ] Test: `src/modules/products/entity/product-image.spec.ts` created
- [ ] Tests fail

**GREEN Phase**:
- [ ] ProductImage entity fields:
  - id, product_id (FK to Product)
  - variant_id (FK to ProductVariant, nullable) - specific variant image
  - image_url: string (500) - Cloudinary or S3 URL
  - thumbnail_url: string (500, nullable)
  - alt_text: string (255, nullable) - SEO/accessibility
  - sort_order: number (default 0)
  - is_primary: boolean (default false) - main product image
  - created_at, updated_at, deleted_at
- [ ] Relationship: ProductImage → Product: ManyToOne
- [ ] Relationship: ProductImage → ProductVariant: ManyToOne (nullable)
- [ ] Tests pass

**REFACTOR Phase**:
- [ ] Add indexes: product_id, variant_id, is_primary
- [ ] Add constraint: only one is_primary per product (or per variant)
- [ ] Tests still pass

**Commit**: YES (group with Task 5)
- Message: `feat(products): add ProductImage entity`

---

### Task 7: Inventory Entity

**What to do**:
- Create `Inventory` to track stock per variant per warehouse

**Must NOT do**:
- NO reservation system (just quantity tracking)
- NO automatic reorder logic

**Recommended Agent Profile**:
- **Category**: `unspecified-high`

**Parallelization**:
- **Can Run In Parallel**: YES (after Tasks 3 & 5)
- **Parallel Group**: Wave 2
- **Blocks**: Task 17 (Inventory Log)
- **Blocked By**: Task 3 (Warehouse), Task 5 (ProductVariant)

**Acceptance Criteria**:

**RED Phase**:
- [ ] Test: `src/modules/inventory/entity/inventory.spec.ts` created
- [ ] Tests fail

**GREEN Phase**:
- [ ] Inventory entity fields:
  - id, variant_id (FK to ProductVariant)
  - warehouse_id (FK to Warehouse)
  - quantity_available: number (default 0) - sellable stock
  - quantity_reserved: number (default 0) - reserved in carts/orders
  - quantity_total: number (default 0) - physical stock
  - reorder_level: number (default 10) - alert threshold
  - reorder_quantity: number (nullable) - suggested reorder amount
  - last_counted_at: timestamp (nullable)
  - created_at, updated_at
- [ ] Unique constraint: (variant_id, warehouse_id) - one inventory record per variant per warehouse
- [ ] Relationship: Inventory → ProductVariant: ManyToOne
- [ ] Relationship: Inventory → Warehouse: ManyToOne
- [ ] Tests pass

**REFACTOR Phase**:
- [ ] Add indexes: variant_id, warehouse_id, quantity_available
- [ ] Add check constraints: quantities >= 0
- [ ] Tests still pass

**Commit**: YES
- Message: `feat(inventory): add Inventory entity for multi-warehouse stock`

---

### Task 8: Cart & CartItem Entities

**What to do**:
- Create `Cart` and `CartItem` for shopping cart functionality
- Cart can be anonymous (session-based) or user-based

**Must NOT do**:
- NO cart abandonment emails
- NO cart merging logic (simple structure)

**Recommended Agent Profile**:
- **Category**: `unspecified-high`

**Parallelization**:
- **Can Run In Parallel**: YES (after Task 5)
- **Parallel Group**: Wave 2
- **Blocks**: Task 9 (Orders)
- **Blocked By**: Task 5 (ProductVariant)

**Acceptance Criteria**:

**RED Phase**:
- [ ] Tests: `src/modules/cart/entity/cart.spec.ts`, `cart-item.spec.ts` created
- [ ] Tests fail

**GREEN Phase**:
- [ ] Cart entity fields:
  - id, user_id (FK to User, nullable)
  - session_id (FK to UserSession, nullable) - for anonymous carts
  - status: enum ('active', 'converted', 'abandoned', default 'active')
  - total_amount: decimal(10,2, default 0)
  - item_count: number (default 0)
  - currency: string (3, default 'VND')
  - expires_at: timestamp (nullable) - cart expiration
  - created_at, updated_at, deleted_at
- [ ] CartItem entity fields:
  - id, cart_id (FK to Cart)
  - variant_id (FK to ProductVariant)
  - quantity: number (default 1)
  - unit_price: decimal(10,2) - price at time of adding
  - total_price: decimal(10,2) - calculated
  - added_at: timestamp
  - updated_at, deleted_at
- [ ] Relationships defined:
  - Cart → CartItems: OneToMany
  - CartItem → Cart: ManyToOne
  - CartItem → ProductVariant: ManyToOne
- [ ] Unique constraint: (cart_id, variant_id) - one line per variant
- [ ] Tests pass

**REFACTOR Phase**:
- [ ] Add indexes: user_id, session_id, status, variant_id
- [ ] Add check constraints: quantity > 0, prices >= 0
- [ ] Tests still pass

**Commit**: YES
- Message: `feat(cart): add Cart and CartItem entities`

---

### Task 9: Order & OrderItem Entities

**What to do**:
- Create `Order` and `OrderItem` for order management
- Order is created from cart (but keeps snapshot data)

**Must NOT do**:
- NO payment transaction logic (just payment status)
- NO shipping label generation

**Recommended Agent Profile**:
- **Category**: `unspecified-high` (complex, critical entity)

**Parallelization**:
- **Can Run In Parallel**: YES (after Task 8)
- **Parallel Group**: Wave 3
- **Blocks**: Task 10 (Order History), Task 11 (Reviews), Task 13 (Promotions)
- **Blocked By**: Task 8 (Cart)

**Acceptance Criteria**:

**RED Phase**:
- [ ] Tests: `src/modules/orders/entity/order.spec.ts`, `order-item.spec.ts` created
- [ ] Tests fail

**GREEN Phase**:
- [ ] Order entity fields:
  - id, order_number: string (20, unique) - human-readable order ID (e.g., ORD-2025-000001)
  - user_id (FK to User)
  - cart_id (FK to Cart, nullable) - reference to source cart
  - status: enum ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
  - payment_status: enum ('pending', 'paid', 'failed', 'refunded')
  - payment_method: enum ('cod', 'credit_card', 'bank_transfer', 'e_wallet')
  - shipping_address: json - full address snapshot
  - billing_address: json - full address snapshot
  - subtotal: decimal(10,2)
  - discount_amount: decimal(10,2, default 0)
  - shipping_amount: decimal(10,2, default 0)
  - tax_amount: decimal(10,2, default 0)
  - total_amount: decimal(10,2)
  - currency: string (3, default 'VND')
  - notes: text (nullable) - customer notes
  - internal_notes: text (nullable) - admin notes
  - tracking_number: string (100, nullable)
  - shipped_at, delivered_at: timestamps (nullable)
  - created_at, updated_at, deleted_at
- [ ] OrderItem entity fields:
  - id, order_id (FK to Order)
  - variant_id (FK to ProductVariant)
  - product_snapshot: json - product name, variant details at time of order
  - quantity: number
  - unit_price: decimal(10,2)
  - total_price: decimal(10,2)
  - discount_amount: decimal(10,2, default 0)
  - created_at, updated_at
- [ ] Relationships defined:
  - Order → OrderItems: OneToMany
  - OrderItem → Order: ManyToOne
  - OrderItem → ProductVariant: ManyToOne
- [ ] Tests pass

**REFACTOR Phase**:
- [ ] Add indexes: order_number (unique), user_id, status, payment_status
- [ ] Add check constraints: amounts >= 0, quantity > 0
- [ ] Tests still pass

**Commit**: YES
- Message: `feat(orders): add Order and OrderItem entities`

---

### Task 10: Order Status History Entity

**What to do**:
- Create `OrderStatusHistory` to track all status changes

**Must NOT do**:
- NO automatic status transitions (just logging)
- NO notification triggers

**Recommended Agent Profile**:
- **Category**: `quick`

**Parallelization**:
- **Can Run In Parallel**: YES (after Task 9)
- **Parallel Group**: Wave 3
- **Blocks**: None
- **Blocked By**: Task 9 (Order)

**Acceptance Criteria**:

**RED Phase**:
- [ ] Test: `src/modules/orders/entity/order-status-history.spec.ts` created
- [ ] Tests fail

**GREEN Phase**:
- [ ] OrderStatusHistory entity fields:
  - id, order_id (FK to Order)
  - status: enum ('pending', 'confirmed', etc.) - new status
  - previous_status: enum (nullable) - old status
  - changed_by: string (100, nullable) - user/system who changed
  - notes: text (nullable)
  - created_at
- [ ] Relationship: OrderStatusHistory → Order: ManyToOne
- [ ] Relationship: Order → OrderStatusHistories: OneToMany
- [ ] Tests pass

**REFACTOR Phase**:
- [ ] Add index on order_id
- [ ] Tests still pass

**Commit**: YES (group with Task 9)
- Message: `feat(orders): add OrderStatusHistory for audit trail`

---

### Task 11: Review & ReviewHelpful Entities

**What to do**:
- Create `Review` for product ratings and reviews
- Create `ReviewHelpful` for "was this helpful" votes

**Must NOT do**:
- NO review moderation workflow (just is_approved flag)
- NO image attachments to reviews

**Recommended Agent Profile**:
- **Category**: `unspecified-high`

**Parallelization**:
- **Can Run In Parallel**: YES (after Tasks 1 & 9)
- **Parallel Group**: Wave 3
- **Blocks**: None
- **Blocked By**: Task 1 (Product), Task 9 (Order)

**Acceptance Criteria**:

**RED Phase**:
- [ ] Tests: `src/modules/reviews/entity/review.spec.ts`, `review-helpful.spec.ts` created
- [ ] Tests fail

**GREEN Phase**:
- [ ] Review entity fields:
  - id, product_id (FK to Product)
  - user_id (FK to User)
  - order_item_id (FK to OrderItem) - verified purchase
  - rating: number (1-5)
  - title: string (200, nullable)
  - content: text
  - is_verified_purchase: boolean (default false)
  - is_approved: boolean (default false) - moderation
  - helpful_count: number (default 0)
  - not_helpful_count: number (default 0)
  - created_at, updated_at, deleted_at
- [ ] ReviewHelpful entity fields:
  - id, review_id (FK to Review)
  - user_id (FK to User)
  - is_helpful: boolean - true=helpful, false=not helpful
  - created_at
- [ ] Unique constraint: (review_id, user_id) - one vote per user per review
- [ ] Relationships defined
- [ ] Tests pass

**REFACTOR Phase**:
- [ ] Add indexes: product_id, user_id, rating, is_approved
- [ ] Add check constraint: rating between 1 and 5
- [ ] Tests still pass

**Commit**: YES
- Message: `feat(reviews): add Review and ReviewHelpful entities`

---

### Task 12: Wishlist Item Entity

**What to do**:
- Create `WishlistItem` for user favorites (variant-level)

**Must NOT do**:
- NO wishlist sharing functionality
- NO public wishlists

**Recommended Agent Profile**:
- **Category**: `quick`

**Parallelization**:
- **Can Run In Parallel**: YES (after Task 5)
- **Parallel Group**: Wave 3
- **Blocks**: None
- **Blocked By**: Task 5 (ProductVariant)

**Acceptance Criteria**:

**RED Phase**:
- [ ] Test: `src/modules/wishlist/entity/wishlist-item.spec.ts` created
- [ ] Tests fail

**GREEN Phase**:
- [ ] WishlistItem entity fields:
  - id, user_id (FK to User)
  - variant_id (FK to ProductVariant)
  - notes: string (500, nullable) - personal notes
  - priority: enum ('low', 'medium', 'high', default 'medium')
  - added_at: timestamp
  - created_at, updated_at
- [ ] Unique constraint: (user_id, variant_id) - no duplicates
- [ ] Relationships defined
- [ ] Tests pass

**REFACTOR Phase**:
- [ ] Add indexes: user_id, variant_id
- [ ] Tests still pass

**Commit**: YES
- Message: `feat(wishlist): add WishlistItem entity`

---

### Task 13: Promotion & PromotionUsage Entities

**What to do**:
- Create `Promotion` for discount codes and campaigns
- Create `PromotionUsage` to track redemptions

**Must NOT do**:
- NO complex promotion rules (buy X get Y, tiered discounts)
- NO automatic promotion application logic

**Recommended Agent Profile**:
- **Category**: `unspecified-high`

**Parallelization**:
- **Can Run In Parallel**: YES (after Task 9)
- **Parallel Group**: Wave 3
- **Blocks**: None
- **Blocked By**: Task 9 (Order)

**Acceptance Criteria**:

**RED Phase**:
- [ ] Tests: `src/modules/promotions/entity/promotion.spec.ts`, `promotion-usage.spec.ts` created
- [ ] Tests fail

**GREEN Phase**:
- [ ] Promotion entity fields:
  - id, code: string (50, unique) - e.g., "SUMMER25"
  - name: string (100)
  - description: text (nullable)
  - type: enum ('percentage', 'fixed_amount', 'free_shipping')
  - value: decimal(10,2) - percentage (e.g., 25.00) or fixed amount
  - min_order_amount: decimal(10,2, nullable)
  - max_discount_amount: decimal(10,2, nullable)
  - usage_limit: number (nullable) - total times code can be used
  - usage_limit_per_user: number (nullable)
  - starts_at, ends_at: timestamps (nullable)
  - is_active: boolean (default true)
  - applies_to: enum ('all', 'categories', 'products')
  - applicable_ids: json (nullable) - array of category/product IDs
  - created_at, updated_at, deleted_at
- [ ] PromotionUsage entity fields:
  - id, promotion_id (FK to Promotion)
  - order_id (FK to Order)
  - user_id (FK to User)
  - discount_amount: decimal(10,2)
  - used_at: timestamp
- [ ] Relationships defined
- [ ] Tests pass

**REFACTOR Phase**:
- [ ] Add indexes: code (unique), is_active, starts_at, ends_at
- [ ] Add check constraints: value >= 0, usage limits > 0 if set
- [ ] Tests still pass

**Commit**: YES
- Message: `feat(promotions): add Promotion and PromotionUsage entities`

---

### Task 14: User Behavior Log Entity

**What to do**:
- Create `UserBehaviorLog` to track all user actions for AI recommendations
- Captures: views, clicks, add-to-cart, purchases, searches

**Must NOT do**:
- NO real-time stream processing setup
- NO aggregation logic (raw log storage only)

**Recommended Agent Profile**:
- **Category**: `unspecified-high`

**Parallelization**:
- **Can Run In Parallel**: YES (after Tasks 1 & 4)
- **Parallel Group**: Wave 4 (AI Tables)
- **Blocks**: None
- **Blocked By**: Task 1 (Product), Task 4 (UserSession)

**Acceptance Criteria**:

**RED Phase**:
- [ ] Test: `src/modules/ai/entity/user-behavior-log.spec.ts` created
- [ ] Tests fail

**GREEN Phase**:
- [ ] UserBehaviorLog entity fields:
  - id, session_id (FK to UserSession)
  - user_id (FK to User, nullable)
  - action_type: enum ('view', 'click', 'add_to_cart', 'remove_from_cart', 'purchase', 'search', 'wishlist_add', 'review_view')
  - product_id (FK to Product, nullable) - for product-related actions
  - variant_id (FK to ProductVariant, nullable)
  - search_query: string (255, nullable) - for search actions
  - cart_id (FK to Cart, nullable)
  - order_id (FK to Order, nullable)
  - metadata: json (nullable) - flexible extra data
  - device_type: enum ('desktop', 'mobile', 'tablet')
  - referrer_url: string (500, nullable)
  - page_url: string (500)
  - ip_address: string (45, nullable)
  - session_duration_seconds: number (nullable)
  - created_at
- [ ] Relationships defined
- [ ] Tests pass

**REFACTOR Phase**:
- [ ] Add indexes: session_id, user_id, action_type, product_id, created_at (composite for time-series queries)
- [ ] Add index on search_query (for search analytics)
- [ ] Tests still pass

**Commit**: YES
- Message: `feat(ai): add UserBehaviorLog for recommendation training data`

---

### Task 15: Product Feature Entity

**What to do**:
- Create `ProductFeature` to store AI-friendly product attributes
- Used for content-based recommendations

**Must NOT do**:
- NO automatic feature extraction (just storage)
- NO ML embedding vectors (start simple with tags)

**Recommended Agent Profile**:
- **Category**: `quick`

**Parallelization**:
- **Can Run In Parallel**: YES (after Task 1)
- **Parallel Group**: Wave 4
- **Blocks**: None
- **Blocked By**: Task 1 (Product)

**Acceptance Criteria**:

**RED Phase**:
- [ ] Test: `src/modules/ai/entity/product-feature.spec.ts` created
- [ ] Tests fail

**GREEN Phase**:
- [ ] ProductFeature entity fields:
  - id, product_id (FK to Product)
  - feature_type: enum ('category', 'style', 'occasion', 'season', 'pattern', 'fabric_type', 'attribute')
  - feature_value: string (100) - e.g., "casual", "summer", "floral"
  - confidence_score: decimal(3,2, nullable) - AI confidence (0.00-1.00)
  - source: enum ('manual', 'ai_extracted', 'imported', default 'manual')
  - weight: number (default 1) - importance for matching
  - created_at, updated_at
- [ ] Unique constraint: (product_id, feature_type, feature_value) - no duplicates
- [ ] Relationship: ProductFeature → Product: ManyToOne
- [ ] Tests pass

**REFACTOR Phase**:
- [ ] Add indexes: product_id, feature_type, feature_value
- [ ] Tests still pass

**Commit**: YES (group with Task 14)
- Message: `feat(ai): add ProductFeature for content-based recommendations`

---

### Task 16: Recommendation Cache Entity

**What to do**:
- Create `RecommendationCache` to store pre-computed recommendations
- Updated by batch job from third-party AI service

**Must NOT do**:
- NO real-time recommendation generation
- NO complex recommendation algorithms

**Recommended Agent Profile**:
- **Category**: `unspecified-high`

**Parallelization**:
- **Can Run In Parallel**: YES (after Task 1)
- **Parallel Group**: Wave 4
- **Blocks**: None
- **Blocked By**: Task 1 (Product)

**Acceptance Criteria**:

**RED Phase**:
- [ ] Test: `src/modules/ai/entity/recommendation-cache.spec.ts` created
- [ ] Tests fail

**GREEN Phase**:
- [ ] RecommendationCache entity fields:
  - id, user_id (FK to User, nullable) - null = global recommendations
  - product_id (FK to Product, nullable) - for "similar products" type
  - recommendation_type: enum ('similar', 'personalized', 'trending', 'complementary', 'frequently_bought_together')
  - algorithm: string (50, default 'third_party') - identifier for tracking
  - recommended_products: json - array of {product_id, score, rank}
  - context_data: json (nullable) - additional context for debugging
  - expires_at: timestamp - when to refresh
  - generated_at: timestamp
  - cache_hit_count: number (default 0) - usage tracking
  - is_active: boolean (default true)
  - created_at, updated_at
- [ ] Unique constraint: (user_id, product_id, recommendation_type) - one cache entry per context
- [ ] Relationships defined
- [ ] Tests pass

**REFACTOR Phase**:
- [ ] Add indexes: user_id, product_id, recommendation_type, expires_at, is_active
- [ ] Add partial index: is_active=true and expires_at > now (for active cache queries)
- [ ] Tests still pass

**Commit**: YES (group with Task 14)
- Message: `feat(ai): add RecommendationCache for batch-computed suggestions`

---

### Task 17: Inventory Log Entity

**What to do**:
- Create `InventoryLog` for audit trail of all inventory changes
- Tracks: sales, restocks, adjustments, transfers

**Must NOT do**:
- NO automatic reconciliation logic
- NO low-stock alerts (just logging)

**Recommended Agent Profile**:
- **Category**: `quick`

**Parallelization**:
- **Can Run In Parallel**: YES (after Task 7)
- **Parallel Group**: Wave 5
- **Blocks**: Task 18 (Migrations)
- **Blocked By**: Task 7 (Inventory)

**Acceptance Criteria**:

**RED Phase**:
- [ ] Test: `src/modules/inventory/entity/inventory-log.spec.ts` created
- [ ] Tests fail

**GREEN Phase**:
- [ ] InventoryLog entity fields:
  - id, inventory_id (FK to Inventory)
  - variant_id (FK to ProductVariant) - denormalized for easier queries
  - warehouse_id (FK to Warehouse) - denormalized
  - action_type: enum ('sale', 'restock', 'adjustment', 'return', 'transfer_in', 'transfer_out')
  - quantity_change: number - positive or negative
  - quantity_before: number
  - quantity_after: number
  - reference_id: number (nullable) - order_id, transfer_id, etc.
  - reference_type: string (50, nullable) - 'order', 'transfer', 'manual'
  - notes: text (nullable)
  - performed_by: string (100, nullable) - user or system
  - created_at
- [ ] Relationships defined
- [ ] Tests pass

**REFACTOR Phase**:
- [ ] Add indexes: inventory_id, variant_id, action_type, created_at
- [ ] Add check constraint: quantity_before + quantity_change = quantity_after
- [ ] Tests still pass

**Commit**: YES
- Message: `feat(inventory): add InventoryLog for audit trail`

---

### Task 18: Generate Migrations & Integration Tests

**What to do**:
- Generate TypeORM migrations from all entities
- Create integration tests for critical relationships
- Verify end-to-end schema works

**Must NOT do**:
- NO seed data (just structure)
- NO performance benchmarking yet

**Recommended Agent Profile**:
- **Category**: `unspecified-high`
- **Skills**: N/A

**Parallelization**:
- **Can Run In Parallel**: NO (final task)
- **Parallel Group**: Wave 5
- **Blocks**: None (final)
- **Blocked By**: All previous tasks

**Acceptance Criteria**:

**Migration Generation**:
- [ ] Run: `npm run migration:generate -- src/migrations/InitialEcommerceSchema`
- [ ] Migration file created in `src/migrations/`
- [ ] Review migration for: all tables, indexes, foreign keys, constraints

**Integration Tests**:
- [ ] Create `src/database/integration.spec.ts`:
  - Test: Create category → product → variant chain works
  - Test: Create warehouse → inventory chain works
  - Test: Create user → cart → cart_item chain works
  - Test: Create order → order_item with product snapshot works
  - Test: User behavior log captures session data
- [ ] All integration tests pass: `npm test -- integration.spec.ts`

**Migration Verification**:
- [ ] Run: `npm run migration:run`
- [ ] Expected: All migrations execute successfully
- [ ] Verify: Check database tables exist with `
  ```bash
  docker exec mysql mysql -u root -p -e "USE fashion_ecommerce; SHOW TABLES;"
  ```
  Or via MySQL client
- [ ] Expected: 18+ tables created

**Full Test Suite**:
- [ ] Run: `npm test`
- [ ] Expected: All tests pass (36+ test files)

**Entity Loading**:
- [ ] Update `src/config/load-entities.ts` to include all new entities
- [ ] Verify: `npm run dev` starts without errors

**Commit**: YES
- Message: `feat(database): generate initial migration and integration tests`
- Files:
  - `src/migrations/InitialEcommerceSchema.ts`
  - `src/database/integration.spec.ts`
  - Updated `src/config/load-entities.ts`

---

## Commit Strategy

| Wave | Tasks | Commit Message | Files |
|------|-------|----------------|-------|
| 1 | 1, 2, 3, 4 | `feat(entities): add core product and inventory base entities` | Category, Product, Brand, Warehouse, UserSession + tests |
| 2 | 5, 6, 7, 8 | `feat(entities): add variants, images, inventory, and cart` | ProductVariant, ProductImage, Inventory, Cart/Items + tests |
| 3 | 9, 10, 11, 12, 13 | `feat(entities): add orders, reviews, wishlist, and promotions` | Order system, Reviews, Wishlist, Promotions + tests |
| 4 | 14, 15, 16 | `feat(ai): add recommendation data tables` | Behavior logs, Product features, Recommendation cache + tests |
| 5 | 17 | `feat(inventory): add inventory audit logging` | InventoryLog + tests |
| 5 | 18 | `feat(database): initial migration and integration tests` | Migration file, integration tests, entity loader |

---

## Success Criteria

### Verification Commands

```bash
# Run all tests
npm test
# Expected: 50+ tests pass

# Generate migration
npm run migration:generate -- src/migrations/InitialEcommerceSchema
# Expected: Migration file created

# Apply migration
npm run migration:run
# Expected: All migrations execute successfully

# Verify database
mysql -u root -p fashion_ecommerce -e "SHOW TABLES;"
# Expected: 18+ tables including:
# - categories, products, brands, product_variants, product_images
# - warehouses, inventory, inventory_logs
# - carts, cart_items, orders, order_items, order_status_history
# - reviews, review_helpful, wishlist_items
# - promotions, promotion_usage
# - user_sessions, user_behavior_logs, product_features, recommendation_cache

# Start app
npm run dev
# Expected: Server starts without TypeORM errors
```

### Final Checklist
- [ ] All 18 entity files created with TypeORM decorators
- [ ] All entity relationships properly defined
- [ ] All test files created (36+ .spec.ts files)
- [ ] All tests pass
- [ ] Migration file generated successfully
- [ ] Migration applies cleanly to database
- [ ] All tables created with correct structure
- [ ] App starts without errors
- [ ] Entity loader includes all entities

### AI-Readiness Checklist
- [ ] UserBehaviorLog captures: views, clicks, cart, purchases, searches
- [ ] ProductFeature stores: category, style, occasion, season, pattern, fabric
- [ ] RecommendationCache has: user/product context, recommendation type, scores
- [ ] All tables have proper indexes for AI query patterns
- [ ] Foreign keys enable JOIN queries for recommendation algorithms

---

## Schema Overview (Quick Reference)

### Core Commerce
- **categories** (hierarchical)
- **brands**
- **products** → categories, brands
- **product_variants** → products (size, color, material)
- **product_images** → products, product_variants

### Inventory
- **warehouses**
- **inventory** → product_variants, warehouses
- **inventory_logs** → inventory (audit trail)

### Shopping & Orders
- **carts** → users (nullable), user_sessions (nullable)
- **cart_items** → carts, product_variants
- **orders** → users, carts (nullable)
- **order_items** → orders, product_variants
- **order_status_history** → orders

### Engagement
- **reviews** → products, users, order_items
- **review_helpful** → reviews, users
- **wishlist_items** → users, product_variants
- **promotions**
- **promotion_usage** → promotions, orders, users

### AI & Recommendations
- **user_sessions** → users (nullable)
- **user_behavior_logs** → user_sessions, users, products, variants
- **product_features** → products (AI-friendly attributes)
- **recommendation_cache** → users (nullable), products (nullable)

---

## Next Steps After This Plan

1. Run `/start-work` to begin execution
2. Sisyphus will execute tasks in parallel waves
3. Each entity will be created with TDD (test first)
4. Final migration will tie everything together
5. You'll have a production-ready schema for fashion e-commerce with AI integration
