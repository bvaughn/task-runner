function createFadeInTask(element) {
  return new tr.Tween(
    function(value) {
      element.style.opacity = value;  
    }, 1000).started(
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
      }
    }, getInterval());
};

function createEraseTask(domElement) {
  var getInterval = function() {
    return Math.round(Math.random() * 40); 
  };
  
  return new tr.Interval(
    function(task) {
      var text = domElement.innerText;

      if (text.length > 0) {
        domElement.innerText = text.substring(0, text.length - 1);

        task.setInterval(getInterval());
      } else {
        task.complete();
      }
    }, getInterval());
};

function insertCodeExample(chain, text, textContainingDomElement, prismDomElement) {
  chain.then(
      createTypeTask(textContainingDomElement, text),
      createFadeInTask(prismDomElement))
    .then(new tr.Sleep(3500))
    .then(
      createEraseTask(textContainingDomElement),
      createFadeOutTask(prismDomElement))
}

var typedHeader = document.getElementById('typedHeader');

var chain = new tr.Chain();

insertCodeExample(chain, "With just a few characters you can chain together asynchronous operations.", typedHeader, document.getElementById('prism1'));
insertCodeExample(chain, "Sequences of tasks can be interrupted easily while running.", typedHeader, document.getElementById('prism2'));
insertCodeExample(chain, "Interrupted tasks can be resumed where they were interrupted.", typedHeader, document.getElementById('prism3'));
insertCodeExample(chain, "Your code can easily listen for changes in task state.", typedHeader, document.getElementById('prism4'));

chain.then(
  createTypeTask(typedHeader, "But that's only the beginning. Keep reading to learn more..."),
  createFadeInTask(document.getElementById('introCallsToAction')))

chain.run();