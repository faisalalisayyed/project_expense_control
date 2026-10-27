# Project Expense Control

A role-based expense management and approval workflow application designed to improve expense verification, enforce approval policies, identify exceptions, and maintain accountability throughout the review process.

**Repository:** [faisalalisayyed/project_expense_control](https://github.com/faisalalisayyed/project_expense_control)

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [User Roles](#user-roles)
- [Expense Approval Workflow](#expense-approval-workflow)
- [Exception Handling](#exception-handling)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Running the Application](#running-the-application)
- [Testing and Verification](#testing-and-verification)
- [Future Improvements](#future-improvements)
- [Author](#author)

## Overview

Project Expense Control provides a structured process for submitting, reviewing, and approving business expense claims.

The application separates responsibilities across four roles: Requester, Project Manager, Finance Reviewer, and Operations Manager. It is designed to support approval policies, evidence validation, exception investigation, and traceable decision-making.

The goal is to make the expense process more transparent and reliable while ensuring that exceptions receive appropriate human review.

## Key Features

- **Role-based access:** Separate interfaces and permissions for different responsibilities.
- **Expense submission:** A workflow for submitting expense claims and supporting information.
- **Approval routing:** Routes claims through the appropriate reviewers.
- **Conditional authorization:** Supports additional Operations review for claims exceeding SAR 1,000, according to the configured policy.
- **Exception detection:** Designed to flag missing information, evidence issues, potential duplicates, and inconsistencies.
- **Human review:** Provides a basis for investigating flagged claims instead of relying exclusively on automatic decisions.
- **Auditability:** Intended to record submissions and approval decisions for traceability.
- **Internationalization:** English and Arabic interface support, including right-to-left (RTL) layout.
- **Persistent storage:** SQLite database with direct SQL queries.

## Technology Stack

| Component | Technology |
|---|---|
| Application framework | Next.js App Router |
| Programming language | JavaScript / JSX |
| Runtime and package manager | Bun |
| Database | SQLite |
| Database access | Direct SQL; no ORM or Prisma |
| Authentication | Session-based authentication |
| Interface | Role-specific dashboards |
| Localization | English and Arabic, including RTL support |

## User Roles

### 1. Requester
- Submits expense claims.
- Provides expense details and supporting evidence.
- Responds to requests for clarification where supported by the workflow.
- Tracks the status of submitted claims.

### 2. Project Manager (PM)
- Reviews submitted claims.
- Evaluates expense details and available evidence.
- Approves, rejects, or requests clarification according to implemented workflow rules.
- Routes claims requiring additional authorization.

### 3. Operations Manager
- Reviews claims that require additional operational authorization.
- Makes a separate authorization decision where the policy requires it.
- Provides an additional control before Finance review.

### 4. Finance Reviewer
- Reviews claims that reach the Finance stage.
- Evaluates supporting information and relevant exceptions.
- Records a finance decision according to the implemented workflow.
- Keeps approval decisions separate from payment execution.

## Expense Approval Workflow

### Standard claim

Requester → Project Manager → Finance Reviewer

### Claim exceeding SAR 1,000

Requester → Project Manager → Operations Manager → Finance Reviewer

The exact routing depends on the configured business rules and the claim's review outcome.

**Important control:** Approval is not the same as payment. An approved claim must not automatically be treated as paid. Payment status should be recorded separately when that functionality is implemented.

## Exception Handling

The application is being developed to identify and handle the following scenarios:

| Reference | Scenario | Expected control |
|---|---|---|
| R01–R02 | Standard expense submissions and approvals | Validate the normal workflow |
| R03 | Potential duplicate expense | Flag for investigation |
| R04 | Claim exceeding SAR 1,000 | Require additional authorization |
| R05 | Missing project information | Flag incomplete information |
| R06–R07 | Potentially related purchases | Flag for further investigation |
| R08 | Missing receipt or evidence | Route for clarification or human review |
| R09 | Currency mismatch | Flag inconsistent currency information |
| R10 | Arithmetic or total mismatch | Flag the discrepancy for review |

These references describe the intended assessment scenarios, not a claim that every scenario has passed testing.

An exception should not automatically result in rejection unless an explicit business rule requires that outcome. Where appropriate, the system should preserve the claim and route it for human investigation.

## Prerequisites

Install the following software before starting:

- **Git:** To clone the repository.
- **Bun:** To install dependencies and run project scripts.
- **A modern browser:** Chrome, Firefox, or another compatible browser.

Official resources:

- [Git](https://git-scm.com/downloads)
- [Bun installation guide](https://bun.sh/docs/installation)
- [Next.js documentation](https://nextjs.org/docs)

## Installation and Setup

### Step 1: Clone the repository

Open a terminal and run:

```bash
git clone https://github.com/faisalalisayyed/project_expense_control.git
cd project_expense_control
```

### Step 2: Install dependencies

From the repository root, run:

```bash
bun install
```

This installs the dependencies defined by the project.

### Step 4: Configure environment variables

Check the repository for `.env.example` in the source code.

If the project provides an example environment file, copy it using the filename specified by the project or rename the file to .env:

```bash
cp .env.example .env
```

### Step 5: Prepare the SQLite database

```bash
bun run dev
```

in another terminal run below command to seed te user login

```bash
bun scripts/seed.js
bun scripts/setup-expenses.js
bun scripts/setup-exceptions.js
```

## Running the Application

```bash
bun run dev
```

Open the local URL printed by the terminal. With the standard Next.js development configuration, this is usually:

http://localhost:3000

To stop the development server, press `Ctrl+C` in the terminal.

If the server fails to start, review the terminal output, environment configuration, dependency versions, and database setup.

## Testing and Verification

Before presenting the application as complete, test each workflow using authorized test accounts.

### Role and workflow checks

- [x] Requester can submit an expense claim.
- [x] PM can review the submitted claim.
- [x] Claims above SAR 1,000 follow the required Operations authorization path.
- [x] Finance can review claims that reach the Finance stage.
- [x] Unauthorized roles cannot perform restricted actions.
- [x] Approval and payment remain separate states.

### Exception checks

- [x] Potential duplicates are detected and routed appropriately.
- [x] Missing project information is flagged.
- [x] Missing receipts trigger the required clarification or review process.
- [x] Currency and total mismatches are identified.
- [x] Potentially related purchases can be investigated.
- [x] Exceptions do not bypass required approvals.

### Audit-trail checks

- [x] Expense submission events are persisted.
- [x] PM decisions are persisted.
- [x] Operations decisions are persisted where required.
- [x] Finance decisions are persisted.
- [x] Events include sufficient information to establish who acted and when.
- [x] Approval does not automatically record payment.

### Interface checks

- [x] Role-specific dashboards display the appropriate information.
- [x] English interface works correctly.
- [x] Arabic interface uses appropriate RTL layout.
- [x] Forms, navigation, and tables remain usable at common screen sizes.

## Future Improvements

Potential improvements include:

- Complete audit logging and decision history.
- Improve exception investigation and clarification workflows.
- Add comprehensive automated tests for all assessment scenarios.
- Improve reviewer visibility into outstanding claims.
- Strengthen input validation and server-side access controls.
- Document database backup and recovery procedures.
- Complete end-to-end English and Arabic RTL testing.
- Prepare deployment instructions and a reproducible demonstration environment.

## Author

**Faisal Ali Sayyed**

Developer — Project Expense Control

GitHub: [@faisalalisayyed](https://github.com/faisalalisayyed)

Repository: [Project Expense Control](https://github.com/faisalalisayyed/project_expense_control)

---
