# Issues - fix-phone-number-registration

## Issues Log

## [2026-01-31T07:28:00Z] Task 3: Validation Middleware Disabled

### Issue Found
- **File**: `recommendation_server/src/routes/auth/index.ts` line 13
- **Problem**: Validation middleware is commented out: `// validateBody(RegisterSchema),`
- **Impact**: Registration without phone_number returns HTTP 500 DB error instead of HTTP 400 validation error

### Test Results
- ✅ Test 2 (with phone_number): **PASS** - Returns HTTP 200, user created
- ❌ Test 1 (without phone_number): **FAIL** - Returns HTTP 500 DB error, should be 400 validation

### Root Cause
The Joi validation infrastructure exists and is correct, but the middleware is not applied to the /register route.

### Recommendation
Uncomment line 13 to enable validation:
```typescript
router.post('/register', 
  validateBody(RegisterSchema),  // ← Enable this
  asyncHandle(authController.register)
);
```
