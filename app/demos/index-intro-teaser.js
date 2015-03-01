function insertCodeExample(chain, text, textContainingDomElement, elementId) {
  var domElement = document.getElementById(elementId);

  chain.then(
      new Type(textContainingDomElement, text),
      new Fade(domElement, true))
    .then(new tr.Sleep(5000))
    .then(
      new Untype(textContainingDomElement),
      new Fade(domElement, false));
};

var typedHeader = document.getElementById('typedHeader');
var introCallsToAction = document.getElementById('introCallsToAction');

var chain = new tr.Chain()
  .first(
    new tr.Closure(function() {
      // Reset in case task is re-run.
      introCallsToAction.style.display = "none";
    }, true));

insertCodeExample(chain, "With just a few characters you can chain together asynchronous operations.", typedHeader, 'prism1');
insertCodeExample(chain, "Sequences of tasks can be interrupted easily while running.", typedHeader, 'prism2');
insertCodeExample(chain, "Interrupted tasks can be resumed where they were interrupted.", typedHeader, 'prism3');
insertCodeExample(chain, "Your code can easily listen for changes in task state.", typedHeader, 'prism4');

chain
  .then(
    new Type(typedHeader, "But that's only the beginning. Keep reading to learn more..."),
    new Fade(introCallsToAction, true, 2500))

// Below code focuses on enabling interactivity with the demo.

var pauseChainButton = document.getElementById('pauseChainButton');
var resumeChainButton = document.getElementById('resumeChainButton');
var restartChainButton = document.getElementById('restartChainButton');

var PAUSE = 1, RESUME = 2, RESTART = 3;

function showButton(button) {
  pauseChainButton.style.display = resumeChainButton.style.display = restartChainButton.style.display = "none";

  switch (button) {
    case PAUSE:
      pauseChainButton.style.display = "";
      break;
    case RESUME:
      resumeChainButton.style.display = "";
      break;
    case RESTART:
      restartChainButton.style.display = "";
      break;
  }
};

chain.started(function() {
  showButton(PAUSE);
}).interrupted(function() {
  showButton(RESUME);
}).completed(function() {
  showButton(RESTART);
});

function onClickHandler() {
  switch (chain.getState()) {
    case tr.enums.State.RUNNING:
      chain.interrupt();
      break;
    case tr.enums.State.INTERRUPTED:
      chain.run();
      break;
    case tr.enums.State.COMPLETED:
      chain.reset();
      chain.run();
      break;
  }
};

pauseChainButton.onclick = resumeChainButton.onclick = restartChainButton.onclick = onClickHandler;

// Last but not lease, run the task...
chain.run();