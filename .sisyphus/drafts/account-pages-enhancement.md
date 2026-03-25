# Draft: Account Pages Enhancement

## Requirements (confirmed)

### TASK 1: Fix Header Navbar Hover Issue
- **Problem**: Dropdown disappears when moving cursor from username button to dropdown menu
- **Root cause**: `mt-2` gap (8px) between button and dropdown in Header.tsx:102
- **Current implementation**: `onMouseEnter/onMouseLeave` on wrapper div (lines 71-74)
- **Solution**: Add padding bridge or restructure mouse events to cover the gap

### TASK 2: Add Header/Footer to Account Pages
- **Files to modify**:
  - `/recommendation_client/src/app/(user)/account/profile/page.tsx`
  - `/recommendation_client/src/app/(user)/account/profile/edit/page.tsx`
  - `/recommendation_client/src/app/(user)/account/orders/page.tsx`
  - `/recommendation_client/src/app/(user)/account/addresses/page.tsx`
  - `/recommendation_client/src/app/(user)/account/forgot-password/page.tsx`
- **Action**: Import Header/Footer, wrap content, add `pt-32` padding

### TASK 3: Create Skeleton Loading Components
- **Location**: `/recommendation_client/src/components/common/`
- **Components to create**:
  1. `Skeleton.tsx` - Base component with pulse animation
  2. `PageSkeleton.tsx` - Full page skeleton
  3. `ProfileSkeleton.tsx` - Profile page specific
  4. `OrdersSkeleton.tsx` - Orders page specific  
  5. `AddressesSkeleton.tsx` - Addresses page specific
- **Pattern**: Use Tailwind's `animate-pulse` class

### TASK 4: Apply Skeleton Loading
- Replace spinner/simple loading states with skeleton components
- Apply to all 5 account pages

## Technical Decisions

- **Hover fix approach**: Use `pb-2` on button container + negative margin on dropdown to bridge gap
- **Skeleton animation**: Use Tailwind's `animate-pulse` (consistent with existing patterns in orders page)
- **Export pattern**: Add exports to `components/common/index.ts`
- **No layout.tsx creation**: Direct page modifications as requested (simpler, explicit)

## Research Findings

### Header.tsx Current State (lines 71-137)
```tsx
<div 
  className="hidden sm:flex relative"
  onMouseEnter={() => setShowUserDropdown(true)}
  onMouseLeave={() => setShowUserDropdown(false)}
>
  <button>...</button>
  {showUserDropdown && (
    <div className="absolute top-full right-0 mt-2 ...">
      // Dropdown content - mt-2 creates the gap!
    </div>
  )}
</div>
```

### Existing Loading Patterns
- ProfilePage: Spinner (`animate-spin`) - lines 13-18
- EditProfilePage: Spinner - lines 52-58
- OrdersPage: `animate-pulse` bars - lines 78-88
- AddressesPage: No explicit loading (relies on user state)
- ForgotPasswordPage: Button loading state only

## Scope Boundaries

### INCLUDE
- Header dropdown hover fix
- Header/Footer wrapper for 5 account pages
- 5 new skeleton components
- Loading state replacement in pages
- Update index.ts exports

### EXCLUDE
- Creating account layout.tsx (not requested)
- Modifying login/signup pages (not in list)
- Adding Next.js loading.tsx files (page-level approach)
- Mobile menu hover issues (desktop only mentioned)

## Open Questions
- None - all requirements clear from user's specification

## Dependency Analysis

```
Task 1 (Header Fix)     ──┐
                          ├──> Wave 1 (Parallel)
Task 3 (Create Skeletons) ┘
                          │
                          ▼
Task 2 (Add Header/Footer) ──> Wave 2 (Parallel)  
Task 4 (Apply Skeletons)   ──┘
```

Note: Task 4 depends on Task 3 (must have skeletons before applying them)
      Task 2 depends on Header/Footer existing (they do)
