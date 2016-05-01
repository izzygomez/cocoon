var express = require('express');
var router = express.Router();
var schemas = require('../models/schemas');
var bcrypt = require('bcryptjs');

var User = schemas.User;

/* GET login */
router.get('/', function(req, res, next) {
  res.render('login');
});

/* POST login */
router.post('/', function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  User.findOne({ username: username }, function(err, user) {
    if (user === null) {
      res.render('login', { message: 'Username or password is not correct!' });
    } else if (bcrypt.compareSync(password, user.password)) {
      req.session.currentUser = user;
      res.redirect('home');
    } else {
      res.render('login', { message: 'Username or password is not correct!' });
    }
  });
});


module.exports = router;
