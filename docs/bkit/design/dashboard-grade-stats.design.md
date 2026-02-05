# Design: Dashboard Member Grade Status DB Integration

## 1. Data Structure Design

### 1.1 Updated Stats Interface
The `getDashboardStats` result will be extended:
```typescript
interface GradeStat {
  count: number;
  percentage: number;
}

interface DashboardStats {
  // ... existing fields
  gradeDistribution: {
    VIP: GradeStat;
    Gold: GradeStat;
    Silver: GradeStat;
    Bronze: GradeStat;
  };
}
```

## 2. Calculation Logic (Algorithm)

To avoid redundant code, the grading logic should be consistent with `MemberManagementPage`.

### 2.1 Backend Process in `adminService.getDashboardStats()`
1. Fetch all `users`.
2. Fetch all non-cancelled `orders`.
3. Aggregate sales by `user_id`.
4. Iterate through users and assign grades based on thresholds:
   - VIP: >= 50,000,000
   - Gold: >= 30,000,000
   - Silver: >= 10,000,000
   - Bronze: < 10,000,000
5. Calculate counts and percentages relative to total users.

## 3. UI Component Mapping

### 3.1 DashboardPage.tsx
Update the "회원 등급별 현황" section to use the dynamic data:
- **Card 1 (VIP)**: `stats.gradeDistribution.VIP.count`명, `stats.gradeDistribution.VIP.percentage`%.
- **Card 2 (Gold)**: `stats.gradeDistribution.Gold.count`명, `stats.gradeDistribution.Gold.percentage`%.
- **Card 3 (Silver)**: `stats.gradeDistribution.Silver.count`명, `stats.gradeDistribution.Silver.percentage`%.
- **Card 4 (Bronze)**: `stats.gradeDistribution.Bronze.count`명, `stats.gradeDistribution.Bronze.percentage`%.

## 4. Performance Considerations
As the user base grows, fetching all users/orders for every dashboard load might become heavy.
- *Short-term*: Keep it simple (fetch and calc).
- *Optimization*: In a real production environment, this should be a cached materialized view or a dedicated analytics table.
