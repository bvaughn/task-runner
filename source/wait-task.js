goog.provide('taskrunner.WaitTask');

goog.require('taskrunner.AbstractTask');
goog.require('taskrunner.TaskState');



/**
 * Task that delays for a specified time before completion.
 *
 * <p>Resuming an interrupted WaitTask can either re-start the Timer at the beginning or resume from the interrupted point.
 *
 * @example
 * // Waits 500ms; restarts the timer after an interruption.
 * var task = new taskrunner.WaitTask(500, true);
 * task.run();
 *
 * @param {number} timeout Time in milliseconds to wait before completing.
 * @param {boolean} opt_resetTimerAfterInterruption Reset the timer after interruption; defaults to false.
 * @param {string=} opt_taskName Optional semantically meaningful task name.
 * @extends {taskrunner.AbstractTask}
 * @constructor
 * @struct
 */
taskrunner.WaitTask = function(timeout, opt_resetTimerAfterInterruption, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {boolean} */
  this.resetTimerAfterInterruption_ = !!opt_resetTimerAfterInterruption;

  /** @private {number} */
  this.timeout_ = timeout;

  /** @private {number} */
  this.timeoutStart_ = -1;

  /** @private {number} */
  this.timeoutPause_ = -1;

  /** @private {?number} */
  this.timeoutId_ = null;
};
goog.inherits(taskrunner.WaitTask, taskrunner.AbstractTask);


/**
 * Stops the running timer.
 * @private
 */
taskrunner.WaitTask.prototype.stopTimer_ = function() {
  if (this.timeoutId_) {
    goog.global.clearTimeout(this.timeoutId_);
    this.timeoutId_ = null;
  }
};


/**
 * @override
 * @ignore
 */
taskrunner.WaitTask.prototype.resetImpl = function() {
  this.stopTimer_();

  this.timeoutStart_ = -1;
  this.timeoutPause_ = -1;
};


/**
 * @override
 * @ignore
 */
taskrunner.WaitTask.prototype.interruptImpl = function() {
  this.stopTimer_();

  this.timeoutPause_ = goog.now();
};


/**
 * @override
 * @ignore
 */
taskrunner.WaitTask.prototype.runImpl = function() {
  if (this.timeoutId_ !== null) {
    throw 'A timeout for this task already exists.';
  }

  var timeout = this.timeout_;
  if (!this.resetTimerAfterInterruption_ &&
      this.timeoutStart_ > -1 &&
      this.timeoutPause_ > -1) {
    timeout += (this.timeoutStart_ - this.timeoutPause_);
  }
  timeout = Math.max(timeout, 0);

  this.timeoutId_ = goog.global.setTimeout(
      goog.bind(this.onTimeout_, this), timeout);
  this.timeoutStart_ = goog.now();
};


/**
 * Event handler for when the deferred task is complete.
 * @private
 */
taskrunner.WaitTask.prototype.onTimeout_ = function() {
  this.stopTimer_();

  this.completeInternal();
};
