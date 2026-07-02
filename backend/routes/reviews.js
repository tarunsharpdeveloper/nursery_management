const { pool } = require('../db');
const { readJson, sendJson } = require('../http');

/**
 * Get all approved reviews for a product
 */
async function getReviews(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];
    
    const [reviews] = await pool.query(
      `SELECT id, customer_name, rating, review_text, created_at 
       FROM reviews 
       WHERE product_id = ? AND is_approved = TRUE 
       ORDER BY created_at DESC`,
      [productId]
    );
    
    sendJson(res, 200, reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    sendJson(res, 500, { error: 'Failed to fetch reviews' });
  }
}

/**
 * Submit a new review
 */
async function submitReview(req, res) {
  try {
    const body = await readJson(req);
    const { product_id, customer_name, customer_email, rating, review_text } = body;
    
    // Validation
    if (!product_id || !customer_name || !customer_email || !rating || !review_text) {
      return sendJson(res, 400, { error: 'All fields are required' });
    }
    
    if (rating < 1 || rating > 5) {
      return sendJson(res, 400, { error: 'Rating must be between 1 and 5' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email)) {
      return sendJson(res, 400, { error: 'Invalid email address' });
    }
    
    // Check if product exists
    const [productExists] = await pool.query(
      'SELECT id FROM products WHERE id = ?',
      [product_id]
    );
    
    if (productExists.length === 0) {
      return sendJson(res, 404, { error: 'Product not found' });
    }
    
    // Insert review
    const [result] = await pool.query(
      `INSERT INTO reviews (product_id, customer_name, customer_email, rating, review_text, is_approved) 
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [product_id, customer_name, customer_email, rating, review_text]
    );
    
    sendJson(res, 201, {
      message: 'Review submitted successfully',
      review: {
        id: result.insertId,
        product_id,
        customer_name,
        rating,
        review_text,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    sendJson(res, 500, { error: 'Failed to submit review' });
  }
}

/**
 * Get review statistics for a product
 */
async function getReviewStats(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];
    
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
       FROM reviews 
       WHERE product_id = ? AND is_approved = TRUE`,
      [productId]
    );
    
    sendJson(res, 200, stats[0] || {
      total_reviews: 0,
      average_rating: 0,
      five_star: 0,
      four_star: 0,
      three_star: 0,
      two_star: 0,
      one_star: 0
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    sendJson(res, 500, { error: 'Failed to fetch review statistics' });
  }
}

module.exports = { getReviews, submitReview, getReviewStats };
