$(document).ready(function() {

  function round1() {
    var filename = $('#filename').html();

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
          var encryptedTuple = data.encryptedTuple;

          // begin round 2
          round2(encryptedTuple, C_length);
        } else {
          $('#message').html(message);
        }
      },
      error: function(xhr, status, error) {
        console.log('oh noo');
      }
    });
  };

  function round2(encryptedTuple, C_length) {
    var keyString = $('#key').val();
    var filename = $('#filename').html();

    // authenticate
    var K_MAC_D = keyString.substring(272, 304);
    var IV_MAC_D = keyString.substring(368, 384);
    if (CBC_MAC(K_MAC_D, IV_MAC_D, encryptedTuple[0]) != encryptedTuple[1]) {
      $('#message').html('CBC-MAC failed!');
      return;
    }

    // decrypt the start index, leaf position, and number of subtree leaves
    var K_D = keyString.substring(128, 160);
    var IV_D = keyString.substring(224, 240);
    var decryptedTuple = decrypt(K_D, IV_D, encryptedTuple[0]);
    var values = decryptedTuple.split('---');
    var startIndex = Number(values[0]);
    var leafPos = Number(values[1]);
    var numLeaves = Number(values[2]);

    // compute the indices in C to query for
    var queryString = $('#query').val();
    var K_3 = keyString.substring(64, 96);
    var C_inds = [];
    for (var i = 0; i < queryString.length; ++i) {
      C_inds.push(securePermute(startIndex + i, C_length, K_3));
    }

    $.ajax({
      url: '/file/' + filename + '/query/2',
      type: 'POST',
      data: {
        C_inds: C_inds
      },
      success: function(data) {
        var success = data.success;
        if (success) {
          var C = data.C;
          var L_length = Number(data.L_length);

          // begin round 3
          round3(C, leafPos, numLeaves, L_length);
        } else {
          var message = data.message;
          $('#message').html(message);
        }
      },
      error: function(xhr, status, error) {
        console.log('oh noo');
      }
    });
  };

  function round3(C, leafPos, numLeaves, L_length) {
    var keyString = $('#key').val();
    var filename = $('#filename').html();

    // authenticate
    var K_MAC_C = keyString.substring(304, 336);
    var IV_MAC_C = keyString.substring(384, 400);
    for (var i = 0; i < C.length; ++i) {
      if (CBC_MAC(K_MAC_C, IV_MAC_C, C[i][0]) != C[i][1]) {
        $('message').html('CBC-MAC failed!');
        return;
      }
    }

    // decrypt C
    var K_C = keyString.substring(160, 192);
    var IV_C = keyString.substring(240, 256);
    var decryptedC = '';
    for (var i = 0; i < C.length; ++i) {
      decryptedC += decrypt(K_C, IV_C, C[i][0]);
    }

    // if C decrypted is not equal to the query, then the query is not
    // a subset of the stored string
    var queryString
    if (decryptedC != queryString) {
      $('message').html('String not found!');
    }

    // if C decrypted is equal to the query, then the query is a substring!
    // make another request to the server

    // compute the permuted indices in L to request for
    var K_4 = keyString.substring(96, 128);
    var L_inds = [];
    for (var i = 0; i < numLeaves; ++i) {
      L_inds.push(securePermute(leafPos + i, L_length, K_4));
    }

    // send the indices to the server
    $.ajax({
      url: '/file/' + filename + '/query/3',
      type: 'POST',
      data: {
        L_inds: L_inds
      },
      success: function(data) {
        var success = data.success;
        if (success) {
          var L = data.L;

          // begin the last round of computation
          round4(L);
        } else {
          var message = data.message;
          $('#message').html(message);
        }
      },
      error: function(xhr, status, error) {
        console.log('oh noo');
      }
    });
  };

  function round4(L) {
    var keyString = $('#key').val();

    // authenticate
    var K_MAC_L = keyString.substring(336, 368);
    var IV_MAC_L = keyString.substring(400, 416);
    for (var i = 0; i < L.length; ++i) {
      if (CBC_MAC(K_MAC_L, IV_MAC_L, L[i][0]) != L[i][1]) {
        $('message').html('CBC-MAC failed!');
        return;
      }
    }

    // decrypt the indices
    K_L = keyString.substring(192, 224);
    IV_L = keyString.substring(256, 272);
    var message = 'Found at indices: ';
    for (var i = 0; i < L.length; ++i) {
      var index = decrypt(K_L, IV_L, L[i][0]);
      message += (index + ', ');
    }
    $('#message').html(message.slice(0, -2));
  };

  $('#submit').click(round1);
});
