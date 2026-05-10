const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/roomController');

// חיפוש — חייב להיות לפני /:id כדי שלא יתנגש עם הפרמטר
router.get('/search', ctrl.searchAvailableRooms);

// CRUD בסיסי לחדר
router.get('/',      ctrl.getAllRooms);
router.get('/:id',   ctrl.getRoomById);
router.post('/',     ctrl.createRoom);
router.put('/:id',   ctrl.updateRoom);
router.delete('/:id', ctrl.deleteRoom);

// שיבוצים
router.post('/:id/assignments',           ctrl.addPermanentAllocation);
router.post('/:id/temporary-allocations', ctrl.addTemporaryAllocation);

module.exports = router;