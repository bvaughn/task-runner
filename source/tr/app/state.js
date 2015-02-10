
goog.provide('tr.app.State');

goog.require('tr.Graph');
goog.require('tr.enums.State');



/**
 * A runtime state of an {@link tr.app.Application}s.
 * Extend this base class to implement custom application states.
 *

 * @example
 * tr.InitializationState = function(application) {
 *   goog.base(this, application, "Initialization state");
 * 
 *   // Queue state sub-tasks
 *   this.add(new LoadSessionTask());
 *   this.add(new LoadContentJSONTask());
 * };
 * goog.inherits(tr.InitializationState, tr.app.State);
 *
 * @param {!tr.app.Application} application A reference to the {@link tr.app.Application} this state belongs to.
 * @param {string=} opt_taskName Optional semantically meaningful task name.
 * @extends {tr.DepdencyGraph}
 * @constructor
 * @struct
 */
tr.app.State = function(application, opt_taskName) {
  goog.base(this, opt_taskName || "State");

  /** @private {!tr.app.Application} */
  this.application_ = application;
};
goog.inherits(tr.app.State, tr.Graph);


/**
 * Returns a reference to the global application.
 */
tr.app.State.prototype.getApplication = function() {
  return this.application_;
};


/**
 * This method is called when a state has been started.
 * Override it to implement custom start behavior.
 */
//tr.app.State.prototype.stateStarted = goog.nullFunction;


/**
 * This method is called when a state has been interrupted.
 * Override it to implement custom interrupt behavior.
 */
//tr.app.State.prototype.stateInterrupted = goog.nullFunction;


/**
 * This method is called when a state has been reset.
 * Override it to implement custom reset behavior.
 */
//tr.app.State.prototype.stateReset = goog.nullFunction;
