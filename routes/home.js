var express = require('express');
var router = express.Router();
var schemas = require('../models/schemas');

var User = schemas.User;

/* GET home page. */
router.get('/', function(req, res) {
  res.render('home', { title: 'THE APP' });
});

module.exports = router;
