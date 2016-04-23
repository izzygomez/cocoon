var express = require('express');
var router = express.Router();
var schemas = require('../models/schemas');

var User = schemas.User;

/* GET home page. */
router.get('/', function(req, res) {
  res.render('home', { title: 'Cocoon' });
});

module.exports = router;
