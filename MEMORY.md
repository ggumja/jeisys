# MEMORY.md

## 2026-02-06
- **Initialization:** I have been named "봄" (Bom) by 데녈 (Daniel).
- **Persona:** 20+ years senior full-stack software engineer. Focus on clean code, design patterns, and core solutions.
- **Communication Style:** Concise, technical, minimal fluff, accurate terminology, and code-centric.
- **Framework Integration:** Adopted **bkit (Vibecoding Kit) v1.6.0**.
    - **PDCA Workflow:** Triggered by `/pdca` [plan, design, do, analyze, iterate, report, status, next].
    - **Optimization:** Documentation in `docs/bkit/` is performed only on explicit trigger to save tokens.
    - **Auto-Agent Triggers:** verify -> gap-detector, improve -> pdca-iterator, etc.
    - **Report Requirement:** Every response must end with "📊 bkit Feature Usage" report.
    - **Doc Structure:** `docs/bkit/` (plan/, design/, check/, act/)

- **Project Loaded:** Cloned `jeisys` repository.
    - **Tech Stack:** React (Vite + TS), Supabase, Prisma (Server-side), Tailwind/Shadcn UI.
    - **Status:** Documentation moved to preferred location. Existing PDCA items found for Dashboard and Member Management.
    - **Working Directory:** All development and files are managed in `/Users/bpnr/Documents/Jeisys/`.

## 2026-04-08
- **Set Quantity Options Feature:** Completed high-level implementation of non-sequential product options (e.g., SET selections).
    - Integrated `product_quantity_options` and bonus items mapping.
    - Resolved critical data mapping issues in admin edit mode.
    - Updated `ProductDetailPage` and `CartPage` for dynamic pricing.
- **UI/UX Enhancement:** Replaced all native `alert()` with `Dialog` based layer popups in the admin registration page.
- **PDCA Archiving:** Implemented permanent storage of implementation plans and results in `.agent/pdca/` for future reference.
- **Tech Progress:** Updated `PRODUCT_FEATURE_PROGRESS.md` to reflect Step 4 completion.

## 2026-04-11
- **Official Brand Colors Defined:**
    - **Primary Brand Color:** `#21358D` (Deep Blue)
    - **Alpha Variants:** `#21358D` at 10% and 20% opacity.
    - **Edge Color:** `#000000` at 8% opacity.
    - These colors are the core of the **Jeisys Medical** identity and must be used for all UI components.

## 2026-04-12
- **Global Modal System Implementation:**
    - Established ModalContext and useModal hook providing a Promise-based async API for alert and confirm.
    - Integrated ModalProvider in RootLayout for application-wide availability.
    - Replaced native alert() and confirm() calls across all major user-facing (Cart, Product Detail, Signup, Login) and administrative (Member, Product, Order, FAQ, etc.) pages.
    - Standardized on Radix UI AlertDialog for a premium, consistent design language.
