# Amatic.ai API Documentation

## Overview

This document describes the REST API endpoints available in Amatic.ai.

**Base URL**: `https://amatic.ai/api` (Production)  
**Base URL**: `http://localhost:3000/api` (Development)

**Authentication**: All protected endpoints require Clerk authentication via session cookies or Bearer token.

---

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Subscriptions](#subscriptions)
- [Referrals](#referrals)
- [Chat](#chat)
- [Canvas](#canvas)
- [Voice](#voice)
- [Webhooks](#webhooks)
- [Health](#health)

---

## Authentication

All API requests must include authentication via Clerk session cookies or Authorization header.

### Headers

```
Authorization: Bearer <clerk_session_token>
Content-Type: application/json
```

### Error Responses

```json
{
  "error": "Unauthorized",
  "status": 401
}
```

---

## Users

### Get User Profile

Get the current authenticated user's profile.

**Endpoint**: `GET /api/users/profile`

**Authentication**: Required

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "clerk_user_id": "user_xxx",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "subscription_status": "active",
    "subscription_plan": "professional",
    "referral_code": "ABC12345",
    "total_earnings": 1500.00,
    "available_balance": 800.00,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-05T00:00:00Z"
  }
}
```

### Update User Profile

Update user profile information.

**Endpoint**: `PATCH /api/users/profile`

**Authentication**: Required

**Request Body**:

```json
{
  "full_name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg"
  }
}
```

---

## Subscriptions

### Create Subscription

Create a new subscription for a plan.

**Endpoint**: `POST /api/subscriptions/create`

**Authentication**: Required

**Request Body**:

```json
{
  "planType": "professional"
}
```

**Available Plans**: `starter`, `basic`, `standard`, `professional`, `business`, `premium`, `enterprise`

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "sub_xxx",
      "plan_id": "plan_professional_monthly",
      "status": "created",
      "amount": 149900
    },
    "razorpay_order_id": "order_xxx"
  }
}
```

### Cancel Subscription

Cancel an active subscription.

**Endpoint**: `POST /api/subscriptions/cancel`

**Authentication**: Required

**Request Body**:

```json
{
  "cancelAtCycleEnd": true
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "Subscription will be cancelled at the end of the billing period",
    "subscription": {
      "id": "sub_xxx",
      "status": "active"
    },
    "cancelAtCycleEnd": true
  }
}
```

---

## Referrals

### Request Withdrawal

Request withdrawal of referral earnings.

**Endpoint**: `POST /api/referrals/withdraw`

**Authentication**: Required

**Request Body**:

```json
{
  "amount": 500,
  "paymentMethod": "bank_transfer",
  "paymentDetails": {
    "accountNumber": "1234567890",
    "ifscCode": "ABCD0123456",
    "accountName": "John Doe"
  }
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "message": "Withdrawal request submitted successfully",
    "payout": {
      "id": "payout_xxx",
      "amount": 500,
      "status": "pending"
    },
    "remainingBalance": 300
  }
}
```

### Get Withdrawal History

Get user's withdrawal history.

**Endpoint**: `GET /api/referrals/withdraw`

**Authentication**: Required

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "payouts": [
      {
        "id": "payout_xxx",
        "amount": 500,
        "status": "completed",
        "payment_method": "bank_transfer",
        "processed_at": "2025-01-05T00:00:00Z",
        "created_at": "2025-01-04T00:00:00Z"
      }
    ],
    "availableBalance": 300,
    "totalEarnings": 1500
  }
}
```

---

## Chat

### Send Chat Message

Send a message to the AI chat assistant.

**Endpoint**: `POST /api/chat`

**Authentication**: Required

**Request Body**:

```json
{
  "message": "Explain quantum physics",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help you?"
    }
  ],
  "domain": "science"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "response": "Quantum physics is...",
    "tokensUsed": 150,
    "model": "gpt-4o"
  }
}
```

---

## Canvas

### Answer Question

Get AI-generated handwritten answer for a canvas question.

**Endpoint**: `POST /api/canvas/answer-question`

**Authentication**: Required

**Request Body**:

```json
{
  "question": "What is photosynthesis?",
  "context": "Biology homework"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "answer": "Photosynthesis is...",
    "handwritingUrl": "https://...",
    "format": "svg"
  }
}
```

---

## Voice

### Synthesize Speech

Convert text to speech.

**Endpoint**: `POST /api/voice/synthesize`

**Authentication**: Required

**Request Body**:

```json
{
  "text": "Hello, how are you?",
  "voice": "en-US-Neural2-A",
  "speed": 1.0
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "audioUrl": "https://...",
    "duration": 2.5
  }
}
```

### Transcribe Audio

Convert speech to text.

**Endpoint**: `POST /api/voice/transcribe`

**Authentication**: Required

**Request Body**: `multipart/form-data`

```
audio: <audio_file>
language: "en"
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "transcript": "Hello, how are you?",
    "confidence": 0.95
  }
}
```

---

## Webhooks

### Razorpay Webhook

Receive payment webhook events from Razorpay.

**Endpoint**: `POST /api/webhooks/razorpay`

**Authentication**: Webhook signature verification

**Headers**:

```
X-Razorpay-Signature: <signature>
```

**Request Body**: Razorpay event payload

**Response**: `200 OK`

```json
{
  "success": true
}
```

### Clerk Webhook

Receive user events from Clerk.

**Endpoint**: `POST /api/webhooks/clerk`

**Authentication**: Svix signature verification

**Headers**:

```
svix-id: <id>
svix-timestamp: <timestamp>
svix-signature: <signature>
```

**Request Body**: Clerk event payload

**Response**: `200 OK`

```json
{
  "success": true
}
```

---

## Health

### Health Check

Check API health status.

**Endpoint**: `GET /api/health`

**Authentication**: Not required

**Response**: `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2025-01-05T12:00:00Z",
  "version": "1.0.0"
}
```

---

## Rate Limits

| Endpoint | Rate Limit |
|----------|------------|
| `/api/chat` | 30 requests/minute |
| `/api/subscriptions/*` | 5 requests/minute |
| `/api/voice/*` | 20 requests/minute |
| General API | 100 requests/minute |

**Rate Limit Headers**:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1704456000
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

**Error Response Format**:

```json
{
  "error": "Error message",
  "status": 400,
  "details": {
    "field": "message",
    "issue": "Required field missing"
  }
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
const response = await fetch('https://amatic.ai/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`
  },
  body: JSON.stringify({
    message: 'Hello',
    conversationHistory: []
  })
});

const data = await response.json();
```

### Python

```python
import requests

response = requests.post(
    'https://amatic.ai/api/chat',
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {session_token}'
    },
    json={
        'message': 'Hello',
        'conversationHistory': []
    }
)

data = response.json()
```

---

## Support

For API support:
- Email: api@amatic.ai
- Documentation: https://docs.amatic.ai
- GitHub Issues: https://github.com/your-org/pensil.io/issues

---

**Last Updated**: 2025-01-05  
**API Version**: 1.0.0

