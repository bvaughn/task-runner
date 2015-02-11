goog.provide('tr.Factory');

goog.require('tr.Abstract');
goog.require('tr.enums.Event');
goog.require('tr.enums.State');

/**
 * Creates and decorates a task returned by the callback.
 *
 * <p>Use this type of task when an important decision needs to be deferred.
 * For example if you need a task to load some data, but the specifics aren't known when your application is initialized.
 * This type of task allows for just-in-time evaluation of data resolved by previous Tasks.
 *
 * @example
 * // Creates and runs a new Xhr only when the outer deferred task is run.
 * // In this example, the variable `someUrl` is not yet set when the task is defined.
 * var task = new tr.Factory(
 *   function() {
 *     return new tr.Xhr(someUrl);
 *   });
 *
 * @param {function(*):tr.Task} taskFactoryFn The function to create an Task object.
 * @param {Object=} opt_thisArg Optional 'this' argument to invoke taskFactoryFn with.
 * @param {!Array=} opt_argsArray Optional arguments array to invoke taskFactoryFn with.
 * @param {string=} opt_taskName Optional defaulttask name.
 * @extends {tr.Abstract}
 * @implements {tr.Decorator}
 * @constructor
 * @struct
 */
tr.Factory = function(taskFactoryFn, opt_thisArg, opt_argsArray, opt_taskName) {
  goog.base(this, opt_taskName || "Factory");

  /** @private {function(*):tr.Task} */
  this.taskFactoryFn_ = taskFactoryFn;

  /** @private {?} */
  this.thisArg_ = opt_thisArg;

  /** @private {!Array|undefined} */
  this.argsArray_ = opt_argsArray;

  /** @private {tr.Task} */
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
goog.inherits(tr.Factory, tr.Abstract);

/**
 * @override
 * @inheritDoc
 */
tr.Factory.prototype.getDecoratedTask = function() {
  return this.deferredTask_;
};

/**
 * Set whether to recreate the deferred task after an error occured.
 * This property is sticky for all consecutive reruns until set again.
 * @param {boolean} recreateDeferredTaskAfterError
 */
tr.Factory.prototype.recreateDeferredTaskAfterError =
    function(recreateDeferredTaskAfterError) {
  this.recreateDeferredTaskAfterError_ = recreateDeferredTaskAfterError;
};

/**
 * Removes the deferred task callbacks.
 * @private
 */
tr.Factory.prototype.removeCallbacks_ = function() {
  if (!this.deferredTask_) {
    return;
  }
  this.deferredTask_.off(
      tr.enums.Event.COMPLETED, this.onDeferredTaskCompleted_, this);
  this.deferredTask_.off(
      tr.enums.Event.ERRORED, this.onDeferredTaskErrored_, this);
  this.deferredTask_.off(
      tr.enums.Event.INTERRUPTED, this.onDeferredTaskInterrupted_, this);
};

/**
 * @override
 * @inheritDoc
 */
tr.Factory.prototype.resetImpl = function() {
  this.removeCallbacks_();

  if (this.deferredTask_) {
    this.deferredTask_ = null;
  }
};

/**
 * @override
 * @inheritDoc
 */
tr.Factory.prototype.interruptImpl = function() {
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
tr.Factory.prototype.runImpl = function() {
  if (!this.deferredTask_ ||
      this.recreateDeferredTaskAfterError_ && this.deferredTaskErrored_) {
    if (goog.isDef(this.thisArg_)) {
      this.deferredTask_ = this.taskFactoryFn_.apply(
          this.thisArg_, this.argsArray_ || []);
    } else {
      this.deferredTask_ = this.taskFactoryFn_.apply();
    }
  }

  if (this.deferredTask_.getState() == tr.enums.State.COMPLETED) {
    this.onDeferredTaskCompleted_(this.deferredTask_);
  } else if (this.deferredTask_.getState() == tr.enums.State.ERRORED) {
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
 * @param {!tr.Task} task
 * @private
 */
tr.Factory.prototype.onDeferredTaskCompleted_ = function(task) {
  this.removeCallbacks_();
  this.completeInternal(task.getData());
};

/**
 * Event handler for when the deferred task errored.
 * @param {!tr.Task} task
 * @private
 */
tr.Factory.prototype.onDeferredTaskErrored_ = function(task) {
  this.removeCallbacks_();
  this.deferredTaskErrored_ = true;
  this.errorInternal(task.getData(), task.getErrorMessage());
};

/**
 * Event handler for when the deferred task is interrupted.
 * @param {!tr.Task} task
 * @private
 */
tr.Factory.prototype.onDeferredTaskInterrupted_ = function(task) {
  this.interrupt();
};
