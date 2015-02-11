goog.provide('tr.Closure');

goog.require('tr.Abstract');

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
 * var task = new tr.Closure(
 *   function() {
 *     // Do stuff
 *   }, true);
 * task.run();
 *
 * @example
 * // Executes the supplied closure and waits to be completed.
 * // You should probably use tr.Xhr instead of $.ajax ;)
 * new tr.Closure(
 *   function(task) {
*      $.ajax("demo/url", {
*        success: function(data) {
*          task.complete(data);
*        },
*        error: function() {
*          task.error('An error occurred');
*        }
*      });
 *   }, false).run();
 *
 * @param {function(!tr.Closure)} runImplFn The function to be executed when this Task is run.
 *                                          ClosureTask will pass a reference to itself to the function.
 * @param {boolean=} opt_synchronous This task should auto-complete when run.
 * @param {string=} opt_taskName Optional task name.
 * @extends {tr.Abstract}
 * @constructor
 * @struct
 */
tr.Closure = function(runImplFn, opt_synchronous, opt_taskName) {
  goog.base(this, opt_taskName || "Closure");

  /** @private {function()} */
  this.runImplFn_ = runImplFn;

  /** @private {boolean} */
  this.autoCompleteUponRun_ = !!opt_synchronous;
};
goog.inherits(tr.Closure, tr.Abstract);

/** @override */
tr.Closure.prototype.runImpl = function() {
  try {
    this.runImplFn_(this);

    // Don't auto-complete if the callback has already interrupted or completed this task.
    if (this.autoCompleteUponRun_ && this.getState() === tr.enums.State.RUNNING) {
      this.completeInternal();
    }
  } catch (error) {

    // Edge case that could be triggered if a Closure task invokes another synchronous task that errors.
    if (this.getState() === tr.enums.State.RUNNING) {
      this.errorInternal(error, error.message);
    }
  }
};

/**
 * Complete this task.
 *
 * @param {!Object=} data Task data.
 */
tr.Closure.prototype.complete = function(data) {
  this.completeInternal(data);
};

/**
 * Error this task.
 *
 * @param {!Object=} data Task data.
 * @param {string=} errorMessage Error message.
 */
tr.Closure.prototype.error = function(data, errorMessage) {
  this.errorInternal(data, errorMessage);
};
