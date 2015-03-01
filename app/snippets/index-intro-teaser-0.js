var chain = new tr.Chain()
  .first(initSession) // Initialize the session.
  .or(requireAuth)    // Require sign-in if no session.
  .then(loadProfile)  // Load the session-user's profile.
  .or(setupProfile)   // If no profile exists create one.
  .then(goToHome)     // Lastly, show the home screen.
  .run();