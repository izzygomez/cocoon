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
    $.ajax({
      url: '/file/' + filename + '/query/2',
      type: 'POST',
      data: {
        startIndex: 42,
        size: 1337
      },
      success: function(data) {
        var success = data.success;
        var message = data.message;
        if (success) {
          console.log('success!');
          console.log(message);
          round3();
        } else {
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
