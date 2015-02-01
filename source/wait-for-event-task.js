goog.provide('taskrunner.WaitForEventTask');

goog.require('taskrunner.AbstractTask');
goog.require('taskrunner.TaskState');



/**
 * Waits for an event-dispatching target to trigger a specific type of event, then completes.
 * For example, this type of task can be used to wait for a DOM element to be clicked.
 *
 * @param {Object} eventTarget Event-dispatching target.
 * @param {string} eventType Type of event to wait for.
 * @param {string=} opt_taskName Optional semantically meaningful task name.
 * @extends {taskrunner.AbstractTask}
 * @constructor
 * @struct
 */
taskrunner.WaitForEventTask = function(eventTarget, eventType, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {Object} */
  this.eventTarget_ = eventTarget;

  /** @private {string} */
  this.eventType_ = eventType;

  /** @private {function(!Object)|undefined} */
  this.listener_ = undefined;

};
goog.inherits(taskrunner.WaitForEventTask, taskrunner.AbstractTask);


/** @override */
taskrunner.WaitForEventTask.prototype.resetImpl = function() {
  // No-op
};


/** @override */
taskrunner.WaitForEventTask.prototype.interruptImpl = function() {
  this.eventTarget_.removeEventListener(this.eventType, this.listener_);
};


/** @override */
taskrunner.WaitForEventTask.prototype.runImpl = function() {
  var that = this;

  this.listener_ = function(event) {
    that.eventTarget_.removeEventListener(that.eventType, that.listener_);
    that.completeInternal(event);
  };

  this.eventTarget_.addEventListener(this.eventType, this.listener_);
};
