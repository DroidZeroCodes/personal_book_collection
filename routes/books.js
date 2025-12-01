import express from 'express';
import { db } from '../client/pg-client.js';
import { fetchBookDetails, fetchBooks } from '../client/open-library-client.js';

var router = express.Router();

/* GET: Display all saved books (The Library) */
router.get('/', async function(req, res, next) {
    try {
        const result = await db.query(
            `SELECT book.*, book_reviews.rating, book_reviews.content 
             FROM book 
             LEFT JOIN book_reviews ON book.id = book_reviews.book_id 
             ORDER BY book.last_accessed_at DESC`
        );
        
        res.render('books', { 
            title: 'My Library',
            books: result.rows || []
        });
    } catch (err) {
        console.error("Error fetching library:", err);
        next(err);
    }
});

/* GET: Display form to Write/Edit a Review */
router.get('/:id/review', async function(req, res, next) {
    const { id } = req.params;
    try {
        // 1. Get Book Info
        const bookResult = await db.query('SELECT * FROM book WHERE id = $1', [id]);
        
        if (bookResult.rows.length === 0) {
            return res.status(404).send("Book not found in library");
        }

        // 2. Get Existing Review (if any)
        const reviewResult = await db.query('SELECT * FROM book_reviews WHERE book_id = $1', [id]);

        res.render('review', { 
            book: bookResult.rows[0],
            review: reviewResult.rows[0] || null
        });
    } catch (err) {
        console.error("Error fetching review form:", err);
        next(err);
    }
});

/* POST: Save or Update a Review */
router.post('/:id/review', async function(req, res, next) {
    const { id } = req.params;
    const { rating, content } = req.body;

    try {
        // PostgreSQL UPSERT: Insert, or Update if it already exists for this book_id
        await db.query(
            `INSERT INTO book_reviews (book_id, rating, content, date_added) 
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (book_id) 
             DO UPDATE SET rating = $2, content = $3, date_added = NOW()`,
            [id, rating, content]
        );
        
        res.redirect(`/books/${id}`);
    } catch (err) {
        console.error("Error saving review:", err);
        next(err);
    }
});

/* POST: Delete a Review */
router.post('/:id/review/delete', async function(req, res, next) {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM book_reviews WHERE book_id = $1', [id]);
        res.redirect(`/books/${id}`);
    } catch (err) {
        console.error("Error deleting review:", err);
        next(err);
    }
});

/* POST: Delete a Book (and its review) */
router.post('/:id/delete', async function(req, res, next) {
    const { id } = req.params;
    try {
        // Assuming ON DELETE CASCADE is set up in SQL. If not, delete review first:
        await db.query('DELETE FROM book_reviews WHERE book_id = $1', [id]);
        await db.query('DELETE FROM book WHERE id = $1', [id]);
        
        res.redirect('/books');
    } catch (err) {
        console.error("Error deleting book:", err);
        next(err);
    }
});

/* GET: Book details (Your existing logic, slightly cleaned up) */
router.get('/:id', async function(req, res, next) {
    const { id } = req.params;

    try {
        // Fetch external data
        const book = await fetchBooks(id, 1);
        const bookDetails = await fetchBookDetails(id);
        
        // Fetch internal DB data
        const savedBookResult = await db.query('SELECT status FROM book WHERE id = $1', [id]);
        const savedReviewResult = await db.query('SELECT * FROM book_reviews WHERE book_id = $1', [id]);

        const isInMyList = savedBookResult.rowCount > 0;
        const status = isInMyList ? savedBookResult.rows[0].status : 'not_started';
        const review = savedReviewResult.rows[0] || null;

        const oliBook = book.docs.map(book => ({
            olid: book.key.substring(7),
            title: book.title,
            author: book.author_name ? book.author_name.join(", ") : 'Unknown',
            publish_year: book.first_publish_year || 'N/A',
            cover_edition_key: book.cover_edition_key,
            description: (bookDetails.description && bookDetails.description.value) ? bookDetails.description.value : (bookDetails.description || 'No description available.'),
            links: bookDetails.links ? bookDetails.links.map(link => ({ title: link.title, url: link.url })) : [],
            inMyList: isInMyList,
            status: status,
            review: review // Pass review to the view
        }))[0];

        res.render("book_id", { oliBook: oliBook });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

/* POST: Add new book (Your existing logic) */
router.post('/:olid', async function(req, res, next) {
    const { olid } = req.params;

    try {
        const fetchedBook = await fetchBooks(olid, 1);
        const fetchedBookDetails = await fetchBookDetails(olid);
        
        const bookDoc = fetchedBook.docs[0]; // Safer access
        
        const book = {
            olid: bookDoc.key.substring(7),
            title: bookDoc.title,
            author: bookDoc.author_name ? bookDoc.author_name.join(", ") : 'Unknown',
            publish_year: bookDoc.first_publish_year || 'N/A',
            cover_edition_key: bookDoc.cover_edition_key,
            description: (fetchedBookDetails.description && fetchedBookDetails.description.value) ? fetchedBookDetails.description.value : (fetchedBookDetails.description || 'No description available.'),
            links: fetchedBookDetails.links ? JSON.stringify(fetchedBookDetails.links) : '[]' // Ensure JSON string for DB
        };

        await db.query(
            'INSERT INTO book (id, title, author, cover_edition_key, publish_year, description, links, last_accessed_at, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING',
            [book.olid, book.title, book.author, book.cover_edition_key, book.publish_year, book.description, book.links, new Date(), "not_started"]
        );

        console.log('Book added/ensured');
        res.redirect(`/books/${book.olid}`);
    } catch (err) {
        console.error(err);
        next(err);
    }
});

/* POST: Update status */
router.post('/:id/status', async function(req, res, next) {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.query(
            'UPDATE book SET status = $1, last_accessed_at = $2 WHERE id = $3',
            [status, new Date(), id]
        );
        res.redirect(`/books/${id}`);
    } catch(err) {
        next(err);
    }
});

export default router;