var sjcl = require('../public/js/sjcl');

sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]()

function F(key, plaintext) {
  var key_hash_bit = sjcl.hash.sha256.hash(key);
  var key_hash = sjcl.codec.hex.fromBits(key_hash_bit);

  var ctxt_bit = sjcl.hash.sha256.hash(plaintext);
  var ctxt = sjcl.codec.hex.fromBits(ctxt_bit);

  var final_ctxt_bit = sjcl.hash.sha256.hash(ctxt + key_hash);
  var final_ctxt = sjcl.codec.hex.fromBits(final_ctxt_bit);
  return final_ctxt;
};

function encrypt(key, iv, plaintext) {
  var key_bit = sjcl.codec.utf8String.toBits(key);
  var iv_bit = sjcl.codec.utf8String.toBits(iv);
  var ptxt_bit = sjcl.codec.utf8String.toBits(plaintext);

  var adata = [];
  var prp = new sjcl.cipher.aes(key_bit);
  var ciphertext = sjcl.mode.cbc.encrypt(prp, ptxt_bit, iv_bit, adata);

  var actual_ctxt = sjcl.codec.base64.fromBits(ciphertext);
  console.log(actual_ctxt);

  return actual_ctxt;
};

function decrypt(key, iv, ciphertext) {
  try {
    var key_bit = sjcl.codec.utf8String.toBits(key);
    var iv_bit = sjcl.codec.utf8String.toBits(iv);

    var ctxt_bit = sjcl.codec.base64.toBits(ciphertext);

    var adata = [];
    var prp = new sjcl.cipher.aes(key_bit);
    var plaintext = sjcl.mode.cbc.decrypt(prp, ctxt_bit, iv_bit, adata);

    var actual_plaintext = sjcl.codec.utf8String.fromBits(plaintext);
    return actual_plaintext;
  } catch (e) {
    return '';
  }
};


module.exports = {
  F: F,
  encrypt: encrypt,
  decrypt: decrypt
};
