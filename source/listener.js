goog.provide('tr.Listener');

goog.require('tr.Abstract');
goog.require('tr.enums.State');



/**
 * Waits for an event-dispatching target to trigger a specific type of event.
 * 
 * @example
 * // Watches a DOM element until a "click" event is dispatched.
 * var task = new tr.Listener(element, "click");
 * task.run();
 *
 * @param {Object} eventTarget Event-dispatching target.
 * @param {string} eventType Type of event to wait for.
 * @param {string=} opt_taskName Optional defaulttask name.
 * @extends {tr.Abstract}
 * @constructor
 * @struct
 */
tr.Listener = function(eventTarget, eventType, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {Object} */
  this.eventTarget_ = eventTarget;

  /** @private {string} */
  this.eventType_ = eventType;

  /** @private {function(!Object)|undefined} */
  this.listener_ = undefined;

};
goog.inherits(tr.Listener, tr.Abstract);


/**
 * @override
 * @inheritDoc
 */
tr.Listener.prototype.resetImpl = function() {
  // No-op
};


/**
 * @override
 * @inheritDoc
 */
tr.Listener.prototype.interruptImpl = function() {
  goog.events.unlisten(this.eventTarget_, this.eventType_, this.listener_);
};


/**
 * @override
 * @inheritDoc
 */
tr.Listener.prototype.runImpl = function() {
  var that = this;

  this.listener_ = function(event) {
    goog.events.unlisten(that.eventTarget_, that.eventType_, that.listener_);

    that.completeInternal(event);
  };

  goog.events.listen(this.eventTarget_, this.eventType_, this.listener_);
};
