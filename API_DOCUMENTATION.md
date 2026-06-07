# Beautify API Documentation

**Base URL:** `https://api.beautify.local/api`

**Authentication:** JWT Bearer Token (from phone auth) or Anonymous for public endpoints

**API Version:** 1.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Accounts](#accounts)
3. [Salons](#salons)
4. [Services](#services)
5. [Staff Members](#staff-members)
6. [Bookings](#bookings)
7. [Feed Posts](#feed-posts)
8. [Media/Images](#media)
9. [Reviews](#reviews)

---

## Authentication

### Phone Authentication - Initiate

**Endpoint:** `POST /accounts/auth/phone/initiate/`

**Description:** Start phone-based authentication (login/register combined flow)

**Authentication:** None (public)

**Request:**
```json
{
  "phone": "+48123456789"
}
```

**Response (201 Created):**
```json
{
  "message": "Verification code sent",
  "phone_number_hint": "+48***456789",
  "resend_wait_seconds": 30
}
```

**Errors:**
- `400`: Invalid or missing phone number
- `429`: Too many requests (rate limited by phone)

---

### Phone Authentication - Verify

**Endpoint:** `POST /accounts/auth/phone/verify/`

**Description:** Verify phone with SMS code and get JWT tokens

**Authentication:** None (public)

**Request:**
```json
{
  "phone": "+48123456789",
  "code": "1234"
}
```

**Response (200 OK):**
```json
{
  "message": "Phone verified successfully",
  "user": {
    "id": "uuid",
    "phone": "+48123456789",
    "phone_verified": true,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "customer"  // customer | staff | owner
  },
  "access_token": "eyJhbGciOiJIUzI1NiI...",
  "refresh_token": "eyJhbGciOiJIUzI1NiI...",
  "created": true  // true if new account, false if existing
}
```

**Errors:**
- `400`: Invalid code or phone
- `401`: Code expired or too many attempts
- `429`: Too many verification attempts (rate limited by IP)

---

### Phone Authentication - Resend Code

**Endpoint:** `POST /accounts/auth/phone/resend/`

**Description:** Resend verification code

**Authentication:** None (public)

**Request:**
```json
{
  "phone": "+48123456789"
}
```

**Response (200 OK):**
```json
{
  "message": "Verification code resent",
  "phone_number_hint": "+48***456789",
  "resend_wait_seconds": 30
}
```

---

### Token Refresh

**Endpoint:** `POST /accounts/token/refresh/`

**Description:** Refresh access token using refresh token

**Authentication:** None (public)

**Request:**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiI..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiI..."
}
```

---

## Accounts

### Get Current User Profile

**Endpoint:** `GET /accounts/me/`

**Description:** Get authenticated user's profile information

**Authentication:** Required (JWT Bearer)

**Response (200 OK):**
```json
{
  "id": "uuid",
  "phone": "+48123456789",
  "phone_verified": true,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "customer"
}
```

---

### Update User Profile

**Endpoint:** `PATCH /accounts/me/`

**Description:** Update user profile (email, first_name, last_name). Phone and role are immutable.

**Authentication:** Required (JWT Bearer)

**Request:**
```json
{
  "email": "newemail@example.com",
  "first_name": "Jane",
  "last_name": "Smith"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "phone": "+48123456789",
  "phone_verified": true,
  "email": "newemail@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "customer"
}
```

---

### Register Device Token (Push Notifications)

**Endpoint:** `POST /accounts/device-tokens/register/`

**Description:** Register device token for push notifications (Firebase Cloud Messaging)

**Authentication:** Required (JWT Bearer)

**Request:**
```json
{
  "token": "fcm-device-token-here",
  "platform": "ios",  // ios | android | web
  "device_id": "optional-device-identifier"
}
```

**Response (201 Created or 200 OK):**
```json
{
  "message": "Device token registered successfully",
  "device_token_id": "uuid",
  "created": true
}
```

---

### Unregister Device Token

**Endpoint:** `POST /accounts/device-tokens/unregister/`

**Description:** Remove device token (e.g., on logout)

**Authentication:** Required (JWT Bearer)

**Request:**
```json
{
  "token": "fcm-device-token-here"
}
```

**Response (200 OK):**
```json
{
  "message": "Device token removed successfully"
}
```

---

### Get Notification Preferences

**Endpoint:** `GET /accounts/notifications/preferences/`

**Description:** Get current notification preference settings

**Authentication:** Required (JWT Bearer)

**Response (200 OK):**
```json
{
  "push_notifications_enabled": true,
  "sms_notifications_enabled": true,
  "email_notifications_enabled": false
}
```

---

### Update Notification Preferences

**Endpoint:** `PATCH /accounts/notifications/preferences/`

**Description:** Update notification preferences (all fields optional)

**Authentication:** Required (JWT Bearer)

**Request:**
```json
{
  "push_notifications_enabled": true,
  "sms_notifications_enabled": false,
  "email_notifications_enabled": false
}
```

**Response (200 OK):**
```json
{
  "message": "Preferences updated",
  "push_notifications_enabled": true,
  "sms_notifications_enabled": false,
  "email_notifications_enabled": false
}
```

---

## Salons

### List All Salons

**Endpoint:** `GET /salons/salons/`

**Description:** Browse all active salons. Owners see all their salons (including inactive).

**Authentication:** Optional (JWT Bearer for owners)

**Query Parameters:**
- `page` (int): Page number for pagination (default: 1)
- `page_size` (int): Items per page (default: varies)

**Response (200 OK):**
```json
{
  "count": 150,
  "next": "https://api.beautify.local/api/salons/salons/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "name": "Glamour Studio",
      "description": "Premium salon specializing in hair and makeup",
      "address": "Main St 123",
      "city": "Warsaw",
      "postal_code": "00-001",
      "country": "Poland",
      "phone": "+48111222333",
      "email": "contact@glamour.local",
      "website": "https://glamour.local",
      "timezone": "Europe/Warsaw",
      "latitude": 52.2297,
      "longitude": 21.0122,
      "avg_rating": 4.5,
      "review_count": 24,
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-20T15:30:00Z"
    }
  ]
}
```

---

### Get Salon Details

**Endpoint:** `GET /salons/salons/{id}/`

**Description:** Get detailed information about a specific salon

**Authentication:** None (public)

**Response (200 OK):** Same as salon object in list

---

### Create Salon (Owner Only)

**Endpoint:** `POST /salons/salons/`

**Description:** Create a new salon (owner role required)

**Authentication:** Required (JWT Bearer, owner role)

**Request:**
```json
{
  "name": "New Salon",
  "description": "Hair and beauty services",
  "address": "Main St 456",
  "city": "Warsaw",
  "postal_code": "00-002",
  "country": "Poland",
  "phone": "+48111222334",
  "email": "info@newsalon.local",
  "website": "https://newsalon.local",
  "timezone": "Europe/Warsaw",
  "latitude": 52.2297,
  "longitude": 21.0122
}
```

**Response (201 Created):**
```json
{
  "message": "Salon profile created successfully",
  "salon": { ... salon object ... }
}
```

---

### Setup Default Business Hours

**Endpoint:** `POST /salons/salons/{id}/setup_default_hours/`

**Description:** Set up default business hours (Mon-Fri 9-18, Sat 9-16, Sun closed)

**Authentication:** Required (JWT Bearer, owner of salon)

**Response (200 OK):**
```json
{
  "message": "Default business hours created successfully (ISO 8601 format)",
  "business_hours": [
    {
      "id": "uuid",
      "salon": "uuid",
      "day_of_week": 0,
      "day_name": "Monday",
      "open_time": "09:00:00",
      "close_time": "18:00:00",
      "is_closed": false,
      "duration_hours": 9.0,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
    // ... more days ...
  ]
}
```

---

## Services

### List Services

**Endpoint:** `GET /salons/services/`

**Description:** Get services. Authenticated owners see services from their salons only. Others see active services from active salons.

**Authentication:** Optional (JWT Bearer for owners)

**Query Parameters:**
- `page` (int): Page number
- `salon` (uuid): Filter by salon

**Response (200 OK):**
```json
{
  "count": 100,
  "results": [
    {
      "id": "uuid",
      "salon": "uuid",
      "name": "Hair Cut",
      "description": "Professional hair cutting service",
      "duration_minutes": 45,
      "price_cents": 5000,  // $50.00
      "price_display": "$50.00",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Get Service Details

**Endpoint:** `GET /salons/services/{id}/`

**Description:** Get detailed service information

**Response (200 OK):** Same as service object in list

---

### Create Service (Owner Only)

**Endpoint:** `POST /salons/services/`

**Description:** Create a service for your salon

**Authentication:** Required (JWT Bearer, owner role)

**Request:**
```json
{
  "salon": "uuid",
  "name": "Hair Color",
  "description": "Professional hair coloring",
  "duration_minutes": 90,
  "price_cents": 8000  // $80.00
}
```

**Validation:**
- Duration: 15-480 minutes
- Price: $1.00-$1000.00

**Response (201 Created):**
```json
{
  "message": "Service created successfully",
  "service": { ... service object ... }
}
```

---

## Staff Members

### List Staff

**Endpoint:** `GET /salons/staff/`

**Description:** Get all active staff members. Owners see staff from their salons only.

**Authentication:** Optional

**Response (200 OK):**
```json
{
  "count": 50,
  "results": [
    {
      "id": "uuid",
      "salon": "uuid",
      "user": "uuid",
      "display_name": "Anna Kowalski",
      "services": ["uuid", "uuid"],  // Array of service IDs
      "is_active": true
    }
  ]
}
```

---

### Get Staff Details

**Endpoint:** `GET /salons/staff/{id}/`

---

## Business Hours & Scheduling

### List Business Hours

**Endpoint:** `GET /salons/business-hours/`

**Description:** Get business hours for salons

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "uuid",
      "salon": "uuid",
      "day_of_week": 0,
      "day_name": "Monday",
      "open_time": "09:00:00",  // ISO 8601 format
      "close_time": "18:00:00",
      "is_closed": false,
      "duration_hours": 9.0,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Create Business Hours (Owner Only)

**Endpoint:** `POST /salons/business-hours/`

**Authentication:** Required (owner role)

**Request:**
```json
{
  "salon": "uuid",
  "day_of_week": 0,  // 0=Monday, 6=Sunday
  "open_time": "09:00:00",
  "close_time": "18:00:00",
  "is_closed": false
}
```

---

### List Schedule Exceptions

**Endpoint:** `GET /salons/schedule-exceptions/`

**Description:** Get special hours/closures for specific dates

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "uuid",
      "salon": "uuid",
      "date": "2024-12-25",
      "open_time": null,
      "close_time": null,
      "is_closed": true,
      "reason": "Christmas Holiday",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Create Schedule Exception (Owner Only)

**Endpoint:** `POST /salons/schedule-exceptions/`

**Request:**
```json
{
  "salon": "uuid",
  "date": "2024-12-25",
  "is_closed": true,
  "reason": "Christmas Holiday"
}
```

---

### List Time Slot Templates

**Endpoint:** `GET /salons/timeslot-templates/`

**Description:** Get time slot configuration for generating available slots

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "uuid",
      "salon": "uuid",
      "staff": "uuid",  // null for salon-wide template
      "slot_duration_minutes": 30,
      "buffer_time_minutes": 15,
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Generate Time Slots

**Endpoint:** `GET /salons/timeslot-templates/{id}/generate_slots/?date=2024-01-25`

**Description:** Generate available time slots for a specific date

**Query Parameters:**
- `date` (YYYY-MM-DD): Date to generate slots for

**Response (200 OK):**
```json
{
  "date": "2024-01-25",
  "salon": "Glamour Studio",
  "staff": "Anna Kowalski",
  "slots": [
    "09:00:00",
    "09:30:00",
    "10:00:00"
    // ... more slots ...
  ],
  "business_hours": {
    "open": "09:00:00",
    "close": "18:00:00",
    "is_closed": false
  },
  "timezone": "Europe/Warsaw",
  "format": "ISO_8601"
}
```

---

## Bookings

### Get Available Slots (Legacy)

**Endpoint:** `GET /bookings/available_slots/`

**Description:** Get available time slots for a specific day

**Authentication:** None (public)

**Query Parameters:**
- `salon` (uuid, required): Salon ID
- `service` (uuid, required): Service ID
- `staff` (uuid, required): Staff member ID
- `date` (YYYY-MM-DD, required): Booking date

**Response (200 OK):**
```json
{
  "date": "2024-01-25",
  "salon": "Glamour Studio",
  "service": "Hair Cut",
  "staff": "Anna Kowalski",
  "available_slots": [
    "09:00",
    "09:45",
    "10:30"
  ],
  "total_slots": 3
}
```

---

### Get Available Slots (New - Atomic Slots)

**Endpoint:** `GET /bookings/availability/`

**Description:** Get available slot options as contiguous atomic slots (preferred method)

**Authentication:** None (public)

**Query Parameters:**
- `salon` (uuid, required)
- `service` (uuid, required)
- `staff` (uuid, required)
- `date` (YYYY-MM-DD, required)

**Response (200 OK):**
```json
{
  "salon": "Glamour Studio",
  "service": "Hair Cut",
  "staff": "Anna Kowalski",
  "date": "2024-01-25",
  "slot_options": [
    {
      "slot_ids": ["uuid1", "uuid2"],
      "start_datetime": "2024-01-25T09:00:00Z",
      "end_datetime": "2024-01-25T09:45:00Z",
      "display": {
        "start_time": "09:00:00",
        "end_time": "09:45:00"
      }
    },
    {
      "slot_ids": ["uuid2", "uuid3"],
      "start_datetime": "2024-01-25T09:45:00Z",
      "end_datetime": "2024-01-25T10:30:00Z",
      "display": {
        "start_time": "09:45:00",
        "end_time": "10:30:00"
      }
    }
  ],
  "total_options": 2
}
```

---

### Create Slot Hold

**Endpoint:** `POST /bookings/holds/`

**Description:** Temporarily hold a set of slots (5 minute TTL)

**Authentication:** None (public)

**Request:**
```json
{
  "slot_ids": ["uuid1", "uuid2"],
  "customer_token": "optional-token"
}
```

**Response (201 Created):**
```json
{
  "hold_id": "uuid",
  "expires_at": "2024-01-25T09:10:00Z"
}
```

---

### Create Anonymous Booking (Email)

**Endpoint:** `POST /bookings/create_anonymous/`

**Description:** Create anonymous booking with email verification

**Authentication:** None (public)

**Request:**
```json
{
  "salon": "uuid",
  "service": "uuid",
  "staff": "uuid",
  "start_time": "2024-01-25T09:00:00Z",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+48123456789"
}
```

**Response (201 Created):**
```json
{
  "message": "Booking created successfully",
  "booking": {
    "id": "uuid",
    "salon": { ... },
    "service": { ... },
    "staff": { ... },
    "start_time": "2024-01-25T09:00:00Z",
    "end_time": "2024-01-25T09:45:00Z",
    "status": "PENDING",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "+48123456789",
    "created_at": "2024-01-25T08:30:00Z"
  },
  "booking_token": "random-token-for-future-reference",
  "instructions": "Save your booking token to manage this appointment"
}
```

---

### Create Anonymous Booking from Hold

**Endpoint:** `POST /bookings/create_anonymous_by_hold/`

**Description:** Confirm held slots into a booking

**Authentication:** None (public)

**Request:**
```json
{
  "salon": "uuid",
  "service": "uuid",
  "staff": "uuid",
  "hold_id": "uuid",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+48123456789"
}
```

**Response (201 Created):** Same as create_anonymous

---

### Lookup Anonymous Booking

**Endpoint:** `GET /bookings/lookup_anonymous/?token=booking-token`

**Description:** Look up anonymous booking by token

**Authentication:** None (public)

**Query Parameters:**
- `token` (string, required): Booking token

**Response (200 OK):**
```json
{
  "id": "uuid",
  "salon": { ... },
  "service": { ... },
  "staff": { ... },
  "start_time": "2024-01-25T09:00:00Z",
  "end_time": "2024-01-25T09:45:00Z",
  "status": "PENDING",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+48123456789",
  "created_at": "2024-01-25T08:30:00Z"
}
```

---

### Cancel Anonymous Booking

**Endpoint:** `POST /bookings/cancel_anonymous/`

**Description:** Cancel anonymous booking by token (respects cancellation policy)

**Authentication:** None (public)

**Request:**
```json
{
  "token": "booking-token"
}
```

**Response (200 OK):**
```json
{
  "message": "Booking cancelled successfully",
  "booking_id": "uuid"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Cannot cancel booking less than 24 hours before appointment",
  "cancellation_policy": {
    "notice_hours": 24,
    "policy_text": "Cancellations must be made 24 hours in advance",
    "hours_until_appointment": 18.5
  }
}
```

---

### Reschedule Booking

**Endpoint:** `POST /bookings/reschedule/`

**Description:** Reschedule booking to new time slots (2 hour minimum notice)

**Authentication:** Optional (JWT for authenticated users, token for anonymous)

**Request:**
```json
{
  "token": "booking-token",  // For anonymous bookings
  "booking_id": "uuid",      // For authenticated users (use either token OR booking_id)
  "new_slot_ids": ["uuid1", "uuid2"]
}
```

**Response (200 OK):**
```json
{
  "message": "Booking rescheduled successfully",
  "booking": { ... updated booking ... },
  "old_time": "2024-01-25T09:00:00Z",
  "new_time": "2024-01-26T10:00:00Z"
}
```

---

### List User Bookings (Authenticated)

**Endpoint:** `GET /bookings/`

**Description:** Get authenticated user's bookings

**Authentication:** Required (JWT Bearer)

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "uuid",
      "salon": { ... },
      "service": { ... },
      "staff": { ... },
      "start_time": "2024-02-01T10:00:00Z",
      "end_time": "2024-02-01T10:45:00Z",
      "status": "CONFIRMED",
      "created_at": "2024-01-25T08:30:00Z"
    }
  ]
}
```

---

### Create Authenticated Booking

**Endpoint:** `POST /bookings/`

**Description:** Create booking for authenticated user

**Authentication:** Required (JWT Bearer)

**Request:**
```json
{
  "salon": "uuid",
  "service": "uuid",
  "staff": "uuid",
  "start_time": "2024-02-01T10:00:00Z"
}
```

---

### Waitlist - Join

**Endpoint:** `POST /bookings/join_waitlist/`

**Description:** Join waitlist when no slots available (anonymous or authenticated)

**Authentication:** None (public)

**Request:**
```json
{
  "salon": "uuid",
  "service": "uuid",
  "staff": "uuid",  // optional
  "preferred_date": "2024-02-01",
  "customer_name": "John Doe",
  "customer_phone": "+48123456789",
  "customer_email": "john@example.com"  // optional
}
```

**Response (201 Created):**
```json
{
  "message": "Added to waitlist successfully",
  "waitlist_id": "uuid",
  "preferred_date": "2024-02-01",
  "expires_at": "2024-02-01T23:59:59Z",
  "position": 3  // Position in line
}
```

---

### Waitlist - Leave

**Endpoint:** `POST /bookings/leave_waitlist/`

**Description:** Remove yourself from waitlist

**Authentication:** Optional

**Request:**
```json
{
  "waitlist_id": "uuid",
  "phone": "optional-for-anonymous"
}
```

**Response (200 OK):**
```json
{
  "message": "Removed from waitlist"
}
```

---

### Waitlist - Get My Entries

**Endpoint:** `GET /bookings/my_waitlist/?phone=optional-for-anonymous`

**Description:** Get your waitlist entries

**Authentication:** Optional

**Response (200 OK):**
```json
{
  "waitlist_entries": [
    {
      "id": "uuid",
      "salon": { "id": "uuid", "name": "Glamour Studio" },
      "service": { "id": "uuid", "name": "Hair Cut" },
      "staff": { "id": "uuid", "name": "Anna Kowalski" },
      "preferred_date": "2024-02-01",
      "status": "ACTIVE",
      "created_at": "2024-01-25T08:30:00Z",
      "expires_at": "2024-02-01T23:59:59Z"
    }
  ]
}
```

---

## Feed Posts

### List Feed (General)

**Endpoint:** `GET /feed/posts/`

**Description:** List all published feed posts

**Authentication:** None (public)

**Query Parameters:**
- `page` (int): Page number

**Response (200 OK):**
```json
{
  "count": 500,
  "next": "...",
  "results": [
    {
      "id": "uuid",
      "salon": {
        "id": "uuid",
        "name": "Glamour Studio",
        "city": "Warsaw"
      },
      "author": {
        "id": "uuid",
        "display_name": "Anna Kowalski"
      },
      "title": "New Hair Style",
      "description": "Check out this amazing new style!",
      "post_type": "hair",  // hair | makeup | nails | skin
      "image_url": "https://...",
      "thumbnail_url": "https://...",
      "featured_service": {
        "id": "uuid",
        "name": "Hair Cut"
      },
      "likes_count": 45,
      "views_count": 200,
      "is_promoted": false,
      "status": "PUBLISHED",
      "published_at": "2024-01-20T10:00:00Z"
    }
  ]
}
```

---

### Get City Feed

**Endpoint:** `GET /feed/posts/city_feed/?city=Warsaw&post_type=hair`

**Description:** Get feed for specific city (main endpoint for mobile)

**Authentication:** None (public, but cached differently for authenticated users)

**Query Parameters:**
- `city` (string, required): City name
- `post_type` (string, optional): Filter by post_type (hair, makeup, nails, skin)
- `page` (int): Page number

**Response (200 OK):**
```json
{
  "count": 150,
  "next": "...",
  "city": "Warsaw",
  "post_type": "hair",
  "total_posts": 150,
  "results": [ ... posts ... ]
}
```

---

### Get Nearby Feed

**Endpoint:** `GET /feed/posts/nearby_feed/`

**Description:** Get feed for nearby salons based on user location

**Authentication:** None (public)

**Query Parameters:**
- `latitude` (float, required): User latitude
- `longitude` (float, required): User longitude
- `radius_km` (float, optional): Search radius (default: 10)
- `post_type` (string, optional): Filter by post type
- `page` (int): Page number
- `page_size` (int): Items per page

**Response (200 OK):**
```json
{
  "latitude": 52.2297,
  "longitude": 21.0122,
  "radius_km": 10,
  "post_type": "hair",
  "total_posts": 75,
  "page": 1,
  "page_size": 20,
  "results": [ ... posts ... ]
}
```

---

### Get Post Details

**Endpoint:** `GET /feed/posts/{id}/`

**Description:** Get full post details (automatically tracks view)

**Authentication:** None (public)

**Response (200 OK):**
```json
{
  "id": "uuid",
  "salon": { ... },
  "author": { ... },
  "title": "New Hair Style",
  "description": "Check out this amazing new style!",
  "post_type": "hair",
  "image_url": "https://...",
  "thumbnail_url": "https://...",
  "featured_service": { ... },
  "likes_count": 45,
  "views_count": 201,
  "is_promoted": false,
  "status": "PUBLISHED",
  "published_at": "2024-01-20T10:00:00Z"
}
```

---

### Get Salon Booking Info from Post

**Endpoint:** `GET /feed/posts/{id}/salon_booking/`

**Description:** Get comprehensive salon booking information for direct tap-to-book flow

**Authentication:** None (public)

**Response (200 OK):**
```json
{
  "salon": {
    "id": "uuid",
    "name": "Glamour Studio",
    "address": "Main St 123",
    "city": "Warsaw",
    "phone": "+48111222333",
    "email": "contact@glamour.local",
    "timezone": "Europe/Warsaw"
  },
  "recommended_staff": {
    "id": "uuid",
    "name": "Anna Kowalski",
    "bio": "Senior stylist with 5 years experience"
  },
  "services": [
    { "id": "uuid", "name": "Hair Cut", "description": "...", "duration_minutes": 45 },
    { "id": "uuid", "name": "Hair Color", "description": "...", "duration_minutes": 90 }
  ],
  "staff_members": [
    { "id": "uuid", "display_name": "Anna Kowalski" },
    { "id": "uuid", "display_name": "Katarzyna Nowak" }
  ],
  "booking_options": {
    "email_booking": {
      "enabled": true,
      "endpoint": "/api/bookings/create_anonymous/",
      "description": "Book with email verification",
      "required_fields": ["customer_name", "customer_email", "customer_phone"]
    },
    "sms_booking": {
      "enabled": true,
      "endpoint": "/api/bookings/sms/initiate/",
      "description": "Book with SMS verification",
      "required_fields": ["customer_name", "customer_phone"],
      "flow": [
        "POST /api/bookings/sms/initiate/ - Start verification",
        "POST /api/bookings/sms/verify/ - Confirm with code"
      ]
    },
    "authenticated_booking": {
      "enabled": true,
      "endpoint": "/api/bookings/",
      "description": "Book as registered user",
      "requires_auth": true
    }
  },
  "helper_endpoints": {
    "availability": "/api/bookings/availability/?salon=uuid&service=uuid&staff=uuid&date=YYYY-MM-DD",
    "available_slots": "/api/bookings/available_slots/?salon=uuid&service=uuid&staff=uuid&date=YYYY-MM-DD",
    "lookup_booking": "/api/bookings/lookup_anonymous/?token=BOOKING_TOKEN"
  },
  "featured_service": {
    "id": "uuid",
    "name": "Hair Cut",
    "duration_minutes": 45,
    "price_display": "$50.00"
  },
  "ui_hints": {
    "post_type": "hair",
    "has_featured_service": true,
    "recommended_services": [ ... filtered services ... ],
    "booking_message": "Inspired by this hair from Anna Kowalski? Book now!"
  }
}
```

---

### Like/Unlike Post

**Endpoint:** `POST /feed/posts/{id}/like/`

**Description:** Toggle like on a post

**Authentication:** Required (JWT Bearer)

**Response (200 OK):**
```json
{
  "liked": true,
  "likes_count": 46
}
```

---

### Save/Unsave Post

**Endpoint:** `POST /feed/posts/{id}/save/`

**Description:** Toggle save on a post

**Authentication:** Required (JWT Bearer)

**Response (200 OK):**
```json
{
  "saved": true
}
```

---

### Get Saved Posts

**Endpoint:** `GET /feed/posts/saved/`

**Description:** Get current user's saved posts

**Authentication:** Required (JWT Bearer)

**Response (200 OK):**
```json
{
  "count": 10,
  "results": [ ... posts ... ]
}
```

---

### Track Post View

**Endpoint:** `POST /feed/posts/{id}/view/`

**Description:** Track post view (called automatically when retrieving post details)

**Authentication:** None (public)

**Response (200 OK):**
```json
{
  "viewed": true
}
```

---

### Create Feed Post (Staff/Owner Only)

**Endpoint:** `POST /feed/posts/`

**Description:** Create a new feed post

**Authentication:** Required (JWT Bearer, staff or owner role)

**Request:**
```json
{
  "title": "New Hair Style",
  "description": "Check out this amazing new style!",
  "post_type": "hair",  // hair | makeup | nails | skin
  "image_url": "https://storage.example.com/image.jpg",
  "thumbnail_url": "https://storage.example.com/thumb.jpg",
  "featured_service": "uuid"  // optional
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "salon": { ... },
  "author": { ... },
  "title": "New Hair Style",
  "description": "Check out this amazing new style!",
  "post_type": "hair",
  "image_url": "https://...",
  "thumbnail_url": "https://...",
  "featured_service": { ... },
  "likes_count": 0,
  "views_count": 0,
  "is_promoted": false,
  "status": "PUBLISHED",
  "published_at": "2024-01-25T10:00:00Z"
}
```

---

### Upload Image for Post

**Endpoint:** `POST /feed/posts/upload_image/`

**Description:** Upload image for feed post (multipart form data)

**Authentication:** Required (JWT Bearer, staff or owner)

**Request:** Multipart form data with `image` file

**Response (201 Created):**
```json
{
  "message": "Image uploaded successfully",
  "image_key": "posts/abc123.jpg",
  "image_url": "https://storage.example.com/posts/abc123.jpg",
  "thumbnail_key": "posts/thumbnails/thumb_abc123.jpg",
  "thumbnail_url": "https://storage.example.com/posts/thumbnails/thumb_abc123.jpg"
}
```

---

### Get Presigned Upload URL

**Endpoint:** `POST /feed/posts/get_upload_url/`

**Description:** Get presigned URL for direct client-side S3 upload

**Authentication:** Required (JWT Bearer, staff or owner)

**Request:**
```json
{
  "content_type": "image/jpeg"  // optional
}
```

**Response (200 OK):**
```json
{
  "upload_url": "https://storage.example.com/posts/abc123.jpg?signature=...",
  "object_key": "posts/abc123.jpg",
  "public_url": "https://storage.example.com/posts/abc123.jpg",
  "expires_in": 3600,
  "content_type": "image/jpeg"
}
```

---

## Media

### Upload Image

**Endpoint:** `POST /media/upload/`

**Description:** Upload image with thumbnail generation

**Authentication:** Required (JWT Bearer, staff or owner)

**Request:** Multipart form data
```
image: [binary file]
folder: "uploads"  // optional
```

**Response (201 Created):**
```json
{
  "message": "Image uploaded successfully",
  "image_key": "uploads/abc123.jpg",
  "image_url": "https://storage.example.com/uploads/abc123.jpg",
  "thumbnail_key": "uploads/thumbnails/thumb_abc123.jpg",
  "thumbnail_url": "https://storage.example.com/uploads/thumbnails/thumb_abc123.jpg"
}
```

---

### Get Presigned Upload URL

**Endpoint:** `POST /media/presigned-url/`

**Description:** Get presigned URL for direct S3 upload

**Authentication:** Required (JWT Bearer, staff or owner)

**Request:**
```json
{
  "content_type": "image/jpeg",  // optional
  "folder": "uploads"  // optional
}
```

**Response (200 OK):**
```json
{
  "upload_url": "https://storage.example.com/uploads/abc123.jpg?signature=...",
  "object_key": "uploads/abc123.jpg",
  "public_url": "https://storage.example.com/uploads/abc123.jpg",
  "expires_in": 3600,
  "content_type": "image/jpeg"
}
```

---

### Delete Image

**Endpoint:** `DELETE /media/delete/`

**Description:** Delete image from storage

**Authentication:** Required (JWT Bearer, staff or owner)

**Request:**
```json
{
  "image_key": "uploads/abc123.jpg",
  "thumbnail_key": "uploads/thumbnails/thumb_abc123.jpg"  // optional
}
```

**Response (200 OK):**
```json
{
  "message": "Image deleted successfully",
  "deleted_image": true,
  "deleted_thumbnail": true
}
```

---

## Reviews

### List Reviews

**Endpoint:** `GET /salons/reviews/`

**Description:** Get salon reviews (public)

**Authentication:** None (public)

**Query Parameters:**
- `salon` (uuid, optional): Filter by salon
- `page` (int): Page number

**Response (200 OK):**
```json
{
  "count": 50,
  "results": [
    {
      "id": "uuid",
      "salon": "uuid",
      "salon_name": "Glamour Studio",
      "customer": "uuid",
      "customer_name": "John",
      "booking": "uuid",
      "rating": 5,
      "comment": "Excellent service!",
      "is_verified": true,
      "created_at": "2024-01-20T10:00:00Z",
      "updated_at": "2024-01-20T10:00:00Z"
    }
  ]
}
```

---

### Create Review (Authenticated Only)

**Endpoint:** `POST /salons/reviews/`

**Description:** Create review for a salon (must have completed booking)

**Authentication:** Required (JWT Bearer)

**Request:**
```json
{
  "salon": "uuid",
  "booking": "uuid",  // optional but recommended
  "rating": 5,  // 1-5
  "comment": "Excellent service!"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "salon": "uuid",
  "salon_name": "Glamour Studio",
  "customer": "uuid",
  "customer_name": "John",
  "booking": "uuid",
  "rating": 5,
  "comment": "Excellent service!",
  "is_verified": true,
  "created_at": "2024-01-25T10:00:00Z",
  "updated_at": "2024-01-25T10:00:00Z"
}
```

---

### Get My Reviews

**Endpoint:** `GET /salons/reviews/my_reviews/`

**Description:** Get current user's reviews

**Authentication:** Required (JWT Bearer)

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "salon": "uuid",
    "salon_name": "Glamour Studio",
    "rating": 5,
    "comment": "Excellent service!",
    "created_at": "2024-01-20T10:00:00Z"
  }
]
```

---

### Get Salon Review Summary

**Endpoint:** `GET /salons/reviews/salon_summary/?salon=uuid`

**Description:** Get review statistics for a salon

**Authentication:** None (public)

**Query Parameters:**
- `salon` (uuid, required): Salon ID

**Response (200 OK):**
```json
{
  "salon_id": "uuid",
  "salon_name": "Glamour Studio",
  "avg_rating": 4.5,
  "review_count": 24,
  "rating_distribution": {
    "1": 0,
    "2": 1,
    "3": 2,
    "4": 8,
    "5": 13
  }
}
```

---

## Health Check

**Endpoint:** `GET /health/`

**Description:** Health check for container orchestration

**Authentication:** None (public)

**Response (200 OK):**
```json
{
  "status": "healthy",
  "database": "ok",
  "service": "beautify-api"
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error description",
  "detail": "Detailed error message (optional)"
}
```

**Common HTTP Status Codes:**
- `200 OK`: Successful GET/PATCH/DELETE
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE with no response body
- `400 Bad Request`: Invalid input or validation error
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limited
- `500 Internal Server Error`: Server error

---

## Rate Limiting

- **Phone Auth Initiate**: 5 requests per phone+IP per 5 minutes
- **Phone Auth Verify**: 5 requests per phone+IP per 5 minutes
- **General Endpoints**: Standard REST rate limits (varies by endpoint)

---

## Authentication Flow for Mobile

### Recommended Flow:

1. **Initial Authentication:**
   - `POST /accounts/auth/phone/initiate/` → Get SMS code
   - `POST /accounts/auth/phone/verify/` → Get JWT tokens
   - Store `access_token` and `refresh_token` securely

2. **Making Authenticated Requests:**
   - Include `Authorization: Bearer {access_token}` header
   - On 401 response: `POST /accounts/token/refresh/` → Get new access token

3. **Device Registration (Optional but Recommended):**
   - `POST /accounts/device-tokens/register/` → Register for push notifications
   - Store `device_token_id` locally

4. **Logout:**
   - `POST /accounts/device-tokens/unregister/` → Remove device token
   - Clear `access_token` and `refresh_token` from storage

---

## Test Credentials (Debug Mode Only)

When `DEBUG=True`, use these test phone numbers for instant verification:

| Phone | Code | Description |
|-------|------|-------------|
| +48111111111 | 1111 | Test Customer 1 |
| +48222222222 | 2222 | Test Customer 2 |
| +48333333333 | 3333 | Test Customer 3 |
| +48999999999 | 9999 | Generic Test User |
| +48555555555 | 5555 | Test Staff Member |

---

## Swagger/OpenAPI Documentation

Interactive API documentation available at:
- Swagger UI: `https://api.beautify.local/api/schema/swagger-ui/`
- ReDoc: `https://api.beautify.local/api/schema/redoc/`
- OpenAPI JSON: `https://api.beautify.local/api/schema/`

---

## Common Mobile Flows

### 1. Browse & Book (Anonymous)

```
GET /feed/posts/city_feed/?city=Warsaw
  → Display feed posts
  
GET /feed/posts/{id}/salon_booking/
  → Get booking options
  
GET /bookings/availability/?salon=X&service=Y&staff=Z&date=2024-01-25
  → Show available times
  
POST /bookings/create_anonymous/
  → Create booking
```

### 2. Browse & Book (Authenticated)

```
POST /accounts/auth/phone/verify/
  → Get JWT tokens
  
POST /accounts/device-tokens/register/
  → Register for notifications
  
POST /bookings/
  → Create authenticated booking
```

### 3. Manage Booking (Anonymous)

```
GET /bookings/lookup_anonymous/?token=XXX
  → View booking details
  
POST /bookings/reschedule/
  → Reschedule to new time
  
POST /bookings/cancel_anonymous/
  → Cancel booking
```

### 4. View Salon Details & Services

```
GET /salons/salons/{id}/
  → Get salon info
  
GET /salons/services/?salon=X
  → Get services
  
GET /salons/staff/?salon=X
  → Get staff members
  
GET /salons/business-hours/?salon=X
  → Get business hours
  
GET /salons/reviews/?salon=X
  → Get reviews
```

---

**Last Updated:** 2024-01-25
**API Version:** 1.0
**Environment:** Production-ready
