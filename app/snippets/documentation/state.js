// Example custom state.
var InitializationState = function() {
  tr.app.State.call(this); // call super constructor.

  // Queue state sub-tasks; in this example these tasks run in parallel.
  this.add(new LoadSessionTask());
  this.add(new LoadContentJSONTask());

  // Once session and content data have been loaded transition to a home-page state.
  this.addToEnd(
    new tr.Closure(
      function() {
        application.enterState(new HomePageState());
      }));
};

InitializationState.prototype = Object.create(tr.app.State.prototype);