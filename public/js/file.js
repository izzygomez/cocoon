$(document).ready(function() {

  sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();

  K_1 = 'This is a key789';
  K_D = 'This is a key123';
  K_C = 'This is a key234';
  K_1 += K_1
  K_D += K_D;
  K_C += K_C;

  IV_D = 'This is an IV456';
  IV_C = 'This is an IV567';

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
    for (var i = 0; i < queryString.length; i++) {
      var ctxt = F(K_1, queryString.substring(0, i + 1));
      T.push(ctxt);
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

    var queryString = $('#query').val();
    var length = queryString.length;

    var startIndex = decrypt(K_D, IV_D, encryptedIndex);
    console.log('startIndex: ' + startIndex);

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
          round3(C, data.index);
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

  function round3(C, index) {
    console.log('check whether strings match');
    var queryString = $('#query').val();
    var length = queryString.length;

    var decryptedC = '';
    for (var i = 0; i < length; ++i) {
      decryptedC += decrypt(K_C, IV_C, C[i]);
    }
    console.log('queryString: \'' + queryString + "\'");
    console.log('decryptedC: \'' + decryptedC + "\'");
    if (queryString == decryptedC) {
      console.log('strings match :D');
      $('#message').html('found at index: ' + index);
    } else {
      console.log('strings do not match');
      $('#message').html('did not find substring');
    }
  };

  $('#submit').click(round1);
});
