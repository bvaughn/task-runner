// Creates a 2-second tween that fades out an element.
var task = new tr.Tween(
  function(value) {
    element.style.opacity = value;
  }, 2000);
task.run();