var express = require('express');
var router = express.Router();
var schemas = require('../models/schemas');
var bcrypt = require('bcryptjs');

var User = schemas.User;

/* GET register page. */
router.get('/', function(req, res) {
  res.render('register');
});

/* POST register */
router.post('/', function(req, res, next) {
  var username = req.body.username;
  User.findOne({ 'username': username }, function(err, user) {
    if (user) {
      res.render('register', { message: 'Username already exists!' });
    } else {
      var password = req.body.password;
      var confirm_password = req.body.confirm_password;
      if (password === confirm_password) {
        var salt = bcrypt.genSaltSync(10);
        var new_user = new User({
          username: username,
          password: bcrypt.hashSync(password, salt)
        });
        new_user.save();
        res.render('index', { message: 'Registration successful!' });
      } else {
        res.render('register', { message: 'The passwords don\'t match!' });
      }
    }
  });
});


module.exports = router;
