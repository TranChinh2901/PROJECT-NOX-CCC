# Decisions - fix-phone-number-registration

## Technical Decisions
- Wave 1: Execute Tasks 1 & 2 in parallel (independent file edits)
- Wave 2: Sequential verification after both DTOs updated
## [2026-01-31] Architectural Decisions

### Decision 1: Validation Middleware Remains Disabled
**Context**: Validation middleware is commented out at `auth/index.ts:13`

**Decision**: DO NOT enable validation middleware as part of this fix

**Rationale**:
- This is an infrastructure-level decision outside the scope of DTO type alignment
- Enabling it may have broader implications for other endpoints
- The DTO type fix achieves the core objective: preventing type mismatches
- Frontend TypeScript now enforces phone_number at compile time

**Consequences**:
- Missing phone_number returns HTTP 500 (DB error) instead of HTTP 400 (validation error)
- This is acceptable for the current scope
- Can be addressed separately if needed

### Decision 2: Skeleton Components Over Simple Spinners
**Context**: Multiple loading states using simple spinners or pulse divs

**Decision**: Create dedicated skeleton components matching actual page structure

**Rationale**:
- Better UX: Shows content structure while loading
- Professional appearance: Matches modern web standards
- Reusability: Components can be used across multiple pages
- Performance: No layout shift when content loads

**Implementation**:
- Base Skeleton component with Tailwind animate-pulse
- Page-specific skeletons (Profile, Orders, Addresses)
- Generic PageSkeleton for simple layouts

### Decision 3: Consistent Header/Footer Pattern
**Context**: Some account pages had Header/Footer, others didn't

**Decision**: Standardize all account pages with Header/Footer wrapper and pt-32 padding

**Rationale**:
- Consistent navigation experience across all pages
- Fixed header requires consistent spacing to prevent content overlap
- Users expect persistent navigation elements

**Pattern Established**:
```tsx
<>
  <Header />
  <div className="min-h-screen ... pt-32">
    {/* Page content */}
  </div>
  <Footer />
</>
```
