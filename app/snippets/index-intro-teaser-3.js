new tr.Xhr('/path/to/load')
  .started(
    function() {
      // Called whenever the task is run.
    })
  .completed(
    function(task) {
      // Called once the XHR completes.
      task.getData(); // Contains response data.
    })
  .errored(
    function(task) {
      // Called in the event of an error!
      task.getError(); // Error context.
      task.getErrorMessage(); // Additional error info.
    });