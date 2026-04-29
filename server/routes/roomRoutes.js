const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// כאשר מישהו יפנה לכתובת /search, הפונקציה שכתבת תופעל
router.get('/search', roomController.searchAvailableRooms);

module.exports = router;