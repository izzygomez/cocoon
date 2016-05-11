var sjcl = require('./public/js/sjcl');

sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();

function CBC_MAC(key, iv, text) {
  var keyBits = sjcl.codec.utf8String.toBits(key);
  var ivBits = sjcl.codec.utf8String.toBits(iv);
  var textBits = sjcl.codec.utf8String.toBits(text);

  var adata = [];
  var prp = new sjcl.cipher.aes(keyBits);
  var ciphertext = sjcl.mode.cbc.encrypt(prp, textBits, ivBits, adata);

  var hexCiphertext = sjcl.codec.hex.fromBits(ciphertext);

  // get last 32 bits of hex ciphertext
  var hexLength = hexCiphertext.length
  var hexMAC = hexCiphertext.slice(hexLength - 32, hexLength);

  var MACBits = sjcl.codec.hex.toBits(hexMAC);
  var stringMAC = sjcl.codec.base64.fromBits(MACBits);

  return stringMAC;
}
