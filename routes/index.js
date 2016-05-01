var express = require('express');
var router = express.Router();
var schemas = require('../models/schemas');
var bcrypt = require('bcryptjs');

var User = schemas.User;

/* GET index page. */
router.get('/', function(req, res) {
  if (req.session.currentUser) {
    var user = req.session.currentUser;
    var message = 'Logged in as: ' + user.username;
    res.render('index', { message: message });
  } else {
    res.render('index', { message: '' });
  }
});

/* GET logout */
router.get('/logout', function(req, res, next) {
  req.session.currentUser = undefined;
  res.redirect('/');
});


module.exports = router;
