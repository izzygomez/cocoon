var express = require('express');
var router = express.Router();
var schemas = require('../models/schemas');
var bcrypt = require('bcryptjs');


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
        var salt = bcrypt.genSaltSync(10);
        var new_user = new User({
          username: username,
          password: bcrypt.hashSync(password, salt)
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
    } else if (bcrypt.compareSync(password, user.password)) {
      res.redirect('/home');
    } else {
      res.send({ success: false,
                 message: 'Username or password is not correct' });
    }
  });
});


module.exports = router;
