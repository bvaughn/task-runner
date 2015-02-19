goog.provide('tr.Decorator');

goog.require('goog.asserts');
goog.require('tr.Abstract');

/**
 * Provides a mechanism for creating tasks via composition rather than inheritance.
 *
 * <p>This task-type decorates an Object ("decorated") that defines a 'run' method.
 * This method will be passed 3 parameters:
 *
 * <ol>
 *   <li><strong>complete</strong>: A callback to be invoked upon successful completion of the task.
 *                                  This callback accepts a parameter: data.
 *   <li><strong>error</strong>: A callback to be invoked upon task failure.
 *                               This callback accepts 2 parameters: data and error-message.
 *   <li><strong>task</strong>: A reference to the decorator.
 * </ol>
 *
 * <p>The decorated Object may also implement 'interrupt' and 'reset' methods, although they are not required.
 *
 * @param {!Object} decorated TODO
 * @param {string=} opt_taskName Optional task name.
 * @extends {tr.Abstract}
 * @throws {Error} if required method "run" not implemented by "decorated".
 * @constructor
 * @struct
 */
tr.Decorator = function(decorated, opt_taskName) {
  goog.base(this, opt_taskName || "Decorator");

  goog.asserts.assert(goog.isFunction(decorated.run), 'Required method "run" not implemented.');

  /**
   * @type {!Object}
   * @private
   */
  this.decorated_ = decorated;
};
goog.inherits(tr.Decorator, tr.Abstract);

/**
 * Returns the decorated object.
 *
 * @return {Object}
 */
tr.Decorator.prototype.getDecorated = function() {
  return this.decorated_;
};

/** @override */
tr.Decorator.prototype.runImpl = function() {
  this.decorated_.run(
    goog.bind(this.complete_, this),
    goog.bind(this.error_, this));
};

/** @override */
tr.Decorator.prototype.interruptImpl = function() {
  if (goog.isFunction(this.decorated_.interrupt)) {
    this.decorated_.interrupt();
  }
};

/** @override */
tr.Decorator.prototype.resetImpl = function() {
  if (goog.isFunction(this.decorated_.reset)) {
    this.decorated_.reset();
  }
};

/**
 * Complete this task.
 *
 * @param {!Object=} data Task data.
 * @private
 */
tr.Decorator.prototype.complete_ = function(data) {
  this.completeInternal(data);
};

/**
 * Error this task.
 *
 * @param {!Object=} data Task data.
 * @param {string=} errorMessage Error message.
 * @private
 */
tr.Decorator.prototype.error_ = function(data, errorMessage) {
  this.errorInternal(data, errorMessage);
};
