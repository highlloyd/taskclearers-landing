---
id: task-2.2
title: Employee API routes
status: Done
assignee: []
created_date: '2025-12-20 19:49'
updated_date: '2025-12-20 20:44'
labels:
  - api
  - employees
dependencies: []
parent_task_id: task-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create API endpoints for employee CRUD operations, notes, documents, and emails
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 /api/admin/employees - GET (list with filters) and POST (create)
- [x] #2 /api/admin/employees/[id] - GET, PATCH, DELETE
- [x] #3 /api/admin/employees/[id]/notes - GET, POST, DELETE
- [x] #4 /api/admin/employees/[id]/documents - GET, POST, DELETE
- [x] #5 /api/admin/employees/[id]/emails - GET, POST
- [x] #6 /api/admin/employees/from-application - POST (convert hired applicant)
- [x] #7 All routes protected with appropriate permissions
<!-- AC:END -->
