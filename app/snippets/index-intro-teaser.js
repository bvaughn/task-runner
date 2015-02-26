new tr.Chain()              // Chain together tasks to...
  .first(initializeSession) // Initialize the session.
  .or(requireSignIn)        // Require sign-in if no session.
  .then(loadUserProfile)    // Load the session-user's profile.
  .or(setupUserProfile)     // If no profile exists create one.
  .then(showHomeScreen)     // Lastly, show the home screen.
  .run();