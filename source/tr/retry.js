goog.provide('tr.Retry');

goog.require('tr.Abstract');
goog.require('tr.enums.Event');
goog.require('tr.enums.State');



/**
 * Decorator for tasks that should be retried on error.
 *
 * <p>For example, you may wish to decorator a Task that relies on Internet connectivity in order to complete.
 * The decorated Task is allowed to fail a specified number of times before the error condition is reported externally.
 *
 * <p>This decorator can also be configured to delay for a set amount of time before re-running its internal tasks.
 * This delay may allow certain types of external error conditions (e.g. temporary loss of Internet connectivity)
 * to resolve before the operation is attempted again.
 *
 * @example
 * // Wraps the decorated task and restarts it in the event of an error.
 * // This task allows 1 second to pass in between each retry, and gives up after 3 retries.
 * var task = new tr.opt_taskName(taskThatMayFail, 3, 1000);
 * task.run();
 *
 * @param {!tr.Task} task The task to decorate.
 * @param {number=} maxRetries Number of times to reset and re-run the decorated Task before erroring the retry tr.
 *                             If not specified this defaults to 5.
 * @param {number=} retryDelay The amount of time to delay before resetting and re-running the decorated Task.
 *                             A value < 0 seconds will result in a synchronous retry.
 *                             If not specified this defaults to 1000 ms.
 * @param {string=} opt_taskName Optional defaulttask name.
 * @extends {tr.Abstract}
 * @implements {tr.Decorator}
 * @constructor
 * @struct
 */
tr.Retry = function(task, maxRetries, retryDelay, opt_taskName) {
  goog.base(this, opt_taskName || "Retry");

  /** @private {!tr.Task} */
  this.decoratedTask_ = task;

  /** @private {number} */
  this.maxRetries_ = goog.isDef(maxRetries) ? maxRetries : tr.Retry.MAX_RETRIES_;

  /** @private {number} */
  this.retryDelay_ = goog.isDef(retryDelay) ? retryDelay : tr.Retry.RETRY_DELAY_;

  /** @private {number} */
  this.retries_ = 0;

  /** @private {?number} */
  this.timeoutId_ = null;
};
goog.inherits(tr.Retry, tr.Abstract);


/**
 * The default max number of times to reset and re-run the decorated Task before
 * erroring the retry tr.
 *
 * @private {number}
 * @const
 */
tr.Retry.MAX_RETRIES_ = 5;

/**
 * The default amount of time to delay before resetting and re-running the
 * decorated Task.
 *
 * @private {number}
 * @const
 */
tr.Retry.RETRY_DELAY_ = 5;


/**
 * @override
 * @inheritDoc
 */
tr.Retry.prototype.getDecoratedTask = function() {
  return this.decoratedTask_;
};


/**
 * Returns the number of retries attempted.
 * @return {number}
 */
tr.Retry.prototype.getRetries = function() {
  return this.retries_;
};


/**
 * Removes the decorated task callbacks.
 * @private
 */
tr.Retry.prototype.removeCallbacks_ = function() {
  this.decoratedTask_.off(tr.enums.Event.COMPLETED, this.onDecoratedTaskCompleted_, this);
  this.decoratedTask_.off(tr.enums.Event.ERRORED, this.onDecoratedTaskErrored_, this);
};


/**
 * Stops the running timer.
 * @private
 */
tr.Retry.prototype.stopTimer_ = function() {
  if (this.timeoutId_) {
    goog.global.clearTimeout(this.timeoutId_);
    this.timeoutId_ = null;
  }
};


/**
 * @override
 * @inheritDoc
 */
tr.Retry.prototype.resetImpl = function() {
  this.stopTimer_();
  this.retries_ = 0;

  this.removeCallbacks_();
  this.decoratedTask_.reset();
};


/**
 * @override
 * @inheritDoc
 */
tr.Retry.prototype.interruptImpl = function() {
  this.stopTimer_();
  this.retries_ = 0; // Interruption resets the number of retries.

  this.removeCallbacks_();
  if (this.decoratedTask_.getState() == tr.enums.State.RUNNING) {
    this.decoratedTask_.interrupt();
  }
};


/**
 * @override
 * @inheritDoc
 */
tr.Retry.prototype.runImpl = function() {
  this.decoratedTask_.completed(this.onDecoratedTaskCompleted_, this);
  this.decoratedTask_.errored(this.onDecoratedTaskErrored_, this);

  if (this.decoratedTask_.getState() == tr.enums.State.COMPLETED) {
    this.onDecoratedTaskCompleted_(this.decoratedTask_);
    return;
  }
  if (this.decoratedTask_.getState() == tr.enums.State.ERRORED) {
    this.decoratedTask_.reset();
  }
  this.decoratedTask_.run();
};


/**
 * Event handler for when the deferred task is complete.
 * @param {!tr.Task} task
 * @private
 */
tr.Retry.prototype.onDecoratedTaskCompleted_ = function(task) {
  this.stopTimer_();
  this.removeCallbacks_();

  this.completeInternal(task.getData());
};


/**
 * Event handler for when the deferred task errored.
 * @param {!tr.Task} task
 * @private
 */
tr.Retry.prototype.onDecoratedTaskErrored_ = function(task) {
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
