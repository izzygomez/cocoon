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
    } else if (!req.file || !req.file.mimetype) {
      var message = 'Please upload a file.';
      res.render('upload', { user: true, message: message });
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
            var state = -1; // -1: starting D
                            //  0: D
                            //  1: C
                            //  2: L
            var totalD = -1;
            var totalC = -1;
            var totalL = -1;
            var nD = 0;
            var nC = 0;
            var nL = 0;
            var D = {};
            var C = [];
            var L = [];

            var readyToSave = false;
            var lineReader = readline.createInterface({
              terminal: false,
              input: fs.createReadStream(req.file.path)
            });
            lineReader.on('line', function(line) {
              try {
                if (state === -1) {
                  totalD = Number(line);
                  if (!line || totalD < 1) throw "Error";
                  else {
                    state = 0;
                  }
                } else if (state === 0) {
                  if (nD < totalD) {
                    json = JSON.parse(line);
                    for (var key in json) {
                      if (json.hasOwnProperty(key)) {
                        D[key] = json[key];
                        if (!D[key] ||
                            D[key].length != 2 ||
                            D[key][0].length != 2 ||
                            D[key][1].length < 0) {
                          throw "Error";
                        }
                      }
                    }
                    ++nD;
                  } else {
                    totalC = Number(line);
                    state = 1;
                  }
                } else if (state == 1) {
                  if (nC < totalC) {
                    json = JSON.parse(line);
                    if (json.length != 2) throw "Error";
                    C.push(json);
                    ++nC;
                  } else {
                    totalL = Number(line);
                    state = 2;
                  }
                } else if (state == 2) {
                  if (nL < totalL - 1) {
                    json = JSON.parse(line);
                    if (json.length != 2) throw "Error";
                    L.push(json);
                    ++nL;
                  } else {
                    state = 3;
                    ++nL;
                    json = JSON.parse(line);
                    if (json.length != 2) throw "Error";
                    L.push(json);

                    if (nD != totalD || nC != totalC  || nL != totalL ||
                        !totalD || !totalC || !totalL ||
                        nD < 1 || nC < 1 || nL < 1 ||
                        totalD < 1 || totalC < 1 || totalL < 1) {
                      throw "Error";
                    }

                    readyToSave = true;
                  }
                } else {
                  throw "Error";
                }
              } catch (e) {
                readyToSave = false;
                var message = 'An error ocurred. ' +
                              'Please only upload files ' +
                              'generated by our python script.';
                res.render('upload', { user: true, message: message });
                lineReader.close();
                process.stdin.destroy();
                return;
              }
            }).on('close', function() {
              if (state == 3 && readyToSave) {
                User.update({ 'username': user.username },
                            { $push: { 'files': req.file.originalname } },
                            function(err) {
                  if (err) {
                    res.render('upload', { user: true,
                                           message: 'An error occured!' });
                    return;
                  }
                  var new_file = new File({
                    'filename': req.file.originalname,
                    'username': user.username,
                    'D': D,
                    'C': C,
                    'L': L
                  });
                  new_file.save();
                  res.render('upload', { user: true,
                                         message: 'Upload successful!' });
                });
                process.stdin.destroy();
              } else {
                var message = 'An error ocurred. ' +
                              'Please only upload files ' +
                              'generated by our python script.';
                process.stdin.destroy();
                res.render('upload', { user: true, message: message });
              }
            });
          }
        }
      });
    }
  });
});


module.exports = router;
