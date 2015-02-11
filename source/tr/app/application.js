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
 * // Initialize the Application and then configure its routes.
 * var application = new tr.app.Application();
 * var router = application.getApplicationRouter();
 * 
 * // An example user-profile page.
 * // This route tries to load user profile information in order to launch a UserProfileState.
 * // If the user profile fails to load, the route falls back to a sign-in state with the assumption that the session is invalid.
 * router.addPath('/user/:userId',
 *   function(params) {
 *     var loadUuserInfo = new LoadUserInfo(params.userId);
 * 
 *     return new tr.app.TransitionState(application).
 *       addTargetState(new UserProfileState(application), [loadUuserInfo]).
 *       addTargetState(new SignInStateState(application))
 *   });
 * 
 * // The router must be configured with a default fall-back state.
 * // This state gets loaded if a URL cannot be matched with a route, or if a route has no states that can be loaded.
 * // It's improtant for this state to have no dependencies.
 * application.getApplicationRouter().setDefaultRoute(
 *   function(params) {
 *     return new SignInStateTask(application);
 *   });
 * 
 * // Once the router has been configured, start it to begin processing states.
 * // This will immediately process the current URL and load the appropriate state.
 * router.start();
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
