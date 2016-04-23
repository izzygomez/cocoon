var express = require('express');
var router = express.Router();
var schemas = require('../models/schemas');
var bcrypt = require('bcryptjs');

var User = schemas.User;

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});


module.exports = router;
