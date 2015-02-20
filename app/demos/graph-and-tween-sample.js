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

function initDemo1() {
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
  graphTask.add(createFadeOutTweenTask(button2), [waitForClickTask]);

  var button3 = document.getElementById('button3');
  waitForClickTask = new tr.Listener(button3, "click");
  graphTask.add(createFadeInTweenTask(button3));
  graphTask.add(waitForClickTask);
  graphTask.add(createFadeOutTweenTask(button3), [waitForClickTask]);

  graphTask.completed(function() {
    var logger = document.getElementById('logger');
    logger.innerText = "Tasks run " + ++completedCount + " times.";

    graphTask.reset();
    graphTask.run();
  });
  graphTask.run();
};