goog.require('goog.testing.MockClock');
goog.require('taskrunner.NullTask');
goog.require('taskrunner.TaskState');
goog.require('taskrunner.TimeoutTask');



/**
 * Tests for TimeoutTask class.
 *
 * @constructor
 */
function TimeoutTaskTest() {
  this.mockClock = new goog.testing.MockClock(true);
}
registerTestSuite(TimeoutTaskTest);


/**
 * Test cleanup.
 */
TimeoutTaskTest.prototype.tearDown = function() {
  this.mockClock.uninstall();
};


/**
 * Tests completing a decorated task within timeout.
 */
TimeoutTaskTest.prototype.completingBeforeTimeout = function() {
  var decoratedTask = new taskrunner.NullTask();
  var timeoutTask = new taskrunner.TimeoutTask(decoratedTask, 1000);

  timeoutTask.run();
  expectEq(taskrunner.TaskState.RUNNING, decoratedTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, timeoutTask.getState());

  this.mockClock.tick(500);

  decoratedTask.complete();
  expectEq(taskrunner.TaskState.COMPLETED, decoratedTask.getState());
  expectEq(taskrunner.TaskState.COMPLETED, timeoutTask.getState());
};


/**
 * Tests erroring a decorated task within timeout.
 */
TimeoutTaskTest.prototype.erroringBeforeTimeout = function() {
  var decoratedTask = new taskrunner.NullTask();
  var timeoutTask = new taskrunner.TimeoutTask(decoratedTask, 1000);

  timeoutTask.run();
  expectEq(taskrunner.TaskState.RUNNING, decoratedTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, timeoutTask.getState());

  this.mockClock.tick(500);

  decoratedTask.error();
  expectEq(taskrunner.TaskState.ERRORED, decoratedTask.getState());
  expectEq(taskrunner.TaskState.ERRORED, timeoutTask.getState());
};


/**
 * Tests not finishing a decorated task within timeout.
 */
TimeoutTaskTest.prototype.finishingAfterTimeout = function() {
  var decoratedTask = new taskrunner.NullTask();
  var timeoutTask = new taskrunner.TimeoutTask(decoratedTask, 1000);

  timeoutTask.run();
  expectEq(taskrunner.TaskState.RUNNING, decoratedTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, timeoutTask.getState());

  this.mockClock.tick(1500);
  expectEq(taskrunner.TaskState.INTERRUPTED, decoratedTask.getState());
  expectEq(taskrunner.TaskState.ERRORED, timeoutTask.getState());
};


/**
 * Tests not finishing a decorated task within timeout after an interruption.
 */
TimeoutTaskTest.prototype.finishingAfterTimeoutAndInterruption = function() {
  var decoratedTask = new taskrunner.NullTask();
  var timeoutTask = new taskrunner.TimeoutTask(decoratedTask, 1000);

  timeoutTask.run();
  expectEq(taskrunner.TaskState.RUNNING, decoratedTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, timeoutTask.getState());

  this.mockClock.tick(500);
  timeoutTask.interrupt();

  timeoutTask.run();
  this.mockClock.tick(500);
  expectEq(taskrunner.TaskState.INTERRUPTED, decoratedTask.getState());
  expectEq(taskrunner.TaskState.ERRORED, timeoutTask.getState());
};


/**
 * Tests completing decorated task during interruption.
 */
TimeoutTaskTest.prototype.completingDecoratedTaskDuringInterruption =
    function() {
  var decoratedTask = new taskrunner.NullTask();
  var timeoutTask = new taskrunner.TimeoutTask(decoratedTask, 1000);

  timeoutTask.run();
  timeoutTask.interrupt();
  expectEq(taskrunner.TaskState.INTERRUPTED, decoratedTask.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, timeoutTask.getState());

  // Completing the decorated task while the timeout task in interrupted.
  decoratedTask.run();
  decoratedTask.complete();
  expectEq(taskrunner.TaskState.COMPLETED, decoratedTask.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, timeoutTask.getState());

  // Timeout task should auto complete upon rerun.
  timeoutTask.run();
  expectEq(taskrunner.TaskState.COMPLETED, decoratedTask.getState());
  expectEq(taskrunner.TaskState.COMPLETED, timeoutTask.getState());
};
