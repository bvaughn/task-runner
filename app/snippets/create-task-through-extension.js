var CustomTask = function() {
  tr.Abstract.call(this); // call super constructor.
};

CustomTask.prototype = Object.create(tr.Abstract.prototype);

CustomTask.prototype.runImpl = function() {
  // Start the work.
};

CustomTask.prototype.interruptImpl = function() {
  // Pause anything that was started.
};

CustomTask.prototype.resetImpl = function() {
  // Restore the task to its initial state so that it can be rerun.
};
