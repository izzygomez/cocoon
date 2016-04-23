var express = require('express');
var router = express.Router();
var schemas = require('../models/schemas');

var User = schemas.User;

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

/* POST register */
router.post('/register', function(req, res, next) {
  var username = req.body.username;
  User.findOne({ 'username': username }, function(err, user) {
    if (user) {
      res.send({ success: false, message: 'Username already exists!' });
    } else {
      var password = req.body.password;
      var confirm_password = req.body.confirm_password;
      if (password === confirm_password) {
        var new_user = new User({
          username: username,
          password: password
        });
        new_user.save();
        res.send({ success: true, message: 'Registration successful!' });
      } else {
        res.send({ success: false, message: 'The passwords don\'t match!' });
      }
    }
  });
});

/* POST login */
router.post('/login', function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  User.findOne({ username: username }, function(err, user) {
    if (user === null) {
      res.send({ success: false,
                 message: 'Username or password is not correct' });
    } else if (password == user.password) {
      res.send({ success: true,
                 message: 'The login info is good!' });
    } else {
      res.send({ success: false,
                 message: 'Username or password is not correct' });
    }
  });
});


module.exports = router;
