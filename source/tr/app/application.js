goog.provide('tr.app.Application');

goog.require('tr.app.ApplicationRouter');
goog.require('tr.Composite');
goog.require('tr.enums.State');



/**
 * <p class="alert alert-info">This class is only available in the <em>task-runner-engine</em> target.
 *
 * Basic Task for encapsulating an application comprised of {@link tr.app.State}s.
 * Use the enterState() method to start the application or to transition between states.
 *
 * @example
 * var application = new tr.app.Application();
 * application.enterState(initializationTask);
 *
 * @example
 * TODO Show router example
 *
 * @extends {tr.CompositeTask}
 * @constructor
 * @struct
 */
tr.app.Application = function() {

  /** @private {!tr.app.ApplicationRouter} */
  this.applicationRouter_ = new tr.app.ApplicationRouter(this);

  /** @private {tr.Task|undefined} */
  this.stateTask_;
};


/**
 * Interrupt the current application-state and enter a new one.
 * 
 * @param {!State} stateTask State task to enter.
 */
tr.app.Application.prototype.enterState = function(stateTask) {
  if (this.stateTask_ === stateTask) {
    stateTask.interrupt();
    stateTask.reset();
    stateTask.run();

  } else {
    if (this.stateTask_ && this.stateTask_.getState() === tr.enums.State.RUNNING) {
      this.stateTask_.interrupt();
    }

    this.stateTask_ = stateTask;

    if (this.stateTask_.getState() !== tr.enums.State.RUNNING) {
      this.stateTask_.run();
    }
  }
};


/**
 * @return {tr.app.ApplicationRouter}
 */
tr.app.Application.prototype.getApplicationRouter = function() {
  return this.applicationRouter_;
};


/**
 * @return Current application {@link tr.app.State}.
 */
tr.app.Application.prototype.getState = function() {
  return this.stateTask_;
};


/**
 * This method is called when a application has been started.
 * Override it to implement custom start behavior.
 */
//tr.app.Application.prototype.applicationStarted = goog.nullFunction;


/**
 * This method is called when a application has been interrupted.
 * Override it to implement custom interrupt behavior.
 */
//tr.app.Application.prototype.applicationInterrupted = goog.nullFunction;


/**
 * This method is called when a application has been reset.
 * Override it to implement custom reset behavior.
 */
//tr.app.Application.prototype.applicationReset = goog.nullFunction;
