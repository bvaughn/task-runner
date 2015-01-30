goog.provide('goog.TimeoutTask.test');
goog.setTestOnly('goog.TimeoutTask.test');

goog.require('goog.testing.MockClock');
goog.require('taskrunner.NullTask');
goog.require('taskrunner.TaskState');
goog.require('taskrunner.TimeoutTask');

describe('goog.TimeoutTask', function() {

  var mockClock;
  
  beforeEach(function() {
    mockClock = new goog.testing.MockClock(true);
  });
  
  afterEach(function() {
    mockClock.uninstall();
  });

  it('should complete if decorated task completes within timeout', function() {
    var decoratedTask = new taskrunner.NullTask();
    var timeoutTask = new taskrunner.TimeoutTask(decoratedTask, 1000);

    timeoutTask.run();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(timeoutTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    mockClock.tick(500);

    decoratedTask.complete();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(timeoutTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should error if decorated task errors within timeout', function() {
    var decoratedTask = new taskrunner.NullTask();
    var timeoutTask = new taskrunner.TimeoutTask(decoratedTask, 1000);

    timeoutTask.run();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(timeoutTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    mockClock.tick(500);

    decoratedTask.error();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(timeoutTask.getState()).toBe(taskrunner.TaskState.ERRORED);
  });

  it('should error if decorated task does not complete within timeout', function() {
    var decoratedTask = new taskrunner.NullTask();
    var timeoutTask = new taskrunner.TimeoutTask(decoratedTask, 1000);

    timeoutTask.run();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(timeoutTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    mockClock.tick(1500);
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(timeoutTask.getState()).toBe(taskrunner.TaskState.ERRORED);
  });

  it('should not error if timeout is exceeded after wrapper task is interrupted', function() {
    var decoratedTask = new taskrunner.NullTask();
    var timeoutTask = new taskrunner.TimeoutTask(decoratedTask, 1000);

    timeoutTask.run();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(timeoutTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    mockClock.tick(500);
    timeoutTask.interrupt();

    timeoutTask.run();
    mockClock.tick(500);
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(timeoutTask.getState()).toBe(taskrunner.TaskState.ERRORED);
  });

  it('should not complete if a decorated task completes while wrapper task is interrupted', function() {
    var decoratedTask = new taskrunner.NullTask();
    var timeoutTask = new taskrunner.TimeoutTask(decoratedTask, 1000);

    timeoutTask.run();
    timeoutTask.interrupt();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(timeoutTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);

    // Completing the decorated task while the timeout task in interrupted.
    decoratedTask.run();
    decoratedTask.complete();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(timeoutTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);

    // Timeout task should auto complete upon rerun.
    timeoutTask.run();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(timeoutTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });
});