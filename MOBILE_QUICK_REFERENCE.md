# Beautify Mobile API - Quick Reference Guide

**For Mobile Development Team Planning**

---

## 🔐 Authentication Flow

### Step 1: Phone Authentication
```
POST /accounts/auth/phone/initiate/
  → {phone: "+48123456789"}
  ← SMS code sent

POST /accounts/auth/phone/verify/
  → {phone: "+48123456789", code: "1234"}
  ← {access_token, refresh_token, user_data, created: bool}
```

### Step 2: Token Management
```
// Use in all authenticated requests
Header: Authorization: Bearer {access_token}

// When access token expires (401 response)
POST /accounts/token/refresh/
  → {refresh: refresh_token}
  ← {access: new_access_token}
```

### Step 3: Push Notifications (Optional but Recommended)
```
POST /accounts/device-tokens/register/
  → {token: "FCM_token", platform: "ios|android|web", device_id: "..."}
  ← {device_token_id, created: bool}

// On logout
POST /accounts/device-tokens/unregister/
  → {token: "FCM_token"}
```

---

## 🏪 Salon Discovery & Browsing

### Primary: City Feed (Main Screen)
```
GET /feed/posts/city_feed/?city=Warsaw&post_type=hair&page=1
  ← {
      results: [{
        id, salon, author, title, description, image_url, 
        likes_count, views_count, post_type
      }],
      city, total_posts, count, next
    }
```

### Alternative: Nearby Feed (Location-Based)
```
GET /feed/posts/nearby_feed/
  ?latitude=52.2297&longitude=21.0122&radius_km=10&post_type=hair
  ← {
      results: [posts...],
      total_posts, radius_km
    }
```

### Get Post Details & Booking Options
```
GET /feed/posts/{id}/
  ← {post details + booking info auto-tracked}

GET /feed/posts/{id}/salon_booking/
  ← {
      salon: {...},
      services: [{id, name, duration_minutes, price_display}],
      staff_members: [...],
      booking_options: {
        email_booking: {enabled, endpoint, required_fields},
        sms_booking: {...},
        authenticated_booking: {...}
      },
      helper_endpoints: {
        availability: "...",
        available_slots: "..."
      }
    }
```

### Browse Salon Details
```
GET /salons/salons/{id}/
  ← {name, address, city, phone, email, timezone, avg_rating, review_count}

GET /salons/services/?salon={id}
  ← [{id, name, duration_minutes, price_display}]

GET /salons/staff/?salon={id}
  ← [{id, display_name, services}]

GET /salons/business-hours/?salon={id}
  ← [{day_name, open_time, close_time, is_closed}]

GET /salons/reviews/?salon={id}
  ← [{customer_name, rating, comment, created_at}]

GET /salons/reviews/salon_summary/?salon={id}
  ← {avg_rating, review_count, rating_distribution}
```

---

## 📅 Booking Flow (Anonymous)

### Step 1: Get Available Times
```
GET /bookings/availability/?salon={id}&service={id}&staff={id}&date=2024-01-25
  ← {
      slot_options: [{
        slot_ids: ["uuid1", "uuid2"],
        start_datetime, end_datetime,
        display: {start_time, end_time}
      }],
      total_options
    }
```

### Step 2: (Optional) Hold Slots (5-minute expiry)
```
POST /bookings/holds/
  → {slot_ids: ["uuid1", "uuid2"]}
  ← {hold_id, expires_at}
```

### Step 3: Create Booking
```
// Via Email (recommended)
POST /bookings/create_anonymous/
  → {
      salon, service, staff,
      start_time,
      customer_name, customer_email, customer_phone
    }
  ← {
      booking: {...},
      booking_token: "save_this_for_later"
    }

// OR via Hold
POST /bookings/create_anonymous_by_hold/
  → {salon, service, staff, hold_id, customer_name, customer_email, customer_phone}
```

### Step 4: Manage Anonymous Booking
```
// Look up
GET /bookings/lookup_anonymous/?token={booking_token}
  ← {booking details}

// Reschedule (2-hour notice required)
POST /bookings/reschedule/
  → {token, new_slot_ids: ["uuid1", "uuid2"]}

// Cancel (respects cancellation policy)
POST /bookings/cancel_anonymous/
  → {token}
  ← May error if within cancellation window
```

---

## 📅 Booking Flow (Authenticated)

### Create Booking
```
POST /bookings/
  → {salon, service, staff, start_time}
  ← {booking...}
```

### View My Bookings
```
GET /bookings/
  ← [{id, salon, service, staff, start_time, status}]
```

---

## 📋 Waitlist (When No Slots Available)

```
POST /bookings/join_waitlist/
  → {
      salon, service, staff (optional),
      preferred_date,
      customer_name, customer_phone, customer_email (optional)
    }
  ← {waitlist_id, position, expires_at}

GET /bookings/my_waitlist/?phone={optional}
  ← [{id, salon, service, staff, preferred_date, status, position}]

POST /bookings/leave_waitlist/
  → {waitlist_id, phone (optional)}
```

---

## ❤️ Social Features (Authenticated)

```
// Like/Unlike Post
POST /feed/posts/{id}/like/
  ← {liked: bool, likes_count}

// Save/Unsave Post
POST /feed/posts/{id}/save/
  ← {saved: bool}

// Get Saved Posts
GET /feed/posts/saved/
  ← [{posts}]

// Track View (auto-called on detail view)
POST /feed/posts/{id}/view/
  ← {viewed: true}

// Leave Review
POST /salons/reviews/
  → {salon, booking (optional), rating (1-5), comment}
  ← {review...}

// Get My Reviews
GET /salons/reviews/my_reviews/
  ← [{reviews}]
```

---

## 📸 Image Upload

### Method 1: Upload to Server (Simpler)
```
POST /media/upload/
  Content-Type: multipart/form-data
  → {image: [binary], folder: "uploads"}
  ← {image_url, thumbnail_url, image_key}
```

### Method 2: Presigned URL (Faster for Mobile)
```
POST /media/presigned-url/
  → {content_type: "image/jpeg", folder: "uploads"}
  ← {upload_url, object_key, public_url, expires_in}

// Then upload directly to S3
PUT {upload_url}
  Content-Type: image/jpeg
  → [binary image data]
```

### For Feed Posts
```
POST /feed/posts/upload_image/
  → Same as /media/upload

POST /feed/posts/get_upload_url/
  → Same as /media/presigned-url/
```

---

## 📱 User Profile

```
GET /accounts/me/
  ← {id, phone, phone_verified, email, first_name, last_name, role}

PATCH /accounts/me/
  → {email, first_name, last_name}
  ← {updated user}
```

---

## 🔔 Notification Preferences

```
GET /accounts/notifications/preferences/
  ← {push_notifications_enabled, sms_notifications_enabled, email_notifications_enabled}

PATCH /accounts/notifications/preferences/
  → {push_notifications_enabled, sms_notifications_enabled, email_notifications_enabled}
```

---

## ⚠️ Error Handling

All errors follow this format:
```json
{
  "error": "Error description",
  "detail": "Optional detailed message"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (auth required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Server Error

**Common Validation Errors:**
```json
{
  "error": "Cannot cancel booking less than 24 hours before appointment",
  "cancellation_policy": {
    "notice_hours": 24,
    "hours_until_appointment": 18.5
  }
}
```

---

## 🧪 Testing (DEBUG Mode)

When `DEBUG=True`, use these test credentials:

| Phone | Code | Role |
|-------|------|------|
| +48111111111 | 1111 | Customer 1 |
| +48222222222 | 2222 | Customer 2 |
| +48333333333 | 3333 | Customer 3 |
| +48999999999 | 9999 | Generic User |
| +48555555555 | 5555 | Staff Member |

---

## 📊 Data Models - Quick Reference

### Booking Status Values
- `PENDING` - Created, awaiting confirmation
- `CONFIRMED` - Confirmed by salon
- `CANCELLED` - Cancelled by customer
- `COMPLETED` - Service completed

### Post Types
- `hair` - Hair services
- `makeup` - Makeup services
- `nails` - Nail services
- `skin` - Skin treatments

### User Roles
- `customer` - Regular user
- `staff` - Salon staff member
- `owner` - Salon owner

### Notification Channels
- `push` - Firebase Cloud Messaging
- `sms` - SMS text message
- `email` - Email

---

## 🔗 API Documentation Links

- **Full Documentation:** `/API_DOCUMENTATION.md`
- **OpenAPI Spec:** `/openapi.yaml`
- **Swagger UI:** `https://api.beautify.local/api/schema/swagger-ui/`
- **ReDoc:** `https://api.beautify.local/api/schema/redoc/`
- **OpenAPI JSON:** `https://api.beautify.local/api/schema/`

---

## 🚀 Implementation Tips

1. **Handle Rate Limiting:** Implement exponential backoff for 429 responses
2. **Cache Feed Posts:** Cache city feed for 5 minutes (no auth needed)
3. **Store Tokens Securely:** Use keychain/secure storage, never localStorage
4. **Track Analytics:** Call `/feed/posts/{id}/view/` automatically when showing posts
5. **Phone Format:** Always send in E.164 format (+country_code followed by number)
6. **Timezone:** Use salon's timezone for all time displays
7. **ISO 8601:** All times are ISO 8601 format (UTC with Z suffix)
8. **Images:** Check thumbnail_url for list views, image_url for details
9. **Pagination:** Use `page` and `page_size` query parameters
10. **Error Messages:** Display user-friendly messages from `error` field, keep `detail` for debugging

---

## 📋 Development Checklist

- [ ] Implement phone authentication
- [ ] Store & refresh JWT tokens
- [ ] Register device tokens on login
- [ ] Unregister device tokens on logout
- [ ] Display city feed (main screen)
- [ ] Implement nearby feed (geo-location)
- [ ] Browse salon details from posts
- [ ] Get available times for booking
- [ ] Create anonymous booking
- [ ] Manage anonymous bookings (lookup, reschedule, cancel)
- [ ] Waitlist functionality
- [ ] Authenticated user bookings
- [ ] User profile management
- [ ] Image upload/presigned URLs
- [ ] Like/save posts (authenticated)
- [ ] Leave reviews (authenticated)
- [ ] Push notification setup
- [ ] Notification preferences management
- [ ] Error handling & rate limiting
- [ ] Offline support (optional)

---

**Last Updated:** 2024-01-25
**API Version:** 1.0
