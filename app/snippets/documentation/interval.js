var paragraph = document.getElementById('paragraph');

// Erases the text within a <p> as though it were being deleted via the backspace key.
// The callback will be executed once every 50ms (approximately),
// And will run until all text has been removed from the paragraph.
new tr.Interval(
  function(task) {
    var text = paragraph.innerText;

    if (text.length > 0) {
      paragraph.innerText = text.substring(0, text.length - 1);
    } else {
      task.complete();
    }
  }, 50);