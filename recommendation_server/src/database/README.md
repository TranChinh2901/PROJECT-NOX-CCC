## Database Source Of Truth

- Runtime datasource and active migration history live under `src/database`.
- The active migration directory is `src/database/migrations`.
- `src/migrations` is legacy history from an older schema-generation workflow and is not the current source of truth for new schema work.

## Recommended Workflow

1. Set `DATABASE_TYPE` explicitly.
2. Run `npm run migration:run` to apply active migrations.
3. Run `npm run schema:drift` to check entity metadata against the current database.
4. Add or update migrations under `src/database/migrations` only.

## Driver Notes

- Use `DATABASE_TYPE=mariadb` for MariaDB servers.
- Use `DATABASE_TYPE=mysql` for MySQL servers.
