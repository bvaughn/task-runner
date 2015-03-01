function createFadeInTask(element, duration) {
  duration = duration || 1000;

  return new tr.Tween(
    function(value) {
      element.style.opacity = value;  
    }, duration).started(
    function() {
      element.style.display = 'block';
    });
};

function createFadeOutTask(element) {
  return new tr.Tween(
    function(value) {
      element.style.opacity = 1 - value;  
    }, 1000).completed(
    function() {
      element.style.display = 'none';
    });
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
      createFadeInTask(prismDomElement))
    .then(new tr.Sleep(5000))
    .then(
      createEraseTask(textContainingDomElement),
      createFadeOutTask(prismDomElement))
}

var typedHeader = document.getElementById('typedHeader');
var taskFlowButton = document.getElementById('taskFlowButton');
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
    createFadeInTask(introCallsToAction, 5000))
  .completed(
    function() {
      taskFlowButton.innerText = "Restart it.";
    })
  .run();

taskFlowButton.onclick = function() {
  switch (chain.getState()) {
    case tr.enums.State.RUNNING:
      chain.interrupt();
      taskFlowButton.innerText = "Resume it.";
      break;
    case tr.enums.State.INTERRUPTED:
      chain.run();
      taskFlowButton.innerText = "Pause it.";
      break;
    case tr.enums.State.COMPLETED:
      chain.reset();
      chain.run();
      taskFlowButton.innerText = "Pause it.";
      break;
  }
};