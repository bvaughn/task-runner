function initDemo1() {
  var graphTask = new tr.Graph();

  var waitForClickTask;
  var completedCount = 0;

  var button1 = document.getElementById('button1');
  waitForClickTask = new tr.Listener(button1, "click");
  graphTask.add(new Fade(button1, true));
  graphTask.add(waitForClickTask);
  graphTask.add(new Fade(button1, false), [waitForClickTask]);

  var button2 = document.getElementById('button2');
  waitForClickTask = new tr.Listener(button2, "click");
  graphTask.add(new Fade(button2, true));
  graphTask.add(waitForClickTask);
  graphTask.add(new Fade(button2, false), [waitForClickTask]);

  var button3 = document.getElementById('button3');
  waitForClickTask = new tr.Listener(button3, "click");
  graphTask.add(new Fade(button3, true));
  graphTask.add(waitForClickTask);
  graphTask.add(new Fade(button3, false), [waitForClickTask]);

  graphTask.completed(function() {
    var logger = document.getElementById('logger');
    logger.innerText = "Tasks run " + ++completedCount + " times.";

    graphTask.reset();
    graphTask.run();
  });
  graphTask.run();
};