var express = require('express');
var schemas = require('../models/schemas');
var crypto = require('./crypto');
var sjcl = require('sjcl');
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
    // var encryptedTuple = '';
    var found = false;

    var index = 0;
    var key = file.D[ T[index] ][0];
    var children = file.D[ T[index] ][1];
    console.log(children.length);
    console.log(children);
    while (index < T.length) {
      var brake = false;
      for (var j = index + 1; j < T.length; ++j) {
        for (var i = 0; i < children.length; ++i) {
          var decrypted = decrypt(children[i].substring(0, 32), IV_s, T[j]);
          if (decrypted in file.D) {
            console.log('HOLY COW');
            index = j;
            key = file.D[ decrypted ][0];
            children = file.D[ decrypted ][1];
            brake = true;
          }
          if (brake) break;
        }
        if (brake) break;
      }
      if (!brake) break;
    }

    var encryptedTuple = key;

    res.send({ success: true, found: true,
               message: 'Substring found :D',
               encryptedTuple: encryptedTuple });
  });
});

router.post('/:filename/query/2', function(req, res, next) {
  var user = req.session.currentUser;
  var filename = req.params.filename;
  var startIndex = Number(req.body.startIndex);
  var length = Number(req.body.length);
  console.log('start index: ' + startIndex);
  console.log('length: ' + length);
  File.findOne({ 'username': user.username, 'filename': filename },
               function(err, file) {
    if (err || file == null) {
      console.log('file not found');
      res.send({ success: false, message: 'File not found!' });
      return;
    }
    if (startIndex + length > file.C.length) {
      console.log('too long');
      res.send({ success: false, message: 'Substring does not exist' });
      return;
    }
    var C = [];
    for (var i = 0; i < length; ++i) {
      C.push(file.C[i + startIndex]);
    }
    console.log('success, sending C');

    console.log('constructing sub-array');

    //constructs lead subArray containing the possible ocurrences. Assumes that
    //the leaf array will be named file.L

    var leafPos = Number(req.body.leafPos);
    var numLeaves = Number(req.body.numLeaves);
    var subL = file.L.slice(leafPos, leafPos + numLeaves);

    res.send({ success: true, message: 'Returning C',
               C: C, index: startIndex, subL: subL });
  });
});


module.exports = router;
