const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.get('/search', roomController.searchAvailableRooms);
router.post('/cancellations', roomController.createCancellation);

module.exports = router;