var express = require('express');
var schemas = require('../models/schemas');
var router = express.Router();

var User = schemas.User;
var File = schemas.File;

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

  File.findOne({ 'username': user.username, 'filename': filename },
               function(err, file) {
    if (file == null) {
      var message = 'File not found!';
      res.render('file', { user: true,
                           filename: req.params.filename,
                           message: message });
      return;
    }

    res.render('file', { user: true,
                         filename: req.params.filename,
                         message: message });
  });
});

router.post('/:filename/query/1', function(req, res, next) {
  var user = req.session.currentUser;
  var filename = req.params.filename;
  File.findOne({ 'username': user.username, 'filename': filename },
               function(err, file) {
    if (err || file == null) {
      res.send({ success: false, message: 'File not found!' });
      return;
    }
    var T = req.body.T;
    var encryptedIndex = -1;
    var found = false;
    for (var i = T.length - 1; i >= 0; --i) {
      if (T[i] in file.D) {
        encryptedIndex = file.D[ T[i] ];
        found = true;
        break;
      }
    }
    if (found) {
      console.log('found!');
      res.send({ success: true, found: true, encryptedIndex: encryptedIndex });
    } else {
      res.send({ success: true, found: false });
    }
  });
});

router.post('/:filename/query/2', function(req, res, next) {
  var user = req.session.currentUser;
  console.log('got the request! (second round)');
  console.log(req.body.startIndex);
  console.log(req.body.size);
  res.send({ success: true, message: 'something something' });
});


module.exports = router;
