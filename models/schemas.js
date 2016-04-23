var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  username: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true },
  files: [{ name: { type: String, required: true },
            contents: { type: String, required: true } }]
});

module.exports = {
  User: mongoose.model('User', userSchema)
};
