goog.provide('tr.app.Application');

goog.require('tr.app.ApplicationRouter');
goog.require('tr.Composite');
goog.require('tr.enums.State');



/**
 * Basic Task for encapsulating an application comprised of {@link tr.app.State}s.
 * Use the enterState() method to start the application or to transition between states.
 *
 * @example
 * var application = new tr.Application();
 * application.enterState(initializationTask);
 *
 * @example
 * TODO Show router example
 *
 * @extends {tr.CompositeTask}
 * @constructor
 * @struct
 */
tr.Application = function() {

  /** @private {!tr.ApplicationRouter} */
  this.applicationRouter_ = new tr.ApplicationRouter(this);

  /** @private {tr.Task|undefined} */
  this.stateTask_;
};


/**
 * Interrupt the current application-state and enter a new one.
 * 
 * @param {!State} stateTask State task to enter.
 * @private
 */
tr.Application.prototype.enterState = function(stateTask) {
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
 * @return {@link tr.ApplicationRouter}
 */
tr.Application.prototype.getApplicationRouter = function() {
  return this.applicationRouter_;
};


/**
 * @return Current application {@link tr.app.State}.
 */
tr.Application.prototype.getState = function() {
  return this.stateTask_;
};


/**
 * This method is called when a application has been started.
 * Override it to implement custom start behavior.
 */
//tr.Application.prototype.applicationStarted = goog.nullFunction;


/**
 * This method is called when a application has been interrupted.
 * Override it to implement custom interrupt behavior.
 */
//tr.Application.prototype.applicationInterrupted = goog.nullFunction;


/**
 * This method is called when a application has been reset.
 * Override it to implement custom reset behavior.
 */
//tr.Application.prototype.applicationReset = goog.nullFunction;
