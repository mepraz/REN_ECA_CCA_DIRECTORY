# API & Security Documentation - Module 1

This document outlines the API endpoints, schemas, database configuration, and security models implemented for the Reliance ECA/CCA Directory Application.

---

## 1. Database & User Schema

### MongoDB Connection (`src/lib/mongodb.ts`)
The connection utility utilizes Mongoose to establish a connection. In development, it caches the connection on the `global` object to prevent leaking connections during hot reloads.

### User Schema (`src/models/User.ts`)
The database contains a `users` collection matching the following interface:

```typescript
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole; // 'MAIN_ADMIN' | 'COLLEGE_ADMIN'
  organizationId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Field Specifications:
- `name`: Required string, trimmed.
- `email`: Required string, unique, lowercased, trimmed, validated via regex format.
- `password`: Required hashed string (using `bcryptjs` with 12 salt rounds).
- `role`: Required string enum (`MAIN_ADMIN` or `COLLEGE_ADMIN`). Defaults to `COLLEGE_ADMIN`.
- `organizationId`: Optional string (to scope access for `COLLEGE_ADMIN` users).
- `isActive`: Required boolean, defaults to `true`.
- `timestamps`: Automatically handles `createdAt` and `updatedAt`.

---

## 2. API Endpoints

### Login Endpoint
* **Path**: `/api/auth/login`
* **Method**: `POST`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "email": "admin@reliance.edu.np",
    "password": "AdminReliance123!"
  }
  ```
* **Success Response (200 OK)**:
  Sets an HTTP-only cookie named `auth_token` containing the JWT.
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": "60c72b2f9b1d8e2354c75908",
      "name": "Super Admin",
      "email": "admin@reliance.edu.np",
      "role": "MAIN_ADMIN",
      "organizationId": null
    }
  }
  ```
* **Error Responses**:
  - `400 Bad Request`: Email/password missing.
  - `401 Unauthorized`: Invalid credentials.
  - `403 Forbidden`: Account is inactive (`isActive: false`).
  - `500 Internal Server Error`: Connection or processing error.

### Logout Endpoint
* **Path**: `/api/auth/logout`
* **Method**: `POST`
* **Success Response (200 OK)**:
  Clears the `auth_token` cookie by setting `maxAge: 0`.
  ```json
  {
    "message": "Logout successful"
  }
  ```

---

## 3. Middleware & Route Protection (`src/middleware.ts`)

The Next.js 15 Middleware protects access across pages and APIs.

### Page Redirection Rules:
- **Unauthenticated requests** attempting to access private routes are redirected to `/login?from=<original_path>`.
- **Authenticated requests** attempting to access public routes (like `/login`) are redirected to the homepage `/`.

### API Protection Rules:
- API routes starting with `/api` (excluding `/api/auth/*`) require a valid JWT token.
- Invalid or missing tokens for API routes return a JSON response:
  ```json
  { "error": "Authentication required" }
  ```
  with HTTP status `401 Unauthorized`.

---

## 4. Authorization Helpers (`src/lib/auth-helpers.ts`)

The following reusable functions enforce role-based access control (RBAC):

1. **`getSession(req)`**: Extracts and decodes the JWT from request cookies or Authorization header.
2. **`checkAuth(req)`**: Asserts the user is authenticated. Throws a `NextResponse.json` (401) if not.
3. **`checkRole(req, allowedRoles)`**: Asserts the user has one of the allowed roles. Throws a `NextResponse.json` (403) if unauthorized.
4. **`isMainAdmin(session)`** / **`isCollegeAdmin(session)`**: Utility boolean flags.
5. **`checkOrganizationAccess(session, organizationId)`**: Returns `true` if the session belongs to `MAIN_ADMIN` (global access) or if the `COLLEGE_ADMIN` matches the specific `organizationId`.

---

## 5. Database Seeding Script

A seeding script is provided to initialize the first `MAIN_ADMIN` account.

### Execution:
Set up environment variables in `.env.local`:
```bash
MONGODB_URI=mongodb://localhost:27017/reliance_eca_cca
ADMIN_EMAIL=admin@reliance.edu.np
ADMIN_PASSWORD=AdminReliance123!
ADMIN_NAME=Super Admin
```
Then run the seed command:
```bash
npm run db:seed
```
This hashes the password with `bcryptjs` and inserts the user record into the database.
