import express from 'express';
var router = express.Router();
import { db } from '../client/pg-client.js';

/* GET home page. */
router.get('/', async function(req, res, next) {
  const result = await db.query(
      "SELECT id, title, author, cover_edition_key FROM book ORDER BY last_accessed_at DESC LIMIT 10;",
  );

  res.render('index', { 
    title: 'Express', 
    books: result.rows || []
  });
});

export default router;
