---
id: task-2.1
title: Employee database schema
status: Done
assignee: []
created_date: '2025-12-20 19:49'
updated_date: '2025-12-20 20:44'
labels:
  - database
  - employees
dependencies: []
parent_task_id: task-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add database tables for employee management to lib/db/schema.ts
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 employees table with all HR fields (name, email, department, role, hireDate, salary, benefits JSON, emergency contact, address JSON, status)
- [x] #2 employeeDocuments table for file uploads
- [x] #3 employeeNotes table following applicationNotes pattern
- [x] #4 employeeActivityLog table for tracking changes
- [x] #5 employeeSentEmails table for email history
- [x] #6 Type exports for all new tables (Employee, NewEmployee, etc.)
<!-- AC:END -->
