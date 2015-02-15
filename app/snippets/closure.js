new Closure(
  function(thisTask) {
    // Do some work and when you're finished call..
    thisTask.complete();
  });