function createFadeInTweenTask(element) {
  return new taskrunner.TweenTask(function(value) {
    element.style.opacity = value;  
  }, 1000);
};

function createFadeOutTweenTask(element) {
  return new taskrunner.TweenTask(function(value) {
    element.style.opacity = 1 - value;  
  }, 1000);
};

function createShrinkTweenTask(element) {
  var boundingClientRect = element.getBoundingClientRect();

  return new taskrunner.TweenTask(function(value) {
    var multiplier = 1 - value;

    element.style.height = boundingClientRect.height * multiplier;
    element.style.width = boundingClientRect.width * multiplier;
  }, 1000);
};

function creatDropTweenTask(element) {
  var viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  var boundingClientRect = element.getBoundingClientRect();

  var task = new taskrunner.TweenTask(function(value) {
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
  window.dependencyGraphTask = new taskrunner.DependencyGraphTask();

  var waitForClickTask;
  var completedCount = 0;

  var button1 = document.getElementById('button1');
  waitForClickTask = new taskrunner.EventListenerTask(button1, "click");
  dependencyGraphTask.addTask(createFadeInTweenTask(button1));
  dependencyGraphTask.addTask(waitForClickTask);
  dependencyGraphTask.addTask(createFadeOutTweenTask(button1), [waitForClickTask]);

  var button2 = document.getElementById('button2');
  waitForClickTask = new taskrunner.EventListenerTask(button2, "click");
  dependencyGraphTask.addTask(createFadeInTweenTask(button2));
  dependencyGraphTask.addTask(waitForClickTask);
  dependencyGraphTask.addTask(createShrinkTweenTask(button2), [waitForClickTask]);

  var button3 = document.getElementById('button3');
  waitForClickTask = new taskrunner.EventListenerTask(button3, "click");
  dependencyGraphTask.addTask(createFadeInTweenTask(button3));
  dependencyGraphTask.addTask(waitForClickTask);
  dependencyGraphTask.addTask(creatDropTweenTask(button3), [waitForClickTask]);

  // Blocks on all of the above tasks
  dependencyGraphTask.addTaskToEnd(
    new taskrunner.ClosureTask(function() {
      var logger = document.getElementById('logger');
      logger.innerText = "Task completed " + ++completedCount + " times";
    }, true));

  dependencyGraphTask.completed(function() {
    dependencyGraphTask.reset();
    dependencyGraphTask.run();
  });
  dependencyGraphTask.run();
};