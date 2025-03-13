# File Management API Documentation

## Overview

This API provides file management capabilities for a collaborative spreadsheet application. It supports user authentication, file operations, permissions management, and integration with AWS S3 for storage.

## Table of Contents

1. [Authentication](#authentication)
2. [File Operations](#file-operations)
3. [Permission Management](#permission-management)
4. [Storage Management](#storage-management)
5. [Sharing](#sharing)
6. [Payment Integration](#payment-integration)
7. [AI Integration](#ai-integration)

## Authentication

All endpoints (except token-based access) require authentication using the `isAuthenticated` middleware.

## File Operations

### Get Admin Files

Retrieves all files owned by the authenticated user along with their permission settings.

```
GET /admin
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "fileId": "file_1234567890_123.csv",
      "file_name_user": "My Spreadsheet",
      "modified_at": "2023-01-01T12:00:00Z",
      "permissions": [
        {
          "email": "user@example.com",
          "read_permission": true,
          "write_permission": false,
          "assigned_at": "2023-01-01T12:00:00Z"
        }
      ]
    }
  ]
}
```

### Create New File

Creates a new empty spreadsheet with 100 rows and 15 columns.

```
POST /newfile
```

**Request Body:**
```json
{
  "fileNamebyUser": "My New Spreadsheet",
  "UserPermissions": [
    {
      "email": "colleague@example.com",
      "permission": "view" 
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "fileId": "file_1234567890_123.csv"
}
```

### Rename File

Renames an existing file.

```
POST /file/rename
```

**Request Body:**
```json
{
  "file_Old_name": "Old Name",
  "fileNewName": "New Name"
}
```

**Response:**
```json
{
  "file_name_user": "New Name"
}
```

### Get File Content

Retrieves the content of a specific file.

```
GET /file/:fileName
```

**Response:**
```json
{
  "fileNameForUser": "My Spreadsheet",
  "fileContent": [
    ["Header1", "Header2", "Header3"],
    ["Data1", "Data2", "Data3"]
  ]
}
```

### Check Write Permission

Checks if a user has write permission for a specific file.

```
GET /file/:fileName/writeCheck
```

**Response:**
```json
{
  "permission": true
}
```

### Delete File

Deletes a file and all associated permissions.

```
DELETE /admin/files/:fileName
```

**Response:**
```json
{
  "success": true,
  "version": "S3-response"
}
```

### Upload File to S3

Creates a new file by uploading content directly to S3.

```
POST /uploadToS3AndLoadFile
```

**Request Body:**
```json
{
  "filename": "My Uploaded File",
  "UserPermissions": [],
  "fileType": "text/csv",
  "fileSize": 1024
}
```

**Response:**
```json
{
  "success": true,
  "presignedUrl": "https://s3-url-for-upload",
  "fileName": "file_1234567890_123.csv"
}
```

## Permission Management

### Add User Permission

Grants a user access to a file.

```
POST /admin/files/:fileName/users
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "read_permission": true,
  "write_permission": false
}
```

**Response:**
```json
{
  "email": "user@example.com",
  "read_permission": true,
  "write_permission": false
}
```

### Update User Permission

Updates a user's permissions for a file.

```
PUT /admin/files/:fileName/users/:email
```

**Request Body:**
```json
{
  "read_permission": true,
  "write_permission": true
}
```

**Response:**
```json
{
  "email": "user@example.com",
  "read_permission": true,
  "write_permission": true,
  "assigned_at": "2023-01-01T12:00:00Z"
}
```

### Remove User Permission

Removes a user's access to a file.

```
DELETE /admin/files/:fileName/users/:email
```

**Response:**
```json
{
  "success": true
}
```

## Sharing

### Generate Access Token

Creates a temporary access token for sharing a file.

```
POST /admin/generateToken
```

**Request Body:**
```json
{
  "time": "24h",
  "fileName": "My Spreadsheet"
}
```

**Response:**
```json
{
  "token": "random-token",
  "url": "http://localhost:5173/token/file/file_id/random-token",
  "expiresAt": 1672531200000
}
```

### Access File with Token

Retrieves a file using a token (no authentication required).

```
GET /token/file/:file_id/:token
```

**Response:**
```json
{
  "fileContent": "CSV content as string",
  "ttl": 86400,
  "fileNameFromUser": "My Spreadsheet"
}
```

### Send Email Invitation

Sends an email with a link to access a shared file.

```
POST /email
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "file_id": "file_1234567890_123.csv"
}
```

**Response:**
```json
{
  "success": true
}
```

## Storage Management

### Get Storage Size

Retrieves the total storage usage for the current user.

```
GET /storageSize
```

**Response:**
```json
{
  "bytes": 1048576,
  "megabytes": 1.0,
  "gigabytes": 0.001
}
```

## Payment Integration

### Create Payment Order

Creates a Razorpay order for storage upgrade.

```
POST /create-storage-order
```

**Request Body:**
```json
{
  "amount": 29900,
  "currency": "INR"
}
```

**Response:**
```json
{
  "id": "order_123456",
  "amount": 29900,
  "currency": "INR"
}
```

### Verify Payment

Verifies a completed payment and updates user storage.

```
POST /verify-payment
```

**Request Body:**
```json
{
  "razorpay_payment_id": "pay_123456",
  "razorpay_order_id": "order_123456",
  "razorpay_signature": "signature"
}
```

**Response:**
```json
{
  "success": true
}
```

## AI Integration

### Chat with AI Assistant

Processes a spreadsheet with AI to perform operations or answer questions.

```
POST /chat
```

**Request Body:**
```json
{
  "fileUrl": "file_1234567890_123.csv",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Calculate the sum of column A"
    }
  ]
}
```

**Response:**
```json
{
  "response": {
    "actions": [
      {
        "type": "SET_FORMULA",
        "row": 10,
        "col": 0,
        "formula": "=SUM(A1:A10)"
      }
    ],
    "response": "I've calculated the sum of column A and placed the result in cell A11."
  }
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad request (missing parameters, invalid input)
- `401` - Unauthorized (missing or invalid authentication)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `500` - Internal server error

Error responses follow this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Excessive requests may be throttled.

## Caching

File content is cached in Redis for performance optimization. The cache is automatically invalidated when a file is modified or deleted.