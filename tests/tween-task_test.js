goog.require('goog.testing.MockClock');
goog.require('goog.testing.recordFunction');
goog.require('taskrunner.MockAnimationFrame');
goog.require('taskrunner.TaskState');
goog.require('taskrunner.TweenTask');



/**
 * Tests for TweenTask class.
 *
 * @constructor
 */
function TweenTaskTest() {
  this.mockClock = new goog.testing.MockClock(true);
  this.mockClock.install();

  this.mockAnimationFrame = new taskrunner.MockAnimationFrame();
  this.mockAnimationFrame.install();
}
registerTestSuite(TweenTaskTest);


/**
 * Helper function updates system time and calls an animation frame.
 *
 * @param {!number} elapsedTime
 * @param {number=} id
 * @private
 */
TweenTaskTest.prototype.callAfter_ = function(elapsedTime, id) {
  this.mockClock.tick(elapsedTime);

  if (id) {
    this.mockAnimationFrame.call(id);
  } else {
    this.mockAnimationFrame.callMostRecent();
  }
};


/**
 * Test built-in linear tween.
 */
TweenTaskTest.prototype.linearEaseCallback = function() {
  var lastValue;
  var callback = goog.testing.recordFunction(function(value) {
    lastValue = value;
  });

  var task = new taskrunner.TweenTask(callback, 100);
  task.run();
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  this.callAfter_(50);
  expectEq(1, callback.getCallCount());
  expectEq(.5, lastValue);
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  this.callAfter_(50);
  expectEq(2, callback.getCallCount());
  expectEq(1, lastValue);
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Test custom easing function.
 */
TweenTaskTest.prototype.customEaseCallback = function() {
  var lastValue;
  var easing = function(value) {
    return value / 2;
  };
  var callback = goog.testing.recordFunction(function(value) {
    lastValue = value;
  });

  var task = new taskrunner.TweenTask(callback, 100, easing);
  task.run();

  this.callAfter_(50);
  expectEq(.25, lastValue);

  this.callAfter_(50);
  expectEq(.5, lastValue);
};


/**
 * Reset tween task.
 */
TweenTaskTest.prototype.resetRestoresInitialState = function() {
  var lastValue;
  var callback = goog.testing.recordFunction(function(value) {
    lastValue = value;
  });

  var task = new taskrunner.TweenTask(callback, 100);
  task.run();
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  this.callAfter_(50);
  expectEq(1, callback.getCallCount());
  expectEq(.5, lastValue);
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.interrupt();
  expectEq(taskrunner.TaskState.INTERRUPTED, task.getState());

  task.reset();
  this.callAfter_(50);
  expectEq(2, callback.getCallCount());
  expectEq(0, lastValue);
  expectEq(taskrunner.TaskState.INITIALIZED, task.getState());
};


/**
 * Interrupting a task when an animation frame is registered cancels the pending
 * animation frame.
 */
TweenTaskTest.prototype.interruptCancelsPendingAnimationFrame = function() {
  var lastValue;
  var callback = goog.testing.recordFunction(function(value) {
    lastValue = value;
  });

  var task = new taskrunner.TweenTask(callback, 100);
  task.run();
  expectEq(taskrunner.TaskState.RUNNING, task.getState());
  expectEq(1, this.mockAnimationFrame.getAnimationFrameCount());

  task.interrupt();
  expectEq(taskrunner.TaskState.INTERRUPTED, task.getState());
  expectEq(0, this.mockAnimationFrame.getAnimationFrameCount());
};


/**
 * Resuming an interrupted animation frame does not cause the tween to exceed
 * its initial duration.
 */
TweenTaskTest.prototype.interruptAndResumeDoesNotExceedDuration = function() {
  var lastValue;
  var callback = goog.testing.recordFunction(function(value) {
    lastValue = value;
  });

  var task = new taskrunner.TweenTask(callback, 100);
  task.run();
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  this.callAfter_(25);
  expectEq(1, callback.getCallCount());
  expectEq(.25, lastValue);
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.interrupt();
  expectEq(taskrunner.TaskState.INTERRUPTED, task.getState());
  expectEq(0, this.mockAnimationFrame.getAnimationFrameCount());

  this.mockClock.tick(25);

  task.run();
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  this.callAfter_(50);
  expectEq(2, callback.getCallCount());
  expectEq(.75, lastValue);
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  this.callAfter_(25);
  expectEq(3, callback.getCallCount());
  expectEq(1, lastValue);
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Animation frames executed after the max-duration has elapsed are not called
 * with a progress greater than 1.
 */
TweenTaskTest.prototype.lastAnimationFrameAfterDuration = function() {
  var lastValue;
  var callback = goog.testing.recordFunction(function(value) {
    lastValue = value;
  });

  var task = new taskrunner.TweenTask(callback, 100);
  task.run();
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  this.callAfter_(150);
  expectEq(1, callback.getCallCount());
  expectEq(1, lastValue);
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Running an interrupted TweenTask while an animation frame is pending cancels
 * the pending frame and schedules a new frame.
 */
TweenTaskTest.prototype.runWhileResetAnimationFramePending = function() {
  var lastValue;
  var callback = goog.testing.recordFunction(function(value) {
    lastValue = value;
  });

  var task = new taskrunner.TweenTask(callback, 100);
  task.run();
  expectEq(taskrunner.TaskState.RUNNING, task.getState());
  expectEq(1, this.mockAnimationFrame.getAnimationFrameCount());

  // interrupt() cancels any pending animation frames.
  task.interrupt();
  expectEq(taskrunner.TaskState.INTERRUPTED, task.getState());
  expectEq(0, this.mockAnimationFrame.getAnimationFrameCount());

  // reset() queues an animation frame for resettings progress to 0.
  task.reset();
  expectEq(taskrunner.TaskState.INITIALIZED, task.getState());
  expectEq(1, this.mockAnimationFrame.getAnimationFrameCount());
  expectEq(0, callback.getCallCount());

  // run() queues a new animation frame and cancels the reset frame.
  task.run();
  expectEq(taskrunner.TaskState.RUNNING, task.getState());
  expectEq(1, this.mockAnimationFrame.getAnimationFrameCount());
  expectEq(0, callback.getCallCount());

  this.callAfter_(50);
  expectEq(taskrunner.TaskState.RUNNING, task.getState());
  expectEq(1, callback.getCallCount());
};
