$(document).ready(function() {
  $('#read').click(function () {
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
        console.log('Finished readig ' + allLines.length + 'lines!');
        return;
      }
      navigator.readSomeLines(index + lines.length, linesReadHandler);
    });
  });
});
