# Backend API Documentation

Base URL:

```text
http://localhost:5000
```

## Auth

### Login

Authenticates a user and returns the user profile, access JWT, and refresh token. The backend also sets the access JWT as an `auth_token` HTTP-only cookie for the web frontend.

```http
POST /api/auth/login
Content-Type: application/json
```

Request body:

```json
{
  "email": "admin@reliance.edu.np",
  "password": "AdminReliance123!"
}
```

Success response:

```json
{
  "message": "Login successful",
  "jwt": "<access-jwt>",
  "refreshToken": "<refresh-token>",
  "tokenType": "Bearer",
  "expiresIn": "7d",
  "refreshTokenExpiresIn": "30d",
  "user": {
    "id": "<user-id>",
    "name": "Super Admin",
    "email": "admin@reliance.edu.np",
    "role": "MAIN_ADMIN",
    "organizationId": null
  }
}
```

Common errors:

```json
{ "error": "Email and password are required" }
```

```json
{ "error": "Invalid email or password" }
```

```json
{ "error": "Your account is deactivated. Please contact the administrator." }
```

Use the returned access token in Postman for protected routes:

```http
Authorization: Bearer <access-jwt>
```

### Logout

Clears the web frontend auth cookie.

```http
POST /api/auth/logout
```

Success response:

```json
{
  "message": "Logout successful"
}
```

## Events

Protected event routes require authentication. Use either the `auth_token` cookie from browser login or this header in Postman:

```http
Authorization: Bearer <access-jwt>
```

### Create Event

```http
POST /api/events
Content-Type: multipart/form-data
Authorization: Bearer <access-jwt>
```

Form fields:

```text
organizationId=<required for MAIN_ADMIN>
programName=<required>
programDate=2026-06-17
programNature=ECA
participantsCount=25
winners=["Winner One","Winner Two"]
guestDetails=Optional guest details
description=Optional description
imageMeta=[{"category":"banner","label":"Main banner"}]
images=<one or more JPG, PNG, or WebP files>
```

If Google Drive upload fails but local storage succeeds, the event still saves and the response includes `warnings`.
