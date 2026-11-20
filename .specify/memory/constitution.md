# AEE Digital API Constitution

## Core Principles

### I. Preserve the Public API
Treat existing endpoints, request and response shapes, status codes, and
observable behavior as compatibility requirements. External DTOs generally use
UPPERCASE field names; domain models use camelCase. Keep these boundaries in
controllers, DTOs, and presenters, and make breaking changes explicit in the
feature specification.

### II. Respect the Layered Architecture
Follow the existing flow: Controller -> Application Service -> Domain
Repository -> Infrastructure. Keep business rules in application services,
repository contracts in the domain, and persistence details in infrastructure.
Inject repositories through the established tokens and reuse existing helpers
and patterns before introducing new abstractions.

### III. Verify Behavior with Focused Tests
Add or update focused unit and e2e tests for behavior introduced or changed by a
feature. Use the existing Jest setup and repository scripts, and run the
smallest relevant test command plus build or other checks required by the
change. Do not claim verification that was not run.

### IV. Protect Data and Runtime Boundaries
Keep credentials and environment-specific configuration out of source code.
Respect MongoDB and in-memory persistence behavior, existing persisted field
conventions, and the repository's operational safeguards. Do not target
production services or run data-changing operational scripts without explicit
authorization.

### V. Keep Changes Small and Failures Explicit
Implement the simplest change that fully meets the specified requirement.
Preserve established NestJS error handling and surface failures explicitly;
avoid silent fallbacks, unrelated cleanup, and new dependencies unless the
feature requires them.

## Technical Constraints

- The API uses NestJS, TypeScript, Fastify, Mongoose, and Jest.
- Preserve the Controller -> Application Service -> Domain Repository ->
  Infrastructure dependency direction.
- Maintain both Mongo and memory persistence implementations where applicable.
- Follow existing AWS Lambda and Terraform deployment conventions for
  infrastructure changes.
- Use existing scripts and test/build commands; avoid changing unrelated
  dependencies or generated deployment artifacts.

## Feature Workflow

For each new feature, create a specification before implementation. Resolve
important ambiguity, plan against the existing codebase, generate and analyze
tasks, implement the approved scope, and converge by checking for remaining
gaps. Review generated artifacts and code changes together. Use the existing
test and build commands to verify the result.

## Governance

This constitution guides feature specifications, plans, implementation, and
reviews. If a feature requires an exception, state and justify it in its
specification or plan. Amend this document only when an enduring project
convention changes.

**Version**: 1.0.0 | **Ratified**: 2026-11-20 | **Last Amended**: 2026-11-20
