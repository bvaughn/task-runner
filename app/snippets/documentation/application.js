// Initialize the Application and then configure its routes.
var application = new tr.app.Application();
var router = application.getApplicationRouter();

// An example user-profile page.
// This route tries to load user profile information in order to launch a UserProfileState.
// If the user profile fails to load, the route falls back to a setup state.
router.addPath('/user/:userId',
  function(params) {
    var loadUuserInfo = new LoadUserInfo(params.userId);

    return new tr.app.TransitionState().
      addTargetState(new UserProfileState(), [loadUuserInfo]).
      addTargetState(new SetupProfileState())
  });

// The router must be configured with a default fall-back state.
// This state gets loaded if a URL cannot be matched with a route, or if a route has no states that can be loaded.
// It's important for this state to have no dependencies.
application.getApplicationRouter().setDefaultRoute(
  function(params) {
    return new SignInStateTask();
  });

// Once the router has been configured, start it to begin processing states.
// This will immediately process the current URL and load the appropriate state.
router.start();