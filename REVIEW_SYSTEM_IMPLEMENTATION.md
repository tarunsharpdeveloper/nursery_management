# Review System Implementation

## Overview
Fully functional review system allowing customers to submit and view product reviews.

---

## Database Schema

### Reviews Table
Located in: `database/schema.sql`

```sql
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_approved BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Fields:**
- `id`: Auto-increment primary key
- `product_id`: Foreign key to products table
- `customer_name`: Reviewer's full name
- `customer_email`: Reviewer's email (not displayed publicly)
- `rating`: 1-5 star rating
- `review_text`: Review content
- `created_at`: Timestamp of review submission
- `is_approved`: Moderation flag (default: TRUE)

---

## Backend Implementation

### API Endpoints
Located in: `backend/routes/reviews.js`

#### 1. GET `/api/reviews/:productId`
- **Purpose**: Fetch all approved reviews for a product
- **Authentication**: None (public endpoint)
- **Response**: Array of review objects
```json
[
  {
    "id": 1,
    "customer_name": "John Doe",
    "rating": 5,
    "review_text": "Excellent product!",
    "created_at": "2026-06-30T10:30:00Z"
  }
]
```

#### 2. POST `/api/reviews`
- **Purpose**: Submit a new review
- **Authentication**: None (public endpoint)
- **Request Body**:
```json
{
  "product_id": 11,
  "customer_name": "Jane Smith",
  "customer_email": "jane@example.com",
  "rating": 5,
  "review_text": "Great quality plants!"
}
```
- **Validation**:
  - All fields required
  - Rating must be 1-5
  - Email format validation
  - Product must exist
- **Response**: 201 Created with review details

#### 3. GET `/api/reviews/stats/:productId`
- **Purpose**: Get review statistics for a product
- **Authentication**: None (public endpoint)
- **Response**:
```json
{
  "total_reviews": 10,
  "average_rating": 4.5,
  "five_star": 6,
  "four_star": 3,
  "three_star": 1,
  "two_star": 0,
  "one_star": 0
}
```

### Route Registration
Updated in: `backend/app.js`

**Key Changes:**
1. Added route matcher function to handle path parameters (`:productId`)
2. Registered review routes:
```javascript
["GET", "/api/reviews/:productId", null, getReviews],
["POST", "/api/reviews", null, submitReview],
["GET", "/api/reviews/stats/:productId", null, getReviewStats]
```

**Route Matching Function:**
```javascript
function matchRoute(method, pathname, routeMethod, routePath) {
  // Handles exact matches and path parameters like :productId
}
```

---

## Frontend Implementation

### Product Details Page
Located in: `frontend/src/app/products/[id]/ProductDetailsClient.tsx`

#### State Management
```typescript
// Review states
const [reviews, setReviews] = useState<Review[]>([]);
const [reviewsLoading, setReviewsLoading] = useState(true);
const [reviewForm, setReviewForm] = useState({
  customer_name: '',
  customer_email: '',
  review_text: ''
});
const [reviewRating, setReviewRating] = useState(0);
const [hoverRating, setHoverRating] = useState(0);
const [submittingReview, setSubmittingReview] = useState(false);
const [reviewSubmitMessage, setReviewSubmitMessage] = useState<{
  type: 'success' | 'error',
  text: string
} | null>(null);
```

#### Features Implemented

**1. Review Loading**
- Fetches reviews on component mount
- Shows loading spinner while fetching
- Displays "No reviews yet" message if empty

**2. Review Display**
- Shows customer name and review date
- Star rating visualization
- Review text content
- Properly formatted dates

**3. Review Submission Form**
- Full name input (required)
- Email input (required, validated)
- Review text textarea (required)
- Star rating selector (1-5 stars, required)
- Submit button with loading state
- Success/error message display

**4. Form Validation**
- Client-side validation for all fields
- Rating selection required
- Email format validation
- Error messages displayed to user

**5. User Experience**
- Form fields disabled during submission
- Loading spinner on submit button
- Success message shown for 5 seconds
- Form reset after successful submission
- Reviews list automatically refreshed

---

## How to Use

### For Customers (Frontend)
1. Visit any product details page (e.g., `/products/11`)
2. Scroll to the "Reviews" section
3. View existing reviews from other customers
4. To submit a review:
   - Select a star rating (1-5)
   - Enter your full name
   - Enter your email address
   - Write your review
   - Click "Post Review"
5. See success message and your review appears immediately

### For Administrators
- All reviews are auto-approved by default (`is_approved = TRUE`)
- To implement moderation:
  - Change default `is_approved` to `FALSE` in schema
  - Create admin panel to approve/reject reviews
  - Only approved reviews appear on frontend

---

## Database Setup

**Run this SQL to create the reviews table:**

```sql
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_approved BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Deployment Instructions

### Backend
1. Ensure the reviews table exists in your database
2. **Restart the backend server** to load the route matcher changes:
   ```bash
   # Stop the backend if running
   # Then start it again
   cd backend
   node app.js
   ```

### Frontend
The frontend changes are already in place. If you rebuild:
```bash
cd frontend
npm run build
```

---

## Testing the System

### 1. Test Review Display
- Visit: `http://localhost:3000/products/11`
- Scroll to Reviews section
- Should show "No reviews yet" if none exist

### 2. Test Review Submission
- Fill out the review form
- Select a rating
- Click "Post Review"
- Should see success message
- Review should appear immediately

### 3. Test API Directly

**Fetch reviews:**
```bash
curl http://localhost:4000/api/reviews/11
```

**Submit a review:**
```bash
curl -X POST http://localhost:4000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 11,
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "rating": 5,
    "review_text": "Great product!"
  }'
```

**Get review stats:**
```bash
curl http://localhost:4000/api/reviews/stats/11
```

---

## Future Enhancements

### Recommended Features
1. **Review Moderation Dashboard**
   - Admin panel to approve/reject reviews
   - Bulk actions for moderation

2. **Verified Purchase Badge**
   - Link reviews to actual orders
   - Show "Verified Purchase" badge

3. **Helpful Votes**
   - Allow users to mark reviews as helpful
   - Sort by most helpful

4. **Review Images**
   - Allow customers to upload product photos
   - Store in media_urls column

5. **Review Reply**
   - Allow store owner to reply to reviews
   - Add `parent_review_id` field

6. **Rating Statistics Widget**
   - Show average rating on product cards
   - Display rating breakdown (5⭐: 80%, 4⭐: 15%, etc.)

7. **Email Notifications**
   - Notify admin when new review submitted
   - Notify customer when review approved

---

## Files Modified

### Backend
- ✅ `backend/routes/reviews.js` - Created review routes
- ✅ `backend/app.js` - Added route matcher and registered review routes
- ✅ `database/schema.sql` - Added reviews table

### Frontend
- ✅ `frontend/src/app/products/[id]/ProductDetailsClient.tsx` - Implemented review UI and functionality

---

## Support

If you encounter issues:
1. Verify the reviews table exists in your database
2. Ensure backend server is restarted after route changes
3. Check browser console for frontend errors
4. Check backend terminal for API errors
5. Verify product_id exists in products table

---

**Status**: ✅ Fully Implemented
**Last Updated**: June 30, 2026
