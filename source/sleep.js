goog.provide('tr.Sleep');

goog.require('tr.Abstract');
goog.require('tr.enums.State');



/**
 * Waits for an amount of time to pass before completing.
 *
 * <p>Resuming an interrupted Sleep can either re-start the timer at the beginning or resume from the interrupted point.
 *
 * @example
 * // Sleeps 500ms before completing
 * var task = new tr.Sleep(500);
 * task.run();
 *
 * @param {number} timeout Time in milliseconds to wait before completing.
 * @param {boolean} opt_resetTimerAfterInterruption Reset the timer after interruption; defaults to false.
 * @param {string=} opt_taskName Optional defaulttask name.
 * @extends {tr.Abstract}
 * @constructor
 * @struct
 */
tr.Sleep = function(timeout, opt_resetTimerAfterInterruption, opt_taskName) {
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
goog.inherits(tr.Sleep, tr.Abstract);


/**
 * Stops the running timer.
 * @private
 */
tr.Sleep.prototype.stopTimer_ = function() {
  if (this.timeoutId_) {
    goog.global.clearTimeout(this.timeoutId_);
    this.timeoutId_ = null;
  }
};


/**
 * @override
 * @inheritDoc
 */
tr.Sleep.prototype.resetImpl = function() {
  this.stopTimer_();

  this.timeoutStart_ = -1;
  this.timeoutPause_ = -1;
};


/**
 * @override
 * @inheritDoc
 */
tr.Sleep.prototype.interruptImpl = function() {
  this.stopTimer_();

  this.timeoutPause_ = goog.now();
};


/**
 * @override
 * @inheritDoc
 */
tr.Sleep.prototype.runImpl = function() {
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
tr.Sleep.prototype.onTimeout_ = function() {
  this.stopTimer_();

  this.completeInternal();
};
