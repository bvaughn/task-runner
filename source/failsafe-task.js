goog.provide('taskrunner.FailsafeTask');

goog.require('taskrunner.AbstractTask');



/**
 * Decorates a task and re-dispatches errors as successful completions.
 *
 * <p>This can be used to decorate tasks that are not essential.
 *
 * @example
 * // Sends a fire-and-forget style XHR to log data (and ignores failures)
 * var task = new taskrunner.FailsafeTask(
 *   return new taskrunner.XHRTask('some-logging-url', someLoggingData));
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


/**
 * @override
 * @inheritDoc
 */
taskrunner.FailsafeTask.prototype.getDecoratedTask = function() {
  return this.decoratedTask_;
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.FailsafeTask.prototype.interruptImpl = function() {
  this.decoratedTask_.interrupt();
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.FailsafeTask.prototype.resetImpl = function() {
  this.decoratedTask_.reset();
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.FailsafeTask.prototype.runImpl = function() {
  this.decoratedTask_.completed(
    goog.bind(
      function(task) {
        this.completeInternal();
      }, this));

  this.decoratedTask_.errored(
    goog.bind(
      function(task) {
        this.completeInternal();
      }, this));

  this.decoratedTask_.run();
};
