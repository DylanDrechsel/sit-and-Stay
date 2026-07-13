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

## Sarah Jenkins Test Data **---------------------------------------------------------------------**

```json
{
  "user": {
    "id": "22a9cee2-ecd5-4cd1-8359-38b67ced3f5d",
    "email": "SarahJenkinsUpdated@Pawsandpalms.com",
    "password": "SecurePassword123?",
    "firstName": "Sarah",
    "lastName": "Jenkins",
    "phone": "+15558675309",
    "avatarUrl": null,
    "globalRole": "USER",
    "createdAt": "1783875038104",
  }
}
```
## Man Ager Test Data **--------------------------------------------------------------------------**

```json
{
  "user": {
    "id": "b95062e3-faea-4426-b1a0-ee64d791d0b5",
    "email": "testmanager@gmail.com",
    "password": "TestManager1!",
    "firstName": "Man",
    "lastName": "Ager",
    "phone": "973-666-6666",
    "avatarUrl": null,
    "globalRole": "USER",
    "createdAt": "1783894713614",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiOTUwNjJlMy1mYWVhLTQ0MjYtYjFhMC1lZTY0ZDc5MWQwYjUiLCJlbWFpbCI6InRlc3RtYW5hZ2VyQGdtYWlsLmNvbSIsImdsb2JhbFJvbGUiOiJVU0VSIiwiaWF0IjoxNzgzODk0NzEzLCJleHAiOjE3ODM5ODExMTN9.ZLWRt67z49VmgWnbAQfQDEaPRn53CS-nR5NQcdZQW_s"
  }
}
```

## 1. Owner Registration

**------------------------------------------------------------------------------------------------**

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

## 8. Change Email (changeEmail) --> **JWT Required**

### Input

```graphql
mutation ChangeEmail($input: ChangeEmailInput!) {
  changeEmail(input: $input) {
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
  "input": {
    "newEmail": "SarahJenkinsUpdated@Pawsandpalms.com",
    "password": "SecurePassword123!"
  }
}
```

### Response

```json
{
  "data": {
    "changeEmail": {
      "id": "22a9cee2-ecd5-4cd1-8359-38b67ced3f5d",
      "email": "sarahjenkinsupdated@pawsandpalms.com",
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

## 9. Change Password (changePassword) --> **JWT Required**

### Input

```graphql
mutation ChangePassword($input: ChangePasswordInput!) {
  changePassword(input: $input) {
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
  "input": {
    "currentPassword": "SecurePassword123!",
    "newPassword": "SecurePassword123?"
  }
}
```

### Response

```json
{
  "data": {
    "changePassword": {
      "id": "22a9cee2-ecd5-4cd1-8359-38b67ced3f5d",
      "email": "sarahjenkinsupdated@pawsandpalms.com",
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

## 10. Update Business (updateBusiness) --> **JWT Required**

### Input

```graphql
mutation UpdateBusiness($input: UpdateBusinessInput!) {
  updateBusiness(input: $input) {
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
{
  "input": {
    "businessId": "debef9dc-8bab-4196-847f-655f7d687a42",
    "description": "Premium in-home pet sitting, overnight care, and dog walking services for the local community. Fully insured and bonded. Paws Pet Patrol!",
    "name": "Paws Pet Patrol"
  }
}
```

### Response

```json
{
  "data": {
    "updateBusiness": {
      "id": "debef9dc-8bab-4196-847f-655f7d687a42",
      "name": "Paws Pet Patrol",
      "description": "Premium in-home pet sitting, overnight care, and dog walking services for the local community. Fully insured and bonded. Paws Pet Patrol!",
      "isActive": true,
      "createdAt": "1783875038105"
    }
  }
}
```

### Key IDs

| Field       | Value                                      |
|-------------|--------------------------------------------|
| Business ID | `debef9dc-8bab-4196-847f-655f7d687a42`     |
---

## 11. Update User (updateUser) --> **JWT Required**

### Input

```graphql
mutation UpdateUser($input: UpdateUserInput!) {
  updateUser(input: $input) {
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
  "input": {
    "avatarUrl": "[https://example.com/pic.jpg](https://example.com/pic.jpg)",
    "firstName": "Sarah",
    "lastName": "Jenkins",
    "phone": "+15558675309"
  }
}
```

### Response

```json
{
  "data": {
    "updateUser": {
      "id": "22a9cee2-ecd5-4cd1-8359-38b67ced3f5d",
      "email": "sarahjenkinsupdated@pawsandpalms.com",
      "firstName": "Sarah",
      "lastName": "Jenkins",
      "phone": "+15558675309",
      "avatarUrl": "[https://example.com/pic.jpg](https://example.com/pic.jpg)",
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

## 12. Invite Employee (inviteEmployee) --> **JWT Required**

### Input

```graphql
mutation InviteEmployee($input: InviteInput!) {
  inviteEmployee(input: $input) {
    id
    email
    role
    expiresAt
    isAccepted
  }
}
```

**Variables:**
```json
{
  "input": {
    "businessId": "debef9dc-8bab-4196-847f-655f7d687a42",
    "email": "TestManager@gmail.com",
    "role": "MANAGER"
  }
}
```

### Response

```json
{
  "data": {
    "inviteEmployee": {
      "id": "5bd3d021-f359-4e7e-ace6-50a44917e61f",
      "email": "testmanager@gmail.com",
      "role": "MANAGER",
      "expiresAt": "1784066325754",
      "isAccepted": false
    }
  }
}
```

### Email Sent Data

```json
{
  "token": "36a5786bc94e355abd5bdc1fdbfa6af7a5f2bc8cd99ae46a0af2ac8b7ea37256",
  "link": "http://localhost:3000/accept-invitation?token=36a5786bc94e355abd5bdc1fdbfa6af7a5f2bc8cd99ae46a0af2ac8b7ea37256"
}
```

### Key IDs

| Field         | Value                                      |
|---------------|--------------------------------------------|
| Business ID   | `debef9dc-8bab-4196-847f-655f7d687a42`     |
| Invitation ID | `5bd3d021-f359-4e7e-ace6-50a44917e61f`     |
---

## 13. Resend Invitation (resendInvitation) --> **JWT Required**

### Input

```graphql
mutation ResendInvitation($input: InviteInput!) {
  resendInvitation(input: $input) {
    id
    email
    role
    expiresAt
    isAccepted
  }
}
```

**Variables:**
```json
{
  "input": {
    "businessId": "debef9dc-8bab-4196-847f-655f7d687a42",
    "email": "TestManager@gmail.com",
    "role": "MANAGER"
  }
}
```

### Response

```json
{
  "data": {
    "resendInvitation": {
      "id": "5bd3d021-f359-4e7e-ace6-50a44917e61f",
      "email": "testmanager@gmail.com",
      "role": "MANAGER",
      "expiresAt": "1784066762062",
      "isAccepted": false
    }
  }
}
```

### Email Sent Data

```json
{
  "token": "2990019d6cfe5b82600087037d9b0ad5a51831875287ee90dd12d7a91b03dd9f",
  "link": "http://localhost:3000/accept-invitation?token=2990019d6cfe5b82600087037d9b0ad5a51831875287ee90dd12d7a91b03dd9f"
}
```

### Key IDs

| Field         | Value                                      |
|---------------|--------------------------------------------|
| Business ID   | `debef9dc-8bab-4196-847f-655f7d687a42`     |
| Invitation ID | `5bd3d021-f359-4e7e-ace6-50a44917e61f`     |
---

## 14. Accept Invitation (acceptInvitation) --> **JWT Required**

### Input

```graphql
mutation AcceptInvitation($input: AcceptInvitationInput!) {
  acceptInvitation(input: $input) {
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
    "firstName": "Man",
    "lastName": "Ager",
    "password": "TestManager1!",
    "phone": "973-666-6666",
    "token": "2990019d6cfe5b82600087037d9b0ad5a51831875287ee90dd12d7a91b03dd9f"
  }
}
```

### Response

```json
{
  "data": {
    "acceptInvitation": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiOTUwNjJlMy1mYWVhLTQ0MjYtYjFhMC1lZTY0ZDc5MWQwYjUiLCJlbWFpbCI6InRlc3RtYW5hZ2VyQGdtYWlsLmNvbSIsImdsb2JhbFJvbGUiOiJVU0VSIiwiaWF0IjoxNzgzODk0NzEzLCJleHAiOjE3ODM5ODExMTN9.ZLWRt67z49VmgWnbAQfQDEaPRn53CS-nR5NQcdZQW_s",
      "user": {
        "id": "b95062e3-faea-4426-b1a0-ee64d791d0b5",
        "email": "testmanager@gmail.com",
        "firstName": "Man",
        "lastName": "Ager",
        "phone": "973-666-6666",
        "avatarUrl": null,
        "globalRole": "USER",
        "createdAt": "1783894713614"
      }
    }
  }
}
```

### Key IDs

| Field       | Value                                      |
|-------------|--------------------------------------------|
| User ID     | `b95062e3-faea-4426-b1a0-ee64d791d0b5`     |
| JWT (7d)    | See `token` field above                    |
---

## 15. Remove Member (removeMember) --> **JWT Required**

### Input

```graphql
mutation RemoveMember($input: RemoveMemberInput!) {
  removeMember(input: $input) {
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
  "input": {
    "businessId": "debef9dc-8bab-4196-847f-655f7d687a42",
    "memberId": "c67be6f9-d944-414c-8189-b738d6636697"
  }
}
```

### Response

```json
{
  "data": {
    "removeMember": {
      "id": "c67be6f9-d944-414c-8189-b738d6636697",
      "role": "MANAGER",
      "isActive": false,
      "joinedAt": "1783894713616",
      "user": {
        "id": "b95062e3-faea-4426-b1a0-ee64d791d0b5",
        "email": "testmanager@gmail.com",
        "firstName": "Man",
        "lastName": "Ager",
        "phone": "973-666-6666",
        "avatarUrl": null,
        "globalRole": "USER",
        "createdAt": "1783894713614"
      }
    }
  }
}
```

### Key IDs

| Field         | Value                                      |
|---------------|--------------------------------------------|
| Business ID   | `debef9dc-8bab-4196-847f-655f7d687a42`     |
| Membership ID | `c67be6f9-d944-414c-8189-b738d6636697`     |
| User ID       | `b95062e3-faea-4426-b1a0-ee64d791d0b5`     |
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

