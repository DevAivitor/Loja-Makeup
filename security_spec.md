# Security Spec

## Data Invariants
1. Products can be read by anyone, but only created, updated, or deleted by the admin (`vitorsori4@gmail.com`).
2. Categories can be read by anyone, but only created, updated, or deleted by the admin.
3. Settings can be read by anyone, but only created, updated, or deleted by the admin.
4. Orders can be created by anyone (anonymous or unauthenticated customers), but only read, updated, or deleted by the admin.

## Dirty Dozen Payloads
1. Create product as non-admin -> PERMISSION_DENIED
2. Update product as non-admin -> PERMISSION_DENIED
3. Delete product as non-admin -> PERMISSION_DENIED
4. Create category as non-admin -> PERMISSION_DENIED
5. Update category as non-admin -> PERMISSION_DENIED
6. Delete category as non-admin -> PERMISSION_DENIED
7. Create setting as non-admin -> PERMISSION_DENIED
8. Update setting as non-admin -> PERMISSION_DENIED
9. Delete setting as non-admin -> PERMISSION_DENIED
10. Read order as non-admin -> PERMISSION_DENIED
11. Update order as non-admin -> PERMISSION_DENIED
12. Create order with invalid schema -> PERMISSION_DENIED
