goog.provide('goog.WaitTask.test');
goog.setTestOnly('goog.WaitTask.test');

goog.require('goog.testing.MockClock');
goog.require('taskrunner.TaskState');
goog.require('taskrunner.WaitTask');

describe('goog.WaitTask', function() {

  var mockClock;
  
  beforeEach(function() {
    mockClock = new goog.testing.MockClock(true);
  });
  
  afterEach(function() {
    mockClock.uninstall();
  });

  it('should complete after the appropriate amount of time ellapses', function() {
    var waitTask = new taskrunner.WaitTask(1000);

    waitTask.run();
    expect(waitTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    mockClock.tick(500);
    expect(waitTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    mockClock.tick(500);
    expect(waitTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should resume timer after an interruption', function() {
    var waitTask = new taskrunner.WaitTask(1000, false);

    waitTask.run();
    expect(waitTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    mockClock.tick(500);
    waitTask.interrupt();

    waitTask.run();
    mockClock.tick(500);
    expect(waitTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should reset timer after interruption', function() {
    var waitTask = new taskrunner.WaitTask(1000, true);

    waitTask.run();
    expect(waitTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    mockClock.tick(500);
    waitTask.interrupt();

    waitTask.run();
    mockClock.tick(500);
    expect(waitTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    mockClock.tick(500);
    expect(waitTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });
});