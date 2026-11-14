# APEX PACIFIC HOLDINGS — SYSTEM ARCHITECTURE SPECIFICATION
## Comprehensive End-to-End Technical Architecture & Data Transfer Pipelines

This document details the complete production architecture of the **APEX Pacific Holdings** luxury real estate and architectural advisory platform, covering the interaction models between the **Frontend (Next.js 15 App Router)**, **Backend API Gateway & Route Handlers**, **PostgreSQL 16 Database via Prisma ORM**, and **Cloudflare R2 Object Storage / Global CDN**.

---

## 1. Interactive Visual Architecture

An interactive, zoomable, high-fidelity system diagram has been rendered using **Archify** (`https://archify.si/`):

- **Interactive HTML Viewer:** [apex-architecture.html](file:///E:/ApexaHoldings/Architecture%20Daigram/apex-architecture.html)
- **High-Resolution Diagram (PNG):** [apex-architecture.png](file:///E:/ApexaHoldings/Architecture%20Daigram/apex-architecture.png)
- **Archify Architecture Specification:** [apex-system-architecture.candidate.json](file:///E:/ApexaHoldings/Architecture%20Daigram/apex-system-architecture.candidate.json)

---

## 2. Multi-Tier Architecture Topology

```
+---------------------------------------------------------------------------------------------------------+
|                                        APEX PACIFIC HOLDINGS                                            |
+---------------------------------------------------------------------------------------------------------+
|  [PRESENTATION LAYER]           [APPLICATION TIER]            [DATABASE TIER]       [CLOUDFLARE TIER]   |
|                                                                                                         |
|  +---------------------+      +---------------------+      +-------------------+   +------------------+ |
|  | Public Web App      | ===> | API Gateway         | ===> | PostgreSQL 16 DB  |   | Cloudflare Edge  | |
|  | Next.js App Router  |      | Route Handlers/Auth |      | Prisma ORM (25)   |   | CDN Media Cache  | |
|  +---------------------+      +---------------------+      +-------------------+   +------------------+ |
|            ^                             ^                           ^                      ^           |
|            |                             |                           |                      |           |
|  +---------------------+                 |                           |                      |           |
|  | Admin CMS Portal    | ================+                           |                      |           |
|  | RBAC & Dashboard    |                                             |                      |           |
|  +---------------------+                                             |                      |           |
|            |                                                         |                      |           |
|            | Presigned Authorization                                 |                      |           |
|            v                                                         |                      |           |
|  +---------------------+                                             |                      |           |
|  | Direct Binary PUT   | =================================================================> | Cloudflare R2    |
|  | (Up to 500MB Video) |                                                                    | Object Storage   |
|  +---------------------+                                                                    +------------------+
+---------------------------------------------------------------------------------------------------------+
```

---

## 3. Data Flow & Communication Pipelines

### A. Frontend to Backend Communication
1. **Public Client Traffic:**
   - Public visitors navigate Next.js App Router server and client components (`/`, `/collection/[country]`, `/collection/[country]/[slug]`, `/services/[slug]`, `/contact`).
   - Private advisory inquiries are submitted via `POST /api/public/enquiry` with honeypot spam protection, phone sanitization, and structured payload validation.
   - Spaces in the Round perspective carousel fetches data via `GET /api/public/space-in-round`.
2. **Admin Operations & RBAC:**
   - Administrators authenticate via `POST /api/admin/auth/login`.
   - On successful password verification (`bcrypt`), an HttpOnly JWT session token (`apex_admin_session`) is signed using `HS256` and issued with `SameSite=Lax`.
   - Every administrative API route enforces fine-grained permissions (`PROPERTIES:CREATE`, `PROPERTIES:UPDATE`, `PROPERTIES:DELETE`, `CONTENT:UPDATE`, `MEDIA_UPLOAD`, `USERS:MANAGE_ROLES`) via `requirePermission()`.

### B. Backend to Database Tier (PostgreSQL 16 via Prisma ORM)
1. **Relational Models:**
   - 25 relational database models including `Property`, `PropertyImage`, `Country`, `CollectionMedia`, `ServiceCategory`, `OneTeamContent`, `HomepageContent`, `AdminUser`, `AdminRole`, `Enquiry`, `Deal`, and `AdminActivityLog`.
2. **Transactional Integrity:**
   - Complex state transitions (deal closing, property creation, service mapping, queue re-ordering) execute inside `db.$transaction()` blocks.
3. **Audit Ledger:**
   - Every administrative modification (publish, update, archive, permanent purge) writes an immutable record to `AdminActivityLog` tracking `adminId`, `entityType`, `entityId`, `action`, and JSON `metadata`.

### C. Cloudflare R2 Media Upload & CDN Streaming Pipeline
To prevent Next.js Node.js server memory starvation and body-size timeouts on large 4K video reels and 50MB photography:
1. **Phase 1 — Presign Handshake:**
   - Client requests authorization via `POST /api/admin/media/presign`.
   - The server validates admin permissions, sanitizes file extension and magic byte requirements, and generates a normalized, collision-free R2 key (e.g. `one-team/middle-video-{timestamp}-{uuid}.mp4`).
2. **Phase 2 — Direct Streaming PUT:**
   - Client streams raw binary data directly using `XMLHttpRequest` with upload progress callbacks, completely bypassing multipart form overhead.
   - Files up to 500MB stream seamlessly without Next.js memory exhaustion.
3. **Phase 3 — Database Asset Record:**
   - The media metadata is persisted to the `MediaAsset` table and linked to the corresponding property, country, or editorial section.
4. **Phase 4 — Global Edge CDN Delivery:**
   - Media is served globally via Cloudflare Edge CDN (`pub-8de28cd1189147deb3a3dafbd4be5e05.r2.dev`) with immutable caching, low-latency delivery, and AVIF/WebP image optimization.

### D. Single Source of Truth & Zero-Waste R2 Purge Pipeline
- **Soft-Delete (Archive):** Delists property from public search and collection pages immediately, unfeatures it from launches, removes it from Space in Round, and stores it in the `Deleted Projects` tab.
- **Permanent Purge:**
  1. Identifies all associated Cloudflare R2 media objects (`mainImage`, `mainVideoUrl`, `mainVideoThumb`, `spaceRoundImage`, `PropertyImage`, `MediaAsset`).
  2. Executes batch S3 `DeleteObjectCommand` against Cloudflare R2 to eliminate orphaned storage bloat.
  3. Cascades relational record deletion in PostgreSQL (`PropertyImage`, `PropertyService`, `Deal`, `MediaAsset`, `Property`).
  4. Automatically reconciles Space in Round slot orders and flushes Next.js ISR caches (`revalidatePath`).

---

## 4. Verification and File Locations

| File | Purpose |
|------|---------|
| [apex-architecture.html](file:///E:/ApexaHoldings/Architecture%20Daigram/apex-architecture.html) | Interactive Archify HTML viewer |
| [apex-architecture.png](file:///E:/ApexaHoldings/Architecture%20Daigram/apex-architecture.png) | High-resolution 2x DPR rendered diagram |
| [apex-system-architecture.candidate.json](file:///E:/ApexaHoldings/Architecture%20Daigram/apex-system-architecture.candidate.json) | Archify architecture schema |
| [apex-architecture.delivery.json](file:///E:/ApexaHoldings/Architecture%20Daigram/apex-architecture.delivery.json) | Validation manifest (status: pass, 0 errors, 0 warnings) |
