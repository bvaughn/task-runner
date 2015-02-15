goog.provide('tr.Tween');

goog.require('goog.asserts');
goog.require('goog.async.AnimationDelay');
goog.require('tr.Abstract');

/**
 * Animation-frame-based task for tweening properties.
 * 
 * <p>This task invokes a callback on each animation frame and passes a 0..1 value representing the progress of the overall tween.
 *
 * @example
 * // Creates a 2-second tween that fades out an element.
 * var task = new tr.Tween(
 *   function(value) {
 *     element.style.opacity = value;
 *   }, 2000);
 * task.run();
 *
 * @param {function(!number)} callback Callback invoked on animation frame with a number (0..1) representing the position of the tween.
 * @param {number} duration Duration of tween in milliseconds.
 * @param {function(!number)=} opt_easingFunction Optional easing function used to convert input time to an eased time.
 *                                                If no function is specified, a linear ease (no ease) will be used.
 * @param {string=} opt_taskName Optional defaulttask name.
 * @extends {tr.Abstract}
 * @constructor
 * @throws {Error} if an invalid duration is provided
 * @struct
 */
tr.Tween = function(callback, duration, opt_easingFunction, opt_taskName) {
  goog.base(this, opt_taskName || "Tween");

  goog.asserts.assert(duration > 0, 'Invalid tween duration provided.');

  /** @private {goog.async.AnimationDelay|undefined} */
  this.animationDelay_ = 0;

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
goog.inherits(tr.Tween, tr.Abstract);

/**
 * @override
 * @inheritDoc
 */
tr.Tween.prototype.interruptImpl = function() {
  this.cancelCurrentAnimationFrame_();
};

/**
 * @override
 * @inheritDoc
 */
tr.Tween.prototype.resetImpl = function() {
  this.elapsed_ = 0;
  this.lastUpdateTimestamp_ = 0;

  // One final animation frame to reset the progress value to 0.
  this.queueAnimationFrame_(this.updateReset_);
};

/**
 * @override
 * @inheritDoc
 */
tr.Tween.prototype.runImpl = function() {
  this.lastUpdateTimestamp_ = goog.now();

  this.queueAnimationFrame_(this.updateRunning_);
};

/**
 * @param {!number} value
 * @return {!number}
 * @private
 */
tr.Tween.prototype.linearEase_ = function(value) {
  return value;
};

/** @private */
tr.Tween.prototype.cancelCurrentAnimationFrame_ = function() {
  if (this.animationDelay_) {
    this.animationDelay_.stop();
    this.animationDelay_.dispose();
  }
};

/**
 * @param {function(!number)} callback
 * @private
 */
tr.Tween.prototype.queueAnimationFrame_ = function(callback) {
  this.cancelCurrentAnimationFrame_();

  this.animationDelay_ = new goog.async.AnimationDelay(goog.bind(callback, this));
  this.animationDelay_.start();
};

/**
 * @param {!number} timestamp
 * @private
 */
tr.Tween.prototype.updateReset_ = function(timestamp) {
  this.animationDelay_ = undefined;

  this.callback_(this.easingFunction_(0));
};

/**
 * @param {!number} timestamp
 * @private
 */
tr.Tween.prototype.updateRunning_ = function(timestamp) {
  timestamp = goog.now();

  this.animationDelay_ = undefined;
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
