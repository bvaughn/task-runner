goog.provide('taskrunner.TweenTask');

goog.require('taskrunner.AbstractTask');



/**
 * Animation-frame-based task for tweening properties.
 * This task invokes a callback on each animation frame and passes a 0..1 value representing the progress of the overall tween.
 *
 * @example
 * // Creates a 2-second tween that fades out an element.
 * var task = new taskrunner.TweenTask(
 *   function(value) {
 *     element.style.opacity = value;
 *   }, 2000);
 * task.run();
 *
 * @param {function(!number)} callback Callback invoked on animation frame with a number (0..1) representing the position of the tween.
 * @param {number} duration Duration of tween in milliseconds.
 * @param {function(!number)=} opt_easingFunction Optional easing function used to convert input time to an eased time.
 *                                                If no function is specified, a linear ease (no ease) will be used.
 * @param {string=} opt_taskName Optional semantically meaningful task name.
 * @extends {taskrunner.AbstractTask}
 * @constructor
 * @throws {Error} if an invalid duration is provided
 * @struct
 */
taskrunner.TweenTask = function(callback, duration, opt_easingFunction, opt_taskName) {
  goog.base(this, opt_taskName);

  goog.asserts.assert(duration > 0, 'Invalid tween duration provided.');

  /** @private {!number} */
  this.animationFrameId_ = 0;

  /** @private {function(!number)} */
  this.callback_ = callback;

  /** @private {!number} */
  this.duration_ = duration;

  /** @private {!number} */
  this.elapsed_ = 0;

  /** @private {?function(!number):!number} */
  this.easingFunction_ = opt_easingFunction || this.linearEase_;

  /** @private {!number} */
  this.lastUpdateTimestamp_ = 0;
};
goog.inherits(taskrunner.TweenTask, taskrunner.AbstractTask);


/**
 * @override
 * @inheritDoc
 */
taskrunner.TweenTask.prototype.interruptImpl = function() {
  this.cancelCurrentAnimationFrame_();
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.TweenTask.prototype.resetImpl = function() {
  this.elapsed_ = 0;
  this.lastUpdateTimestamp_ = 0;

  // One final animation frame to reset the progress value to 0.
  this.queueAnimationFrame_(this.updateReset_);
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.TweenTask.prototype.runImpl = function() {
  this.lastUpdateTimestamp_ = goog.now();

  this.queueAnimationFrame_(this.updateRunning_);
};


/**
 * @param {!number} value
 * @return {!number}
 * @private
 */
taskrunner.TweenTask.prototype.linearEase_ = function(value) {
  return value;
};


/** @private */
taskrunner.TweenTask.prototype.cancelCurrentAnimationFrame_ = function() {
  if (this.animationFrameId_) {
    goog.global.cancelAnimationFrame(this.animationFrameId_);
  }
};


/**
 * @param {function(!number)} callback
 * @private
 */
taskrunner.TweenTask.prototype.queueAnimationFrame_ = function(callback) {
  this.cancelCurrentAnimationFrame_();

  this.animationFrameId_ = goog.global.requestAnimationFrame(
      goog.bind(callback, this));
};


/**
 * @param {!number} timestamp
 * @private
 */
taskrunner.TweenTask.prototype.updateReset_ = function(timestamp) {
  this.animationFrameId_ = 0;

  this.callback_(this.easingFunction_(0));
};


/**
 * @param {!number} timestamp
 * @private
 */
taskrunner.TweenTask.prototype.updateRunning_ = function(timestamp) {
  timestamp = goog.now();

  this.animationFrameId_ = 0;
  this.elapsed_ += timestamp - this.lastUpdateTimestamp_;
  this.lastUpdateTimestamp_ = timestamp;

  var value = this.easingFunction_(Math.min(1, this.elapsed_ / this.duration_));

  this.callback_(value);

  // Check for complete or queue another animation frame.
  if (this.elapsed_ >= this.duration_) {
    this.completeInternal();
  } else {
    this.queueAnimationFrame_(this.updateRunning_);
  }
};
