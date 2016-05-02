var express = require('express');
var schemas = require('../models/schemas');
var router = express.Router();

var User = schemas.User;

var authenticate = function(req, res, next) {
  if (req.session.currentUser) {
    next();
  } else {
    res.render('index', { message: 'Please log in!' });
  }
};

router.all('*', authenticate);

/* GET file page. */
router.get('/:filename', function(req, res, next) {
  var user = req.session.currentUser;
  var message = 'Logged in as: ' + user.username;

  var filename = req.params.filename;

  res.render('file', { user: true,
                       filename: req.params.filename,
                       message: message });
});


module.exports = router;
