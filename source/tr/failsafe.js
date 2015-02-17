goog.provide('tr.Failsafe');

goog.require('tr.Abstract');

/**
 * Decorates a task and re-dispatches errors as successful completions.
 *
 * <p>This can be used to decorate tasks that are not essential.
 *
 * @example
 * // Sends a fire-and-forget style XHR to log data (and ignores failures)
 * var task = new tr.Failsafe(
 *   return new tr.Xhr('some-logging-url', someLoggingData));
 * task.run();
 *
 * @param {!tr.Task} decoratedTask Decorated task to be run when this task is run.
 * @param {string=} opt_taskName Optional task name.
 * @extends {tr.Abstract}
 * @implements {tr.Decorator}
 * @constructor
 * @struct
 */
tr.Failsafe = function(decoratedTask, opt_taskName) {
  goog.base(this, opt_taskName || "Failsafe for " + decoratedTask.getName());

  /**
   * @type {!tr.Task}
   * @private
   */
  this.decoratedTask_ = decoratedTask;
};
goog.inherits(tr.Failsafe, tr.Abstract);

/**
 * @override
 * @inheritDoc
 */
tr.Failsafe.prototype.getDecoratedTask = function() {
  return this.decoratedTask_;
};

/**
 * @override
 * @inheritDoc
 */
tr.Failsafe.prototype.interruptImpl = function() {
  this.decoratedTask_.interrupt();
};

/**
 * @override
 * @inheritDoc
 */
tr.Failsafe.prototype.resetImpl = function() {
  this.decoratedTask_.reset();
};

/**
 * @override
 * @inheritDoc
 */
tr.Failsafe.prototype.runImpl = function() {
  this.decoratedTask_.completed(
    goog.bind(
      function(task) {
        this.completeInternal();
      }, this));

  this.decoratedTask_.errored(
    goog.bind(
      function(task) {
        this.completeInternal();
      }, this));

  this.decoratedTask_.run();
};
