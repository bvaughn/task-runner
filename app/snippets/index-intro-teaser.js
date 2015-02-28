var chain = new tr.Chain()
  .first(initSession) // Initialize the session.
  .or(requireAuth)    // Require sign-in if no session.
  .then(loadProfile)  // Load the session-user's profile.
  .or(setupProfile)   // If no profile exists create one.
  .then(goToHome)     // Lastly, show the home screen.
  .run();

// The above sequence can be interrupted easily,
// No matter which task is running...
chain.interrupt();

// The sequence can later be resumed,
// And will pick back up where it was interrupted...
chain.run();

// Listeners can be notified of state changes...
chain.errored(failureCallback);
chain.completed(successCallback)