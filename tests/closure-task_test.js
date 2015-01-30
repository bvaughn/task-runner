goog.provide('goog.ClosureTask.test');
goog.setTestOnly('goog.ClosureTask.test');

goog.require('taskrunner.ClosureTask');
goog.require('taskrunner.TaskState');

describe('goog.ClosureTask', function() {

  it('should auto completing upon running when enabled', function() {
    var method = jasmine.createSpy();

    var task = new taskrunner.ClosureTask(method, true);
    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(method).toHaveBeenCalled();
    expect(method.calls.count()).toEqual(1);
  });

  it('should not auto completing upon running when disabled', function() {
    var method = jasmine.createSpy();

    var task = new taskrunner.ClosureTask(method, false);
    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(method).toHaveBeenCalled();
    expect(method.calls.count()).toEqual(1);

    task.complete();
    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should error if wrapped function throws an error', function() {
    var error = new Error('test');

    var method = function() {
      throw error;
    };

    var task = new taskrunner.ClosureTask(method, true);
    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(task.getData()).toBe(error);
    expect(task.getErrorMessage()).toBe('test');
  });

  it('should rerun wrapped function if reset and rerun', function() {
    var method = jasmine.createSpy();

    var task = new taskrunner.ClosureTask(method);
    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(method).toHaveBeenCalled();
    expect(method.calls.count()).toEqual(1);

    task.complete();

    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);

    task.reset();

    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(method.calls.count()).toEqual(2);
  });
});