function createFadeInTweenTask(element) {
  return new tr.Tween(function(value) {
    element.style.opacity = value;  
  }, 1000);
};

function createFadeOutTweenTask(element) {
  return new tr.Tween(function(value) {
    element.style.opacity = 1 - value;  
  }, 1000);
};

function createShrinkTweenTask(element) {
  var boundingClientRect = element.getBoundingClientRect();

  return new tr.Tween(function(value) {
    var multiplier = 1 - value;

    element.style.height = boundingClientRect.height * multiplier;
    element.style.width = boundingClientRect.width * multiplier;
  }, 1000);
};

function creatDropTweenTask(element) {
  var viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  var boundingClientRect = element.getBoundingClientRect();

  var task = new tr.Tween(function(value) {
    element.style.top = boundingClientRect.top + value * (viewportHeight - boundingClientRect.top);
  }, 1000);
  task.started(function() {
    element.style.position = 'absolute';
    element.style.left = boundingClientRect.left;
    element.style.top = boundingClientRect.top;
  });

  return task;
};

function init() {
  var graphTask = new tr.Graph();

  var waitForClickTask;
  var completedCount = 0;

  var button1 = document.getElementById('button1');
  waitForClickTask = new tr.Listener(button1, "click");
  graphTask.add(createFadeInTweenTask(button1));
  graphTask.add(waitForClickTask);
  graphTask.add(createFadeOutTweenTask(button1), [waitForClickTask]);

  var button2 = document.getElementById('button2');
  waitForClickTask = new tr.Listener(button2, "click");
  graphTask.add(createFadeInTweenTask(button2));
  graphTask.add(waitForClickTask);
  graphTask.add(createShrinkTweenTask(button2), [waitForClickTask]);

  var button3 = document.getElementById('button3');
  waitForClickTask = new tr.Listener(button3, "click");
  graphTask.add(createFadeInTweenTask(button3));
  graphTask.add(waitForClickTask);
  graphTask.add(creatDropTweenTask(button3), [waitForClickTask]);

  // Blocks on all of the above tasks
  graphTask.addToEnd(
    new tr.Closure(function() {
      var logger = document.getElementById('logger');
      logger.innerText = "Task completed " + ++completedCount + " times";
    }, true));

  graphTask.completed(function() {
    graphTask.reset();
    graphTask.run();
  });
  graphTask.run();
};