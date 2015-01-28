goog.provide('taskrunner.RetryOnErrorTask');

goog.require('goog.asserts');
goog.require('taskrunner.AbstractTask');
goog.require('taskrunner.TaskEvent');
goog.require('taskrunner.TaskState');



/**
 * Decorator for Tasks that should be retried on error.
 *
 * For example, you may wish to decorator a Task that relies on Internet
 * connectivity in order to complete. The decorated Task is allowed to fail a
 * specified number of times before the error condition is reported externally.
 *
 * This decorator can also be configured to delay for a set amount of time
 * before re-running its internal tasks. This delay may allow certain types of
 * external error conditions (e.g. temporary loss of Internet connectivity) to
 * resolve before the operation is attempted again.
 *
 * @param {!taskrunner.Task} task The task to decorate.
 * @param {number=} maxRetries Number of times to reset and re-run the decorated
 *     Task before erroring the retry task. If not specified this defaults to 5.
 * @param {number=} retryDelay The amount of time to delay before resetting and
 *     re-running the decorated Task. A value < 0 seconds will result in a
 *     synchronous retry. If not specified this defaults to 1000 ms.
 * @param {string=} opt_taskName Optional semantically meaningful task name.
 * @extends {taskrunner.AbstractTask}
 * @implements {taskrunner.DecoratorTask}
 * @constructor
 * @struct
 */
taskrunner.RetryOnErrorTask = function(
    task, maxRetries, retryDelay, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {!taskrunner.Task} */
  this.decoratedTask_ = task;

  /** @private {number} */
  this.maxRetries_ = goog.isDef(maxRetries) ?
      maxRetries : taskrunner.RetryOnErrorTask.MAX_RETRIES_;

  /** @private {number} */
  this.retryDelay_ = goog.isDef(retryDelay) ?
      retryDelay : taskrunner.RetryOnErrorTask.RETRY_DELAY_;

  /** @private {number} */
  this.retries_ = 0;

  /** @private {?number} */
  this.timeoutId_ = null;
};
goog.inherits(taskrunner.RetryOnErrorTask, taskrunner.AbstractTask);


/**
 * The default max number of times to reset and re-run the decorated Task before
 * erroring the retry task.
 *
 * @private {number}
 * @const
 */
taskrunner.RetryOnErrorTask.MAX_RETRIES_ = 5;

/**
 * The default amount of time to delay before resetting and re-running the
 * decorated Task.
 *
 * @private {number}
 * @const
 */
taskrunner.RetryOnErrorTask.RETRY_DELAY_ = 5;


/** @override */
taskrunner.RetryOnErrorTask.prototype.getDecoratedTask = function() {
  return this.decoratedTask_;
};


/**
 * Returns the number of retries attempted.
 * @return {number}
 */
taskrunner.RetryOnErrorTask.prototype.getRetries = function() {
  return this.retries_;
};


/**
 * Removes the decorated task callbacks.
 * @private
 */
taskrunner.RetryOnErrorTask.prototype.removeCallbacks_ = function() {
  this.decoratedTask_.off(
      taskrunner.TaskEvent.COMPLETED, this.onDecoratedTaskCompleted_, this);
  this.decoratedTask_.off(
      taskrunner.TaskEvent.ERRORED, this.onDecoratedTaskErrored_, this);
};


/**
 * Stops the running timer.
 * @private
 */
taskrunner.RetryOnErrorTask.prototype.stopTimer_ = function() {
  if (this.timeoutId_) {
    goog.global.clearTimeout(this.timeoutId_);
    this.timeoutId_ = null;
  }
};


/** @override */
taskrunner.RetryOnErrorTask.prototype.resetImpl = function() {
  this.stopTimer_();
  this.retries_ = 0;

  this.removeCallbacks_();
  this.decoratedTask_.reset();
};


/** @override */
taskrunner.RetryOnErrorTask.prototype.interruptImpl = function() {
  this.stopTimer_();
  this.retries_ = 0; // Interruption resets the number of retries.

  this.removeCallbacks_();
  if (this.decoratedTask_.getState() == taskrunner.TaskState.RUNNING) {
    this.decoratedTask_.interrupt();
  }
};


/** @override */
taskrunner.RetryOnErrorTask.prototype.runImpl = function() {
  this.decoratedTask_.completed(this.onDecoratedTaskCompleted_, this);
  this.decoratedTask_.errored(this.onDecoratedTaskErrored_, this);

  if (this.decoratedTask_.getState() == taskrunner.TaskState.COMPLETED) {
    this.onDecoratedTaskCompleted_(this.decoratedTask_);
    return;
  }
  if (this.decoratedTask_.getState() == taskrunner.TaskState.ERRORED) {
    this.decoratedTask_.reset();
  }
  this.decoratedTask_.run();
};


/**
 * Event handler for when the deferred task is complete.
 * @param {!taskrunner.Task} task
 * @private
 */
taskrunner.RetryOnErrorTask.prototype.onDecoratedTaskCompleted_ =
    function(task) {
  this.stopTimer_();
  this.removeCallbacks_();

  this.completeInternal(task.getData());
};


/**
 * Event handler for when the deferred task errored.
 * @param {!taskrunner.Task} task
 * @private
 */
taskrunner.RetryOnErrorTask.prototype.onDecoratedTaskErrored_ =
    function(task) {
  if (this.retries_ >= this.maxRetries_) {
    this.stopTimer_();
    this.removeCallbacks_();

    this.errorInternal(task.getData(), task.getErrorMessage());

    return;
  }

  this.retries_++;

  if (this.retryDelay_ >= 0) {
    this.timeoutId_ = goog.global.setTimeout(
      goog.bind(this.runImpl, this), this.retryDelay_);
  } else {
    this.runImpl();
  }
};
