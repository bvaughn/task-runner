goog.provide('taskrunner.EventListenerTask');

goog.require('taskrunner.AbstractTask');
goog.require('taskrunner.TaskState');



/**
 * Waits for an event-dispatching target to trigger a specific type of event, then completes.
 * For example, this type of task can be used to wait for a DOM element to be clicked.
 *
 * @example
 * // Watches a DOM element until a "click" event is dispatched.
 * var task = new taskrunner.EventListenerTask(element, "click");
 * task.run();
 *
 * @param {Object} eventTarget Event-dispatching target.
 * @param {string} eventType Type of event to wait for.
 * @param {string=} opt_taskName Optional semantically meaningful task name.
 * @extends {taskrunner.AbstractTask}
 * @constructor
 * @struct
 */
taskrunner.EventListenerTask = function(eventTarget, eventType, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {Object} */
  this.eventTarget_ = eventTarget;

  /** @private {string} */
  this.eventType_ = eventType;

  /** @private {function(!Object)|undefined} */
  this.listener_ = undefined;

};
goog.inherits(taskrunner.EventListenerTask, taskrunner.AbstractTask);


/**
 * @override
 * @inheritDoc
 */
taskrunner.EventListenerTask.prototype.resetImpl = function() {
  // No-op
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.EventListenerTask.prototype.interruptImpl = function() {
  goog.events.unlisten(this.eventTarget_, this.eventType_, this.listener_);
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.EventListenerTask.prototype.runImpl = function() {
  var that = this;

  this.listener_ = function(event) {
    goog.events.unlisten(that.eventTarget_, that.eventType_, that.listener_);

    that.completeInternal(event);
  };

  goog.events.listen(this.eventTarget_, this.eventType_, this.listener_);
};
