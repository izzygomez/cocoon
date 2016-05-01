var express = require('express');
var router = express.Router();

var authenticate = function(req, res, next) {
  if (req.session.currentUser) {
    next();
  } else {
    res.render('index', { message: 'Please log in!' });
  }
};

router.all('*', authenticate);

/* GET home page. */
router.get('/', function(req, res, next) {
  var user = req.session.currentUser;
  var message = 'Logged in as: ' + user.username;
  res.render('upload', { user: user, message: message });
});


module.exports = router;
