// Example implementation of only the 'run' method.
var decorator =
  new tr.Decorator({
    run: function(completeCallback, errorCallback) {
      // Do some stuff (potentially asynchronus) and then..
      completeCallback("I'm done!");
    }
  });
decorator.run();

// Example implementation of all methods (including optional interrup() and reset() methods).
var Decorated = function() {};
Decorated.prototype.run = function(completeCallback, errorCallback) {
  this.completeCallback = completeCallback;
  this.errorCallback = errorCallback;

  // Do some stuff...
};
Decorated.prototype.interrupt = function() {
  // Interrupt any in-flight operations.
};
Decorated.prototype.reset = function() {
  // Cleanup any task state in case the task is run again.
};

var decorator =
  new tr.Decorator(
    new Decorated());
decorator.run();