# Design: Member Management DB Integration

## 1. Component Architecture
The `MemberManagementPage.tsx` will be refactored to use **React Query** for data fetching and mutations, replacing the manual `useEffect` and `useState` management for members.

### 1.1 Data Service (adminService.ts)
New and updated methods:
- `getUsers()`: Update to perform a join or aggregate fetch to get `total_sales` per user.
- `updateUserStatus(userId, status)`: Update to handle state synchronization.
- `getUserEquipments(userId)`: New method to fetch equipment linked to a specific user.

### 1.2 Hooks (useAdmin.ts)
Create a new hook file `src/hooks/useAdmin.ts` containing:
- `useAdminUsers()`: Fetches user list.
- `useUpdateUserStatus()`: Mutation for approval/rejection.
- `useUserEquipments(userId)`: Fetches specific equipment.

## 2. Interface Mapping
Update `Member` interface in `MemberManagementPage.tsx` to align with DB:
```typescript
interface Member {
  id: string;
  name: string;
  email: string;
  hospitalName: string;
  businessNumber: string;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  role: 'admin' | 'user';
  created_at: string;
  total_sales: number; // Calculated from orders
  // ... other fields from public.users
}
```

## 3. Grading Logic
Grading thresholds (Base on `total_sales`):
- **VIP**: > 50,000,000 KRW
- **Gold**: > 30,000,000 KRW
- **Silver**: > 10,000,000 KRW
- **Bronze**: Default

## 4. UI/UX Refinement
- **Detail Modal**: Implementation of a "Equipments" tab or section using the `getUserEquipments` hook.
- **Approval Actions**: Visual feedback (Loader) while processing approval/rejection.
- **Grade Management**: Admin UI to adjust thresholds (Optional/Phased).

## 5. Security & RLS
Ensure `auth.uid()` check and `role = 'admin'` for all write operations on the `users` table.
```sql
CREATE POLICY admin_update_users ON public.users
FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
```
