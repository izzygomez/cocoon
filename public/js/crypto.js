// Helper functions

/**
* arg number  : (bit) string
* arg size    : number
* return s    : zero-padded string
**/
function zero_pad (number, size) {
  var s = String(number);
  while (s.length < size) s = "0" + s;
  return s;
}

/**
* arg string  : string to hash
* arg key     : key to use for hash
* return s    : SHA256 hash in binary form
**/
function SHA256(string, key) {
  var stringBitArray = sjcl.hash.sha256.hash(string);
  var stringDigest = sjcl.codec.hex.fromBits(stringBitArray);
  var keyBitArray = sjcl.hash.sha256.hash(key);
  var keyDigest = sjcl.codec.hex.fromBits(keyBitArray);
  var finalHashBitArray = sjcl.hash.sha256.hash(stringDigest + keyDigest);
  var finalHashDigest = sjcl.codec.hex.fromBits(finalHashBitArray);
  var s = hex2bin(finalHashDigest);
  return s;
}

/**
* arg hexString : string of a hex number
* return out    : string of binary form of input (w/ truncated leading zeros)
**/
function hex2bin(hexString) {
  var out = '';

  // For each hexadecimal character
  for (var i=0; i < hexString.length; i++) {
      // Convert to decimal
      var decimal = parseInt(hexString.charAt(i), 16);

      // Convert to binary and add 0s onto the left as necessary to make up to 4 bits
      var binary = zero_pad(decimal.toString(2), 4);

      // Append to string
      out += binary;
  }
  // truncate leading zeros (goddammit Brian...)
  out = out.slice(out.indexOf("1"));

  return out;
}

// end Helper functions

/**
* arg index         : index that you want to permute
* arg totalIndices  : amount of total indices
* arg key           : key to use for permutation function
* return            : new index value, after permutation
**/
function permute (index, totalIndices, key) {
  var nIndex = Number(index);
  var indexBitLength = Math.ceil( Math.log(totalIndices) / Math.log(2) );
  var paddedIndex = zero_pad(nIndex.toString(2), indexBitLength);

  // yo, this shouldn't happen, but a sanity check is a good thing
  if (paddedIndex.length !== indexBitLength) {
    console.log("ERROR PERMUTING");
  }

  // set the midpoint for both parity cases
  var midpoint = Math.floor(indexBitLength/2);

  var L = paddedIndex.slice(0, midpoint);
  var R = paddedIndex.slice(midpoint);
  var R_hashed = SHA256(R, key);
  var R_hashed_cut = R_hashed.slice(0, midpoint);
  var xor = zero_pad((parseInt(L,2)^parseInt(R_hashed_cut, 2)).toString(2), midpoint);
  var final = R + xor;
  return parseInt(final, 2);
}

/**
* arg index         : index that you want to unpermute
* arg totalIndices  : amount of total indices
* arg key           : key to use for permutation function
* return            : original index value, after unpermuting
**/
function unpermute (index, totalIndices, key) {
  var nIndex = Number(index);
  var indexBitLength = Math.ceil( Math.log(totalIndices) / Math.log(2) );
  var paddedIndex = zero_pad(nIndex.toString(2), indexBitLength);

  // yo, this shouldn't happen, but a sanity check is a good thing
  if (paddedIndex.length !== indexBitLength) {
    console.log("ERROR PERMUTING");
  }

  // set the midpoint for both parity cases
  var midpoint = Math.ceil(indexBitLength/2);
  var n = Math.floor(indexBitLength/2);

  var alpha = paddedIndex.slice(0, midpoint);
  var beta = paddedIndex.slice(midpoint);
  var alpha_hashed = SHA256(alpha, key);
  var alpha_hashed_cut = alpha_hashed.slice(0, n);
  var xor = zero_pad((parseInt(beta, 2)^parseInt(alpha_hashed_cut, 2)).toString(2), n);
  var final = xor + alpha;
  return parseInt(final, 2);
}

/**
* same interface as permute, but permutes for three rounds for security
**/
function securePermute (index, totalIndices, key) {
  var roundOne = permute(index, totalIndices, key);
  var roundTwo = permute(roundOne, totalIndices, key);
  var roundThree = permute(roundTwo, totalIndices, key);
  return roundThree;
}

/**
* same interface as permute, but permutes for three rounds for security
**/
function secureUnpermute (index, totalIndices, key) {
  var roundOne = unpermute(index, totalIndices, key);
  var roundTwo = unpermute(roundOne, totalIndices, key);
  var roundThree = unpermute(roundTwo, totalIndices, key);
  return roundThree;
}

sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();

// CBC-MAC for authentication
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

// pseudo-random function
function F(key, plaintext) {
  var key_hash_bit = sjcl.hash.sha256.hash(key);
  var key_hash = sjcl.codec.hex.fromBits(key_hash_bit);

  var ctxt_bit = sjcl.hash.sha256.hash(plaintext);
  var ctxt = sjcl.codec.hex.fromBits(ctxt_bit);

  var final_ctxt_bit = sjcl.hash.sha256.hash(ctxt + key_hash);
  var final_ctxt = sjcl.codec.hex.fromBits(final_ctxt_bit);
  return final_ctxt;
};

// AES encryption in CBC mode
function encrypt(key, iv, plaintext) {
  var key_bit = sjcl.codec.utf8String.toBits(key);
  var iv_bit = sjcl.codec.utf8String.toBits(iv);
  var ptxt_bit = sjcl.codec.utf8String.toBits(plaintext);

  var adata = [];
  var prp = new sjcl.cipher.aes(key_bit);
  var ciphertext = sjcl.mode.cbc.encrypt(prp, ptxt_bit, iv_bit, adata);

  var actual_ctxt = sjcl.codec.base64.fromBits(ciphertext);

  return actual_ctxt;
};

// AES decryption in CBC mode
function decrypt(key, iv, ciphertext) {
  var key_bit = sjcl.codec.utf8String.toBits(key);
  var iv_bit = sjcl.codec.utf8String.toBits(iv);

  var ctxt_bit = sjcl.codec.base64.toBits(ciphertext);

  var adata = [];
  var prp = new sjcl.cipher.aes(key_bit);
  var plaintext = sjcl.mode.cbc.decrypt(prp, ctxt_bit, iv_bit, adata);

  var actual_plaintext = sjcl.codec.utf8String.fromBits(plaintext);
  return actual_plaintext;
};

