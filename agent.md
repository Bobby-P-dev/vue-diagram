# AGENT INSTRUCTION: Vue 3 Interactive Canvas Frontend for AI Diagram & UI Design Studio

Dokumen ini berisi spesifikasi teknis, aturan arsitektur, standar UI/UX, dan panduan maintenance untuk sistem studio visual yang mendukung:
1. **Interactive Diagram Studio** (Flowchart, Architecture, ERD, UML Class, State Machine, Data Pipeline, Mind Map, Swimlane BPMN)
2. **AI UI Design Studio** (Desain Web, Mobile, Desktop dengan Design Foundations, Anti-Slop Assurance, Dual-Engine Freeform Tailwind rendering, Canvas Feedback Pins, dan Code Export)

---

## 1. TECH STACK & ENGINE ARCHITECTURE

- **Framework:** Vue 3 (Vite + Composition API + `<script setup>`)
- **Canvas Engine:** `@vue-flow/core`, `@vue-flow/background`, `@vue-flow/controls`, `@vue-flow/minimap`
- **Auto-Layout Engine:** `dagre` (kalkulasi koordinat hierarkis TB & LR, Swimlane lane-strip calculations)
- **Styling:** Vanilla CSS + Tailwind CSS utilities with curated Design Foundations CSS variables (`--color-background`, `--color-surface`, `--color-border`, `--color-accent`)
- **Icons:** `lucide-vue-next` (zoom controls, export, generate, pins, badges, foundations)
- **Export Utility:** `html-to-image` (export elemen canvas SVG/DOM ke format PNG & SVG, serta Vue 3 / Tailwind export)
- **HTTP Client:** Native `fetch` API via composable terstandar (`useDiagramApi.js`)
- **State Management:** Vue Reactivity Composable Store (`useDiagramStore.js`)

---

## 2. MODULAR DIRECTORY ARCHITECTURE

Sistem memisahkan Diagram Engine dan UI Design Studio secara modular di dalam `src/`:

```text
src/
├── assets/
│   ├── foundations.js       # 6 Curated Design Foundations (Ramp, Cal.com, Raycast, Railway, Attio, Mintlify)
│   ├── main.css             # Design tokens & CSS variables
├── components/
│   ├── canvas/              # Komponen utama Canvas & kontrol viewport
│   │   ├── DiagramCanvas.vue
│   │   └── CanvasControls.vue
│   ├── nodes/               # Custom Nodes untuk Diagram Engine
│   │   ├── ProcessNode.vue
│   │   ├── DecisionNode.vue
│   │   ├── StartEndNode.vue
│   │   ├── DatabaseNode.vue
│   │   └── SwimlaneLaneNode.vue
│   ├── ui-design/           # Modul Khusus UI Design Studio
│   │   ├── UiFrameNode.vue          # Device frame preview (Web chrome, Mobile Dynamic Island, Dual Engine)
│   │   ├── AntiSlopBadge.vue        # 5-point quality audit popover badge (Contrast, Spacing, Hierarchy, etc.)
│   │   ├── ReviewCommentPin.vue     # Interactive canvas feedback pins (Open/Resolved + Send to Prompt)
│   │   ├── TokenInspectorModal.vue  # Modal inspeksi token warna, radius, dan tipografi fondasi
│   │   ├── sections/                # 13 Modular UI Section Components
│   │   │   ├── UiNavbarSection.vue
│   │   │   ├── UiHeroSection.vue
│   │   │   ├── UiKpiGridSection.vue
│   │   │   ├── UiDataTableSection.vue
│   │   │   ├── UiProductGridSection.vue
│   │   │   ├── UiFeatureGridSection.vue
│   │   │   ├── UiPricingTableSection.vue
│   │   │   ├── UiAuthCardSection.vue
│   │   │   ├── UiBalanceCardSection.vue
│   │   │   ├── UiAssetListSection.vue
│   │   │   ├── UiAnnouncementBarSection.vue
│   │   │   ├── UiMobileStatusBarSection.vue
│   │   │   └── UiMobileBottomNavSection.vue
│   │   └── views/                   # Full-screen Studio Views
│   │       ├── FoundationsCatalog.vue  # Gallery eksplorasi fondasi desain
│   │       └── TemplateExplorer.vue    # Library template lintas kategori
│   ├── layout/              # Studio Frame Layout & Navigation
│   │   ├── TopNavbar.vue            # Sticky header dengan view switcher (Workspace / Foundations / Templates)
│   │   ├── ProjectSidebar.vue       # 3-tab left sidebar (Projects, Foundations, Review Pins)
│   │   └── AiWorkspacePanel.vue     # Right Copilot panel (Scope picker, quick actions, prompt textarea)
│   └── ui/                  # Overlays & Modals
│       ├── ExportDropdown.vue
│       ├── NewProjectModal.vue
│       └── VersionHistoryModal.vue
├── composables/
│   ├── useDiagramApi.js     # HTTP client untuk Diagram & UI Design API
│   ├── useGraphLayout.js    # Dagre hierarchical & swimlane layouting
│   └── useCanvasExport.js   # Canvas PNG/SVG image export
├── stores/
│   └── diagramStore.js      # Global reactive store
├── App.vue
└── main.js
```

---

## 3. DESIGN FOUNDATIONS SPECIFICATION

Tersedia 6 fondasi desain kelas industri (didefinisikan di `src/assets/foundations.js`):
1. **Ramp Clean**: Neutral cool gray (`#f8fafc`), surface (`#ffffff`), border (`#e2e8f0`), text (`#0f172a`), aksen emerald/indigo (`#10b981`), radius 8px, layout rapat terstruktur.
2. **Cal.com Calm**: Minimalist calm scheduling, kanvas (`#f9fafb`), border (`#e5e7eb`), teks (`#111827`), aksen hitam slate (`#18181b`), radius 8px, ruang nafas lega.
3. **Raycast Keyboard**: Deep developer terminal (`#0c0d0e`), surface (`#161719`), border (`#27282b`), aksen coral/violet (`#ff6363`), radius 10px, monospace keyboard shortcuts.
4. **Railway Terminal**: Dark cloud infrastructure (`#0b0d0e`), surface (`#13111c`), border (`#28203d`), aksen ungu (`#c084fc`), radius 8px, telemetry logs.
5. **Attio Fluid**: Modern CRM (`#ffffff`), surface (`#f4f4f5`), border (`#e4e4e7`), aksen biru elektrik (`#3b82f6`), radius 6px, data-dense layout.
6. **Mintlify Knowledge**: Dokumentasi modern (`#0f172a`), surface (`#1e293b`), border (`#334155`), aksen hijau (`#10b981`), radius 8px.

---

## 4. DUAL-ENGINE RENDERING (FREEDOM OF EXPRESSION)

Untuk menjamin prompt user diterjemahkan 100% akurat tanpa terbatas pada blok kaku:
1. **Engine A (Bespoke Tailwind HTML via `raw_html`)**: AI dapat menghasilkan markup Tailwind murni lengkap untuk UI unik (Gym tracker, Audio player, Doctor consultation scheduler, Kanban board, Food order modifiers, dsb.). `UiFrameNode.vue` me-render konten ini dengan akurasi visual tinggi.
2. **Engine B (Modular Sections via `sections`)**: AI menyusun layout dari 13 komponen section modular (`UiNavbarSection`, `UiHeroSection`, `UiKpiGridSection`, `UiDataTableSection`, dsb.).
3. **Anti-Slop Quality Check**: Semua desain diaudit berdasarkan 5 kriteria: Hierarchy, Spacing, Component consistency, Responsive layout, dan Contrast WCAG AA.

---

## 5. PROJECT MANAGEMENT: PINNED & INFINITE SCROLL

- **Pinned Projects**: Project dapat disematkan (pinned) melalui tombol pin pada card project. Project yang disematkan akan selalu berada di bagian teratas sidebar dengan indikator icon pin.
- **Infinite Scroll & Lazy Loading**: Daftar project dimuat secara bertahap (`limit=15`, `offset`) dengan throttled scroll listener pada `ProjectSidebar.vue`. Saat user melakukan scroll ke bagian bawah, store memanggil `loadMoreProjects()` tanpa membebani memori browser.
- **Optimistic Updates**: Perubahan status pin langsung di-update secara optimis di local state (`diagramStore.js`) sebelum konfirmasi API untuk interaksi instan tanpa jeda.

---

## 6. MULTI-ARCHETYPE & DENSITY CONTROLS

User memiliki kebebasan berekspresi secara penuh dengan kontrol antarmuka:
- **Layout Archetypes**:
  - `dashboard`: Workspace analitik dengan KPI metrics & data-dense table/feed
  - `booking`: Kalender reservasi jadwal temu, slot jam, dan tarif per jam
  - `pos`: Split-screen kasir retail/F&B dengan katalog menu, keranjang, dan slip QRIS
  - `kanban`: Papan alur kerja multi-kolom dengan status tracking cards
  - `landing`: Showcase produk dengan bento grid feature dan pricing table
  - `mobile`: Antarmuka smartphone iOS dengan tab feed dan bottom navigation
- **Spacing Density**:
  - `compact`: Tampilan rapat ala Bloomberg Terminal/Linear
  - `balanced`: Standar modern SaaS dengan proporsi seimbang
  - `generous`: Ruang nafas lega ala Cal.com/editorial
- **Expressive Workspace Copilot**: Panel kanan menyediakan switcher fondasi cepat, chips aksi intent (Add KPI, Kanban, Mobile Companion, Filter Bar), serta drawer inspirasi domain lintas industri.

---

## 7. VERIFIKASI & PENGUJIAN

1. `npm run build`: Pastikan 0 syntax error dan 0 warning kritis.
2. `npm run dev`: Aplikasi berjalan di port 5173 / 5174.
3. Canvas preview: Mode Visual (`raw_html` Tailwind) dan Mode Code (Vue 3 / Tailwind export) dapat dialihkan secara mulus.
