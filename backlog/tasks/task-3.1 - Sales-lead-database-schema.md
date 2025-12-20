---
id: task-3.1
title: Sales lead database schema
status: Done
assignee: []
created_date: '2025-12-20 19:49'
updated_date: '2025-12-20 20:48'
labels:
  - database
  - sales
dependencies: []
parent_task_id: task-3
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add database tables for sales lead CRM to lib/db/schema.ts
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 salesLeads table with fields: companyName, contactName, contactEmail, contactPhone, stage, estimatedValue, source, assignedTo, lostReason, wonDate
- [x] #2 salesLeadNotes table following applicationNotes pattern
- [x] #3 salesLeadActivityLog table for tracking interactions
- [x] #4 salesLeadSentEmails table for email history
- [x] #5 Type exports for all new tables (SalesLead, NewSalesLead, etc.)
<!-- AC:END -->
