# Decisions - Cart & Profile UI

## Architectural Choices

*This file tracks key architectural and design decisions made during implementation.*

---

## Phase 1: Interface Definition - 2026-01-30T07:45

### Decision 1: Types Organization Strategy
**Context**: Need to enable parallel development without merge conflicts.

**Decision**: Split types into domain-specific files:
- `cart.types.ts` - Cart and CartItem types
- `auth.types.ts` - User, AuthResponse, enums
- `order.types.ts` - Order and OrderItem types
- `index.ts` - Re-exports all types

**Rationale**: Each team can work in their own type file, reducing conflicts.

---

### Decision 2: Cart Persistence Strategy
**Context**: User closes browser, cart should persist.

**Decision**: Hybrid localStorage + API sync
- localStorage as primary storage (survives browser close)
- API sync on operations (when user is authenticated)
- Optimistic updates (UI first, then API)

**Rationale**: Best UX - cart never lost, even if API fails.

---

### Decision 3: Guest Checkout
**Context**: Should non-logged-in users be able to checkout?

**Decision**: NO - Must login before checkout

**Rationale**: Simplifies implementation, backend requires user ID for orders.

---

### Decision 4: Header Integration Ownership
**Context**: Both Cart and Profile teams need Header changes.

**Decision**: Profile team owns Header.tsx integration

**Rationale**: Profile team handles auth state, which is primary Header dependency.

---

