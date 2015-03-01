function createFadeTask(element, fadeIn, duration) {
  duration = duration || 1000;

  return new tr.Tween(
      function(value) {
        element.style.opacity = fadeIn ? value : 1 - value;
      }, duration)
    .started(
      function() {
        if (fadeIn) {
          element.style.display = 'block';
        }
      })
    .completed(
      function() {
        if (!fadeIn) {
          element.style.display = 'none';
        }
      });;
};

function createTypeTask(domElement, textToWrite) {
  var getInterval = function(isWhitespace) {
    return isWhitespace ? Math.round(Math.random() * 125) + 50 : Math.round(Math.random() * 50) + 25; 
  };

  var length = textToWrite.length;
  var index = -1;

  return new tr.Interval(
    function(task) {
      if (++index < length) {
        domElement.innerText = textToWrite.substring(0, index + 1);

        var character = textToWrite.charAt(index);
        var isWhitespace = character.match(/\s/);

        task.setInterval(getInterval(isWhitespace));
      } else {
        task.complete();

        index = -1;
      }
    }, getInterval());
};

function createEraseTask(domElement) {
  return new tr.Interval(
    function(task) {
      var text = domElement.innerText;

      if (text.length > 0) {
        domElement.innerText = text.substring(0, text.length - 1);
      } else {
        task.complete();
      }
    }, 25);
};

function insertCodeExample(chain, text, textContainingDomElement, prismDomElement) {
  chain.then(
      createTypeTask(textContainingDomElement, text),
      createFadeTask(prismDomElement, true))
    .then(new tr.Sleep(5000))
    .then(
      createEraseTask(textContainingDomElement),
      createFadeTask(prismDomElement, false));
};

// Below code assembles a task sequence using the above task factory functions.

var typedHeader = document.getElementById('typedHeader');
var introCallsToAction = document.getElementById('introCallsToAction');

var chain = new tr.Chain()
  .first(
    new tr.Closure(function() {
      introCallsToAction.style.display = "none";
    }, true));

insertCodeExample(chain, "With just a few characters you can chain together asynchronous operations.", typedHeader, document.getElementById('prism1'));
insertCodeExample(chain, "Sequences of tasks can be interrupted easily while running.", typedHeader, document.getElementById('prism2'));
insertCodeExample(chain, "Interrupted tasks can be resumed where they were interrupted.", typedHeader, document.getElementById('prism3'));
insertCodeExample(chain, "Your code can easily listen for changes in task state.", typedHeader, document.getElementById('prism4'));

chain
  .then(
    createTypeTask(typedHeader, "But that's only the beginning. Keep reading to learn more..."),
    createFadeTask(introCallsToAction, true, 2500))

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