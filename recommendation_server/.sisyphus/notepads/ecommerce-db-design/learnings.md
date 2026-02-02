# Entity Testing Patterns - Learnings

## Successful Patterns

### Test Structure
- Group tests by concern: Schema Validation, Unique Constraints, Field Constraints, Timestamps, Business Logic, Edge Cases
- Use descriptive test names that explain business intent
- Test both positive and negative cases

### Common Test Categories
1. **Schema Validation**: Required fields, nullable fields, default values
2. **Unique Constraints**: Enforce uniqueness where needed
3. **Field Constraints**: Max lengths, data types
4. **Timestamp Fields**: created_at, updated_at, deleted_at
5. **Business Logic**: State transitions, validation rules
6. **Relationships**: Foreign keys, OneToMany, ManyToOne
7. **Edge Cases**: Boundary values, empty strings, maximum lengths

### String Length Testing Gotcha
When testing max string lengths with concatenation:
- Calculate base string length first: `'https://example.com/'.length` = 20
- To get 255 total: repeat count = 255 - base_length
- Example: `'https://example.com/' + 'a'.repeat(235)` = 255 chars

### Floating Point Arithmetic
Use `.toFixed(2)` and `Number()` wrapper for decimal calculations:
```typescript
const discount = Number((comparePrice - basePrice).toFixed(2));
```

## Test Count Per Entity
- Simple entities (Brand, Warehouse): 24-32 tests
- Medium complexity (Category, Product): 21-42 tests  
- Complex entities (Cart, CartItem): 40-41 tests

## Time Estimates
- Simple entity test creation: ~5-10 minutes
- Medium entity: ~10-15 minutes
- Complex entity: ~15-20 minutes
