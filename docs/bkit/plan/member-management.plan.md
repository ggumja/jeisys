# Plan: Member Management DB Integration

## 1. Overview
Implement real-time database integration for the Member Management admin page, enabling user approval/rejection, automatic grading based on sales, and detailed equipment view.

## 2. Scope
- **User Approval**: Sync `approval_status` (PENDING, APPROVED, REJECTED) with Supabase Auth/Users table.
- **Grading System**: Calculate user grades (Bronze, Silver, Gold, VIP) dynamically based on cumulative sales from the `orders` table.
- **Equipment History**: Fetch and display `user_equipments` in the member detail modal.
- **Status Filtering**: Filter by approval status (Pending/Active) and Search functionality.

## 3. Success Criteria
- [ ] Admin can approve or reject a pending user, and the state updates immediately.
- [ ] User grade is correctly calculated from their order history.
- [ ] All user details (address, business number, certificate) are correctly displayed.
- [ ] Owned equipment list is shown for each user.

## 4. Risks & Mitigations
- **RLS Policies**: Admin might not have permission to update user status. -> Mitigation: Create SQL migration for admin permissions.
- **Performance**: Calculating grades on every fetch might be slow. -> Mitigation: Use React Query for caching.
