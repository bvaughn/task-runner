goog.provide('tr.app.State');

goog.require('tr.Graph');
goog.require('tr.enums.State');

/**
 * <p class="alert alert-info">This class is only available in the <em>task-runner-engine</em> target.
 *
 * A runtime state of an {@link tr.app.Application}s.
 * Extend this base class to implement custom application states.
 *
 * @example
 * tr.InitializationState = function() {
 *   goog.base(this, "Initialization state");
 * 
 *   // Queue state sub-tasks; in this example these tasks run in parallel.
 *   this.add(new LoadSessionTask());
 *   this.add(new LoadContentJSONTask());
 *
 *   // Once session and content data have been loaded transition to a home-page state.
 *   this.addToEnd(
 *     new tr.Closure(
 *       function() {
 *         application.enterState(new HomePageState());
 *       }));
 * };
 * goog.inherits(tr.InitializationState, tr.app.State);
 *
 * @param {string=} opt_name Optional semantically meaningful task name.
 * @extends {tr.DepdencyGraph}
 * @constructor
 * @struct
 */
tr.app.State = function(opt_name) {
  goog.base(this, opt_name || "State");

  /**
   * @type {tr.app.Application|undefined}
   * @private
   */
  this.application_;
};
goog.inherits(tr.app.State, tr.Graph);

/**
 * Returns a reference to the global application.
 */
tr.app.State.prototype.getApplication = function() {
  return this.application_;
};

/**
 * This method should be invoked by the {tr.app.Application} just prior to entering (running) this state.
 *
 * @param {!tr.app.Application} application A reference to the {@link tr.app.Application}.
 */
tr.app.State.prototype.setApplication = function(application) {
  return this.application_ = application;
};
