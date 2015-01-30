goog.provide('goog.RetryOnErrorTask.test');
goog.setTestOnly('goog.RetryOnErrorTask.test');

goog.require('goog.testing.MockClock');
goog.require('taskrunner.NullTask');
goog.require('taskrunner.RetryOnErrorTask');
goog.require('taskrunner.TaskState');

describe('goog.RetryOnErrorTask', function() {

  var mockClock;
  
  beforeEach(function() {
    mockClock = new goog.testing.MockClock(true);
  });
  
  afterEach(function() {
    mockClock.uninstall();
  });

  it('should (synchronously) retry in the event of errors when configured to be synchronous', function() {
    var decoratedTask = new taskrunner.NullTask();
    var retryOnErrorTask = new taskrunner.RetryOnErrorTask(decoratedTask, 3, -1);

    retryOnErrorTask.run();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    // 1st retry
    decoratedTask.error();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    // 2nd retry
    decoratedTask.error();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    // 3rd retry
    decoratedTask.error();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    // Error
    decoratedTask.error();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.ERRORED);
  });

  it('should (asynchronously) retry in the event of errors when configured to be asynchronous', function() {
    var decoratedTask = new taskrunner.NullTask();
    var retryOnErrorTask = new taskrunner.RetryOnErrorTask(decoratedTask, 2, 10);

    retryOnErrorTask.run();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    // 1st retry
    decoratedTask.error();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    mockClock.tick(5);
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    mockClock.tick(5);
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    // 2nd retry
    decoratedTask.error();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    mockClock.tick(10);
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    // Complete
    decoratedTask.complete();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should reset retry count on interruption', function() {
    var decoratedTask = new taskrunner.NullTask();
    var retryOnErrorTask = new taskrunner.RetryOnErrorTask(decoratedTask, 1, -1);

    retryOnErrorTask.run();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    decoratedTask.error();
    expect(retryOnErrorTask.getRetries()).toBe(1);
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    retryOnErrorTask.interrupt();
    expect(retryOnErrorTask.getRetries()).toBe(0);
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
  });

  it('should not complete if decorated task completes while retry task is interrupted', function() {
    var decoratedTask = new taskrunner.NullTask();
    var retryOnErrorTask = new taskrunner.RetryOnErrorTask(decoratedTask, 1, -1);

    retryOnErrorTask.run();
    retryOnErrorTask.interrupt();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);

    // Completing the decorated task while the retry task in interrupted.
    decoratedTask.run();
    decoratedTask.complete();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);

    // Retry task should auto complete upon rerun.
    retryOnErrorTask.run();
    expect(decoratedTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(retryOnErrorTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });
});