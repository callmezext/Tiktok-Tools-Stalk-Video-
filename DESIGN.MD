# DESIGN.MD — Unified Multi-Role Design System

> **Project Rune** — Complete design token reference and component specification.
> Covers BOTH the RUNE Core scraper UI (vanilla CSS) AND the RuneClipy platform (Tailwind v4).

---

## 🎨 Token-Based Color Palette

### Brand Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--accent` | `#8B5CF6` | Primary brand / CTAs / active states |
| `--accent-light` | `#A78BFA` | Hover states, gradient endpoints, inline links |
| `--accent-dark` | `#7C3AED` / `#6D28D9` | Button pressed states, gradient start |
| `--pink` | `#EC4899` | Secondary accent / gradient pairs / CTA variants |
| `--pink-dark` | `#DB2777` | Pink pressed state |
| `--tiktok-cyan` | `#25F4EE` | TikTok-specific accent (profile card ring) |
| `--tiktok-red` | `#FE2C55` | TikTok-specific accent (banner gradient) |

### Surface Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0B0E14` / `#0A0A0F` | App background |
| `--bg-secondary` | `#111827` / `#12121A` | Cards, sidebars, overlays |
| `--bg-tertiary` | `#1F2937` | Hover backgrounds, input focus rings |
| `--bg-glass` | `rgba(17,24,39,0.8)` | Glassmorphism cards |

### Text Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#F9FAFB` / `#F0F0F5` | Headings, primary content |
| `--text-secondary` | `#9CA3AF` / `#8B8BA3` | Body text, descriptions |
| `--text-muted` | `#6B7280` / `#5A5A72` | Labels, timestamps, captions |

### Border Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--border` | `#1E293B` | Default border |
| `--border-hover` | `#374151` | Hover/focus border |
| `--border-glass` | `rgba(255,255,255,0.06)` | Glass card borders |

### Status Colors (Dashboard)
| Token | Hex | Context |
|-------|-----|---------|
| `--success` | `#10B981` | Approved, active, online, verified |
| `--warning` | `#F59E0B` | Pending, paused, needs attention |
| `--error` | `#EF4444` | Rejected, banned, errors, danger actions |
| `--info` | `#3B82F6` | Informational, neutral highlights |

---

## 📐 Spacing Rules (Dual-Mode)

### User-Facing Views (Landing, Auth, Campaign Detail)
- **Base unit**: 8px
- **Section padding**: 48-96px vertical, 24-48px horizontal
- **Card padding**: 24-48px
- **Element gaps**: 12-24px
- **Typography breathing room**: generous `line-height: 1.5-1.7`
- **Max content width**: 1280px (7xl)

### Admin/Dashboard Views (High-Density)
- **Base unit**: 4px
- **Section padding**: 16-32px
- **Card padding**: 16-24px
- **Table cell padding**: 10-16px
- **Element gaps**: 4-12px
- **Typography**: compact `line-height: 1.3-1.5`
- **Max content width**: 1400px
- **Grid system**: CSS Grid with `repeat(auto-fit, minmax(240px, 1fr))` for responsive stat cards

---

## 🔤 Typography Scale

### Font Stack
```
Primary: Inter (weights: 300, 400, 500, 600, 700, 800, 900)
Monospace: JetBrains Mono (weights: 400, 600)
```

### Scale (User-Facing)
| Element | Size | Weight | Tracking |
|---------|------|--------|----------|
| Hero H1 | 48-72px | 800 (extrabold) | -0.02em |
| Section H2 | 30-36px | 800 | -0.01em |
| Card H3 | 18-20px | 700 | normal |
| Body | 16px | 400 | normal |
| Caption | 12-14px | 400-500 | 0.01em |
| Badge | 11px | 600 | 0.05em (uppercase) |

### Scale (Admin)
| Element | Size | Weight | Tracking |
|---------|------|--------|----------|
| Page Title | 24px | 800 | -0.3px |
| Section Title | 14-16px | 700 | normal |
| Stat Value | 20-28px | 800 | tight |
| Table Header | 10px | 600 | 1px (uppercase) |
| Table Body | 13px | 400 | normal |
| Button | 12px | 600 | normal |
| Micro Label | 9-10px | 500-600 | 0.5-1.5px (uppercase) |

---

## 🧩 Component Specifications

### Buttons

| Variant | Class | Background | Text | Border Radius |
|---------|-------|------------|------|---------------|
| Primary | `.btn-gradient` | `linear-gradient(135deg, accent, accent-dark)` | White | 12px |
| Pink | `.btn-pink` | `linear-gradient(135deg, pink, pink-dark)` | White | 12px |
| Admin Success | `.admin-btn--success` | `success/15` | Success | 10px |
| Admin Danger | `.admin-btn--danger` | `error/15` | Error | 10px |
| Admin Warning | `.admin-btn--warning` | `warning/15` | Warning | 10px |
| Admin Ghost | `.admin-btn--ghost` | `bg-tertiary` | Text-secondary | 10px |

**Interaction**: All buttons have shimmer sweep on hover (`::before` pseudo), `translateY(-1px)` lift, and subtle box-shadow expansion.

### Cards

| Variant | Background | Blur | Border | Radius | Hover |
|---------|-----------|------|--------|--------|-------|
| Glass Card | `bg-card (rgba)` | `blur(16-20px)` | `1px solid border` | 16px | Border brightens, subtle shadow |
| Admin Stat Card | `bg-card` | none | `1px solid border` | 16px | `translateY(-2px)`, gradient top-bar reveal |

### Badges
- Pill shape: `border-radius: 20px`
- Padding: `4px 10px`
- Font: `11px / 600 / uppercase / 0.5px tracking`
- Variants: `badge-music`, `badge-clipping`, `badge-logo`, `badge-ugc`, `badge-active`, `badge-paused`, `badge-ended`

### Empty States
- Centered layout, 60px vertical padding
- Large emoji icon (48px, 60% opacity)
- Muted text description (14px)
- Optional CTA button

### Skeleton/Shimmer Loading
- Animated gradient sweep: `bg-tertiary → lighter → bg-tertiary`
- 1.5s infinite loop
- Applied via `.admin-shimmer` class
- Match shape of content being loaded

### Modals (Planned)
- Centered overlay with `bg-black/60` backdrop
- Glass card body, max-width 480px
- Close button top-right
- Animated entrance: `fadeInUp 0.3s`

### Status Indicators
- Dot: 8px circle with status color
- Active states get `box-shadow` glow pulse
- Pending states get opacity pulse animation

### Tables
- Sticky header (implementation needed in admin views)
- Alternating hover: `bg-primary/30`
- Horizontal scroll wrapper on mobile with `-webkit-overflow-scrolling: touch`
- Min-width: 600px for complex tables

---

## 🖥️ Responsive Breakpoints

| Breakpoint | Target | Key Changes |
|------------|--------|-------------|
| `≤480px` | Small phones | Compact padding, smaller fonts, full-width buttons |
| `≤768px` | Phones/small tablets | Mobile sidebar overlay, card-based table view, stacked grids |
| `≤1024px` | Tablets | Reduced stat card padding |
| `≥1025px` | Desktop | Full sidebar, multi-column grids |

---

## ✅ Anti-AI Slop Checklist

Every component and page MUST pass these checks:

### Layout
- [ ] **No orphan white space** — every gap serves visual hierarchy
- [ ] **No arbitrary 3-card hero** — stat cards must display real, useful data
- [ ] **No massive useless charts** — charts show real data density with tooltips
- [ ] **Grid columns are justified** — no random `grid-cols-3` on 2-item arrays

### Visual
- [ ] **No plain red/blue/green** — use the curated palette above
- [ ] **No browser-default fonts** — Inter or JetBrains Mono only
- [ ] **No flat unstyled buttons** — use gradient/ghost/status variants
- [ ] **No unstyled scrollbars** — custom scrollbar CSS applied globally

### Interactive
- [ ] **Hover states defined** — every clickable element changes on hover
- [ ] **Loading states exist** — shimmer skeletons, not blank screens
- [ ] **Empty states designed** — meaningful message + optional action, not `null`
- [ ] **Error states visible** — styled error messages, not `console.log` only

### Admin Specific
- [ ] **Tables have sticky headers** (to implement)
- [ ] **Filter tabs present** where data exceeds 10 items
- [ ] **Batch actions available** for list views (to implement)
- [ ] **Data density prioritized** — avoid wasting space on decorative elements

### Mobile
- [ ] **Touch targets ≥44px** — all interactive elements
- [ ] **No horizontal overflow** — test at 320px width
- [ ] **Sidebar collapses** to overlay with backdrop
- [ ] **Tables convert** to card layout or horizontal scroll

---

*Last updated: 2026-05-19*
