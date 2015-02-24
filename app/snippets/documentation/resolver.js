var resolver = new tr.Resolver();
resolver.addResolution(userHomePage, [loadSession, loadUserProfile]);
resolver.addResolution(setupProfileState, [loadSession]);
resolver.addResolution(signInState);
resolver.run();

// Here is an example of a Resolver used in an application router context.
// If a valid session can be found and the user has setup a profile, then a home-page state (task) is run.
// If auser is logged in but has no profile, he/she is redirected to a profile setup state.
// Otherwise if no session information can be loaded the user is sent to a sign-in state.

var resolver = new tr.Resolver(true);
resolver.addResolution(stayInTheMatrix, [bluePillChosen]);
resolver.addResolution(escapeToTheRealWorld, [redPillChosen]);
resolver.run();

// Here is a silly example of how branching-logic can be added to a series of tasks.
// The two outcomes specified are mutually exclusive.
// The decision between the two is deferred until the first dependency is satisfied.
// The constructor param TRUE tells the Resolver not to wait for all dependencies,
// But to proceed once the first one resolution is valid.