var crossFadeContainer = document.getElementById('crossFadeContainer');
var crossFadeElementA = document.getElementById('crossFadeElementA');
var crossFadeElementB = document.getElementById('crossFadeElementB');

// This creates a looping crossfade between our two elements.
var chain = new tr.Chain()
  .then(new Crossfade(crossFadeElementA, crossFadeElementB))
  .then(new Crossfade(crossFadeElementB, crossFadeElementA))
  .completed(function(task) {
    task.reset();
    task.run();
  })
  .run();

// And this pauses and resumes our crossfade.
crossFadeContainer.onclick = function() {
  if (chain.getState() === tr.enums.State.RUNNING) {
    chain.interrupt();
  } else {
    chain.run();
  }
};