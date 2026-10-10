# Migration order

1. `202610070001_original_baseline` represents the uploaded original schema.
2. `202610070002_audit_repairs` adds the repaired domain fields and tables, distrusts legacy client-controlled verification flags, marks old refunds UNKNOWN, and adds constraints.

Read ../../SETUP.md before applying these to an existing database. A fresh database executes both. An existing database that exactly matches the original baseline records only that baseline as applied, then executes the repair migration. Preserve backups and rehearse upgrades. Do not reset existing records.

Plain PostgreSQL 16 is sufficient. Availability is serialized with property row locks and explicit room-capacity checks. A blanket exclusion constraint would be inappropriate for room types with multiple units.
