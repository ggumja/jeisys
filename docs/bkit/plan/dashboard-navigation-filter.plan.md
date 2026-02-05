# Plan: Dashboard Grade Card Filter Navigation

## 1. Objective
Enable seamless navigation from the Admin Dashboard to the Member Management page with a pre-applied grade filter when a user clicks on a specific grade status card.

## 2. Key Tasks
- **Dashboard Redirection**: Update `DashboardPage.tsx` to navigate to `/admin/members` with a query parameter (e.g., `?grade=VIP`) when a card is clicked.
- **Filter Initialization**: Update `MemberManagementPage.tsx` to detect the `grade` query parameter on mount and initialize the filter state accordingly.
- **UI Feedback**: Ensure the grade cards in the dashboard look interactive (hover effects, pointer cursor).

## 3. Implementation Details
### 3.1 DashboardPage.tsx
1. Import `useNavigate` from `react-router-dom`.
2. Add `cursor-pointer hover:bg-neutral-50 transitions` styles to the grade cards.
3. Implement `handleGradeClick(grade: string)` function.

### 3.2 MemberManagementPage.tsx
1. Import `useSearchParams` from `react-router-dom`.
2. Use `useEffect` or `useSearchParams` directly to set the initial `gradeFilter` state.
3. If a grade is passed via URL, ensure the "All Members" tab is active (or appropriate tab) and the filter dropdown shows the selected grade.

## 4. Success Criteria
- [ ] Clicking the "VIP" card on the dashboard opens `/admin/members` with only VIP users listed.
- [ ] The filter dropdown in Member Management correctly reflects the active grade filter.
- [ ] Navigation works for all four grades (VIP, Gold, Silver, Bronze).
