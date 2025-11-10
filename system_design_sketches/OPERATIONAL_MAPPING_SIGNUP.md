# Operational Mapping: Signup and Verification Pages

**Version:** 1.0  
**Date:** November 5, 2025  
**Status:** ❌ Not Yet Implemented (Design Specification)  
**Pages:** `/signup`, `/verify`, `/forgot-password`, `/reset-password`

---

## ⚠️ IMPORTANT: This is a Design Specification

These pages are not yet implemented. Authentication currently supports login flows; this file captures planned signup and verification operations using AWS Cognito.

---

## Page: Signup (`/signup`)

### User Role: Guest (Unauthenticated)

---

### Task S-1: Open Signup Page

**Status:** ❌ Planned

1. User navigates to `/signup`
2. `Signup.tsx` renders; clears any prior auth error state
3. If already authenticated, redirect to `/dashboard`

---

### Task S-2: Register a New Account

**Status:** ❌ Planned

1. User fills form: email, password, confirm password
2. Frontend validation: email format, password strength policy
3. Call Cognito SignUp
   - SDK: `Auth.signUp({ username: email, password })`
4. Cognito creates user in User Pool (status: UNCONFIRMED)
5. Cognito emails a verification code to user
6. Frontend routes to `/verify?email={email}` with info banner

---

## Page: Verify Email (`/verify`)

### User Role: Guest (Unauthenticated)

---

### Task S-3: Confirm Email with Verification Code

**Status:** ❌ Planned

1. Page reads `email` from query string or form input
2. User enters 6-digit code from email
3. Frontend calls Cognito ConfirmSignUp
   - SDK: `Auth.confirmSignUp(email, code)`
4. On success: show success banner and link to `/login`
5. On failure: display specific error (CodeMismatch, ExpiredCode)

---

### Task S-4: Resend Verification Code

**Status:** ❌ Planned

1. User clicks "Resend code" button
2. Frontend calls Cognito ResendSignUp
   - SDK: `Auth.resendSignUp(email)`
3. Show info: "Verification code sent"

---

## Page: Forgot Password (`/forgot-password`)

### User Role: Guest (Unauthenticated)

---

### Task S-5: Request Password Reset Code

**Status:** ❌ Planned

1. User provides email
2. Frontend calls Cognito ForgotPassword
   - SDK: `Auth.forgotPassword(email)`
3. Cognito emails reset code
4. Frontend navigates to `/reset-password?email={email}`

---

## Page: Reset Password (`/reset-password`)

### User Role: Guest (Unauthenticated)

---

### Task S-6: Submit New Password with Code

**Status:** ❌ Planned

1. User enters code, new password, confirm password
2. Frontend calls Cognito ForgotPasswordSubmit
   - SDK: `Auth.forgotPasswordSubmit(email, code, newPassword)`
3. On success: show success banner and link to `/login`
4. On error: display error messages

---

## Notes on Overlaps

- The login document covers G-3 (New Password Challenge), which is distinct from S-6 (self-service password reset).
- Social login (Google) can be integrated later via Cognito Hosted UI; not in alpha scope.

---

## Infrastructure Components

| Component | Role | Status |
|-----------|------|--------|
| Cognito User Pool | Auth backend | ✅ Available |
| Amplify Auth SDK | Browser auth | ✅ Available |
| Signup/Verify Components | UI pages | ❌ To be created |
| Email templates | Verification emails | ✅ Managed by Cognito |

---

## Security & Validation

- Rate-limit signup and verification attempts
- Password policy enforced by Cognito
- Never log plaintext passwords or codes
- Clear error messaging without leaking account existence details

---

## End of Signup and Verification Operational Mapping
