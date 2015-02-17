// Creates and runs a new Xhr only when the outer deferred task is run.
// In this example, the variable `someUrl` is not yet set when the task is defined.
var task = new tr.Factory(
  function() {
    return new tr.Xhr(someUrl);
  });