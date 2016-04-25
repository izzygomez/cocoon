$(document).ready(function() {
  function read() {
    var file = $('#file-select')[0].files[0];
    if (!file) {
      console.log('no file chosen');
      return;
    }

    var navigator = new FileNavigator(file);
    var indexToStartWith = 0;
    var countLines = 0;
    var allLines = [];
    navigator.readSomeLines(indexToStartWith, function linesReadHandler(err, index, lines, eof, progress) {
      if (err) {
        console.log('Error: ' + err);
        return;
      }
      countLines = countLines + lines.length;
      allLines = allLines.concat(lines);
      console.log(countLines);
      if (eof)  {
        console.log('Finished reading ' + allLines.length + ' lines!');
        allLines.push('#');
        var text = allLines.join([separator = '\n']);
        encrypt(text);
        return;
      }
      navigator.readSomeLines(index + lines.length, linesReadHandler);
    });
  }

  function encrypt(text) {
    console.log(text.length);
    console.log(text.substring(0, 100));

    var startTime = new Date();

    console.log('creating suffix tree...');
    var suffixTree = new SuffixTree();
    console.log('adding string...');
    suffixTree.addString(text);
    console.log('finished!');

    var endTime = new Date();

    var timeDiff = (endTime - startTime) / 1000;
    console.log('Construction time: ' + timeDiff);
    // var seconds = Math.round(timeDiff % 60);
  }

  $('#read').click(read);
});
