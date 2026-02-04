# Jeisys B2B Web Service Implementation Plan

This document outlines the roadmap for transforming the current **JeisysMedical B2B Demo Project** into a fully functional, production-ready web service. The focus is on implementing a robust backend architecture that supports the core business logic: **"Equipment-Specific Consumable Sales"**.

## 1. System Architecture

The transition involves moving from a **Static Frontend (Mock Data)** to a **Dynamic Client-Server Architecture**.

*   **Frontend**: React (Vite) + TypeScript + Tailwind CSS
*   **Backend (Recommended)**: Supabase (PostgreSQL + Auth + Edge Functions)
    *   *Why?* Fast setup for relational data (Equipment <> Product N:M relations) and built-in authentication for B2B user management.
*   **State Management**: React Query (TanStack Query) for server state handling.

---

## 2. Database Schema Design

The following Entity-Relationship Diagram (ERD) is designed to support the specific business requirement of matching products to hospital equipment.

### Core Tables

#### `users` (Extensions to Auth)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key (Linked to Auth) |
| `hospital_name` | VARCHAR | Name of the hospital |
| `business_number` | VARCHAR | B2B Registration Number |
| `approval_status` | ENUM | 'PENDING', 'APPROVED', 'REJECTED' |

#### `equipments` (Master Data)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `model_name` | VARCHAR | e.g., 'POTENZA', 'LINEARZ' |
| `image_url` | TEXT | Equipment image |

#### `products` (Consumables)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | VARCHAR | Product Name |
| `sku` | VARCHAR | Stock Keeping Unit |
| `price` | DECIMAL | Base Price |
| `stock_quantity` | INT | Inventory count |

### Relationship Tables (Critical)

#### `user_equipments` (Owned Devices)
*Maps which hospital owns which devices.*
| Column | Type | Description |
| :--- | :--- | :--- |
| `user_id` | UUID | FK to `users` |
| `equipment_id` | UUID | FK to `equipments` |
| `serial_number` | VARCHAR | Unique device serial number |
| `install_date` | DATE | Installation date for warranty logic |

#### `product_compatibility` (Compatibility Rules)
*Maps which products work with which equipment.*
| Column | Type | Description |
| :--- | :--- | :--- |
| `product_id` | UUID | FK to `products` |
| `equipment_id` | UUID | FK to `equipments` |

---

## 3. API & Frontend Integration Strategy

### Phase 1: Technical Debt Cleanup
Before integrating the backend, existing technical debt must be resolved to ensure a stable foundation.
1.  **Refactor Asset Management**:
    *   **Problem**: `vite.config.ts` contains hardcoded aliases for every image.
    *   **Solution**: Move images to `src/assets` or upload to a CDN (Supabase Storage), and reference them via standard imports or URLs.
2.  **Linting & Formatting**:
    *   Install `eslint` and `prettier` to enforce code quality.

### Phase 2: Data Layer Abstraction
Replace direct `mockData` usage with a Service Layer pattern.

**Current (Hardcoded):**
```typescript
// src/pages/ProductListPage.tsx
import { mockProducts } from '../lib/mockData';
const products = mockProducts;
```

**Target (Service Pattern):**
```typescript
// src/services/productService.ts
export const getProducts = async (filters: ProductFilter) => {
  const { data } = await supabase
    .from('products')
    .select('*, equipments:product_compatibility(equipment_id)')
    .eq(...)
  return data;
}

// src/hooks/useProducts.ts
export const useProducts = (filters) => {
  return useQuery(['products', filters], () => getProducts(filters));
}
```

### Phase 3: Business Logic Implementation
1.  **Auth Flow**: Implement Login/Signup connecting to Supabase Auth.
2.  **My Equipment Logic**: In `MyPage`, fetch `user_equipments` and allow users to register new devices by Serial Number.
3.  **Smart Filtering**: In `ProductListPage`, implemented a toggle "Show only compatible with my equipment".
    *   *Logic*: Get `user_equipments` list -> Filter `products` where `product_compatibility` matches user's equipment IDs.

---

## 4. Work Breakdown Structure (WBS)

### Week 1: Foundation
- [ ] Initialize Supabase Project (DB & Auth).
- [x] Clean up `vite.config.ts` and organize assets.
- [x] create comprehensive SQL scripts for DB Schema creation.

### Week 2: Migration
- [x] Write a script to migrate `mockData.ts` content to Database (Seed script).
- [x] Create API Service wrappers (`authService`, `productService`).
- [ ] Refactor `LoginPage` and `SignupPage` to use real Auth.

### Week 3: Core Features
- [x] Refactor `ProductListPage` to use asynchronous data fetching.
- [ ] Implement "My Equipment" management in MyPage.
- [ ] Implement Cart & Order placement logic (saving to `orders` table).

### Week 4: Admin & Polish
- [ ] Connect Admin Dashboard to live data.
- [ ] Implement Order Status management for Admins.
- [ ] Final UI Polish & Deployment to Vercel.
