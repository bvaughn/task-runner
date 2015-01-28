goog.provide('taskrunner.ClosureTask');

goog.require('taskrunner.AbstractTask');



/**
 * Task that invokes a specified function upon execution. This type of Task can
 * be synchronous or asynchronous. It autoCompleteUponRun is true, it will
 * complete after the function is run. Otherwise it will not complete until
 * specifically instructed to do so.
 *
 * @param {function()} runImplFn The function to be executed when this Task is
 *     run.
 * @param {boolean=} opt_autoCompleteUponRun Whether this task will
 *     auto-complete when run.
 * @param {string=} opt_taskName Optional semantically meaningful task name.
 * @extends {taskrunner.AbstractTask}
 * @constructor
 * @struct
 */
taskrunner.ClosureTask = function(
    runImplFn, opt_autoCompleteUponRun, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {function()} */
  this.runImplFn_ = runImplFn;

  /** @private {boolean} */
  this.autoCompleteUponRun_ = !!opt_autoCompleteUponRun;
};
goog.inherits(taskrunner.ClosureTask, taskrunner.AbstractTask);


/** @override */
taskrunner.ClosureTask.prototype.runImpl = function() {
  try {
    this.runImplFn_();

    if (this.autoCompleteUponRun_) {
      this.completeInternal();
    }
  } catch (error) {
    this.errorInternal(error, error.message);
  }
};


/**
 * Complete this task.
 *
 * @param {!Object=} data Task data.
 */
taskrunner.ClosureTask.prototype.complete = function(data) {
  this.completeInternal(data);
};


/**
 * Error this task.
 *
 * @param {!Object=} data Task data.
 * @param {string=} errorMessage Error message.
 */
taskrunner.ClosureTask.prototype.error = function(data, errorMessage) {
  this.errorInternal(data, errorMessage);
};
