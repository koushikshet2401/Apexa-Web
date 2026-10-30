# Apex Web — Ultra-Luxury Architectural & Real Estate Platform

A cinematic, modern web application for an ultra-luxury real estate development and advisory firm. Designed with immersive typography, fluid Lenis smooth scrolling, GSAP & Framer Motion micro-interactions, responsive video showcases, and full DPDP-compliant enquiry architecture.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: `v20.x` or later (LTS recommended)
- **Package Manager**: `pnpm` (recommended) or `npm` / `yarn`

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/koushikshet2401/Apexa-Web.git
cd Apexa-Web
```

Install packages:
```bash
# Recommended
pnpm install

# Alternatively
npm install
```

### 3. Run Locally
Start the development server:

```bash
pnpm dev
# or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Build & Production

To compile an optimized production build:

```bash
pnpm build
pnpm start
# or: npm run build && npm run start
```

---

## 📦 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **Smooth Scrolling**: [Lenis](https://lenis.darkroom.engineering/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/) & [GSAP](https://gsap.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Carousels**: [Embla Carousel](https://www.embla-carousel.com/)

---

## 📁 Project Structure

```
├── public/                 # Static assets (images, high-res videos, svgs)
│   ├── images/             # Property photography
│   └── videos/             # Ambient background & showcase videos
├── src/
│   ├── app/                # Next.js App Router (pages & API endpoints)
│   │   ├── (public)/       # Public routes (properties, services, privacy, etc.)
│   │   ├── api/            # API routes (rate-limited enquiry endpoint)
│   │   ├── layout.tsx      # Root layout & providers
│   │   └── page.tsx        # Homepage
│   ├── components/
│   │   ├── layout/         # Navigation & Footer
│   │   ├── providers/      # Smooth scroll & theme providers
│   │   ├── sections/       # Hero, Gallery, About, Contact sections
│   │   └── ui/             # Reusable UI widgets & forms
│   ├── data/               # Curated properties & collection datasets
│   └── lib/                # Shared utilities
├── requirement.txt         # Detailed system requirements & install guide
├── package.json
└── tailwind.config.ts
```

---

## 📄 License & Ownership
Copyright © Apex Luxury Real Estate. All rights reserved.
