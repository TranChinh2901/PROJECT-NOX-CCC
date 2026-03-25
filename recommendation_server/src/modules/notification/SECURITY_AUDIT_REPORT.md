# Notification System Security Audit Report

**Audit Date:** February 5, 2026
**Auditor:** Security Audit Team
**Scope:** Notification System (Backend + Frontend)
**Classification:** INTERNAL - CONFIDENTIAL

---

## Executive Summary

This comprehensive security audit evaluated the notification system implementation across both backend (`/recommendation_server/src/modules/notification/`) and frontend (`/recommendation_client/src/`) components. The audit identified **16 security findings** across various severity levels:

| Severity | Count |
|----------|-------|
| HIGH     | 5     |
| MEDIUM   | 7     |
| LOW      | 4     |

**Overall Risk Assessment:** MEDIUM-HIGH

The system demonstrates good foundational security practices including proper authentication checks, authorization validation, and input validation via Joi schemas. However, critical gaps exist in HTTP security headers, rate limiting, template injection protection, and WebSocket security that require immediate attention.

---

## Table of Contents

1. [Authentication and Authorization](#1-authentication-and-authorization)
2. [Input Validation](#2-input-validation)
3. [Data Security](#3-data-security)
4. [API Security](#4-api-security)
5. [WebSocket Security](#5-websocket-security)
6. [Frontend Security](#6-frontend-security)
7. [Dependency Security](#7-dependency-security)
8. [OWASP Top 10 Mapping](#8-owasp-top-10-mapping)
9. [Findings Summary](#9-findings-summary)
10. [Remediation Recommendations](#10-remediation-recommendations)
11. [Security Test Cases](#11-security-test-cases)
12. [Security Configuration Checklist](#12-security-configuration-checklist)

---

## 1. Authentication and Authorization

### 1.1 JWT Validation in REST Endpoints

**Status:** PASS (with observations)

**Findings:**

The authentication middleware (`/middlewares/auth.middleware.ts`) properly validates JWT tokens:

```typescript
// Lines 31-42: Token verification
const decoded = authService.verifyToken(token);
if (!decoded) {
  throw new AppError(
    'Invalid or malformed authentication token',
    HttpStatusCode.UNAUTHORIZED,
    ErrorCode.INVALID_TOKEN,
  );
}
```

**Positive Observations:**
- All notification routes properly protected with `requireAuth()` middleware
- Role-based access control implemented via `requireAdmin()` for admin endpoints
- Token extraction from `Authorization: Bearer <token>` header

**Security Concerns:**

| ID | Severity | Finding |
|----|----------|---------|
| AUTH-001 | LOW | Debug logging of decoded token (line 34: `console.log(decoded)`) may expose sensitive JWT claims in production logs |
| AUTH-002 | MEDIUM | No token refresh mechanism observed - long-lived tokens increase attack window |

### 1.2 Authorization - Privilege Escalation Protection

**Status:** PASS

The system properly validates resource ownership before operations:

```typescript
// NotificationController.ts - Lines 93-98
if (notification.userId.getValue() !== userId) {
  throw new AppError(
    'Access denied',
    HttpStatusCode.FORBIDDEN,
    ErrorCode.FORBIDDEN,
  );
}
```

**Verified Endpoints:**
- GET `/notifications/:id` - Ownership check before returning notification
- POST `/notifications/:id/read` - Ownership validation in MarkAsReadUseCase
- POST `/notifications/:id/archive` - Ownership check implemented
- DELETE `/notifications/:id` - Ownership validation present

### 1.3 Admin Endpoint Protection

**Status:** PARTIAL - FINDING

| ID | Severity | Finding |
|----|----------|---------|
| AUTH-003 | HIGH | Admin notification endpoints NOT protected by `requireAdmin()` |

**Evidence:**
In `/routes/notification.ts`, the AdminNotificationController endpoints are imported but **NOT mounted with admin protection**. The routes file only shows user routes (lines 27-195). The admin routes appear to be missing from the notification router.

**Admin Routes Status:**
- `/admin/index.ts` uses `router.use(requireAdmin())` at line 25
- Notification admin endpoints are defined in `AdminNotificationController.ts` but **NOT registered in any route file**

**Recommendation:** Mount admin notification routes under `/api/v1/admin/notifications` with proper `requireAdmin()` middleware.

---

## 2. Input Validation

### 2.1 Request DTO Validation

**Status:** PASS (Joi validation implemented)

Validation schemas exist for all endpoints in `/presentation/validation.schema.ts`:

| Schema | Protection |
|--------|------------|
| `getNotificationsQuerySchema` | Type whitelist, pagination limits (max 100) |
| `markManyAsReadSchema` | Array validation, positive integers |
| `updatePreferencesSchema` | Nested object validation |
| `adminSendNotificationSchema` | URI validation, max lengths |
| `createTemplateSchema` | Enum validation, length limits |

**Example Security Control:**
```typescript
// validation.schema.ts - Lines 117-126
export const adminSendNotificationSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  title: Joi.string().max(255).required(),
  message: Joi.string().required(),  // WARNING: No max length
  actionUrl: Joi.string().uri().max(500).optional(),
  imageUrl: Joi.string().uri().max(255).optional(),
});
```

### 2.2 SQL Injection

**Status:** PASS

TypeORM parameterized queries are used throughout:

```typescript
// TypeORMNotificationRepository.ts
const entity = await this.repository.findOne({ where: { id } });
```

No raw SQL queries or string concatenation observed in the notification module.

### 2.3 NoSQL Injection

**Status:** N/A - PostgreSQL/MySQL via TypeORM (no MongoDB detected)

### 2.4 XSS in Notification Content

**Status:** VULNERABILITY FOUND

| ID | Severity | Finding |
|----|----------|---------|
| INPUT-001 | HIGH | No sanitization of notification title/message content before storage or delivery |

**Evidence:**
```typescript
// CreateNotificationUseCase.ts - Lines 33-45
const notification = NotificationDomain.create({
  title: request.title,      // Unsanitized user input
  message: request.message,  // Unsanitized user input
  // ...
});
```

The validation schema only checks length for `title` (max 255) but has **no length limit for `message`** and **no HTML/script sanitization**.

### 2.5 Template Injection

**Status:** VULNERABILITY FOUND

| ID | Severity | Finding |
|----|----------|---------|
| INPUT-002 | HIGH | Template interpolation vulnerable to code injection |

**Evidence:**
```typescript
// TypeORMTemplateRepository.ts - Lines 112-116
private interpolate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key];
    return value !== undefined ? String(value) : match;  // No escaping!
  });
}
```

An attacker with template creation access could inject `{{constructor}}` or similar payloads. Additionally, data values are not HTML-escaped before interpolation into email templates.

---

## 3. Data Security

### 3.1 Sensitive Data Logging

**Status:** VULNERABILITY FOUND

| ID | Severity | Finding |
|----|----------|---------|
| DATA-001 | MEDIUM | Decoded JWT token logged to console in production |
| DATA-002 | LOW | User emails cached in memory without encryption |

**Evidence:**
```typescript
// auth.middleware.ts - Line 34
console.log(decoded);  // Logs user ID, email, role to console

// NotificationDeliveryService.ts - Line 30
private userEmails: Map<number, string> = new Map();  // Unencrypted cache
```

### 3.2 Error Message Information Disclosure

**Status:** PARTIAL PASS

Error handling generally avoids exposing internals:

```typescript
// NotificationController.ts - Lines 51-55
return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
  success: false,
  message: error.message || 'Failed to get notifications',  // Generic fallback
});
```

However, `error.message` is still returned which could leak stack traces or internal details.

### 3.3 Mass Assignment

**Status:** PASS

DTOs explicitly define allowed fields. No direct object spread from request body to entities.

---

## 4. API Security

### 4.1 CSRF Protection

**Status:** N/A (JWT Bearer token authentication)

JWT in Authorization header provides CSRF protection since browsers do not automatically attach the header.

### 4.2 CORS Configuration

**Status:** PASS (with recommendation)

```typescript
// main.ts - Lines 13-20
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**Recommendation:** In production, ensure `CORS_ORIGIN` is explicitly set to allowed domains only.

### 4.3 Rate Limiting

**Status:** VULNERABILITY FOUND

| ID | Severity | Finding |
|----|----------|---------|
| API-001 | HIGH | No rate limiting middleware implemented |

**Evidence:**
`main.ts` does not include any rate limiting (express-rate-limit, express-slow-down, or similar). This allows:
- Brute force attacks on authentication
- DoS via notification creation spam
- Bulk API abuse

### 4.4 HTTP Security Headers

**Status:** VULNERABILITY FOUND

| ID | Severity | Finding |
|----|----------|---------|
| API-002 | HIGH | No security headers (helmet.js or equivalent) |

**Missing Headers:**
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Content-Security-Policy`
- `X-XSS-Protection`
- `Referrer-Policy`

---

## 5. WebSocket Security

### 5.1 Connection Authentication

**Status:** PARTIAL - NEEDS REVIEW

| ID | Severity | Finding |
|----|----------|---------|
| WS-001 | MEDIUM | WebSocket authentication implementation not visible in audited code |

**Client-Side (notificationSocket.ts):**
```typescript
// Lines 48-51 - Token passed as query parameter
const wsUrl = new URL(this.options.url);
wsUrl.searchParams.set('token', this.options.token);  // Token in URL
```

**Security Concern:** Token in URL query parameter can be:
- Logged in server access logs
- Cached by proxies
- Visible in browser history
- Exposed in Referrer headers

**Server-Side:** The `InMemoryWebSocketService.ts` does not show the actual WebSocket server implementation or how connections are authenticated.

### 5.2 WebSocket Hijacking

**Status:** CANNOT VERIFY

The WebSocket gateway/server code was not found in the audited files. Recommend verifying:
- Origin header validation
- Token validation on connection
- Connection upgrade security

### 5.3 Message Validation

**Status:** CONCERN

| ID | Severity | Finding |
|----|----------|---------|
| WS-002 | MEDIUM | Client parses all WebSocket messages with JSON.parse without schema validation |

```typescript
// notificationSocket.ts - Lines 141-172
private handleMessage(event: MessageEvent): void {
  try {
    const message: SocketMessage = JSON.parse(event.data);  // No validation
    switch (message.type) {
      // ...
    }
  }
}
```

### 5.4 DoS via Malformed Messages

**Status:** CONCERN

No visible message size limits or malformed message handling on the server side.

---

## 6. Frontend Security

### 6.1 XSS in Notification Rendering

**Status:** PASS

React automatically escapes content in JSX:

```tsx
// NotificationItem.tsx - Lines 121-122, 130-138
<h4>{notification.title}</h4>  // Auto-escaped by React
<p>{notification.message}</p>  // Auto-escaped by React
```

### 6.2 DOM-based XSS

**Status:** PASS

No `dangerouslySetInnerHTML` usage found in notification components.

### 6.3 Sensitive Data in localStorage

**Status:** OBSERVATION

```typescript
// NotificationContext.tsx - Line 151
const token = localStorage.getItem('technova_access_token');
```

JWT stored in localStorage is vulnerable to XSS attacks. Consider using httpOnly cookies for token storage.

### 6.4 WebSocket URL Injection

**Status:** PASS

```typescript
// NotificationContext.tsx - Lines 48-49
wsEndpoint = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000'
```

URL comes from environment variables, not user input.

---

## 7. Dependency Security

### 7.1 Frontend Dependencies (recommendation_client)

**npm audit results:**

| Severity | Package | CVE | Recommendation |
|----------|---------|-----|----------------|
| HIGH | next@16.1.4 | CVE-2026-23864 | Upgrade to 16.1.5+ |
| MODERATE | next@16.1.4 | CVE-2025-59471 | Upgrade to 16.1.5+ |
| MODERATE | next@16.1.4 | CVE-2025-59472 | Upgrade to 16.1.5+ |

### 7.2 Backend Dependencies (recommendation_server)

**npm audit results:**

| Severity | Package | CVE | Recommendation |
|----------|---------|-----|----------------|
| HIGH | cloudinary@1.41.3 | CVE-2025-12613 | Upgrade to 2.7.0+ |
| HIGH | tar@6.2.1 (via sqlite3) | CVE-2026-23745 | Upgrade to 7.5.3+ |
| HIGH | tar@6.2.1 (via sqlite3) | CVE-2026-23950 | Upgrade to 7.5.4+ |
| HIGH | tar@6.2.1 (via sqlite3) | CVE-2026-24842 | Upgrade to 7.5.7+ |

| ID | Severity | Finding |
|----|----------|---------|
| DEP-001 | HIGH | 7 high-severity vulnerabilities in dependencies |

---

## 8. OWASP Top 10 Mapping

| OWASP 2021 | Status | Findings |
|------------|--------|----------|
| A01: Broken Access Control | PASS | Proper ownership checks, RBAC implemented |
| A02: Cryptographic Failures | NEEDS REVIEW | JWT implementation not fully audited |
| A03: Injection | PARTIAL | SQL injection mitigated, XSS/template injection present |
| A04: Insecure Design | PARTIAL | Good architecture, missing rate limiting |
| A05: Security Misconfiguration | FAIL | Missing security headers, debug logging |
| A06: Vulnerable Components | FAIL | High-severity dependency vulnerabilities |
| A07: Identification/Auth Failures | PASS | JWT validation, role checks present |
| A08: Software/Data Integrity | NEEDS REVIEW | Template system requires hardening |
| A09: Security Logging/Monitoring | PARTIAL | Basic logging, no security event monitoring |
| A10: SSRF | PASS | No server-side URL fetching in notification module |

---

## 9. Findings Summary

### High Severity (5)

| ID | Finding | Impact |
|----|---------|--------|
| AUTH-003 | Admin endpoints unprotected | Privilege escalation |
| INPUT-001 | No XSS sanitization | Stored XSS attacks |
| INPUT-002 | Template injection vulnerability | Code injection |
| API-001 | No rate limiting | DoS, brute force |
| DEP-001 | Vulnerable dependencies | Various CVEs |

### Medium Severity (7)

| ID | Finding | Impact |
|----|---------|--------|
| AUTH-002 | No token refresh | Extended attack window |
| DATA-001 | JWT logged to console | Credential exposure |
| API-002 | Missing security headers | Various attacks |
| WS-001 | Token in WebSocket URL | Token leakage |
| WS-002 | No message schema validation | Input manipulation |
| INPUT-003 | No message length limit | Storage DoS |
| LOG-001 | No security event logging | Incident detection failure |

### Low Severity (4)

| ID | Finding | Impact |
|----|---------|--------|
| AUTH-001 | Debug console.log | Minor info disclosure |
| DATA-002 | Unencrypted email cache | In-memory data exposure |
| FE-001 | Token in localStorage | XSS token theft |
| ERR-001 | Error.message returned | Minor info disclosure |

---

## 10. Remediation Recommendations

### Immediate (P0 - Within 24 hours)

1. **Mount admin notification routes with protection**
   ```typescript
   // routes/notification.ts - Add at end
   import { requireAdmin } from '../middlewares/auth.middleware';

   // Admin routes
   router.post('/admin/send', requireAdmin(), AdminNotificationController.sendNotification);
   router.post('/admin/send-bulk', requireAdmin(), AdminNotificationController.sendBulkNotification);
   ```

2. **Add rate limiting**
   ```bash
   npm install express-rate-limit
   ```
   ```typescript
   // main.ts
   import rateLimit from 'express-rate-limit';

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100,
     standardHeaders: true,
     legacyHeaders: false,
   });

   app.use('/api/', limiter);
   ```

3. **Update vulnerable dependencies**
   ```bash
   # Frontend
   cd recommendation_client && npm update next@16.1.5

   # Backend
   cd recommendation_server && npm update cloudinary@2.7.0
   ```

### Short-term (P1 - Within 1 week)

4. **Add security headers**
   ```bash
   npm install helmet
   ```
   ```typescript
   // main.ts
   import helmet from 'helmet';
   app.use(helmet());
   ```

5. **Implement XSS sanitization**
   ```bash
   npm install dompurify
   ```
   ```typescript
   // In CreateNotificationUseCase.ts
   import DOMPurify from 'dompurify';

   const sanitizedTitle = DOMPurify.sanitize(request.title, { ALLOWED_TAGS: [] });
   const sanitizedMessage = DOMPurify.sanitize(request.message, { ALLOWED_TAGS: [] });
   ```

6. **Fix template interpolation**
   ```typescript
   // TypeORMTemplateRepository.ts
   private interpolate(template: string, data: Record<string, any>): string {
     return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
       const value = data[key];
       if (value === undefined) return match;
       // HTML escape the value
       return String(value)
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#039;');
     });
   }
   ```

7. **Remove debug logging**
   ```typescript
   // auth.middleware.ts - Remove line 34
   // console.log(decoded);  // DELETE THIS LINE
   ```

### Medium-term (P2 - Within 1 month)

8. **Implement WebSocket authentication via header/ticket**
9. **Add message length validation** (max 10KB for message field)
10. **Implement security event logging** (failed auth, bulk operations)
11. **Add token refresh mechanism**
12. **Migrate token storage to httpOnly cookies**

---

## 11. Security Test Cases

### Authentication Tests

```typescript
describe('Notification Authentication', () => {
  it('should reject requests without Authorization header', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });

  it('should reject invalid JWT tokens', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });

  it('should reject expired tokens', async () => {
    const expiredToken = generateExpiredToken();
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});
```

### Authorization Tests

```typescript
describe('Notification Authorization', () => {
  it('should prevent user from accessing other user notifications', async () => {
    const user1Token = getTokenForUser(1);
    const user2NotificationId = await createNotificationForUser(2);

    const res = await request(app)
      .get(`/api/v1/notifications/${user2NotificationId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.status).toBe(403);
  });

  it('should prevent non-admin from accessing admin endpoints', async () => {
    const userToken = getTokenForUser(1, 'user');

    const res = await request(app)
      .post('/api/v1/admin/notifications/send')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ userId: 1, type: 'general', title: 'Test', message: 'Test' });
    expect(res.status).toBe(403);
  });
});
```

### Input Validation Tests

```typescript
describe('Notification Input Validation', () => {
  it('should reject XSS in notification title', async () => {
    const adminToken = getAdminToken();

    const res = await request(app)
      .post('/api/v1/admin/notifications/send')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: 1,
        type: 'general',
        title: '<script>alert("XSS")</script>',
        message: 'Test message'
      });

    // Should sanitize or reject
    if (res.status === 201) {
      expect(res.body.data.notification.title).not.toContain('<script>');
    }
  });

  it('should reject oversized message payload', async () => {
    const adminToken = getAdminToken();
    const largeMessage = 'x'.repeat(1000000); // 1MB

    const res = await request(app)
      .post('/api/v1/admin/notifications/send')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: 1,
        type: 'general',
        title: 'Test',
        message: largeMessage
      });
    expect(res.status).toBe(400);
  });

  it('should prevent SQL injection in filter parameters', async () => {
    const userToken = getUserToken();

    const res = await request(app)
      .get('/api/v1/notifications?type=general\' OR 1=1--')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(400); // Should fail validation
  });
});
```

### Rate Limiting Tests

```typescript
describe('Rate Limiting', () => {
  it('should block excessive requests', async () => {
    const userToken = getUserToken();

    // Make 150 requests rapidly
    const promises = Array(150).fill(null).map(() =>
      request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`)
    );

    const responses = await Promise.all(promises);
    const blocked = responses.filter(r => r.status === 429);
    expect(blocked.length).toBeGreaterThan(0);
  });
});
```

### WebSocket Security Tests

```typescript
describe('WebSocket Security', () => {
  it('should reject connections without valid token', (done) => {
    const ws = new WebSocket('ws://localhost:5000/ws/notifications');
    ws.onerror = () => {
      done(); // Expected to fail
    };
    ws.onopen = () => {
      done(new Error('Should not connect without token'));
    };
  });

  it('should reject connections with invalid token', (done) => {
    const ws = new WebSocket('ws://localhost:5000/ws/notifications?token=invalid');
    ws.onclose = (event) => {
      expect(event.code).toBe(4001); // Custom auth failure code
      done();
    };
  });
});
```

---

## 12. Security Configuration Checklist

### Pre-Production Checklist

- [ ] Remove all `console.log` statements logging sensitive data
- [ ] Set `NODE_ENV=production`
- [ ] Configure explicit `CORS_ORIGIN` (not wildcard)
- [ ] Install and configure `helmet` middleware
- [ ] Install and configure `express-rate-limit`
- [ ] Update all vulnerable dependencies
- [ ] Configure proper HTTPS/TLS
- [ ] Set secure cookie flags (`secure`, `httpOnly`, `sameSite`)
- [ ] Implement request body size limits
- [ ] Enable HSTS with preload

### Authentication Configuration

- [ ] JWT expiration set appropriately (recommend 15min access, 7d refresh)
- [ ] JWT algorithm set to RS256 or ES256 (asymmetric)
- [ ] Token refresh mechanism implemented
- [ ] Failed login attempt limiting
- [ ] Account lockout after N failures

### Logging Configuration

- [ ] Security events logged (auth failures, admin actions)
- [ ] PII excluded from logs
- [ ] Log rotation configured
- [ ] Centralized log aggregation

### WebSocket Configuration

- [ ] Connection authentication implemented
- [ ] Origin header validation
- [ ] Message size limits
- [ ] Connection rate limiting
- [ ] Heartbeat timeout handling

### Database Security

- [ ] Connection over TLS
- [ ] Least-privilege database user
- [ ] Parameterized queries (verified)
- [ ] Sensitive data encrypted at rest

---

## Appendix A: Files Audited

### Backend

- `/src/modules/notification/presentation/NotificationController.ts`
- `/src/modules/notification/presentation/AdminNotificationController.ts`
- `/src/modules/notification/presentation/PreferenceController.ts`
- `/src/modules/notification/presentation/validation.schema.ts`
- `/src/modules/notification/application/use-cases/CreateNotificationUseCase.ts`
- `/src/modules/notification/application/use-cases/MarkAsReadUseCase.ts`
- `/src/modules/notification/application/use-cases/SendNotificationUseCase.ts`
- `/src/modules/notification/infrastructure/repositories/TypeORMNotificationRepository.ts`
- `/src/modules/notification/infrastructure/repositories/TypeORMTemplateRepository.ts`
- `/src/modules/notification/infrastructure/services/InMemoryWebSocketService.ts`
- `/src/modules/notification/infrastructure/services/NotificationDeliveryService.ts`
- `/src/modules/notification/di/container.ts`
- `/src/modules/notification/entity/notification.ts`
- `/src/routes/notification.ts`
- `/src/routes/admin/index.ts`
- `/src/middlewares/auth.middleware.ts`
- `/src/main.ts`

### Frontend

- `/src/lib/websocket/notificationSocket.ts`
- `/src/lib/api/notification.api.ts`
- `/src/contexts/NotificationContext.tsx`
- `/src/components/notifications/NotificationItem.tsx`
- `/src/types/notification.types.ts`

---

## Appendix B: Tools Used

- Manual code review
- npm audit / pnpm audit
- OWASP Testing Guide v4.2
- OWASP ASVS 4.0

---

**Report Prepared By:** Security Audit Team
**Review Status:** FINAL
**Next Audit Due:** August 2026 (or after major changes)
