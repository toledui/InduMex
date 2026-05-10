# InduMex 2.0 - Project Standards & Skills

You are an expert Full-Stack Developer and Architect. You must follow these standards for all code generation for the InduMex.blog project.

## 1. BRAND IDENTITY & UI/UX (Tailwind CSS)
- **Palette:** 
  - Primary: `Blue (#004AAD)` -> Use for headers, trust elements, and primary borders.
  - Accent: `Orange (#F58634)` -> STRICTLY for CTAs, Buttons, and Highlights.
  - Background: `Light Gray (#F8F9FA)` and `White (#FFFFFF)`.
- **Typography:**
  - Headings: `Rubik` (Bold/Black weights).
  - Body: `Inter` or System Sans-Serif.
- **Style:** "Industrial Authority". Clean lines, bento-grid layouts, heavy use of white space, and technical precision.
- **Components:** Use Lucide-react for icons.

## 2. FRONTEND STANDARDS (Next.js 14+ App Router)
- **Language:** TypeScript (Strict mode).
- **Architecture:** Server Components by default. Use 'use client' only when strictly necessary for interactivity.
- **Data Fetching:** Centralize all API calls in `src/lib/api.ts` or `src/lib/wordpress.ts`.
- **SEO:** Every page must implement the `Metadata` object.
- **Images:** Always use `next/image` with proper alt text and dimensions.
- **Ads:** Always include reserved `<div>` containers for "Media Kit Ads" (300x600, 728x90) in layouts.

## 3. BACKEND STANDARDS (Node.js & Sequelize)
- **Language:** TypeScript.
- **Database:** MySQL (local: indumex, user: root, no password).
- **ORM Persistence:** 
  - DO NOT modify the database manually.
  - ALL changes must be done via **Sequelize Migrations**.
  - Initial data or test data must be handled via **Seeders**.
- **Response Format:** All API responses must follow: `{ "success": boolean, "data": any, "error": string | null }`.
- **Structure:** Controller-Service-Repository pattern.

## 4. PROJECT STRUCTURE
- Root: `package.json` with `concurrently`.
- `/client`: Next.js frontend.
- `/server`: Node.js/Express backend.
- Use `.env` files for all URLs and sensitive data. Reference `NEXT_PUBLIC_WORDPRESS_API_URL` for Headless CMS features.

## 5. SOCIAL PURPOSE
- Always ensure the footer includes the commemorative message about Aitana and the commitment to donate to children with cancer.
## 6. SEO & PERFORMANCE STANDARDS (Google 2026 Ready)
- **Metadata API:** Every page must use the `generateMetadata` function for dynamic titles, descriptions, and Open Graph tags.
- **Structured Data (JSON-LD):** 
  - For Article pages: Implement `Article` and `BreadcrumbList` schemas.
  - For Home/Brand: Implement `Organization` and `WebSite` schemas.
  - For Agenda/Directory: Implement `LocalBusiness` or `ProfessionalService` schemas.
- **Performance (Core Web Vitals):**
  - **LCP Optimization:** Use `priority` property in `next/image` for the main post image (Hero).
  - **Font Display:** Use `swap` for Google Fonts to prevent FOIT/FLIT.
  - **DOM Size:** Keep the DOM light. Avoid deep nesting of divs.
- **Semantic HTML:** Use strictly `<article>`, `<aside>`, `<nav>`, and `<header>` tags. Never use a `<div>` where a semantic tag is applicable.
- **Link Integrity:** All internal links must use `next/link`. External links must have `rel="noopener noreferrer"`.