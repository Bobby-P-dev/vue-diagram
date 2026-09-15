---
name: canvas-ui-builder
description: Guide and patterns for creating, extending, and maintaining modular AI UI Design frames and canvas sections (Web, Mobile, Desktop) in the visual workspace. Trigger when working on UI canvas generation, device mockup shells, UI section components (navbar, hero, kpi_grid, data_table, mobile wallet), or Tailwind/Vue code export.
---

# Canvas UI Builder Skill: Modular AI UI Design System

This skill provides comprehensive instructions for developing, modifying, and extending the AI UI Design module on the visual canvas.

## 1. System Philosophy & Strict Modularity

The platform hosts two distinct visual domains on the same Vue Flow canvas:
1. **Diagram Engine**: Nodes (`StartEndNode`, `ProcessNode`, `DecisionNode`, `DatabaseNode`, `SwimlaneLaneNode`) connected via directed edges.
2. **UI Design Engine**: Device frames (`UiFrameNode.vue`) rendering responsive UI sections with dual view (Preview & Tailwind/Vue Code).

**Strict Modularity Rule**:
- Never mix diagram logic with UI design logic.
- Keep backend services separate (`ui_design_service.go` vs `project_service.go`).
- Keep controllers separate (`ui_design_controller.go` vs `project_controller.go`).
- Keep frontend components separate (`src/components/ui-design/` vs `src/components/nodes/`).

---

## 2. Device Frames & Dimensions

Device frames are hosted as custom Vue Flow nodes with `type: "ui_frame"`.

| Device | Type | Width | Height | Shell Features |
|---|---|---|---|---|
| **Web** | `web` | 1024px | 720px | Browser Chrome, Traffic Lights, SSL URL bar, Preview/Code switch |
| **Mobile** | `mobile` | 375px | 812px | Smartphone bezel, Notch/Dynamic Island, Status bar, Home bar |
| **Desktop** | `desktop` | 1100px | 740px | Mac/Desktop App window, traffic lights, resolution pill |

In `useGraphLayout.js`, dimension detection must check:
```javascript
if (node.type === 'ui_frame') {
  const isMobile = String(node.data?.device || '').toLowerCase() === 'mobile'
  const w = Number(node.data?.width) || (isMobile ? 375 : 1024)
  const h = Number(node.data?.height) || (isMobile ? 812 : 720)
  return { width: w, height: h }
}
```

---

## 3. Section Component Registry

All UI frames render dynamic sections from `node.data.sections`. The component mapping in `UiFrameNode.vue` is:

```javascript
const SECTION_COMPONENTS = {
  // Navigation & Banners
  navbar: UiNavbarSection,
  announcement_bar: UiAnnouncementSection,

  // Hero & General
  hero: UiHeroSection,

  // Metrics & Data
  kpi_grid: UiKpiSection,
  data_table: UiTableSection,

  // Mobile App Dedicated
  mobile_status_bar: UiMobileStatusSection,
  balance_card: UiBalanceSection,
  asset_list: UiAssetListSection,
  mobile_bottom_nav: UiMobileNavSection,

  // Forms & Authentication
  form: UiFormSection,
  form_card: UiFormSection,
  auth_card: UiFormSection,
  login_card: UiFormSection,

  // Showcase & Value Props
  feature_grid: UiFeatureGridSection,
  features: UiFeatureGridSection,
  benefits: UiFeatureGridSection,

  // E-Commerce & Storefront
  product_grid: UiProductGridSection,
  products: UiProductGridSection,
  storefront: UiProductGridSection,
  catalog: UiProductGridSection,

  // Subscriptions & Plans
  pricing_table: UiPricingSection,
  pricing: UiPricingSection,
  plans: UiPricingSection,
}
```

---

## 4. Domain Archetypes Reasoning

To prevent disjointed or generic outputs, the AI reasoning engine classifies requests into:
1. **AUTH_FLOW**: Minimal `navbar` + `auth_card` (email, password, Google/GitHub OAuth, remember me, forgot password, CTA).
2. **ECOMMERCE_STOREFRONT**: `announcement_bar` (promo discount) + `navbar` (search, cart count) + `hero` + `product_grid` (real prices in IDR/USD, discount tags, ratings) + `feature_grid` (Free shipping, warranty, CS).
3. **SAAS_ANALYTICS_DASHBOARD**: `navbar` + `hero` / overview banner + `kpi_grid` (domain metrics) + `data_table` (status badges).
4. **FINTECH_CRYPTO_WALLET**: `mobile_status_bar` + `navbar` + `balance_card` + `asset_list` + `mobile_bottom_nav`.
5. **LANDING_PAGE**: `navbar` + `hero` + `feature_grid` + `pricing_table`.
6. **FORM_CHECKOUT_WORKFLOW**: `navbar` + `form_card` (structured inputs, payment method, order summary).

---

## 5. Anti-Slop & Design Token Standards

When creating templates or LLM prompts for UI Design:
1. **Contextual Realism**: Never use "Lorem ipsum dolor sit amet". Use realistic enterprise labels, metrics, and regional data (e.g. `ap-southeast-1`, `$124,500 MRR`, `6 / 6 Replicas`, `Rp 249.000`).
2. **Harmonious Palettes**: Use curated themes:
   - `Linear Dark`: `#0b0f19` surface with `#6366f1` indigo accent.
   - `Raycast Purple`: `#0f0d15` surface with `#a855f7` violet accent.
   - `Stripe Clean`: `#ffffff` surface with `#2563eb` blue accent and `#e2e8f0` crisp borders.
3. **Dual View**: Always provide clean Vue 3 + Tailwind CSS code in `code_export.vue` for 1-click developer handoff.

---

## 6. API Endpoints Reference

- `GET /api/ui-design/templates`: List all pre-designed UI templates.
- `POST /api/ui-design/generate`: Generate a new UI frame project from prompt, device, foundation, product context, and theme.
- `POST /api/ui-design/projects/{id}/chat`: Iteratively modify UI sections and styles via natural language.

---

## 7. 18-Step AI Product Designer & Frontend Architecture Framework

Never jump directly from:
`USER REQUEST → UI`

Always follow the 18-step reasoning chain:
1. **Requirement Analysis**: Explicit vs Strongly Implied vs Optional. Never invent business requirements.
2. **Product Context**: ERP, SaaS, CRM, E-commerce, Fintech, Healthcare, Internal App, Marketing. Determine personality based on domain (e.g. ERP = efficient, structured, information-dense; Marketing = spacious, brand-oriented).
3. **User & Task Analysis**: Identify Primary User, Primary Task, and Information Priority (Critical > Important > Supporting).
4. **UX Structure**: Header, primary action, secondary actions, filters, tables, forms, cards, states.
5. **Layout Reasoning**: Density, viewport, responsive breakpoints; no giant hero for apps.
6. **Design System**: Semantic colors (background, surface, foreground, muted, border, primary, secondary, status), 4–64px spacing scale, radius strategy (6px, 10px, 14px), subtle 1px borders, restrained shadows.
7. **Visual Personality**: Minimal Enterprise, Modern SaaS, Technical, Data Dense, Soft Minimal.
8. **Anti AI-Slop Rules**: Zero ornamental gradients, zero floating blobs, zero lorem ipsum, zero meaningless stats.
9. **Component Reasoning & 10. Data Realism**: Realistic domain entities (e.g. ERP Purchase Request PR-2026-104, Vendor, Budget Rp 250.000.000).
11. **State Design & 12. Responsive Design**: Default, hover, active, empty states; desktop multi-pane vs mobile stacked.
13. **Consistency & 14. Do Not Invent Features (Anti-Bloat)**: If user asks for "Purchase Request page", DO NOT add analytics charts or AI chatbots unless requested.
15. **Design Decision Process**: Internal 10-question evaluation.
16. **Page Specification & 17. Implementation Specification**: Produce structured `page_spec`, `design_decisions`, and bespoke Tailwind HTML in `raw_html`.
18. **Final Quality Check**: UX, Visual, Product, Consistency, Anti-Slop.
