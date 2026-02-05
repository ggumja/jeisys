# Design: Dashboard Grade Card Filter Navigation

## 1. Specification: Query Parameters
We will use the reserved key `grade` in the URL query string to synchronize the state between pages.
- **URL Pattern**: `/admin/members?grade={GRADE_NAME}`
- **Accepted Values**: `VIP`, `Gold`, `Silver`, `Bronze`

## 2. Dashboard Integration Design (`DashboardPage.tsx`)

### 2.1 Refactor Grade Card UI
Change the static `div` to a button-like interactive element.
- **CSS classes**: `cursor-pointer hover:border-neutral-900 hover:shadow-sm transition-all active:scale-[0.98]`
- **Event Handler**: `onClick={() => navigate('/admin/members?grade=VIP')}`

### 2.2 Navigation Logic
```typescript
const navigate = useNavigate();
const handleGradeCardClick = (grade: string) => {
  navigate(`/admin/members?grade=${grade}`);
};
```

## 3. Member Page Filter Sync Design (`MemberManagementPage.tsx`)

### 3.1 Initial State Detection
The component must read the URL on mount.
```typescript
const [searchParams] = useSearchParams();
const urlGrade = searchParams.get('grade');

// Initial state should prefer URL param
const [gradeFilter, setGradeFilter] = useState<string>(urlGrade || 'all');
```

### 3.2 State/URL Synchronization (Optional)
When the user manually changes the filter in `MemberManagementPage`, we should decide whether to update the URL or just keep it local. 
- **Decision**: Update URL to keep the filtered view shareable/bookmarkable.

## 4. UI/UX Considerations
- Add a "Clear Filter" indicator if a grade is active from the dashboard.
- Ensure the "All Members" tab is automatically selected when navigating from the dashboard to ensure the filter works correctly over the entire set.
