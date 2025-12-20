---
id: task-1
title: 'Foundation: Add permissions and navigation for new features'
status: Done
assignee: []
created_date: '2025-12-20 19:48'
updated_date: '2025-12-20 19:56'
labels:
  - foundation
  - permissions
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Set up the foundation for Employee Management and Sales Lead CRM features by adding new permissions and sidebar navigation items. This must be completed first as other features depend on it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 New permissions added to lib/auth/permissions.ts: VIEW_EMPLOYEES, MANAGE_EMPLOYEES, VIEW_SALES_LEADS, MANAGE_SALES_LEADS
- [x] #2 Permission groups updated: Employees and Sales groups defined
- [x] #3 Permission labels added for UI display
- [x] #4 Route permissions added to middleware.ts for /admin/employees and /admin/sales
- [x] #5 Sidebar navigation updated with Employees and Sales nav items (with appropriate icons)
- [x] #6 Database schema pushed with npm run db:push
<!-- AC:END -->
