goog.provide('taskrunner.FailsafeTask');

goog.require('taskrunner.AbstractTask');



/**
 * Decorates a task and re-dispatches errors as successful completions.
 * This can be used to decorate tasks that should be run at a particular time, but are not essential.
 *
 * @example
 * // Runs the decoratedTask and successfully completes as soon as it errors or completes.
 * var task = new taskrunner.FailsafeTask(decoratedTask);
 * task.run();
 *
 * @param {!taskrunner.Task} decoratedTask Decorated task to be run when this task is run.
 * @extends {taskrunner.AbstractTask}
 * @implements {taskrunner.DecoratorTask}
 * @constructor
 * @struct
 */
taskrunner.FailsafeTask = function(decoratedTask, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {!taskrunner.Task} */
  this.decoratedTask_ = decoratedTask;
};
goog.inherits(taskrunner.FailsafeTask, taskrunner.AbstractTask);


/** @inheritDoc */
taskrunner.FailsafeTask.prototype.getDecoratedTask = function() {
  return this.decoratedTask_;
};


/** @override */
taskrunner.FailsafeTask.prototype.interruptImpl = function() {
  this.decoratedTask_.interrupt();
};


/** @override */
taskrunner.FailsafeTask.prototype.resetImpl = function() {
  this.decoratedTask_.reset();
};


/** @override */
taskrunner.FailsafeTask.prototype.runImpl = function() {
  this.decoratedTask_.completed(
    function(task) {
      this.completeInternal();
    }.bind(this));

  this.decoratedTask_.errored(
    function(task) {
      this.completeInternal();
    }.bind(this));

  this.decoratedTask_.run();
};
