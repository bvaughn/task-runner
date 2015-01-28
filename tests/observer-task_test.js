goog.require('taskrunner.CompositeTask');
goog.require('taskrunner.NullTask');
goog.require('taskrunner.ObserverTask');
goog.require('taskrunner.TaskState');



/**
 * Tests for ObserverTask class.
 *
 * @constructor
 */
function ObserverTaskTest() {}
registerTestSuite(ObserverTaskTest);


/**
 * Tests when failUponFirstError is configured to true.
 */
ObserverTaskTest.prototype.failUponFirstErrorTrue = function() {
  var task1 = new taskrunner.NullTask();
  var task2 = new taskrunner.NullTask();
  var observerTask = new taskrunner.ObserverTask([task1, task2], true);

  observerTask.run();
  task1.run();
  task2.run();

  var data = {};
  var message = 'foobar';
  task1.error(data, message);
  expectEq(taskrunner.TaskState.ERRORED, observerTask.getState());
  expectEq(data, observerTask.getData());
  expectEq(message, observerTask.getErrorMessage());
};


/**
 * Tests when failUponFirstError is configured to true.
 */
ObserverTaskTest.prototype.failUponFirstErrorFalse = function() {
  var task1 = new taskrunner.NullTask();
  var task2 = new taskrunner.NullTask();
  var observerTask = new taskrunner.ObserverTask([task1, task2], false);

  observerTask.run();
  task1.run();
  task2.run();

  var data = {};
  var message = 'foobar';
  task1.error(data, message);
  expectEq(taskrunner.TaskState.RUNNING, observerTask.getState());

  task2.complete();
  expectEq(taskrunner.TaskState.ERRORED, observerTask.getState());
  expectThat(observerTask.getData(), isUndefined);
  expectThat(observerTask.getErrorMessage(), isUndefined);
};


/**
 * Tests completing a decorated task within timeout.
 */
ObserverTaskTest.prototype.noTasksToObserve = function() {
  var observerTask = new taskrunner.ObserverTask();
  observerTask.run();
  expectEq(taskrunner.TaskState.COMPLETED, observerTask.getState());
};


/**
 * Tests when all observed tasks are completed before run.
 */
ObserverTaskTest.prototype.allTasksCompletedBeforeRun = function() {
  var task1 = new taskrunner.NullTask();
  var task2 = new taskrunner.NullTask();
  var observerTask = new taskrunner.ObserverTask([task1, task2]);

  task1.run();
  task1.complete();
  task2.run();
  task2.complete();

  observerTask.run();
  expectEq(taskrunner.TaskState.COMPLETED, observerTask.getState());
};


/**
 * Tests that observer task does not start any observed tasks.
 */
ObserverTaskTest.prototype.doesNotRunObservedTasks = function() {
  var task1 = new taskrunner.NullTask();
  var task2 = new taskrunner.NullTask();
  var observerTask = new taskrunner.ObserverTask([task1, task2]);

  observerTask.run();
  expectEq(taskrunner.TaskState.RUNNING, observerTask.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, task1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, task2.getState());
};


/**
 * Tests observing a new task while the observer task is running.
 */
ObserverTaskTest.prototype.observeNewTaskWhileRunning = function() {
  var task1 = new taskrunner.NullTask();
  var task2 = new taskrunner.NullTask();
  var observerTask = new taskrunner.ObserverTask([task1]);

  observerTask.run();
  task1.run();
  task2.run();
  expectEq(taskrunner.TaskState.RUNNING, observerTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, task1.getState());
  expectEq(taskrunner.TaskState.RUNNING, task2.getState());

  observerTask.observeTask(task2);

  task1.complete();
  expectEq(taskrunner.TaskState.RUNNING, observerTask.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task1.getState());
  expectEq(taskrunner.TaskState.RUNNING, task2.getState());

  task2.complete();
  expectEq(taskrunner.TaskState.COMPLETED, observerTask.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task2.getState());
};


/**
 * Tests removing an observed task while the observer task is running.
 */
ObserverTaskTest.prototype.removeTaskWhileRunning = function() {
  var task1 = new taskrunner.NullTask();
  var task2 = new taskrunner.NullTask();
  var observerTask = new taskrunner.ObserverTask([task1, task2]);

  observerTask.run();
  task1.run();
  task2.run();

  expectEq(taskrunner.TaskState.RUNNING, observerTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, task1.getState());
  expectEq(taskrunner.TaskState.RUNNING, task2.getState());

  observerTask.stopObservingTask(task2);

  expectEq(taskrunner.TaskState.RUNNING, observerTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, task1.getState());
  expectEq(taskrunner.TaskState.RUNNING, task2.getState());

  task1.complete();

  expectEq(taskrunner.TaskState.COMPLETED, observerTask.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task1.getState());
  expectEq(taskrunner.TaskState.RUNNING, task2.getState());
};


/**
 * Tests removing an observed task while the observer task is running leaving
 * only completed tasks.
 */
ObserverTaskTest.prototype.removeTaskWhileRunningLeavingOnlyCompletedTasks =
    function() {
  var task1 = new taskrunner.NullTask();
  var task2 = new taskrunner.NullTask();
  var observerTask = new taskrunner.ObserverTask([task1, task2]);

  observerTask.run();
  task1.run();
  task2.run();
  task1.complete();

  expectEq(taskrunner.TaskState.RUNNING, observerTask.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task1.getState());
  expectEq(taskrunner.TaskState.RUNNING, task2.getState());

  observerTask.stopObservingTask(task2);

  expectEq(taskrunner.TaskState.COMPLETED, observerTask.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task1.getState());
  expectEq(taskrunner.TaskState.RUNNING, task2.getState());
};


/**
 * Tests not observing duplicate tasks.
 */
ObserverTaskTest.prototype.doesNotObserveDuplicateTasks = function() {
  var task1 = new taskrunner.NullTask();
  var task2 = new taskrunner.NullTask();
  var observerTask = new taskrunner.ObserverTask([task1, task1]);

  expectEq(1, observerTask.getObservedTasks().length);

  observerTask.observeTask(task2);
  observerTask.observeTask(task1);
  observerTask.observeTask(task2);

  expectEq(2, observerTask.getObservedTasks().length);
};


/**
 * Tests operations count and completed operations count with both simple and
 * composite tasks.
 */
ObserverTaskTest.prototype.operationsCount = function() {
  var task1 = new taskrunner.NullTask();
  var task2 = new taskrunner.NullTask();
  var observerTask = new taskrunner.ObserverTask([task1, task2]);

  observerTask.run();
  task1.run();
  task2.run();

  expectEq(2, observerTask.getOperationsCount());
  expectEq(0, observerTask.getCompletedOperationsCount());

  task1.complete();
  expectEq(1, observerTask.getCompletedOperationsCount());

  var task3 = new taskrunner.NullTask();
  var task4 = new taskrunner.NullTask();
  var task5 = new taskrunner.CompositeTask(true, [task3, task4]);
  task5.run();

  observerTask.observeTask(task5);
  expectEq(4, observerTask.getOperationsCount());
  expectEq(1, observerTask.getCompletedOperationsCount());

  task3.complete();
  expectEq(2, observerTask.getCompletedOperationsCount());

  task2.complete();
  task4.complete();
  expectEq(4, observerTask.getCompletedOperationsCount());
  expectEq(taskrunner.TaskState.COMPLETED, observerTask.getState());
};


/**
 * Tests rerunning after error.
 */
ObserverTaskTest.prototype.rerunAfterError = function() {
  var task1 = new taskrunner.NullTask();
  var task2 = new taskrunner.NullTask();
  var observerTask = new taskrunner.ObserverTask([task1, task2], true);

  observerTask.run();
  task1.run();
  task2.run();
  task1.error();

  expectEq(taskrunner.TaskState.ERRORED, observerTask.getState());

  task1.run();
  task1.complete();
  observerTask.run();
  expectEq(taskrunner.TaskState.RUNNING, observerTask.getState());

  task2.complete();
  expectEq(taskrunner.TaskState.COMPLETED, observerTask.getState());
};
