goog.provide('goog.FailsafeTask.test');
goog.setTestOnly('goog.FailsafeTask.test');

goog.require('taskrunner.NullTask');
goog.require('taskrunner.FailsafeTask');
goog.require('taskrunner.TaskState');

describe('goog.FailsafeTask', function() {

  var nullTask;
  var failsafeTask;
  
  beforeEach(function() {
    nullTask = new taskrunner.NullTask();
    failsafeTask = new taskrunner.FailsafeTask(nullTask);
  });

  it('should implement the taskrunner.DecoratorTask interface', function() {
    expect(failsafeTask.getDecoratedTask()).toBe(nullTask);
  });

  it('should run the decorated task when run', function() {
    expect(failsafeTask.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(nullTask.getState()).toBe(taskrunner.TaskState.INITIALIZED);

    failsafeTask.run();

    expect(failsafeTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask.getState()).toBe(taskrunner.TaskState.RUNNING);
  });

  it('should interrupt the decorated task when interrupt', function() {
    failsafeTask.run();
    failsafeTask.interrupt();

    expect(failsafeTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(nullTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
  });

  it('should reset the decorated task when reset', function() {
    failsafeTask.run();
    failsafeTask.interrupt();
    failsafeTask.reset();

    expect(failsafeTask.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(nullTask.getState()).toBe(taskrunner.TaskState.INITIALIZED);
  });

  it('should complete event when the decorated task errors', function() {
    failsafeTask.run();

    var error = {};
    var errorMessage = 'foobar';

    nullTask.error(error, errorMessage);

    expect(nullTask.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(nullTask.getData()).toBe(error);
    expect(nullTask.getErrorMessage()).toBe(errorMessage);

    expect(failsafeTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should complete when the decorated task completes', function() {
    failsafeTask.run();

    var data = {};

    nullTask.complete(data);

    expect(nullTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask.getData()).toBe(data);

    expect(failsafeTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });
});