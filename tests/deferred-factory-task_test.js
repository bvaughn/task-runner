goog.provide('goog.DeferredFactoryTask.test');
goog.setTestOnly('goog.DeferredFactoryTask.test');

goog.require('taskrunner.DeferredFactoryTask');
goog.require('taskrunner.NullTask');
goog.require('taskrunner.TaskState');

describe('goog.DeferredFactoryTask', function() {

  var stubTask;
  var method;

  beforeEach(function() {
    stubTask = new taskrunner.NullTask();

    method = jasmine.createSpy();
    method.and.returnValue(stubTask);
  });

  it('should work without any arguments or scope', function() {
    var deferredFactoryTask = new taskrunner.DeferredFactoryTask(method);

    expect(deferredFactoryTask.getDecoratedTask()).toBeNull();

    deferredFactoryTask.run();

    expect(deferredFactoryTask.getDecoratedTask()).not.toBeNull();
  });

  it('should work with arguments and scope', function() {
    var deferredFactoryTask = new taskrunner.DeferredFactoryTask(method, {}, [1, 2, 3]);

    expect(deferredFactoryTask.getDecoratedTask()).toBeNull();

    deferredFactoryTask.run();

    expect(method).toHaveBeenCalled();
    expect(method.calls.argsFor(0)).toEqual([1, 2, 3]);
    expect(deferredFactoryTask.getDecoratedTask()).not.toBeNull();
  });

  it('should complete when deferred task completes it', function() {
    var deferredFactoryTask = new taskrunner.DeferredFactoryTask(method);

    deferredFactoryTask.run();

    expect(deferredFactoryTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(stubTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    stubTask.complete();

    expect(stubTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(deferredFactoryTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should error when deferred task errors it', function() {
    var deferredFactoryTask = new taskrunner.DeferredFactoryTask(method);

    deferredFactoryTask.run();

    expect(deferredFactoryTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(stubTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    stubTask.error();

    expect(stubTask.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(deferredFactoryTask.getState()).toBe(taskrunner.TaskState.ERRORED);
  });

  it('should clear the deferred task on reset', function() {
    var deferredFactoryTask = new taskrunner.DeferredFactoryTask(method);
    deferredFactoryTask.run();

    expect(deferredFactoryTask.getDecoratedTask()).not.toBeNull();

    deferredFactoryTask.interrupt();
    deferredFactoryTask.reset();

    expect(deferredFactoryTask.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(deferredFactoryTask.getDecoratedTask()).toBeNull();
  });

  it('should recreate the deferred task after an error if enabled', function() {
    var deferredFactoryTask = new taskrunner.DeferredFactoryTask(method);
    deferredFactoryTask.recreateDeferredTaskAfterError(true);

    deferredFactoryTask.run();

    expect(method.calls.count()).toEqual(1);

    stubTask.error();

    expect(deferredFactoryTask.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(stubTask.getState()).toBe(taskrunner.TaskState.ERRORED);

    deferredFactoryTask.run();

    expect(method.calls.count()).toEqual(2);
  });

  it('should not recreate the deferred task after an error if disabled', function() {
    var deferredFactoryTask = new taskrunner.DeferredFactoryTask(method);
    deferredFactoryTask.recreateDeferredTaskAfterError(false);

    deferredFactoryTask.run();

    expect(method.calls.count()).toEqual(1);

    stubTask.error();

    expect(deferredFactoryTask.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(stubTask.getState()).toBe(taskrunner.TaskState.ERRORED);

    deferredFactoryTask.run();

    expect(method.calls.count()).toEqual(1);
  });

  it('should not complete if deferred task completes while wrapper is interrupted', function() {
    var deferredFactoryTask = new taskrunner.DeferredFactoryTask(method);
    deferredFactoryTask.recreateDeferredTaskAfterError(false);

    deferredFactoryTask.run();
    deferredFactoryTask.interrupt();

    expect(deferredFactoryTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(stubTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);

    // Completing the deferred task while the factory task task in interrupted.
    stubTask.run();
    stubTask.complete();
    
    expect(stubTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(deferredFactoryTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);

    // Factory task should auto complete upon rerun.
    deferredFactoryTask.run();
    
    expect(stubTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(deferredFactoryTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });
});