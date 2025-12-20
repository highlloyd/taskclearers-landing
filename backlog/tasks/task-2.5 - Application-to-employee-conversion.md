---
id: task-2.5
title: Application to employee conversion
status: Done
assignee: []
created_date: '2025-12-20 19:49'
updated_date: '2025-12-20 20:51'
labels:
  - workflow
  - employees
dependencies: []
parent_task_id: task-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement workflow to convert hired applicants to employee records
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 When application status changes to hired, prompt to create employee
- [x] #2 Employee creation form pre-filled with application data (name, email, phone)
- [x] #3 Employee record links back to original application via applicationId
- [x] #4 Application detail page shows link to employee record if converted
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified completed: Convert to Employee button in ApplicationActions.tsx (line 232-240), employee new page with fromApplication query param support, applicationId linking in place
<!-- SECTION:NOTES:END -->
