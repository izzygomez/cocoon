var express = require('express');
var router = express.Router();
var schemas = require('../models/schemas');

var User = schemas.User;

var authenticate = function(req, res, next) {
  if (req.session.currentUser) {
    next();
  } else {
    res.render('index', { message: 'Please log in!' });
  }
};

router.all('*', authenticate);

/* GET home page. */
router.get('/', function(req, res) {
  var user = req.session.currentUser;
  var message = 'Welcome, ' + user.username + '!';

  User.findOne({ 'username': user.username }, function(err, user) {
    if (user == null) {
      res.render('index', { message: 'An error occurred!' });
      return;
    }
    res.render('home', { user: true ,
                         files: user.files,
                         message: message });
  });
});


module.exports = router;
