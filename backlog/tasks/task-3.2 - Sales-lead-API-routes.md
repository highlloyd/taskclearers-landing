---
id: task-3.2
title: Sales lead API routes
status: Done
assignee: []
created_date: '2025-12-20 19:49'
updated_date: '2025-12-20 21:03'
labels:
  - api
  - sales
dependencies: []
parent_task_id: task-3
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create API endpoints for sales lead CRUD operations, notes, and emails
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 /api/admin/sales-leads - GET (list with filters) and POST (create)
- [x] #2 /api/admin/sales-leads/[id] - GET, PATCH, DELETE
- [x] #3 /api/admin/sales-leads/[id]/notes - GET, POST, DELETE
- [x] #4 /api/admin/sales-leads/[id]/emails - GET, POST
- [x] #5 All routes protected with appropriate permissions
- [x] #6 Stage changes logged to activity log automatically
<!-- AC:END -->
