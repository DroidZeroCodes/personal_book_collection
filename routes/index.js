import express from 'express';
var router = express.Router();
import { db } from '../client/pg-client.js';

/* GET home page. */
router.get('/', async function(req, res, next) {
  const result = await db.query(
      "SELECT book.id, book.title, book.author, book.cover_edition_key, book.status, book_reviews.rating FROM book LEFT JOIN book_reviews ON book.id = book_reviews.book_id ORDER BY book.last_accessed_at DESC LIMIT 10;",
  );

  res.render('index', { 
    title: 'Express', 
    books: result.rows || []
  });
});

export default router;
