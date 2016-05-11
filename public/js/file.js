$(document).ready(function() {

  function round1() {
    // make sure the entered key is the correct length
    var keyString = $('#key').val();
    if (keyString.length != 416) {
      $('#message').html('Error: The key you entered is invalid.');
      return;
    }

    // construct array T from the query string
    var queryString = $('#query').val();
    K_1 = keyString.substring(0, 32);
    K_2 = keyString.substring(32, 64);
    IV_s = 'This is an IV000';
    var T = [ F(K_1, '') ];
    for (var i = 0; i < queryString.length; i++) {
      var key = F(K_2, queryString.substring(0, i + 1)).substring(0, 32);
      var ctxt = F(K_1, queryString.substring(0, i + 1));
      T.push(encrypt(key, IV_s, ctxt));
    }

    // send the server encryptions of all the prefixes of query string
    var filename = $('#filename').html();
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
          var C_length = Number(data.C_length);
          var L_length = Number(data.L_length);
          round2(data.encryptedTuple, C_length, L_length);
        } else {
          $('#message').html(message);
        }
      },
      error: function(xhr, status, error) {
        console.log('oh noo');
      }
    });
  };

  function round2(encryptedTuple, C_length, L_length) {
    var keyString = $('#key').val();
    var K_3 = keyString.substring(64, 96);
    var K_4 = keyString.substring(96, 128);
    var K_D = keyString.substring(128, 160);
    var IV_D = keyString.substring(224, 240);
    var IV_s = 'This is an IV000';

    var filename = $('#filename').html();

    var queryString = $('#query').val();
    var length = queryString.length;

    // authenticate
    var K_MAC_D = keyString.substring(272, 304);
    var IV_MAC_D = keyString.substring(368, 384);
    if (CBC_MAC(K_MAC_D, IV_MAC_D, encryptedTuple[0]) != encryptedTuple[1]) {
      console.log(encryptedTuple[0]);
      console.log(encrypt(K_MAC_D, IV_MAC_D, encryptedTuple[0]));
      console.log(encryptedTuple[1]);
      $('#message').html('CBC-MAC failed! (1)');
      return;
    }

    var decryptedTuple = decrypt(K_D, IV_D, encryptedTuple[0]);
    var values = decryptedTuple.split('---');
    var startIndex = values[0];
    var leafPos = values[1];
    var numLeaves = values[2];

    var C_inds = [];
    for (var i = 0; i < length; ++i) {
      C_inds.push(securePermute(Number(startIndex) + i, C_length, K_3));
    }

    var L_inds = [];
    for (var i = 0; i < numLeaves; ++i) {
      L_inds.push(securePermute(Number(leafPos) + i, L_length, K_4));
    }

    $.ajax({
      url: '/file/' + filename + '/query/2',
      type: 'POST',
      data: {
        length: length,
        leafPos: leafPos,
        numLeaves: numLeaves,
        C_inds: C_inds,
        L_inds: L_inds
      },
      success: function(data) {
        var success = data.success;
        var message = data.message;
        if (success) {
          $('#message').html(message);
          var C = data.C;
          var L = data.L;
          round3(C, L);
        } else {
          $('#message').html(message);
        }
      },
      error: function(xhr, status, error) {
        console.log('oh noo');
      }
    });
  };

  function round3(C, L) {
    var keyString = $('#key').val();
    K_C = keyString.substring(160, 192);
    K_L = keyString.substring(192, 224);
    IV_C = keyString.substring(240, 256);
    IV_L = keyString.substring(256, 272);
    IV_s = 'This is an IV000';

    var queryString = $('#query').val();
    var length = queryString.length;

    // authenticate
    var K_MAC_C = keyString.substring(304, 336);
    var IV_MAC_C = keyString.substring(384, 400);
    for (var i = 0; i < C.length; ++i) {
      if (CBC_MAC(K_MAC_C, IV_MAC_C, C[i][0]) != C[i][1]) {
        $('message').html('CBC-MAC failed! (2)');
        return;
      }
    }
    var K_MAC_L = keyString.substring(336, 368);
    var IV_MAC_L = keyString.substring(400, 416);
    for (var i = 0; i < L.length; ++i) {
      if (CBC_MAC(K_MAC_L, IV_MAC_L, L[i][0]) != L[i][1]) {
        $('message').html('CBC-MAC failed! (3)');
        return;
      }
    }

    var decryptedC = '';
    for (var i = 0; i < C.length; ++i) {
      decryptedC += decrypt(K_C, IV_C, C[i][0]);
    }

    if (queryString == decryptedC) {
      var decryptedIndices = "";
      for (var i = 0; i < L.length; i++) {
        var currentIndex = decrypt(K_L, IV_L, L[i][0]);
        decryptedIndices = decryptedIndices.concat(currentIndex + ", ");
      }
      decryptedIndices = decryptedIndices.slice(0,-2);
      $('#message').html('found at indices: ' + decryptedIndices);
    } else {
      $('#message').html('did not find substring');
    }
  };

  $('#submit').click(round1);
});
