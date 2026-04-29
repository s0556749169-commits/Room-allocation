const express = require('express');
const router = express.Router();
const cancellationController = require('../controllers/cancellationController');

router.post('/add', cancellationController.addCancellation);
router.delete('/:id', cancellationController.deleteCancellation);

module.exports = router;