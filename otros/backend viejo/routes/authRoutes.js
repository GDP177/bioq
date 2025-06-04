const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/ping', (req, res) => {
  res.send('pong');
});

module.exports = router;
