new tr.Xhr('/path/to/load')
  .started(
    function(task) {}
  ).completed(
    function(task) {
      task.getData(); // Contains response data.
    }
  ).errored(
    function(task) {
      task.getError(); // Error context.
      task.getErrorMessage(); // Additional error info.
    });