import axios from "axios";

async function fetchBookCovers(olid) {
  const bookCovers = await axios.get(`https://covers.openlibrary.org/b/OLID/olid-L.jpg`);
  console.log(bookCovers);
  return bookCovers.data;
}

async function fetchBooks(searchTerm, limit) {
  const searchedBooks = await axios.get(`https://openlibrary.org/search.json?q=${searchTerm}&limit=${limit}`);
  return searchedBooks.data;
}

async function fetchBookDetails(olid) {
  const searchedBooks = await axios.get(`https://openlibrary.org/works/${olid}.json`);
  return searchedBooks.data;
}

export { fetchBookCovers, fetchBooks, fetchBookDetails };