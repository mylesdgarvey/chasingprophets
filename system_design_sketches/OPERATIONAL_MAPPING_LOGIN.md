# Operational Mapping: Login Page

**Version:** 1.0  
**Date:** November 5, 2025  
**Status:** Implemented Features Only  
**Page:** `/login`

---

## Overview

This document provides detailed operational mappings for all tasks on the Login page, describing the exact data flow from user action to system response, including all infrastructure components involved.

---

## User Role: Guest (Unauthenticated)

### Task G-1: Navigate to the Login Page

**Task ID:** G-1  
**Task Name:** Navigate to the Login page  
**Status:** ✅ Implemented

#### Operational Flow

1. **User Action**
   - User opens browser and enters application URL or is redirected from protected route

2. **Browser Request**
   - Browser sends `GET` request to AWS Amplify hosting domain
   - URL: `https://<amplify-domain>/login`

3. **AWS Amplify**
   - Serves static React application bundle from CloudFront CDN
   - Returns `index.html` + JavaScript bundles (including React Router)

4. **Client-Side Routing (React Router)**
   - `main.tsx` loads and initializes React application
   - React Router evaluates current URL path `/login`
   - Matches route to Login component in route configuration
   - Checks `AuthContext` for existing authentication state

5. **AuthContext Check**
   - Context reads from `localStorage` or session storage for existing Cognito tokens
   - If valid token exists: redirect to `/dashboard`
   - If no token or expired: render Login page component

6. **Component Render**
   - Login page component (`src/pages/auth/Login.tsx`) renders
   - Displays:
     - Email/username input field
     - Password input field
     - "Sign In" button
     - Application branding/logo

7. **End State**
   - User sees Login form ready for input
   - No database queries executed
   - No API calls made

---

### Task G-2: Submit Credentials to Log In

**Task ID:** G-2  
**Task Name:** Submit credentials to log in  
**Status:** ✅ Implemented

#### Operational Flow

1. **User Input**
   - User types username in email/username field (stored in component state)
   - User types password in password field (stored in component state, masked)
   - User clicks "Sign In" button or presses Enter

2. **Client-Side Validation**
   - Login component validates:
     - Username field is not empty
     - Password field is not empty
   - If validation fails:
     - Display inline error message
     - Stop flow (do not proceed to API)

3. **Authentication Request Preparation**
   - Component calls authentication service method (e.g., `signIn()` from `src/hooks/useAuth.ts`)
   - Credentials packaged into request object

4. **AWS Amplify Auth Library**
   - `useAuth` hook uses AWS Amplify Auth library
   - Library method: `Auth.signIn(username, password)`
   - Creates authentication request with:
     - Username
     - Password
     - Client ID (from environment variable `VITE_COGNITO_CLIENT_ID`)

5. **API Request to AWS Cognito**
   - HTTP POST to AWS Cognito User Pool endpoint
   - Region: Defined in `VITE_AWS_REGION` environment variable
   - User Pool ID: Defined in `VITE_COGNITO_USER_POOL_ID`
   - Request Body:
     ```json
     {
       "AuthFlow": "USER_PASSWORD_AUTH",
       "ClientId": "<COGNITO_CLIENT_ID>",
       "AuthParameters": {
         "USERNAME": "<user-entered-username>",
         "PASSWORD": "<user-entered-password>"
       }
     }
     ```

6. **AWS Cognito Processing**
   - Cognito User Pool receives authentication request
   - Looks up user in User Pool by username
   - If user not found:
     - Return error: `UserNotFoundException`
     - Flow jumps to step 12 (Error Handling)
   - If user found:
     - Verifies password hash matches stored hash
     - If password incorrect:
       - Return error: `NotAuthorizedException`
       - Flow jumps to step 12 (Error Handling)
   - If password correct:
     - Check user status (CONFIRMED, FORCE_CHANGE_PASSWORD, etc.)
     - If status is `FORCE_CHANGE_PASSWORD`:
       - Return challenge: `NEW_PASSWORD_REQUIRED`
       - Flow continues to Task G-3
     - If status is `CONFIRMED`:
       - Generate JWT tokens

7. **JWT Token Generation (Successful Auth)**
   - Cognito generates three tokens:
     - **ID Token**: Contains user identity claims (sub, email, groups)
     - **Access Token**: Used for API authorization
     - **Refresh Token**: Used to obtain new tokens when they expire
   - Tokens signed with Cognito private key
   - Token expiration set (typically 1 hour for access/ID, 30 days for refresh)

8. **Response to Client**
   - Cognito returns authentication response:
     ```json
     {
       "AuthenticationResult": {
         "AccessToken": "<jwt-access-token>",
         "IdToken": "<jwt-id-token>",
         "RefreshToken": "<jwt-refresh-token>",
         "ExpiresIn": 3600,
         "TokenType": "Bearer"
       }
     }
     ```

9. **Client Token Storage**
   - `useAuth` hook receives tokens
   - Stores tokens in:
     - `AuthContext` state (for immediate use)
     - Browser `localStorage` or `sessionStorage` (for persistence)
     - Key format: `CognitoIdentityServiceProvider.<clientId>.<username>.<tokenType>`

10. **User Profile Fetch**
    - Auth hook calls `Auth.currentAuthenticatedUser()`
    - Reads user attributes from ID token claims:
      - `sub` (user ID)
      - `email`
      - `cognito:groups` (roles: admin, user)
    - Stores user object in AuthContext state

11. **Success Navigation**
    - AuthContext updates `isAuthenticated` state to `true`
    - React Router detects authentication state change
    - Redirects user to `/dashboard`
    - Login component unmounts

12. **Error Handling (Alternative Flow)**
    - If Cognito returns error:
      - `NotAuthorizedException`: "Incorrect username or password"
      - `UserNotFoundException`: "User does not exist"
      - `UserNotConfirmedException`: "Please verify your email"
      - `NetworkError`: "Unable to connect. Please try again."
    - Display error message in UI below Sign In button
    - User remains on Login page
    - Can retry authentication

---

### Task G-3: Handle New Password Challenge

**Task ID:** G-3  
**Task Name:** Be prompted for a new password on first login  
**Status:** ✅ Implemented

#### Operational Flow

1. **Prerequisite**
   - User has submitted credentials (Task G-2)
   - AWS Cognito returned `NEW_PASSWORD_REQUIRED` challenge

2. **Challenge Detection**
   - Amplify Auth library receives challenge response:
     ```json
     {
       "ChallengeName": "NEW_PASSWORD_REQUIRED",
       "Session": "<session-token>",
       "ChallengeParameters": {
         "USER_ID_FOR_SRP": "<username>",
         "requiredAttributes": "[]"
       }
     }
     ```

3. **UI Update**
   - Login component detects challenge state
   - Hides standard username/password fields
   - Displays new password form:
     - "New Password" input field
     - "Confirm New Password" input field
     - "Submit New Password" button
   - Optionally shows password requirements:
     - Minimum length (8 characters)
     - Must contain uppercase, lowercase, number, special character

4. **User Input**
   - User enters new password in "New Password" field
   - User re-enters same password in "Confirm New Password" field
   - User clicks "Submit New Password" button

5. **Client-Side Validation**
   - Component validates:
     - New password meets complexity requirements
     - New password matches confirmation password
   - If validation fails:
     - Display error message
     - User corrects input and resubmits

6. **Challenge Response Preparation**
   - Component calls `Auth.completeNewPassword(user, newPassword)`
   - Amplify Auth library prepares challenge response:
     - Includes session token from initial challenge
     - Includes new password
     - Includes any required user attributes (if configured)

7. **API Request to AWS Cognito**
   - HTTP POST to Cognito `RespondToAuthChallenge` endpoint
   - Request Body:
     ```json
     {
       "ChallengeName": "NEW_PASSWORD_REQUIRED",
       "ClientId": "<COGNITO_CLIENT_ID>",
       "Session": "<session-token-from-step-2>",
       "ChallengeResponses": {
         "USERNAME": "<username>",
         "PASSWORD": "<new-password>",
         "NEW_PASSWORD": "<new-password>"
       }
     }
     ```

8. **AWS Cognito Processing**
   - Cognito validates session token
   - Validates new password meets pool requirements
   - If password invalid:
     - Return error: `InvalidPasswordException`
     - Flow jumps to error handling (step 13)
   - If valid:
     - Updates user's password in User Pool
     - Changes user status from `FORCE_CHANGE_PASSWORD` to `CONFIRMED`
     - Generates JWT tokens (same as Task G-2, step 7)

9. **Response to Client**
   - Cognito returns authentication result with tokens
   - Same structure as Task G-2, step 8

10. **Client Token Storage**
    - Same process as Task G-2, steps 9-10
    - Tokens stored in localStorage and AuthContext

11. **Success Navigation**
    - AuthContext updates `isAuthenticated` to `true`
    - Optionally display success message: "Password updated successfully"
    - React Router redirects to `/dashboard`

12. **User Profile Initialization**
    - Dashboard loads user's default preferences
    - Theme applied from localStorage or defaults to system preference

13. **Error Handling (Alternative Flow)**
    - Possible errors:
      - `InvalidPasswordException`: "Password does not meet requirements"
      - `CodeMismatchException`: "Invalid session token"
      - `ExpiredCodeException`: "Session expired, please log in again"
    - Display error message in UI
    - If session expired:
      - Reset to standard login form
      - User must re-enter original credentials

---

## Infrastructure Component Summary

### Components Involved in Login Tasks

| Component | Role | Location/Identifier |
|-----------|------|---------------------|
| **AWS Amplify Hosting** | Static asset delivery (HTML, JS, CSS bundles) | CloudFront + S3 bucket |
| **React Router** | Client-side routing to `/login` path | `src/main.tsx`, route config |
| **Login Component** | UI rendering and form state management | `src/pages/auth/Login.tsx` |
| **AuthContext** | Global authentication state management | `src/context/AuthContext.tsx` |
| **useAuth Hook** | Authentication logic and Cognito integration | `src/hooks/useAuth.ts` |
| **AWS Amplify Auth Library** | SDK for Cognito API calls | NPM package `@aws-amplify/auth` |
| **AWS Cognito User Pool** | User authentication and JWT token generation | Pool ID: `VITE_COGNITO_USER_POOL_ID` |
| **Browser LocalStorage** | Persistent token storage | Keys: `CognitoIdentityServiceProvider.*` |

---

## Data Storage Details

### Cognito User Pool (AWS DynamoDB Backend - Managed by AWS)

**Table:** Cognito automatically manages user data in internal DynamoDB tables

**User Record Structure (Conceptual):**
```json
{
  "Username": "user@example.com",
  "PasswordHash": "<bcrypt-hash>",
  "UserStatus": "CONFIRMED" | "FORCE_CHANGE_PASSWORD" | "UNCONFIRMED",
  "Email": "user@example.com",
  "EmailVerified": true,
  "Groups": ["admin"] | ["user"],
  "UserAttributes": [
    { "Name": "email", "Value": "user@example.com" },
    { "Name": "email_verified", "Value": "true" }
  ],
  "UserCreateDate": "2025-11-05T10:00:00Z",
  "UserLastModifiedDate": "2025-11-05T10:30:00Z"
}
```

### Browser LocalStorage

**Keys Created:**
- `CognitoIdentityServiceProvider.<ClientId>.<Username>.idToken`
- `CognitoIdentityServiceProvider.<ClientId>.<Username>.accessToken`
- `CognitoIdentityServiceProvider.<ClientId>.<Username>.refreshToken`
- `CognitoIdentityServiceProvider.<ClientId>.LastAuthUser`
- `CognitoIdentityServiceProvider.<ClientId>.<Username>.clockDrift`

**Value Format (ID Token Example):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiY29nbml0bzpncm91cHMiOlsiYWRtaW4iXSwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

---

## Network Traffic Summary

### Task G-2: Login Request

**Request:**
```
POST https://cognito-idp.<region>.amazonaws.com/
Content-Type: application/x-amz-json-1.1
X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth

{
  "AuthFlow": "USER_PASSWORD_AUTH",
  "ClientId": "<client-id>",
  "AuthParameters": {
    "USERNAME": "user@example.com",
    "PASSWORD": "userPassword123!"
  }
}
```

**Response (Success):**
```json
{
  "AuthenticationResult": {
    "AccessToken": "eyJraWQiOiJxxx...",
    "ExpiresIn": 3600,
    "IdToken": "eyJraWQiOiJ5eXk...",
    "RefreshToken": "eyJjdHkiOiJKV1Q...",
    "TokenType": "Bearer"
  },
  "ChallengeParameters": {}
}
```

**Response (New Password Required):**
```json
{
  "ChallengeName": "NEW_PASSWORD_REQUIRED",
  "Session": "AYABeLU...",
  "ChallengeParameters": {
    "USER_ID_FOR_SRP": "user@example.com",
    "requiredAttributes": "[]",
    "userAttributes": "{\"email\":\"user@example.com\"}"
  }
}
```

---

## Security Considerations

1. **Password Transmission**
   - All communication over HTTPS (TLS 1.2+)
   - Passwords never stored in browser memory after submission
   - Passwords hashed by Cognito using bcrypt

2. **Token Security**
   - JWT tokens signed with Cognito's private key
   - Tokens include expiration claims
   - Refresh tokens rotated on use (optional Cognito configuration)

3. **Session Management**
   - Tokens auto-expire (default 1 hour)
   - Refresh token used to obtain new access/ID tokens
   - Logout clears all tokens from localStorage

4. **CSRF Protection**
   - Cognito tokens include audience claim (`aud`) validation
   - API Gateway validates token issuer matches User Pool

---

## Error States and User Feedback

| Error Code | User Message | Technical Cause | Recovery Action |
|------------|--------------|-----------------|-----------------|
| `NotAuthorizedException` | "Incorrect username or password" | Password hash mismatch | User re-enters credentials |
| `UserNotFoundException` | "User does not exist" | Username not in User Pool | User checks spelling or signs up |
| `UserNotConfirmedException` | "Please verify your email address" | Email verification pending | User checks email for verification link |
| `InvalidPasswordException` | "Password must be at least 8 characters and include uppercase, lowercase, number, and special character" | New password doesn't meet requirements | User creates stronger password |
| `NetworkError` | "Unable to connect. Please check your internet connection." | No internet or Cognito service down | User checks connection and retries |
| `ExpiredCodeException` | "Session expired. Please log in again." | Session token expired during password change | User restarts login process |

---

## Performance Metrics

**Expected Response Times:**
- Navigate to Login page: < 500ms (cached assets)
- Login API call (G-2): 200-800ms (Cognito authentication)
- New password challenge (G-3): 300-1000ms (Cognito password update)

**Bandwidth:**
- Initial page load: ~200-500 KB (React bundles, cached after first load)
- Login API request: ~500 bytes
- Login API response: ~2-4 KB (JWT tokens)

---

## End of Login Page Operational Mapping
