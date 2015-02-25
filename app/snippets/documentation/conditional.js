// Here is an example of a Conditional that chooses between prioritized outcomes.
// In this example the conditional is acting as an application router of sorts.
// When it is run, the loadSession and loadUserProfile tasks are run first.
// If both succeed then the home-page state (task) is run.
// If loadUserProfile fails the user is redirected to a profile setup state.
// Otherwise the ELSE condition is run and the user is sent to the sign-in state.
var resolver = new tr.Conditional();
resolver.addResolution(userHomePage, [loadSession, loadUserProfile]);
resolver.addResolution(setupProfileState, [loadSession]);
resolver.addResolution(signInState);
resolver.run();

// Here is an example of a mutually-exclusive conditional.
// When the task is run, both listenForRestart and listenForContinue tasks are run.
// The first one to succeed will cause the Conditional to continue.
// The conditional will fail if neither precondition succeeds.
var resolver = new tr.Conditional(true);
resolver.addResolution(restartActivity, [listenForRestart]);
resolver.addResolution(returnToHome, [listenForContinue]);
resolver.run();