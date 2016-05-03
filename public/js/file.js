$(document).ready(function() {

  K_D = 'This is a key123';
  K_C = 'This is a key234';
  K_D += K_D;
  K_C += K_C;

  IV_D = 'This is an IV456';
  IV_C = 'This is an IV567';

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
    var key_bit = sjcl.codec.utf8String.toBits(key);
    var iv_bit = sjcl.codec.utf8String.toBits(iv);

    var ctxt_bit = sjcl.codec.base64.toBits(ciphertext);

    var adata = [];
    var prp = new sjcl.cipher.aes(key_bit);
    var plaintext = sjcl.mode.cbc.decrypt(prp, ctxt_bit, iv_bit, adata);

    var actual_plaintext = sjcl.codec.utf8String.fromBits(plaintext);
    return actual_plaintext;
  };

  function round1() {
    var queryString = $('#query').val();
    var filename = $('#filename').html();
    var T = [];
    for (i=0; i<queryString.length; i++) {
      var bitArray = sjcl.hash.sha256.hash(queryString.substring(0,i+1));
      var formattedString = sjcl.codec.hex.fromBits(bitArray);
      T = T.concat(formattedString);
    }

    console.log(T);
    console.log(queryString);
    console.log(filename);
    console.log('hi');
    $.ajax({
      url: '/file/' + filename + '/query/1',
      type: 'POST',
      data: {
        T: T
      },
      success: function(data) {
        var success = data.success;
        var message = data.message;
        if (success) {
          var found = data.found;
          if (found) {
            console.log('success!');
            console.log(message);
            $('#message').html(message);
            round2(data.encryptedIndex);
          } else {
            $('#message').html(message);
          }
        } else {
          $('#message').html(message);
        }
      },
      error: function(xhr, status, error) {
        console.log('oh noo');
      }
    });
  };

  function round2(encryptedIndex) {
    console.log('round 2 of communication protocol');

    console.log(encryptedIndex);

    var filename = $('#filename').html();

    sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();

    var queryString = $('#query').val();
    var length = queryString.length;

    var startIndex = decrypt(K_D, IV_D, encryptedIndex);

    // var adata = [];
    // var key_bit = sjcl.codec.utf8String.toBits(K_C);
    // var iv_bit = sjcl.codec.utf8String.toBits(IV_C);
    // var prp = new sjcl.cipher.aes(key_bit);
    // var ciphertext_bit = sjcl.codec.base64.toBits(encryptedIndex);
    // var decrypted_ciphertext = sjcl.mode.cbc.decrypt(prp, ciphertext_bit, iv_bit, adata);
    // var actual_decrypted_ctxt = sjcl.codec.base64.fromBits(decrypted_ciphertext);

    // var startIndex = actual_decrypted_ctxt;

    $.ajax({
      url: '/file/' + filename + '/query/2',
      type: 'POST',
      data: {
        startIndex: startIndex,
        length: length
      },
      success: function(data) {
        var success = data.success;
        var message = data.message;
        if (success) {
          var C = data.C;
          console.log('success!');
          console.log(message);
          console.log("C: ", C);
          $('#message').html(message);
          round3();
        } else {
          console.log("no success RIP");
          $('#message').html(message);
        }
      },
      error: function(xhr, status, error) {
        console.log('oh noo');
      }
    });
  };

  function round3() {
    console.log('check whether strings match');
  };

  $('#submit').click(round1);
});
