goog.require('goog.testing.MockClock');
goog.require('taskrunner.NullTask');
goog.require('taskrunner.RetryOnErrorTask');
goog.require('taskrunner.TaskState');



/**
 * Tests for RetryOnErrorTask class.
 *
 * @constructor
 */
function RetryOnErrorTaskTest() {
  this.mockClock = new goog.testing.MockClock(true);
}
registerTestSuite(RetryOnErrorTaskTest);


/**
 * Test cleanup.
 */
RetryOnErrorTaskTest.prototype.tearDown = function() {
  this.mockClock.uninstall();
};


/**
 * Tests synchronously retrying on error.
 */
RetryOnErrorTaskTest.prototype.synchronouslyRetryOnError = function() {
  var decoratedTask = new taskrunner.NullTask();
  var retryOnErrorTask = new taskrunner.RetryOnErrorTask(decoratedTask, 3, -1);

  retryOnErrorTask.run();
  expectEq(taskrunner.TaskState.RUNNING, decoratedTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, retryOnErrorTask.getState());

  // 1st retry
  decoratedTask.error();
  expectEq(taskrunner.TaskState.RUNNING, decoratedTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, retryOnErrorTask.getState());

  // 2nd retry
  decoratedTask.error();
  expectEq(taskrunner.TaskState.RUNNING, decoratedTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, retryOnErrorTask.getState());

  // 3rd retry
  decoratedTask.error();
  expectEq(taskrunner.TaskState.RUNNING, decoratedTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, retryOnErrorTask.getState());

  // Error
  decoratedTask.error();
  expectEq(taskrunner.TaskState.ERRORED, decoratedTask.getState());
  expectEq(taskrunner.TaskState.ERRORED, retryOnErrorTask.getState());
};


/**
 * Tests asynchronously retrying on error.
 */
RetryOnErrorTaskTest.prototype.asynchronouslyRetryOnError = function() {
  var decoratedTask = new taskrunner.NullTask();
  var retryOnErrorTask = new taskrunner.RetryOnErrorTask(decoratedTask, 2, 10);

  retryOnErrorTask.run();
  expectEq(taskrunner.TaskState.RUNNING, decoratedTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, retryOnErrorTask.getState());

  // 1st retry
  decoratedTask.error();
  expectEq(taskrunner.TaskState.ERRORED, decoratedTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, retryOnErrorTask.getState());
  this.mockClock.tick(5);
  expectEq(taskrunner.TaskState.ERRORED, decoratedTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, retryOnErrorTask.getState());
  this.mockClock.tick(5);
  expectEq(taskrunner.TaskState.RUNNING, decoratedTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, retryOnErrorTask.getState());

  // 2nd retry
  decoratedTask.error();
  expectEq(taskrunner.TaskState.ERRORED, decoratedTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, retryOnErrorTask.getState());
  this.mockClock.tick(10);
  expectEq(taskrunner.TaskState.RUNNING, decoratedTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, retryOnErrorTask.getState());

  // Complete
  decoratedTask.complete();
  expectEq(taskrunner.TaskState.COMPLETED, decoratedTask.getState());
  expectEq(taskrunner.TaskState.COMPLETED, retryOnErrorTask.getState());
};


/**
 * Tests that interruption should reset the number of retries.
 */
RetryOnErrorTaskTest.prototype.interruptionResetRetries = function() {
  var decoratedTask = new taskrunner.NullTask();
  var retryOnErrorTask = new taskrunner.RetryOnErrorTask(decoratedTask, 1, -1);

  retryOnErrorTask.run();
  expectEq(taskrunner.TaskState.RUNNING, decoratedTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, retryOnErrorTask.getState());

  decoratedTask.error();
  expectEq(1, retryOnErrorTask.getRetries());
  expectEq(taskrunner.TaskState.RUNNING, decoratedTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, retryOnErrorTask.getState());

  retryOnErrorTask.interrupt();
  expectEq(0, retryOnErrorTask.getRetries());
  expectEq(taskrunner.TaskState.INTERRUPTED, decoratedTask.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, retryOnErrorTask.getState());
};


/**
 * Tests completing decorated task during interruption.
 */
RetryOnErrorTaskTest.prototype.completingDecoratedTaskDuringInterruption =
    function() {
  var decoratedTask = new taskrunner.NullTask();
  var retryOnErrorTask = new taskrunner.RetryOnErrorTask(decoratedTask, 1, -1);

  retryOnErrorTask.run();
  retryOnErrorTask.interrupt();
  expectEq(taskrunner.TaskState.INTERRUPTED, decoratedTask.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, retryOnErrorTask.getState());

  // Completing the decorated task while the retry task in interrupted.
  decoratedTask.run();
  decoratedTask.complete();
  expectEq(taskrunner.TaskState.COMPLETED, decoratedTask.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, retryOnErrorTask.getState());

  // Retry task should auto complete upon rerun.
  retryOnErrorTask.run();
  expectEq(taskrunner.TaskState.COMPLETED, decoratedTask.getState());
  expectEq(taskrunner.TaskState.COMPLETED, retryOnErrorTask.getState());
};
