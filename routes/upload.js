var express = require('express');
var multer = require('multer');
var fs = require('fs');
var readline = require('readline');
var schemas = require('../models/schemas');
var router = express.Router();

var User = schemas.User;
var File = schemas.File;

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
  res.render('upload', { user: true });
});

/* POST upload page. */
router.post('/', function(req, res, next) {
  var user = req.session.currentUser;
  var dir = uploads_dir + '/' + user.username;
  var storage = multer.diskStorage({
    destination: function(req, file, callback) {
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
    if (err) {
      res.render('upload', { user: true, message: 'Error uploading file.' });
    } else if (req.file.mimetype!=="text/plain") {
      var message = 'Only text file uploads are supported.';
      res.render('upload', { user: true, message: message });
    } else {
      User.findOne({ 'username': user.username }, function(err, currentuser) {
        if (err) {
          var message = 'Error uploading file. Username not found.';
          res.render('upload', { user: true, message: message });
        } else {
          if (currentuser.files.indexOf(req.file.originalname) > -1) {
            var message = 'You may not upload files with duplicate names!';
            res.render('upload', { user: true, message: message });
          } else {
            var state = -1; // -1: starting D, 0: D, 1: C
            var totalD = -1;
            var totalC = -1;
            var nD = 0;
            var nC = 0;

            var D = {};
            var C = [];

            var lineReader = readline.createInterface({
              terminal: false,
              input: fs.createReadStream(req.file.path)
            });
            lineReader.on('line', function(line) {
              if (state === -1) {
                totalD = Number(line);
                if (isNaN(line) || totalD == 0){ //First line check
                  var message = 'An error ocurred. ' +
                                'Please only upload files ' +
                                'generated by our python script.';
                  res.render('upload', { user: true, message: message });
                  lineReader.close();
                  return;
                } else{
                  state = 0;
                }
              } else if (state === 0) {
                if (nD < totalD) {
                  if( totalD < 0 || (line.charAt(0) != "{") ){
                    var message = 'An error ocurred. ' +
                                  'Please only upload files ' +
                                  'generated by our python script.';
                    res.render('upload', { user: true, message: message });
                    lineReader.close();
                    process.stdin.destroy();
                    return;
                  }
                  json = JSON.parse(line);
                  for (var key in json) {
                    if (json.hasOwnProperty(key)) {
                      D[key] = json[key];
                    }
                  }
                  ++nD;
                } else {
                  totalC = Number(line);
                  state = 1;
                }
              } else if (state == 1) {
                if (nC < totalC - 1) {
                  C.push(line);
                  ++nC;
                } else {
                  C.push(line);
                  // for (var key in D) {
                  //   if (D.hasOwnProperty(key)) {
                  //     console.log(key + ' -> ' + D[key]);
                  //   }
                  // }
                  // for (var i = 0; i < C.length; ++i) {
                  //   console.log(C[i]);
                  // }
                  // console.log(Object.keys(D).length)
                  // console.log(C.length);
                  User.update({ 'username': user.username },
                              { $push: { 'files': req.file.originalname } },
                              function(err) {
                    if (err) {
                      res.render('upload', { user: true,
                                             message: 'An error occured!' });
                    } else {
                      var new_file = new File({
                        'filename': req.file.originalname,
                        'username': user.username,
                        'D': D,
                        'C': C
                      });
                      new_file.save();
                      res.render('upload', { user: true,
                                             message: 'Upload successful!' });
                    }
                  });
                }
              } else {
                console.log('ERROR');
              }
            }).on('close', function(){
              console.log("Closing off linereads!");
              process.stdin.destroy();
            });
          }
        }
      });
    }
  });
});


module.exports = router;
