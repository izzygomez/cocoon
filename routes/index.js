var express = require('express');
var router = express.Router();
var schemas = require('../models/schemas');
var bcrypt = require('bcryptjs');

var User = schemas.User;

var authenticate = function(req, res, next) {
  if (req.session.currentUser) {
    next();
  } else {
    res.render('index', { message: '' });
  }
};

router.all('*', authenticate);

/* GET index page. */
router.get('/', function(req, res) {
  var user = req.session.currentUser;
  var message = 'Logged in as: ' + user.username;
  res.render('index', { message: message });
});

/* GET logout */
router.get('/logout', function(req, res, next) {
  req.session.currentUser = undefined;
  res.redirect('/');
});


module.exports = router;
