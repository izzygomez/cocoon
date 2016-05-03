$(document).ready(function() {

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
    var filename = $('#filename').html();

    K_C = 'This is a key234'
    IV_C = 'This is an IV567'

    var queryString = $('#query').val();
    var length = queryString.length;
    var adata = [];
    var key_bit = sjcl.codec.utf8String.toBits(K_C);
    var iv_bit = sjcl.codec.utf8String.toBits(IV_C);
    var prp = new sjcl.cipher.aes(key_bit);

    var ciphertext_bit = sjcl.codec.base64.toBits(encryptedIndex);
    var decrypted_ciphertext = sjcl.mode.cbc.decrypt(prp, ciphertext_bit, iv_bit, adata);
    var actual_decrypted_ctxt = sjcl.codec.base64.fromBits(decrypted_ciphertext);

    var startIndex = actual_decrypted_ctxt;

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
