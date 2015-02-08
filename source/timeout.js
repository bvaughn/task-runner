goog.provide('tr.Timeout');

goog.require('tr.Abstract');
goog.require('tr.enums.Event');
goog.require('tr.enums.State');



/**
 * Decorates a Task and enforces a max-execution time limit.
 * 
 * <p>If specified time interval elapses before the decorated Task has complete it is considered to be an error.
 * The decorated Task will be interrupted in that event.
 *
 * @example
 * // Wraps the decorated task and enforces a 5-second maximum timeout.
 * var task = new tr.Timeout(decoratedTask, 5000);
 * task.run();
 *
 * @param {!tr.Task} task The task to decorate.
 * @param {number} timeout Time in milliseconds to wait before timing out the decorated tr.
 * @param {string=} opt_taskName Optional defaulttask name.
 * @extends {tr.Abstract}
 * @implements {tr.Decorator}
 * @constructor
 * @struct
 */
tr.Timeout = function(task, timeout, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {!tr.Task} */
  this.decoratedTask_ = task;

  /** @private {number} */
  this.timeout_ = timeout;

  /** @private {number} */
  this.timeoutStart_ = -1;

  /** @private {number} */
  this.timeoutPause_ = -1;

  /** @private {?number} */
  this.timeoutId_ = null;
};
goog.inherits(tr.Timeout, tr.Abstract);


/**
 * @override
 * @inheritDoc
 */
tr.Timeout.prototype.getDecoratedTask = function() {
  return this.decoratedTask_;
};


/**
 * Removes the decorated task callbacks.
 * @private
 */
tr.Timeout.prototype.removeCallbacks_ = function() {
  this.decoratedTask_.off(tr.enums.Event.COMPLETED, this.onDecoratedTaskCompleted_, this);
  this.decoratedTask_.off(tr.enums.Event.ERRORED, this.onDecoratedTaskErrored_, this);
};


/**
 * Stops the running timer.
 * @private
 */
tr.Timeout.prototype.stopTimer_ = function() {
  if (this.timeoutId_) {
    goog.global.clearTimeout(this.timeoutId_);
    this.timeoutId_ = null;
  }
};


/**
 * @override
 * @inheritDoc
 */
tr.Timeout.prototype.resetImpl = function() {
  this.stopTimer_();
  this.removeCallbacks_();

  this.decoratedTask_.reset();
  this.timeoutStart_ = -1;
  this.timeoutPause_ = -1;
};


/**
 * @override
 * @inheritDoc
 */
tr.Timeout.prototype.interruptImpl = function() {
  this.stopTimer_();
  this.removeCallbacks_();

  this.decoratedTask_.interrupt();
  this.timeoutPause_ = goog.now();
};


/**
 * @override
 * @inheritDoc
 */
tr.Timeout.prototype.runImpl = function() {
  if (this.timeoutId_ !== null) {
    throw 'A timeout for this task already exists.';
  }

  var timeout = this.timeout_;
  if (this.timeoutStart_ > -1 && this.timeoutPause_ > -1) {
    timeout += (this.timeoutStart_ - this.timeoutPause_);
  }
  timeout = Math.max(timeout, 0);

  this.timeoutId_ = goog.global.setTimeout(
      goog.bind(this.onTimeout_, this), timeout);
  this.timeoutStart_ = goog.now();

  if (this.decoratedTask_.getState() == tr.enums.State.COMPLETED) {
    this.onDecoratedTaskCompleted_(this.decoratedTask_);
  } else if (this.decoratedTask_.getState() == tr.enums.State.ERRORED) {
    this.onDecoratedTaskErrored_(this.decoratedTask_);
  } else {
    this.decoratedTask_.completed(this.onDecoratedTaskCompleted_, this);
    this.decoratedTask_.errored(this.onDecoratedTaskErrored_, this);
    this.decoratedTask_.run();
  }
};


/**
 * Event handler for when the deferred task is complete.
 * @private
 */
tr.Timeout.prototype.onTimeout_ = function() {
  this.stopTimer_();
  this.removeCallbacks_();

  this.decoratedTask_.interrupt();
  this.errorInternal(this.decoratedTask_.getData(), 'Task timed out after ' + this.timeout_ + 'ms');
};


/**
 * Event handler for when the deferred task is complete.
 * @param {!tr.Task} task
 * @private
 */
tr.Timeout.prototype.onDecoratedTaskCompleted_ = function(task) {
  this.stopTimer_();
  this.removeCallbacks_();

  this.completeInternal(task.getData());
};


/**
 * Event handler for when the deferred task errored.
 * @param {!tr.Task} task
 * @private
 */
tr.Timeout.prototype.onDecoratedTaskErrored_ = function(task) {
  this.stopTimer_();
  this.removeCallbacks_();

  this.errorInternal(task.getData(), task.getErrorMessage());
};
