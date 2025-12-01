import express from 'express';
import { fetchBooks } from '../client/open-library-client.js';

var router = express.Router();

/* GET search books in oli */
router.get('/search', async function (req, res, next) {
    try {
        const { q, ajax } = req.query;
        const searchedBooks = await fetchBooks(q, 10);
        const oliSearchResults = searchedBooks.docs.map(book => ({
            olid: book.key.substring(7),
            title: book.title,
            author: book.author_name.join(", ") || 'Unknown',
            publish_year: book.first_publish_year || 'N/A',
            cover_edition_key: book.cover_edition_key
        }));

        console.log('Books:', oliSearchResults);

        // If AJAX → return JSON only
        if (ajax) {
            return res.json(oliSearchResults);
        }
        
        res.render(".", { q, oliSearchResults });
    } catch (error) {
        console.error('Error fetching search results:', error);
        next(error);
    }
});

export default router;
