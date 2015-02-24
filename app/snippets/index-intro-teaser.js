new tr.Chain()
  .first(initializeSession) // Initialize the session.
  .or(requireSignIn)        // If no session exists prompt the user to sign-in.
  .then(loadUserProfile)    // Load the session user's profile.
  .or(setupUserProfile)     // If no profile exists create one.
  .then(showHomeScreen)     // Once a profile is loaded show the home screen.
  .run();