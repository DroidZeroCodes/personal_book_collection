import express from 'express';
import { db } from '../client/pg-client.js';
import { fetchBookCovers, fetchBookDetails, fetchBooks } from '../client/open-library-client.js';

var router = express.Router();

/* GET get saved books. */
router.get('/', async function(req, res, next) {
    res.render('my-books', { 
        title: 'Books',
        books: []
    });
});

/* GET book details. */
router.get('/:id', async function(req, res, next) {
    const { id } = req.params;

    const book = await fetchBooks(id, 1);
    const bookDetails = await fetchBookDetails(id);
    const savedBookResult = await db.query(
        'SELECT status FROM book WHERE id = $1;',
        [id]
    );
    const isInMyList = savedBookResult.rowCount > 0 ? savedBookResult.rows[0].status : false;
    const status = isInMyList ? isInMyList : 'not_started';

    const oliBook = book.docs.map(book => ({
        olid: book.key.substring(7),
        title: book.title,
        author: book.author_name.join(", ") || 'Unknown',
        publish_year: book.first_publish_year || 'N/A',
        cover_edition_key: book.cover_edition_key,
        description: bookDetails.description || bookDetails.description.value || 'No description available.',
        links: bookDetails.links ? bookDetails.links.map(link => ({
            title: link.title,
            url: link.url
        })) : [],
        inMyList: isInMyList,
        status: status
    }));

    console.log('Book:', oliBook);
    res.render("books", { oliBook: oliBook[0] });
});

/* POST add new book. */
router.post('/:olid', async function(req, res, next) {
    const { olid } = req.params;

    const fetchedBook = await fetchBooks(olid, 1);
    const fetchedBookDetails = await fetchBookDetails(olid);

    const book = fetchedBook.docs.map(book => ({
        olid: book.key.substring(7),
        title: book.title,
        author: book.author_name.join(", ") || 'Unknown',
        publish_year: book.first_publish_year || 'N/A',
        cover_edition_key: book.cover_edition_key,
        description: fetchedBookDetails.description.value || 'No description available.',
        links: fetchedBookDetails.links ? fetchedBookDetails.links.map(link => ({
            title: link.title,
            url: link.url
        })) : [],
    }))[0];

    const dbResponse = await db.query(
        'INSERT INTO book (id, title, author, cover_edition_key, publish_year, description, links, last_accessed_at, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;',
        [book.olid, book.title, book.author, book.cover_edition_key, book.publish_year, book.description, book.links, new Date(), "not_started"]
    );

    console.log('Created book ID');
    res.redirect(`/books/${book.olid}`);
});

/* PUT update book status. */
router.post('/:id/status', async function(req, res, next) {
    const { id } = req.params;
    const { status } = req.body;

    const dbResponse = await db.query(
        'UPDATE book SET status = $1, last_accessed_at = $2 WHERE id = $3 RETURNING id;',
        [status, new Date(), id]
    );

    console.log('Updated book status');
    res.redirect(`/books/${id}`);
});

/* DELETE delete book. */
router.delete('/:id', async function(req, res, next) {
    const testSearchBooks = await fetchBooks('harry', 5);
    console.log('Books:', testSearchBooks);
    res.send('respond with a resource');
});

/* GET search books. */
router.get('/search', async function(req, res, next) {
    const testSearchBooks = await fetchBooks('harry', 5);
    console.log('Books:', testSearchBooks);
    res.send('respond with a resource');
});

/* POST add book review. */
router.post('/:id/review', async function(req, res, next) {
    const testSearchBooks = await fetchBooks('harry', 5);
    console.log('Books:', testSearchBooks);
    res.send('respond with a resource');
});

/* PUT update book review. */
router.put('/:id/review', async function(req, res, next) {
    const testSearchBooks = await fetchBooks('harry', 5);
    console.log('Books:', testSearchBooks);
    res.send('respond with a resource');
});

/* DELETE book review. */
router.delete('/:id/review', async function(req, res, next) {
    const testSearchBooks = await fetchBooks('harry', 5);
    console.log('Books:', testSearchBooks);
    res.send('respond with a resource');
});

export default router;
