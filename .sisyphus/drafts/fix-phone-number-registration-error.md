# Draft: Fix phone_number Registration Error (Option 2: Make Optional)

## Requirements (confirmed)
- **Error**: `Field 'phone_number' doesn't have a default value` on POST /api/v1/auth/register
- **Chosen Fix**: Make phone_number optional/nullable throughout the stack
- **Reason**: User preference - phone_number should NOT be a business requirement

## Research Findings

### Files Requiring Changes

| File | Current | Target Change |
|------|---------|---------------|
| **Migration (NEW)** | N/A | ALTER TABLE users MODIFY phone_number nullable, DROP UNIQUE |
| **Entity** | `phone_number!: string` | `phone_number?: string` + `nullable: true` |
| **Server SignupDto** | `phone_number?: string` | Keep as-is (already optional) |
| **Joi Validation** | `.required()` | `.optional()` |
| **AuthService.register** | Queries by `{ phone_number }` | Skip phone_number check if undefined |
| **Client SignupDto** | `phone_number?: string` | Keep as-is (already optional) |
| **UserListResponseDto** | `phone_number: string` | `phone_number?: string` |

### Critical Logic Issue in auth.service.ts

Lines 70-75 have a bug when phone_number is optional:
```typescript
const existingUser = await this.userRepository.findOne({
  where: [
    { email },
    { phone_number }  // BUG: If phone_number is undefined, this matches ALL users with NULL phone!
  ]
});
```

**Fix Required**:
```typescript
const whereConditions: any[] = [{ email }];
if (phone_number) {
  whereConditions.push({ phone_number });
}
const existingUser = await this.userRepository.findOne({
  where: whereConditions
});
```

### Database Considerations

1. **Remove UNIQUE constraint on phone_number** - Multiple NULLs would violate unique (in MySQL 5.7)
   - MySQL 8.0+ allows multiple NULLs in unique column, but older versions don't
   - Safest: Remove unique index on phone_number OR keep unique but handle NULLs specially

2. **Migration must**:
   - ALTER COLUMN to allow NULL
   - Optionally: DROP UNIQUE INDEX (if we want multiple users without phone)

### Decision: Unique Constraint
- **Option A**: Keep unique - Only one user can have NULL phone_number
- **Option B**: Drop unique - Multiple users can have NULL phone_number (more flexible)

**Recommended**: Option B - Drop unique, because:
- Multiple users registering without phone is valid use case
- Unique constraint with NULLs is database-version dependent
- If phone_number is truly optional, uniqueness doesn't make business sense

## Scope

### IN:
- Database migration (nullable + drop unique index)
- Entity update (nullable: true)
- Joi schema update (optional)
- AuthService logic fix (conditional phone_number check)
- DTO updates (optional types)

### OUT:
- Frontend form changes
- Login flow changes (already handles optional phone)
- Other endpoints using phone_number for profile updates (already handle optional)

## Technical Decisions
- **Chosen approach**: Option B - Full optional with no unique constraint
- **Migration strategy**: New migration file, not modifying existing
- **Backward compatibility**: Existing users with phone_number unaffected
