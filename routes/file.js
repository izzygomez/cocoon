var express = require('express');
var schemas = require('../models/schemas');
var crypto = require('./crypto');
var sjcl = require('../public/js/sjcl');
var router = express.Router();

var User = schemas.User;
var File = schemas.File;

var F = crypto.F;
var encrypt = crypto.encrypt;
var decrypt = crypto.decrypt;

var IV_s = 'This is an IV000';

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

    if (T.length < 2) {
      res.send({ success: false, message: 'Query cannot be empty!' });
      return;
    }

    // if the root node is not found, then the client key is wrong
    if (!(T[0] in file.D)) {
      res.send({ success: false, message: 'The key is incorrect!' });
      return;
    }

    try {
      // traverse the suffix tree from the root node as far as possible
      var index = 0;
      if (file.D[ T[index] ].length != 2) throw "Error";
      var encryptedTuple = file.D[ T[index] ][0];
      var children = file.D[ T[index] ][1];
      while (index < T.length) {
        var brake = false;
        for (var j = index + 1; j < T.length; ++j) {
          for (var i = 0; i < children.length; ++i) {
            var decrypted = decrypt(children[i].substring(0, 32), IV_s, T[j]);
            if (decrypted in file.D) {
              if (file.D[ decrypted ].length != 2) throw "Error";
              index = j;
              encryptedTuple = file.D[ decrypted ][0];
              children = file.D[ decrypted ][1];
              brake = true;
            }
            if (brake) break;
          }
          if (brake) break;
        }
        if (!brake) break;
      }
    } catch (e) {
      res.send({ success: false, message: 'The ciphertext is corrupted.' });
    }

    res.send({ success: true,
               encryptedTuple: encryptedTuple,
               C_length: file.C.length });
  });
});

router.post('/:filename/query/2', function(req, res, next) {
  var user = req.session.currentUser;
  var filename = req.params.filename;
  File.findOne({ 'username': user.username, 'filename': filename },
               function(err, file) {
    if (err || file == null) {
      res.send({ success: false, message: 'File not found!' });
      return;
    }

    // construct the C array to send back to the client
    var C_inds = req.body.C_inds;
    var C = [];
    for (var i = 0; i < C_inds.length; ++i) {
      C.push(file.C[ C_inds[i] ]);
    }

    // send array C back to the client
    res.send({ success: true, C: C, L_length: file.L.length });
  });
});

router.post('/:filename/query/3', function(req, res, next) {
  var user = req.session.currentUser;
  var filename = req.params.filename;
  File.findOne({ 'username': user.username, 'filename': filename },
               function(err, file) {
    if (err || file == null) {
      res.send({ success: false, message: 'File not found!' });
      return;
    }

    // fill up L with the indices of occurrence of the query string
    var L_inds = req.body.L_inds;
    L = [];
    for (var i = 0; i < L_inds.length; ++i) {
      L.push(file.L[ L_inds[i] ]);
    }

    // send the indices of occurrence to the client
    res.send({ success: true, L: L });
  });
});


module.exports = router;
