goog.provide('taskrunner.WaitTask');

goog.require('goog.asserts');
goog.require('taskrunner.AbstractTask');
goog.require('taskrunner.TaskState');



/**
 * Task that delays for a specified time before completion. Resuming an
 * interrupted WaitTask can either re-start the Timer at the beginning or resume
 * from the interrupted point.
 *
 * @param {number} timeout Time in milliseconds to wait before completing.
 * @param {boolean} opt_resetTimerAfterInterruption Whether to reset the timer
 *     after interruption. Defaults to false.
 * @param {string=} opt_taskName Optional semantically meaningful task name.
 * @extends {taskrunner.AbstractTask}
 * @constructor
 * @struct
 */
taskrunner.WaitTask = function(
    timeout, opt_resetTimerAfterInterruption, opt_taskName) {
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


/** @override */
taskrunner.WaitTask.prototype.resetImpl = function() {
  this.stopTimer_();

  this.timeoutStart_ = -1;
  this.timeoutPause_ = -1;
};


/** @override */
taskrunner.WaitTask.prototype.interruptImpl = function() {
  this.stopTimer_();

  this.timeoutPause_ = goog.now();
};


/** @override */
taskrunner.WaitTask.prototype.runImpl = function() {
  goog.asserts.assert(this.timeoutId_ === null,
      'A timeout for this task already exists.');

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
