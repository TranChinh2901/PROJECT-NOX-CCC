# TechNova Premium Landing Page - Parallel Task Graph

## Project Overview
**Stack:** Next.js 16.1.4 + Tailwind v4 + React 19 + TypeScript  
**Design System:** Liquid Glass (translucent layers, morphing elements, 400-600ms animations)  
**Pattern:** Horizontal Scroll Journey  
**Fonts:** Cormorant (headings) + Montserrat (body)  
**Colors:** #1C1917 (primary dark), #CA8A04 (gold accent), #FAFAF9 (background), #0C0A09 (text)

---

## Parallel Execution Waves

### **WAVE 1: Foundation Setup** (Can Start Immediately)
**Duration Estimate:** 45-60 minutes  
**Dependencies:** None - All tasks in this wave can run in parallel

| Task ID | Task Name | Category + Skills | Deliverable | File Path | Success Criteria |
|---------|-----------|-------------------|-------------|-----------|------------------|
| **T1.1** | Install & Configure Fonts | `frontend-ui-ux` | Font configuration in layout.tsx | `/src/app/layout.tsx` | Cormorant + Montserrat loaded, no Geist imports |
| **T1.2** | Set Up Tailwind v4 Theme | `visual-engineering` + `tailwind` | Tailwind config with custom theme | `/src/app/globals.css` | CSS variables for colors, backdrop-filter utilities |
| **T1.3** | Create Animation Utilities | `visual-engineering` + `framer-motion` | Animation constants and helpers | `/src/lib/animations.ts` | 400-600ms curves, prefers-reduced-motion hooks |
| **T1.4** | Install Icon Library | `frontend-ui-ux` | Lucide React icons installed | `package.json` | `lucide-react` in dependencies |

**Wave 1 Acceptance Criteria:**
- [ ] Layout.tsx exports fonts correctly with Cormorant and Montserrat
- [ ] globals.css has all CSS variables and Tailwind v4 theme config
- [ ] Animation utilities export: `transition-smooth`, `transition-liquid`, `useReducedMotion()`
- [ ] `lucide-react` added to package.json

---

### **WAVE 2: Base Components** (Starts After Wave 1 completes)
**Duration Estimate:** 90-120 minutes  
**Dependencies:** Wave 1 must complete

| Task ID | Task Name | Category + Skills | Deliverable | File Path | Success Criteria |
|---------|-----------|-------------------|-------------|-----------|------------------|
| **T2.1** | GlassCard Component | `frontend-ui-ux` + `visual-engineering` | Reusable glass card | `/src/components/ui/GlassCard.tsx` | Backdrop-blur, translucent bg, hover lift |
| **T2.2** | LiquidButton Component | `frontend-ui-ux` | Reusable button variants | `/src/components/ui/LiquidButton.tsx` | Primary (gold), Secondary (outline), Ghost variants |
| **T2.3** | ProductCard Component | `frontend-ui-ux` | Product showcase card | `/src/components/ui/ProductCard.tsx` | Image, title, specs overlay, hover animation |
| **T2.4** | Section Container | `frontend-ui-ux` | Reusable section wrapper | `/src/components/ui/Section.tsx` | Responsive padding, max-width, glass background option |
| **T2.5** | Value Block Component | `frontend-ui-ux` | Value proposition block | `/src/components/ui/ValueBlock.tsx` | Icon, title, description, glass styling |
| **T2.6** | CTA Button Component | `frontend-ui-ux` | Members-only CTA | `/src/components/ui/MembersCTA.tsx` | Gold accent, glow effect, pulse animation |

**Wave 2 Acceptance Criteria:**
- [ ] GlassCard: Backdrop-blur working, translucent background rgba(255,255,255,0.1), hover: translateY(-4px)
- [ ] LiquidButton: 3 variants, cursor-pointer, 200ms transitions, no layout shift on hover
- [ ] ProductCard: Image with overlay gradient, specs text, hover scale(1.02)
- [ ] Section: Responsive padding (py-16 md:py-24), glass:bg-white/5 backdrop-blur-md option
- [ ] ValueBlock: Icon + title + description, centered, glass effect
- [ ] MembersCTA: Gold #CA8A04 bg, text-white, glow shadow on hover, pulse border animation

---

### **WAVE 3: Layout Components** (Starts After Wave 1 completes)
**Duration Estimate:** 60-75 minutes  
**Dependencies:** Wave 1 must complete, can parallel with Wave 2

| Task ID | Task Name | Category + Skills | Deliverable | File Path | Success Criteria |
|---------|-----------|-------------------|-------------|-----------|------------------|
| **T3.1** | Floating Navbar | `frontend-ui-ux` + `visual-engineering` | Header with glass effect | `/src/components/layout/Header.tsx` | Fixed position, backdrop-blur, logo, nav items |
| **T3.2** | Footer | `frontend-ui-ux` | Premium footer | `/src/components/layout/Footer.tsx` | Logo, links, social icons, glass styling |
| **T3.3** | Responsive Hook | `frontend-ui-ux` | Breakpoint detection | `/src/hooks/useMediaQuery.ts` | Mobile/tablet/desktop detection |
| **T3.4** | Scroll Progress | `visual-engineering` | Horizontal scroll indicator | `/src/components/ui/ScrollProgress.tsx` | Progress bar for horizontal scroll section |

**Wave 3 Acceptance Criteria:**
- [ ] Header: Fixed top-0, z-50, bg-black/80 backdrop-blur-xl, logo (TechNova text), 3 nav items, mobile menu
- [ ] Footer: bg-[#1C1917], 4-column layout, social icons (Lucide), copyright text
- [ ] useMediaQuery: Returns { isMobile, isTablet, isDesktop } based on breakpoints
- [ ] ScrollProgress: Width 0-100% based on horizontal scroll position

---

### **WAVE 4: Section Components** (Starts After Wave 2 & 3 complete)
**Duration Estimate:** 120-150 minutes  
**Dependencies:** Wave 2 and Wave 3 must complete

| Task ID | Task Name | Category + Skills | Deliverable | File Path | Success Criteria |
|---------|-----------|-------------------|-------------|-----------|------------------|
| **T4.1** | Hero Section | `artistry` + `visual-engineering` | Cinematic hero | `/src/components/sections/HeroSection.tsx` | Full viewport, product carousel, glass overlay, CTA |
| **T4.2** | Product Showcase Section | `artistry` + `frontend-ui-ux` | Products grid | `/src/components/sections/ProductsSection.tsx` | Laptops, smartphones, desktops showcase |
| **T4.3** | Horizontal Scroll Container | `visual-engineering` | Scrollable track | `/src/components/sections/HorizontalScroll.tsx` | GSAP/Framer horizontal scroll implementation |
| **T4.4** | Storytelling Section | `artistry` | Product storytelling | `/src/components/sections/StorySection.tsx` | Layered animations, craft details, materials |
| **T4.5** | Values Section | `frontend-ui-ux` | Value propositions | `/src/components/sections/ValuesSection.tsx` | 3 value blocks: Tech, Quality, Exclusivity |
| **T4.6** | Craftsmanship Section | `artistry` | Materials showcase | `/src/components/sections/CraftSection.tsx` | Close-up imagery, layered glass panels |
| **T4.7** | Members CTA Section | `frontend-ui-ux` | Exclusive access CTA | `/src/components/sections/MembersSection.tsx` | Dark background, gold accents, form/email capture |

**Wave 4 Acceptance Criteria:**
- [ ] HeroSection: 100vh, animated product images, glass overlay panel, "Experience Tomorrow" headline
- [ ] ProductsSection: 3 product categories, hover reveals specs, morphing glass cards
- [ ] HorizontalScroll: Container with overflow-x-hidden, inner track 300vw width, smooth scrolling
- [ ] StorySection: Parallax layers, text reveals on scroll, material imagery with glass overlays
- [ ] ValuesSection: 3 cards in bento grid, icons (Lucide), glass backgrounds
- [ ] CraftSection: Large imagery, floating glass panels with specs, 400-600ms reveal animations
- [ ] MembersSection: Dark bg #0C0A09, gold #CA8A04 accents, email input + submit button, pulse glow

---

### **WAVE 5: Integration & Assembly** (Starts After Wave 4 completes)
**Duration Estimate:** 45-60 minutes  
**Dependencies:** All previous waves must complete

| Task ID | Task Name | Category + Skills | Deliverable | File Path | Success Criteria |
|---------|-----------|-------------------|-------------|-----------|------------------|
| **T5.1** | HomePage Assembly | `frontend-ui-ux` | Main page composition | `/src/components/user/about/HomePage.tsx` | All sections integrated in correct order |
| **T5.2** | User Page Route | `frontend-ui-ux` | Route page wrapper | `/src/app/(user)/page.tsx` | Proper imports, metadata, no errors |
| **T5.3** | Responsive Testing | `frontend-ui-ux` | Breakpoint fixes | Multiple files | 375px, 768px, 1024px, 1440px all working |
| **T5.4** | Accessibility Audit | `frontend-ui-ux` + `a11y` | A11y compliance | All files | 4.5:1 contrast, reduced-motion, focus states |
| **T5.5** | Animation Polish | `visual-engineering` | Final animations | Key section files | All animations 400-600ms, no jank |

**Wave 5 Acceptance Criteria:**
- [ ] HomePage: Header → Hero → Horizontal Scroll (Products + Story) → Values → Craft → Members → Footer
- [ ] All sections render without errors, no console warnings
- [ ] Responsive: Mobile (375px) stacks vertically, tablet (768px) 2-col, desktop (1024px+) full layout
- [ ] Accessibility: Tab navigation works, focus rings visible, prefers-reduced-motion disables animations
- [ ] Performance: 60fps animations, no layout shifts, images optimized

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                      WAVE 1: Foundation                      │
│  T1.1 Fonts  │  T1.2 CSS  │  T1.3 Animations  │  T1.4 Icons │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
┌────────▼─────────┐      ┌─────────▼──────────┐
│  WAVE 2: Base    │      │   WAVE 3: Layout   │
│    Components    │      │    Components      │
│ T2.1-T2.6        │      │ T3.1-T3.4          │
└────────┬─────────┘      └─────────┬──────────┘
         │                          │
         └──────────┬───────────────┘
                    │
┌───────────────────▼──────────────────────────────────────────┐
│                    WAVE 4: Sections                           │
│  T4.1 Hero │ T4.2 Products │ T4.3 H-Scroll │ T4.4 Story      │
│  T4.5 Values │ T4.6 Craft │ T4.7 Members                    │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                    WAVE 5: Integration                        │
│   T5.1 Assembly → T5.2 Route → T5.3 Responsive → T5.4 A11y   │
└──────────────────────────────────────────────────────────────┘
```

---

## Critical Path Analysis

**Critical Path (longest chain):**
```
T1.2 (CSS Setup) → T2.1 (GlassCard) → T4.1 (Hero) → T5.1 (Assembly) = ~5.5 hours
```

**Parallel Speedup:**
- Sequential estimate: ~8 hours
- Parallel estimate: ~5.5 hours
- **Speedup: 31% faster**

---

## Task Details by Category

### **Visual Engineering Tasks** (T1.2, T1.3, T3.1, T4.1, T4.3, T4.6, T5.5)
- **Category:** `visual-engineering`
- **Skills Required:** 
  - CSS backdrop-filter and glassmorphism
  - Framer Motion / GSAP for animations
  - CSS custom properties
  - Performance optimization (will-change, transform)

### **Frontend UI/UX Tasks** (T1.1, T1.4, T2.1-T2.6, T3.2, T3.3, T3.4, T4.2, T4.5, T4.7, T5.1-T5.4)
- **Category:** `frontend-ui-ux`
- **Skills Required:**
  - React + TypeScript
  - Tailwind v4
  - Next.js 16
  - Accessibility (a11y)
  - Lucide icons
  - Responsive design

### **Artistry Tasks** (T4.1, T4.2, T4.4, T4.6)
- **Category:** `artistry`
- **Skills Required:**
  - Visual design implementation
  - Animation choreography
  - Typography hierarchy
  - Color theory application

---

## File Structure

```
/src
├── app
│   ├── (user)
│   │   └── page.tsx                    # T5.2
│   ├── layout.tsx                      # T1.1 (updated)
│   └── globals.css                     # T1.2 (updated)
├── components
│   ├── layout
│   │   ├── Header.tsx                  # T3.1
│   │   └── Footer.tsx                  # T3.2
│   ├── sections
│   │   ├── HeroSection.tsx             # T4.1
│   │   ├── ProductsSection.tsx         # T4.2
│   │   ├── HorizontalScroll.tsx        # T4.3
│   │   ├── StorySection.tsx            # T4.4
│   │   ├── ValuesSection.tsx           # T4.5
│   │   ├── CraftSection.tsx            # T4.6
│   │   └── MembersSection.tsx          # T4.7
│   ├── ui
│   │   ├── GlassCard.tsx               # T2.1
│   │   ├── LiquidButton.tsx            # T2.2
│   │   ├── ProductCard.tsx             # T2.3
│   │   ├── Section.tsx                 # T2.4
│   │   ├── ValueBlock.tsx              # T2.5
│   │   ├── MembersCTA.tsx              # T2.6
│   │   └── ScrollProgress.tsx          # T3.4
│   └── user
│       └── about
│           └── HomePage.tsx            # T5.1 (updated)
├── hooks
│   └── useMediaQuery.ts                # T3.3
└── lib
    ├── animations.ts                   # T1.3
    └── utils.ts                        # (utility functions)
```

---

## Design System Compliance Checklist

### Colors (Wave 1-2)
- [ ] Primary: #1C1917 (dark stone)
- [ ] Accent/CTA: #CA8A04 (gold)
- [ ] Background: #FAFAF9 (warm white)
- [ ] Text: #0C0A09 (near black)

### Typography (Wave 1)
- [ ] Headings: Cormorant (400, 500, 600, 700)
- [ ] Body: Montserrat (300, 400, 500, 600, 700)

### Animations (Wave 1, 5)
- [ ] All transitions: 400-600ms
- [ ] Curves: cubic-bezier(0.4, 0, 0.2, 1) for smooth
- [ ] prefers-reduced-motion: Disable animations

### Glass Effects (Wave 2)
- [ ] Backdrop-blur: blur(8px) to blur(24px)
- [ ] Background: rgba(255, 255, 255, 0.05) to rgba(255, 255, 255, 0.15)
- [ ] Border: 1px solid rgba(255, 255, 255, 0.1)

### Anti-Patterns (All Waves)
- [ ] No emojis (use Lucide icons)
- [ ] cursor-pointer on all interactive elements
- [ ] No layout-shifting hovers
- [ ] 4.5:1 text contrast minimum
- [ ] Visible focus states

### Responsiveness (Wave 5)
- [ ] 375px: Mobile stacked
- [ ] 768px: Tablet 2-column
- [ ] 1024px: Desktop full
- [ ] 1440px: Large desktop

---

## Section Content Specifications

### Hero Section (T4.1)
- **Headline:** "Experience Tomorrow, Today"
- **Subheadline:** "Cutting-edge technology that transcends boundaries"
- **CTA:** "Discover Collection" (LiquidButton primary)
- **Background:** Cinematic product imagery with glass overlay

### Products Section (T4.2)
**Categories:**
1. **Laptops** - "Mobile Powerhouses"
2. **Smartphones** - "Pocket Revolution"
3. **Desktops** - "Ultimate Performance"

Each card: Product image, name, key specs, "Explore" link

### Horizontal Scroll (T4.3)
**Track Content:**
- Section 1: Product lineup showcase
- Section 2: Innovation highlights
- Section 3: Craftsmanship close-ups
- Section 4: Testimonials

### Values Section (T4.5)
**Three Value Blocks:**
1. **Advanced Technology** - "Pioneering the impossible"
2. **Uncompromising Quality** - "Crafted to perfection"
3. **Exclusive Access** - "For the select few"

### Members Section (T4.7)
- **Headline:** "Join the Inner Circle"
- **Description:** "Early access to limited editions and private offers"
- **Form:** Email input + "Join Now" button
- **Background:** Dark gradient with gold glow accents

---

## Implementation Notes

### Tailwind v4 Configuration
Tailwind v4 uses CSS-first configuration. Update globals.css:

```css
@import "tailwindcss";

@theme {
  --color-primary: #1C1917;
  --color-accent: #CA8A04;
  --color-background: #FAFAF9;
  --color-text: #0C0A09;
  
  --font-heading: 'Cormorant', serif;
  --font-body: 'Montserrat', sans-serif;
}
```

### Horizontal Scroll Implementation
Use Framer Motion with useScroll and useTransform:

```typescript
const { scrollYProgress } = useScroll({
  target: containerRef,
  offset: ["start start", "end end"]
});

const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);
```

### Glassmorphism Pattern
```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Animation Timing
```typescript
const transitions = {
  smooth: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  liquid: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
};
```

---

## Success Metrics

### Visual Quality
- [ ] All glass effects render correctly (backdrop-filter working)
- [ ] Animations run at 60fps
- [ ] No layout shift on page load
- [ ] Typography hierarchy clear and premium

### Technical Quality
- [ ] Zero TypeScript errors
- [ ] Zero ESLint warnings
- [ ] All components typed correctly
- [ ] No console errors in browser

### Accessibility
- [ ] 100% keyboard navigable
- [ ] All images have alt text
- [ ] Focus indicators visible
- [ ] Reduced motion respected

### Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1

---

## Agent Dispatch Summary

| Wave | Tasks | Recommended Agent | Parallelization |
|------|-------|-------------------|-----------------|
| 1 | T1.1-T1.4 | 1 agent, all parallel | Yes |
| 2 | T2.1-T2.6 | 2-3 agents | Yes (subdivide) |
| 3 | T3.1-T3.4 | 1-2 agents | Yes |
| 4 | T4.1-T4.7 | 3-4 agents | Yes (subdivide) |
| 5 | T5.1-T5.5 | 1-2 agents | Sequential integration |

**Recommended Workflow:**
1. Dispatch Wave 1 tasks to single agent (foundation setup)
2. Upon Wave 1 completion, dispatch Waves 2 & 3 in parallel (multiple agents)
3. Upon Waves 2 & 3 completion, dispatch Wave 4 (section development)
4. Upon Wave 4 completion, dispatch Wave 5 (integration & polish)

**Estimated Total Time:** 5.5-6 hours (parallel) vs 8 hours (sequential)
