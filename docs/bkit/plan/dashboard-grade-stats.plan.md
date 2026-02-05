# Plan: Dashboard Member Grade Status DB Integration

## 1. Objective
Replace mock data in the "Member Grade Status" section of the Admin Dashboard with real-time analytics from Supabase.

## 2. Key Tasks
- **Service Layer**: Update `adminService.getDashboardStats()` to calculate grade distribution.
- **Frontend State**: Update `DashboardPage` to include `gradeStats` in its local state.
- **UI Rendering**: Map the fetched grade statistics to the status cards at the bottom of the dashboard.

## 3. Implementation Details
### 3.1 Data Calculation (Service)
Since grades are calculated based on cumulative sales (from the `orders` table), `getDashboardStats` needs to:
1. Fetch all users and their non-cancelled orders.
2. Calculate total sales per user.
3. Classify users into VIP, Gold, Silver, and Bronze.
4. Return an object: `{ gradeStats: { VIP: { count, percent }, Gold: { ... }, ... } }`.

### 3.2 UI Integration (DashboardPage)
1. Initialize stats state with default zeros for grades.
2. Update the `loadDashboardData` function to handle the new fields.
3. Replace hardcoded numbers (e.g., "48명") with `{stats.gradeStats.VIP.count}명`.

## 4. Success Criteria
- [ ] VIP/Gold/Silver/Bronze counts match the actual data in `MemberManagementPage`.
- [ ] Percentages are correctly calculated based on the total number of approved/active users.
- [ ] No significant performance degradation on dashboard load.
