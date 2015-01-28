goog.require('goog.testing.MockClock');
goog.require('taskrunner.TaskState');
goog.require('taskrunner.WaitTask');



/**
 * Tests for WaitTask class.
 *
 * @constructor
 */
function WaitTaskTest() {
  this.mockClock = new goog.testing.MockClock(true);
}
registerTestSuite(WaitTaskTest);


/**
 * Test cleanup.
 */
WaitTaskTest.prototype.tearDown = function() {
  this.mockClock.uninstall();
};


/**
 * Tests completing a wait task after timeout.
 */
WaitTaskTest.prototype.completingAfterTimeout = function() {
  var waitTask = new taskrunner.WaitTask(1000);

  waitTask.run();
  expectEq(taskrunner.TaskState.RUNNING, waitTask.getState());

  this.mockClock.tick(500);
  expectEq(taskrunner.TaskState.RUNNING, waitTask.getState());

  this.mockClock.tick(500);
  expectEq(taskrunner.TaskState.COMPLETED, waitTask.getState());
};


/**
 * Tests resume the timer after interruption.
 */
WaitTaskTest.prototype.resumeTimerAfterInterruption = function() {
  var waitTask = new taskrunner.WaitTask(1000, false);

  waitTask.run();
  expectEq(taskrunner.TaskState.RUNNING, waitTask.getState());

  this.mockClock.tick(500);
  waitTask.interrupt();

  waitTask.run();
  this.mockClock.tick(500);
  expectEq(taskrunner.TaskState.COMPLETED, waitTask.getState());
};


/**
 * Tests reset the timer after interruption.
 */
WaitTaskTest.prototype.resetTimerAfterInterruption = function() {
  var waitTask = new taskrunner.WaitTask(1000, true);

  waitTask.run();
  expectEq(taskrunner.TaskState.RUNNING, waitTask.getState());

  this.mockClock.tick(500);
  waitTask.interrupt();

  waitTask.run();
  this.mockClock.tick(500);
  expectEq(taskrunner.TaskState.RUNNING, waitTask.getState());

  this.mockClock.tick(500);
  expectEq(taskrunner.TaskState.COMPLETED, waitTask.getState());
};
