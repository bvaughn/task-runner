var goToUserProfileTask = new tr.app.TransitionState();

// In this example, the highest-priority target state is one that displays a user-profile.
goToUserProfileTask.addTargetState(userProfileState, [loadSessionTask, loadUserProfileTask]);

// If the user-profile could not be loaded, fall back to viewing the user's homepage.
goToUserProfileTask.addTargetState(userHomePageState, [loadSessionTask]);

// If the neither could not be loaded, fall back to the login screen.
goToUserProfileTask.addTargetState(loginState, []);

// Change application-state to initiate the transition.
application.enterState(goToUserProfileTask);