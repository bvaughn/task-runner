goog.provide('taskrunner.DeferredFactoryTask');

goog.require('taskrunner.AbstractTask');
goog.require('taskrunner.TaskEvent');
goog.require('taskrunner.TaskState');



/**
 * Decorates a Task returned by the specified factory method.
 *
 * <p>Use this type of task when an important decision needs to be deferred.
 * For example if you need a task to load some data, but the specifics aren't known when your application is initialized.
 * This type of task allows for just-in-time evaluation of data resolved by previous Tasks.
 *
 * @example
 * // Creates and runs a new XHRTask only when the outer deferred task is run.
 * // In this example, the variable `someUrl` is not yet set when the task is defined.
 * var task = new taskrunner.DeferredFactoryTask(
 *   function() {
 *     return new taskrunner.XHRTask(someUrl);
 *   });
 *
 * @param {function(*):taskrunner.Task} taskFactoryFn The function to create an Task object.
 * @param {Object=} opt_thisArg Optional 'this' argument to invoke taskFactoryFn with.
 * @param {!Array=} opt_argsArray Optional arguments array to invoke taskFactoryFn with.
 * @param {string=} opt_taskName Optional defaulttask name.
 * @extends {taskrunner.AbstractTask}
 * @implements {taskrunner.DecoratorTask}
 * @constructor
 * @struct
 */
taskrunner.DeferredFactoryTask = function(taskFactoryFn, opt_thisArg, opt_argsArray, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {function(*):taskrunner.Task} */
  this.taskFactoryFn_ = taskFactoryFn;

  /** @private {?} */
  this.thisArg_ = opt_thisArg;

  /** @private {!Array|undefined} */
  this.argsArray_ = opt_argsArray;

  /** @private {taskrunner.Task} */
  this.deferredTask_ = null;

  /**
   * Whether to recreate the deferred task after an error occured.
   * @private {boolean}
   */
  this.recreateDeferredTaskAfterError_ = false;

  /**
   * Whether the deferred task has errored.
   * @private {boolean}
   */
  this.deferredTaskErrored_ = false;
};
goog.inherits(taskrunner.DeferredFactoryTask, taskrunner.AbstractTask);


/**
 * @override
 * @inheritDoc
 */
taskrunner.DeferredFactoryTask.prototype.getDecoratedTask = function() {
  return this.deferredTask_;
};


/**
 * Set whether to recreate the deferred task after an error occured.
 * This property is sticky for all consecutive reruns until set again.
 * @param {boolean} recreateDeferredTaskAfterError
 */
taskrunner.DeferredFactoryTask.prototype.recreateDeferredTaskAfterError =
    function(recreateDeferredTaskAfterError) {
  this.recreateDeferredTaskAfterError_ = recreateDeferredTaskAfterError;
};


/**
 * Removes the deferred task callbacks.
 * @private
 */
taskrunner.DeferredFactoryTask.prototype.removeCallbacks_ = function() {
  if (!this.deferredTask_) {
    return;
  }
  this.deferredTask_.off(
      taskrunner.TaskEvent.COMPLETED, this.onDeferredTaskCompleted_, this);
  this.deferredTask_.off(
      taskrunner.TaskEvent.ERRORED, this.onDeferredTaskErrored_, this);
  this.deferredTask_.off(
      taskrunner.TaskEvent.INTERRUPTED, this.onDeferredTaskInterrupted_, this);
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.DeferredFactoryTask.prototype.resetImpl = function() {
  this.removeCallbacks_();

  if (this.deferredTask_) {
    this.deferredTask_ = null;
  }
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.DeferredFactoryTask.prototype.interruptImpl = function() {
  if (!this.deferredTask_) {
    return;
  }
  this.removeCallbacks_();
  this.deferredTask_.interrupt();
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.DeferredFactoryTask.prototype.runImpl = function() {
  if (!this.deferredTask_ ||
      this.recreateDeferredTaskAfterError_ && this.deferredTaskErrored_) {
    if (goog.isDef(this.thisArg_)) {
      this.deferredTask_ = this.taskFactoryFn_.apply(
          this.thisArg_, this.argsArray_ || []);
    } else {
      this.deferredTask_ = this.taskFactoryFn_.apply();
    }
  }

  if (this.deferredTask_.getState() == taskrunner.TaskState.COMPLETED) {
    this.onDeferredTaskCompleted_(this.deferredTask_);
  } else if (this.deferredTask_.getState() == taskrunner.TaskState.ERRORED) {
    this.onDeferredTaskErrored_(this.deferredTask_);
  } else {
    this.deferredTask_.completed(this.onDeferredTaskCompleted_, this);
    this.deferredTask_.errored(this.onDeferredTaskErrored_, this);
    this.deferredTask_.interrupted(this.onDeferredTaskInterrupted_, this);
    this.deferredTask_.run();
  }
};


/**
 * Event handler for when the deferred task is complete.
 * @param {!taskrunner.Task} task
 * @private
 */
taskrunner.DeferredFactoryTask.prototype.onDeferredTaskCompleted_ =
    function(task) {
  this.removeCallbacks_();
  this.completeInternal(task.getData());
};


/**
 * Event handler for when the deferred task errored.
 * @param {!taskrunner.Task} task
 * @private
 */
taskrunner.DeferredFactoryTask.prototype.onDeferredTaskErrored_ =
    function(task) {
  this.removeCallbacks_();
  this.deferredTaskErrored_ = true;
  this.errorInternal(task.getData(), task.getErrorMessage());
};


/**
 * Event handler for when the deferred task is interrupted.
 * @param {!taskrunner.Task} task
 * @private
 */
taskrunner.DeferredFactoryTask.prototype.onDeferredTaskInterrupted_ =
    function(task) {
  this.interrupt();
};
