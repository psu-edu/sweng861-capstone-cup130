# Database Migrations

Campus Rental uses explicit PostgreSQL SQL migrations.

Migration files must:

- Use the `.sql` extension.
- Begin with a sequential numeric prefix.
- Use descriptive lowercase names separated by underscores.
- Remain immutable after they have been applied.

Example:

```text
0001_create_users.sql
0002_create_housing_inventory.sql
0003_create_housing_applications.sql
```

Migrations are applied in filename order.

Each migration is executed inside a PostgreSQL transaction. Successfully applied migrations are recorded in the `schema_migrations` infrastructure table along with a SHA-256 checksum.

Do not edit an applied migration. Create a new migration instead.