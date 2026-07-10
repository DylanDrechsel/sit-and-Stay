# PetSitterPro — Test Data & API Responses

> **Purpose**: A running record of test accounts, tokens, and raw API responses so you don't
> have to re-query the database during development.
>
> **Keep this file up to date** as you add new test users, businesses, and operations.

---

## Quick Reference — Active Test Accounts

| Role  | Name        | Email                           | Business          | User ID                                |
|-------|-------------|---------------------------------|-------------------|----------------------------------------|
| OWNER | Alex Morgan | alex.morgan@bitesizebakery.com  | Bite-Sized Bakery | `9b214a90-8b30-427e-af60-6d8661ce9261` |

---

## 1. Owner Registration

### Input

```graphql
mutation Mutation($input: RegisterOwnerInput!) {
  registerOwner(input: $input) {
    business {
      createdAt
      description
      id
      isActive
      name
    }
    token
    user {
      id
      email
      firstName
      lastName
      phone
      avatarUrl
      globalRole
      createdAt
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "email": "alex.morgan@bitesizebakery.com",
    "password": "SuperSecurePassword123!",
    "firstName": "Alex",
    "lastName": "Morgan",
    "phone": "+15551234567",
    "businessName": "Bite-Sized Bakery",
    "businessDescription": "A boutique pastry shop specializing in sourdough croissants and custom mini cakes."
  }
}
```

### Response

```json
{
  "data": {
    "registerOwner": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5YjIxNGE5MC04YjMwLTQyN2UtYWY2MC02ZDg2NjFjZTkyNjEiLCJlbWFpbCI6ImFsZXgubW9yZ2FuQGJpdGVzaXplYmFrZXJ5LmNvbSIsImdsb2JhbFJvbGUiOiJVU0VSIiwiaWF0IjoxNzgzNjk5MzcwLCJleHAiOjE3ODQzMDQxNzB9.P4EhSrb_J5trDMfK5e2RD-wNzpNDTcDjMigYmEsNbVc",
      "user": {
        "id": "9b214a90-8b30-427e-af60-6d8661ce9261",
        "email": "alex.morgan@bitesizebakery.com",
        "firstName": "Alex",
        "lastName": "Morgan",
        "phone": "+15551234567",
        "avatarUrl": null,
        "globalRole": "USER",
        "createdAt": "1783699369960"
      },
      "business": {
        "id": "747eae1a-f958-4281-a400-1b9a804b1bb0",
        "name": "Bite-Sized Bakery",
        "description": "A boutique pastry shop specializing in sourdough croissants and custom mini cakes.",
        "isActive": true,
        "createdAt": "1783699369965"
      }
    }
  }
}
```

### Key IDs

| Field       | Value                                    |
|-------------|------------------------------------------|
| User ID     | `9b214a90-8b30-427e-af60-6d8661ce9261`  |
| Business ID | `747eae1a-f958-4281-a400-1b9a804b1bb0`  |
| JWT (7d)    | See `token` field above                  |

> **Note:** The response key shows `ownerRegister` — this may reflect an older resolver name.
> The current `typeDefs.ts` uses `registerOwner`. Verify if re-running this test.

---

<!--
================================================================
  TEMPLATE — Copy this block when adding a new test entry
================================================================

## N. <Operation Name>

### Input

```graphql
mutation/query OperationName($input: InputType!) {
  fieldName(input: $input) {
    ...
  }
}
```

**Variables:**
```json
{
  "input": {}
}
```

### Response

```json
{
  "data": {}
}
```

### Key IDs

| Field | Value |
|-------|-------|
|       |       |

================================================================
-->