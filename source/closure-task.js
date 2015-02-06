goog.provide('taskrunner.ClosureTask');

goog.require('taskrunner.AbstractTask');



/**
 * Invokes a callback function when run.
 * 
 * <p>This type of Task can be asynchronous or asynchronous.
 * <ul>
 * <li>Set <code>opt_synchronous</code> to TRUE for synchronous tasks.
 * This type of task will automatically complete itself after the callback function is called.
 * If an error occurs in the callback function, this type of task will error.
 * <li>Set <code>opt_synchronous</code> to FALSE for asynchronous tasks.
 * In this case the task not complete until specifically instructed to do so.
 * To complete the task, your callback should call either complete() or error().
 * </ul>
 *
 * @example
 * // Executes the supplied closure and auto-completes after running it.
 * var task = new taskrunner.ClosureTask(
 *   function() {
 *     // Do stuff
 *   }, true);
 * task.run();
 *
 * @example
 * // Executes the supplied closure and waits to be completed.
 * // You should probably use taskrunner.XHRTask instead of $.ajax ;)
 * var task = new taskrunner.ClosureTask(
 *   function() {
*      $.ajax("demo/url", {
*        success: function(data) {
*          task.complete(data);
*        },
*        error: function() {
*          task.error('An error occurred');
*        }
*      });
 *   }, false);
 * task.run();
 *
 * @param {function()} runImplFn The function to be executed when this Task is run.
 * @param {boolean=} opt_synchronous This task should auto-complete when run.
 * @param {string=} opt_taskName Optional task name.
 * @extends {taskrunner.AbstractTask}
 * @constructor
 * @struct
 */
taskrunner.ClosureTask = function(runImplFn, opt_synchronous, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {function()} */
  this.runImplFn_ = runImplFn;

  /** @private {boolean} */
  this.autoCompleteUponRun_ = !!opt_synchronous;
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
