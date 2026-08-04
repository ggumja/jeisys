# 🛠️ 교육 캘린더 개발자 구현 명세서 (비즈니스 로직 & 프론트 관리자 아키텍처)

본 문서는 **교육 캘린더 관리 시스템**의 **핵심 비즈니스 로직** 및 **프론트엔드 관리자 화면 아키텍처** 구현 명세서입니다.

---

## 1. ⚙️ 핵심 비즈니스 로직 (Service Layer)

### ① 미승인 신청자 존재 여부 연산 (`hasPendingApplicants`)
- 관리자 일정 목록을 불러올 때, 신청 내역(`education_requests`) 중 `status = 'pending'` 인 `schedule_id` 목록을 매핑하여 각 일정에 `hasPendingApplicants: boolean` 플래그를 결합합니다.
- **목적**: 미승인 신청자가 존재하는 행에 붉은색 하이라이트 배경(`bg-red-50/50`) 및 깜빡이는 `NEW` 핑(Ping) 배지를 노출하기 위함입니다.

```typescript
async getEducationSchedules() {
    const { data: schedules } = await supabase.from('education_schedules').select('*').order('date', { ascending: false });
    const { data: pendingRequests } = await supabase.from('education_requests').select('schedule_id').eq('status', 'pending');

    const pendingScheduleIds = new Set((pendingRequests || []).map(r => r.schedule_id));

    return (schedules || []).map(row => ({
        ...row,
        hasPendingApplicants: pendingScheduleIds.has(row.id)
    }));
}
```

---

### ② 신청 승인/거절 시 수강 인원(`enrolled`) 자동 동기화
- 신청자의 상태가 `pending` ➔ `scheduled`(승인) 또는 `cancelled`(거절)로 변경될 때, 해당 일정의 승인 확정 인원 수(`enrolled`)를 DB count 기반으로 실시간 자동 집계하여 동기화합니다.

```typescript
async updateEducationRequestStatus(id: string, status: 'pending' | 'scheduled' | 'completed' | 'cancelled') {
    const { data: currentReq } = await supabase.from('education_requests').select('schedule_id').eq('id', id).single();
    await supabase.from('education_requests').update({ status }).eq('id', id);

    if (currentReq?.schedule_id) {
        const { count } = await supabase
            .from('education_requests')
            .select('*', { count: 'exact', head: true })
            .eq('schedule_id', currentReq.schedule_id)
            .in('status', ['scheduled', 'completed']);

        await supabase.from('education_schedules').update({ enrolled: count || 0 }).eq('id', currentReq.schedule_id);
    }
}
```

---

### ③ 일정 일괄 완료 처리 및 일정 취소 (소프트 딜리트)
- **일정 완료 (`completeScheduleWithRequests`)**:
  - 관리자가 일정의 🟢 완료 버튼을 누를 때 교육 일자가 오늘 기준 지나지 않은 미래 날짜인 경우 *"일정이 도래하기 전입니다. 이 일정을 완료 처리하면 승인된 신청자도 모두 완료 처리됩니다. 진행하시겠습니까?"* 안내 팝업을 노출하고, 확인 시 해당 일정과 승인된 신청자 전체의 상태를 `'completed'`로 일괄 변경합니다.
- **일정 취소 (`cancelEducationScheduleWithRequests`)**:
  - 데이터 삭제 대신 일정 및 연관 신청자 전체의 상태를 `'cancelled'`로 전환하여 DB 이력을 안전하게 보존합니다.

---

## 2. 🖥️ 프론트엔드 관리자 아키텍처 (`EducationManagementPage.tsx`)

### ① 2단 헤더 & 캡슐형 필터 탭 UI
```
+-----------------------------------------------------------------------------------------+
| [교육 캘린더 관리]                                                       [+ 일정 등록]  |  <-- 1단: 메인 헤더
+-----------------------------------------------------------------------------------------+
| 상태 [ 예정 | 완료 | 취소 ]      종류 [ 전체 | 교육 | 세미나 ]                              |  <-- 2단: 캡슐형 탭
+-----------------------------------------------------------------------------------------+
```
- **상태 필터 (`statusFilter`)**: `scheduled`(예정) / `completed`(완료) / `cancelled`(취소)
- **종류 필터 (`typeFilter`)**: `all`(전체) / `education`(교육) / `seminar`(세미나)
- **제이시스 시그니처 컬러**: 활성 탭 버튼 배경색으로 `#21358d` (Navy) 적용.

---

### ② 미승인 신규 신청자 알림 (NEW 배지)
- `schedule.hasPendingApplicants === true` 인 경우:
  - 데이터 테이블 행 전체에 연한 붉은색 배경 (`bg-red-50/50`) 적용
  - 신청현황 및 신청자 관리 아이콘(📋) 상단에 **깜빡이는 붉은색 `NEW` 미니 배지** 및 핑(Ping) 애니메이션 표시

---

### ③ 신청자 관리 독립 화면 (`ApplicantsView`)
- 이메일 컬럼을 제외한 **8개 슬림 컬럼 구조** (`No.`, `병원명`, `담당자`, `연락처`, `신청일`, `메모`, `상태`, `처리`)
- **버튼 및 처리 액션**:
  - `pending` (대기중): **`[승인]`** (네이비 버튼 `style={{ backgroundColor: '#21358d' }}`) 및 **`[거절]`** (레드 테두리 버튼)
  - `scheduled` (확정): **`[승인 취소]`** (대기 상태 복귀)
- 상단 **`[목록으로 돌아가기]`** 버튼 클릭 시 관리자 목록으로 원활하게 복귀하며 상태 자동 최신화.

---

### ④ 일정 취소 아이콘 (`CalendarX`)
- 목록 우측 관리 컬럼에서 기존 휴지통 삭제 대신 **`CalendarX` (📅✖️ 일정 취소 전용 아이콘)**을 노출하여, 클릭 시 "선택한 일정을 취소 상태로 변경하시겠습니까?" 팝업과 함께 소프트 딜리트 진행.
