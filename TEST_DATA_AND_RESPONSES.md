# PetSitterPro — Test Data & API Responses

> **Purpose**: A running record of test accounts, tokens, and raw API responses so you don't
> have to re-query the database during development.
>
> **Keep this file up to date** as you add new test users, businesses, and operations.

---

## Quick Reference — Active Test Accounts

| Role  | Name        | Email                           | Business          | User ID                                |
|-------|-------------|---------------------------------|-------------------|----------------------------------------|
| OWNER | Sarah Jenkins | SarahJenkins@Pawsandpalms.com  | Paws Pet Sitting | `22a9cee2-ecd5-4cd1-8359-38b67ced3f5d` |

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
    "businessName": "Paws Pet Sitting",
    "businessDescription": "Premium in-home pet sitting, overnight care, and dog walking services for the local community. Fully insured and bonded.",
    "email": "SarahJenkins@Pawsandpalms.com",
    "firstName": "Sarah",
    "lastName": "Jenkins",
    "password": "SecurePassword123!",
    "phone": "+15558675309"
  }
}
```

### Response

```json
{
  "data": {
    "registerOwner": {
      "business": {
        "createdAt": "1783875038105",
        "description": "Premium in-home pet sitting, overnight care, and dog walking services for the local community. Fully insured and bonded.",
        "id": "debef9dc-8bab-4196-847f-655f7d687a42",
        "isActive": true,
        "name": "Paws Pet Sitting"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMmE5Y2VlMi1lY2Q1LTRjZDEtODM1OS0zOGI2N2NlZDNmNWQiLCJlbWFpbCI6InNhcmFoamVua2luc0BwYXdzYW5kcGFsbXMuY29tIiwiZ2xvYmFsUm9sZSI6IlVTRVIiLCJpYXQiOjE3ODM4NzUwMzgsImV4cCI6MTc4Mzk2MTQzOH0.6BMphazEkiCu-99RN9gOrWp-5ExPp6xzlV80HwpPWX0",
      "user": {
        "id": "22a9cee2-ecd5-4cd1-8359-38b67ced3f5d",
        "email": "sarahjenkins@pawsandpalms.com",
        "firstName": "Sarah",
        "lastName": "Jenkins",
        "phone": "+15558675309",
        "avatarUrl": null,
        "globalRole": "USER",
        "createdAt": "1783875038104"
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
---

## 2. User Login

### Input

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
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
    "email": "SarahJenkins@Pawsandpalms.com",
    "password": "SecurePassword123!"
  }
}
```

### Response

```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMmE5Y2VlMi1lY2Q1LTRjZDEtODM1OS0zOGI2N2NlZDNmNWQiLCJlbWFpbCI6InNhcmFoamVua2luc0BwYXdzYW5kcGFsbXMuY29tIiwiZ2xvYmFsUm9sZSI6IlVTRVIiLCJpYXQiOjE3ODM4NzUyNjMsImV4cCI6MTc4Mzk2MTY2M30.2N6J8MCrBq1aTVjOJw1eTBDCtAwJ95sovQRmgEw_bAs",
      "user": {
        "id": "22a9cee2-ecd5-4cd1-8359-38b67ced3f5d",
        "email": "sarahjenkins@pawsandpalms.com",
        "firstName": "Sarah",
        "lastName": "Jenkins",
        "phone": "+15558675309",
        "avatarUrl": null,
        "globalRole": "USER",
        "createdAt": "1783875038104"
      }
    }
  }
}
```

### Key IDs

| Field       | Value                                      |
|-------------|--------------------------------------------|
| User ID     | `22a9cee2-ecd5-4cd1-8359-38b67ced3f5d`     |
| JWT (7d)    | See `token` field above                    |
---

## 3. Get Current User (getMe) --> **JWT Required**

### Input

```graphql
query Query {
  getMe {
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
```

**Variables:**
```json
{}
```

### Response

```json
{
  "data": {
    "getMe": {
      "id": "22a9cee2-ecd5-4cd1-8359-38b67ced3f5d",
      "email": "sarahjenkins@pawsandpalms.com",
      "firstName": "Sarah",
      "lastName": "Jenkins",
      "phone": "+15558675309",
      "avatarUrl": null,
      "globalRole": "USER",
      "createdAt": "1783875038104"
    }
  }
}
```

### Key IDs

| Field       | Value                                      |
|-------------|--------------------------------------------|
| User ID     | `22a9cee2-ecd5-4cd1-8359-38b67ced3f5d`     |
---

## 4. Get User By ID (getUserById) --> **JWT Required**

### Input

```graphql
query Query($userId: ID!) {
  getUserById(userId: $userId) {
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
```

**Variables:**
```json
{
  "userId": "22a9cee2-ecd5-4cd1-8359-38b67ced3f5d"
}
```

### Response

```json
{
  "data": {
    "getUserById": {
      "id": "22a9cee2-ecd5-4cd1-8359-38b67ced3f5d",
      "email": "sarahjenkins@pawsandpalms.com",
      "firstName": "Sarah",
      "lastName": "Jenkins",
      "phone": "+15558675309",
      "avatarUrl": null,
      "globalRole": "USER",
      "createdAt": "1783875038104"
    }
  }
}
```

### Key IDs

| Field       | Value                                      |
|-------------|--------------------------------------------|
| User ID     | `22a9cee2-ecd5-4cd1-8359-38b67ced3f5d`     |
---

## 5. Get My Businesses (getMyBusinesses) --> **JWT Required**

### Input

```graphql
query GetMyBusinesses {
  getMyBusinesses {
    id
    name
    description
    isActive
    createdAt
  }
}
```

**Variables:**
```json
{}
```

### Response

```json
{
  "data": {
    "getMyBusinesses": [
      {
        "id": "debef9dc-8bab-4196-847f-655f7d687a42",
        "name": "Paws Pet Sitting",
        "description": "Premium in-home pet sitting, overnight care, and dog walking services for the local community. Fully insured and bonded.",
        "isActive": true,
        "createdAt": "1783875038105"
      }
    ]
  }
}
```

### Key IDs

| Field       | Value                                      |
|-------------|--------------------------------------------|
| Business ID | `debef9dc-8bab-4196-847f-655f7d687a42`     |
---

## 6. Get Business Members (getBusinessMembers) --> **JWT Required**

### Input

```graphql
query GetBusinessMembers($businessId: ID!) {
  getBusinessMembers(businessId: $businessId) {
    id
    role
    isActive
    joinedAt
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
  "businessId": "debef9dc-8bab-4196-847f-655f7d687a42"
}
```

### Response

```json
{
  "data": {
    "getBusinessMembers": [
      {
        "id": "186405cd-2b56-44e2-859f-6495a200ecb8",
        "role": "OWNER",
        "isActive": true,
        "joinedAt": "1783875038112",
        "user": {
          "id": "22a9cee2-ecd5-4cd1-8359-38b67ced3f5d",
          "email": "sarahjenkins@pawsandpalms.com",
          "firstName": "Sarah",
          "lastName": "Jenkins",
          "phone": "+15558675309",
          "avatarUrl": null,
          "globalRole": "USER",
          "createdAt": "1783875038104"
        }
      }
    ]
  }
}
```

### Key IDs

| Field         | Value                                      |
|---------------|--------------------------------------------|
| Business ID   | `debef9dc-8bab-4196-847f-655f7d687a42`     |
| Membership ID | `186405cd-2b56-44e2-859f-6495a200ecb8`     |
| User ID       | `22a9cee2-ecd5-4cd1-8359-38b67ced3f5d`     |
---

## 7. Get Inactive Business Members (getInactiveBusinessMembers) --> **JWT Required**

### Input

```graphql
query GetBusinessMembers($businessId: ID!) {
  getInactiveBusinessMembers(businessId: $businessId) {
    id
    isActive
    joinedAt
    role
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
  "businessId": "debef9dc-8bab-4196-847f-655f7d687a42"
}
```

### Response --> When Business has Inactive Users (NEED TO UPDATE)

```json
{
  "data": {
    "getInactiveBusinessMembers": []
  }
}

### Response --> When Business has NO Inactive Users

```json
{
  "data": {
    "getInactiveBusinessMembers": []
  }
}
```

### Key IDs

| Field       | Value                                      |
|-------------|--------------------------------------------|
| Business ID | `debef9dc-8bab-4196-847f-655f7d687a42`     |

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

