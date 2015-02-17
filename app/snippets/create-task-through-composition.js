// Create a synchronous task that auto-completes after executing the callback.
var task = new tr.Closure(
  function() {
    // Do stuff here...
  }, true);
task.run();

// Create an asynchronous task that your callback is responsible for completing.
// Note that this example is silly; you should probably use tr.Xhr instead of $.ajax.
var task = new tr.Closure(
  function(thisTask) {
      $.ajax("demo/url", {
        success: function(data) {
          thisTask.complete(data);
        },
        error: function() {
          thisTask.error('An error occurred');
        }
      });
  }, false);
task.run();