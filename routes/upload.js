var express = require('express');
var multer = require('multer');
var fs = require('fs');
var router = express.Router();

var uploads_dir = './uploads';

var authenticate = function(req, res, next) {
  if (req.session.currentUser) {
    next();
  } else {
    res.render('index', { message: 'Please log in!' });
  }
};

router.all('*', authenticate);

/* GET upload page. */
router.get('/', function(req, res, next) {
  var user = req.session.currentUser;
  var message = 'Logged in as: ' + user.username;
  res.render('upload', { user: user, message: message });
});

/* POST upload page. */
router.post('/', function(req, res, next) {
  var user = req.session.currentUser;
  var storage = multer.diskStorage({
    destination: function(req, file, callback) {
      var dir = uploads_dir + '/' + user.username;
      if (!fs.existsSync(uploads_dir)) {
        fs.mkdirSync(uploads_dir);
      }
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      callback(null, dir);
    },
    filename: function (req, file, callback) {
      callback(null, file.originalname);
    }
  });

  var upload = multer({ storage: storage }).single('ciphertextFile');
  upload(req, res, function(err) {
    console.log(req.file)
    if (err) {
      res.render('upload', { user: user, message: 'Error uploading file.' });
    } else {
      res.render('upload', { user: user, message: 'Upload successful!' });
    }
  });
});


module.exports = router;
