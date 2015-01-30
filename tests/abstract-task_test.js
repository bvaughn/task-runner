goog.provide('goog.AbstractTask.test');
goog.setTestOnly('goog.AbstractTask.test');

goog.require('taskrunner.AbstractTask');
goog.require('taskrunner.NullTask');
goog.require('taskrunner.TaskEvent');
goog.require('taskrunner.TaskState');



describe('goog.AbstractTask', function() {

  it('should report the correct name', function() {
    var fooTask = new taskrunner.AbstractTask('foo');
    var barTask = new taskrunner.AbstractTask('bar');

    expect(fooTask.getTaskName()).toBe('foo');
    expect(barTask.getTaskName()).toBe('bar');
  });

  it('should generate unique ids for each task', function() {
    var task1 = new taskrunner.AbstractTask();
    var task2 = new taskrunner.AbstractTask();

    expect(task1.getUniqueID()).not.toBe(task2.getUniqueID());
  });

  it('should require runImpl method to be implemented', function() {
    var task = new taskrunner.AbstractTask();

    expect(function() {
      task.run();
    }).toThrow();
  });

  it('should error if a task that is not running is told to enter an complete-state', function() {
    var task = new taskrunner.NullTask();

    expect(function() {
      task.complete();
    }).toThrow();
  });

  it('should error if a task that is not running is told to enter an error-state', function() {
    var task = new taskrunner.NullTask();

    expect(function() {
      task.error();
    }).toThrow();
  });

  it('should call started callback handlers', function() {
    var task = new taskrunner.NullTask();
    var callback1 = jasmine.createSpy();
    var callback2 = jasmine.createSpy();

    task.started(callback1);
    task.started(callback2);
    task.run();

    expect(callback1).toHaveBeenCalledWith(task);
    expect(callback2).toHaveBeenCalledWith(task);
  });

  it('should call completed callback handlers', function() {
    var task = new taskrunner.NullTask();
    var callback1 = jasmine.createSpy();
    var callback2 = jasmine.createSpy();
    var data = {};

    task.completed(callback1);
    task.completed(callback2);
    task.run();
    task.complete(data);

    expect(callback1).toHaveBeenCalledWith(task);
    expect(callback2).toHaveBeenCalledWith(task);
  });

  it('should call errored callback handlers', function() {
    var task = new taskrunner.NullTask();
    var callback1 = jasmine.createSpy();
    var callback2 = jasmine.createSpy();
    var data = {};
    var message = 'foobar';

    task.errored(callback1);
    task.errored(callback2);
    task.run();
    task.error(data, message);

    expect(callback1).toHaveBeenCalledWith(task);
    expect(callback2).toHaveBeenCalledWith(task);
  });

  it('should call final callback handlers', function() {
    var task = new taskrunner.NullTask();
    var callback1 = jasmine.createSpy();
    var callback2 = jasmine.createSpy();

    task.final(callback1);
    task.final(callback2);
    task.run();
    task.complete();

    expect(callback1).toHaveBeenCalledWith(task);
    expect(callback2).toHaveBeenCalledWith(task);
  });

  it('should trigger callbacks with the correct scope if one is provided', function() {
    var task = new taskrunner.NullTask();
    task.run();

    var scope = {};
    var calledWithScope;

    var callback = function() {
      calledWithScope = this;
    };

    task.on(taskrunner.TaskEvent.COMPLETED, callback, scope);
    task.complete();

    expect(calledWithScope).toBe(scope);
  });

  it('should allow callbacks to be removed', function() {
    var task = new taskrunner.NullTask();
    task.run();

    var callback = jasmine.createSpy();
    var scope = {};
    task.on(taskrunner.TaskEvent.COMPLETED, callback, scope);

    task.off(taskrunner.TaskEvent.COMPLETED, callback); // missing scope
    task.complete();

    expect(callback).toHaveBeenCalledWith(task);
    expect(callback.calls.count()).toEqual(1);

    task.reset();
    task.run();

    task.off(taskrunner.TaskEvent.COMPLETED, callback, scope);
    task.complete();
    
    expect(callback.calls.count()).toEqual(1);
  });

  it('should not trigger a duplicate callback multiple times per state-change', function() {
    var task = new taskrunner.NullTask();
    var startCallback = jasmine.createSpy();
    var errorCallback = jasmine.createSpy();
    var completeCallback = jasmine.createSpy();
    var finalCallback = jasmine.createSpy();

    task.started(startCallback).
         started(startCallback).
         errored(errorCallback).
         errored(errorCallback).
         errored(errorCallback).
         completed(completeCallback).
         completed(completeCallback).
         final(finalCallback).
         final(finalCallback).
         final(finalCallback);

    task.run();

    expect(startCallback).toHaveBeenCalledWith(task);
    expect(startCallback.calls.count()).toEqual(1);

    task.error();

    expect(errorCallback).toHaveBeenCalledWith(task);
    expect(errorCallback.calls.count()).toEqual(1);
    expect(finalCallback).toHaveBeenCalledWith(task);
    expect(finalCallback.calls.count()).toEqual(1);

    task.reset();
    task.run();

    expect(startCallback).toHaveBeenCalledWith(task);
    expect(startCallback.calls.count()).toEqual(2);

    task.complete();

    expect(completeCallback).toHaveBeenCalledWith(task);
    expect(completeCallback.calls.count()).toEqual(1);
    expect(finalCallback).toHaveBeenCalledWith(task);
    expect(finalCallback.calls.count()).toEqual(2);
  });

  it('should enable a callback to be registered multiple times with unique scopes', function() {
    var callback = jasmine.createSpy();
    var scope1 = {};
    var scope2 = {};
    
    var task = new taskrunner.NullTask();
    task.run();
    task.final(callback, scope1).
         final(callback, scope2);
    task.complete();

    expect(callback).toHaveBeenCalledWith(task);
    expect(callback.calls.count()).toEqual(2);
  });

  it('should update completed operations count when a task is completed', function() {
    var task = new taskrunner.NullTask();
    expect(task.getOperationsCount()).toBe(1);
    expect(task.getCompletedOperationsCount()).toBe(0);

    task.run();
    task.complete();

    expect(task.getOperationsCount()).toBe(1);
    expect(task.getCompletedOperationsCount()).toBe(1);
  });

  it('should reset task state to initialized when a completed task is reset', function() {
    var task = new taskrunner.NullTask();
    var data = {};
    expect(task.getState()).toBe(taskrunner.TaskState.INITIALIZED);

    task.run();
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.complete(data);
    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getData()).toBe(data);

    task.reset();
    expect(task.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(task.getData()).toBeUndefined();
  });

  it('should reset task state to initialized when an errored task is reset', function() {
    var task = new taskrunner.NullTask();
    var data = {};
    var message = 'foobar';
    expect(task.getState()).toBe(taskrunner.TaskState.INITIALIZED);

    task.run();
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.error(data, message);
    expect(task.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(task.getData()).toBe(data);
    expect(task.getErrorMessage()).toBe(message);

    task.reset();
    expect(task.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(task.getData()).toBeUndefined();
    expect(task.getErrorMessage()).toBeUndefined();
  });

  it('should not allow a running task to be reset', function() {
    var task = new taskrunner.NullTask();
    task.run();

    expect(function() {
      task.reset();
    }).toThrow();
  });

  it('should not allow a running task to be run again', function() {
    var task = new taskrunner.NullTask();
    task.run();

    expect(function() {
      task.run();
    }).toThrow();
  });

  it('should allow a completed task to be reset and rerun', function() {
    var task = new taskrunner.NullTask();
    var data = {};

    task.run();
    task.complete(data);
    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getData()).toBe(data);

    task.reset();
    expect(task.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(task.getData()).toBeUndefined();

    task.run();
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);
  });

  it('should allow an errored task to be reset and rerun', function() {
    var task = new taskrunner.NullTask();
    var data = {};
    var message = 'foobar';

    task.run();
    task.error(data, message);
    expect(task.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(task.getData()).toBe(data);
    expect(task.getErrorMessage()).toBe(message);

    task.reset();
    expect(task.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(task.getData()).toBeUndefined();

    task.run();
    expect(taskrunner.TaskState.RUNNING, task.getState());
    expect(task.getData()).toBeUndefined();
    expect(task.getErrorMessage()).toBeUndefined();

    task.complete(data);
    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getData()).toBe(data);
  });

  it('should only allow running tasks to be interrupted', function() {
    var task = new taskrunner.NullTask();

    expect(function() {
      task.interrupt();
    }).toThrow();
  });

  it('should allow running tasks to be interrupted', function() {
    var task = new taskrunner.NullTask();
    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.interrupt();

    expect(task.getState()).toBe(taskrunner.TaskState.INTERRUPTED);

    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);
  });

  it('should invoke interrupted callbacks when a task is interrupted', function() {
    var task = new taskrunner.NullTask();
    task.run();

    var callback1 = jasmine.createSpy();
    var callback2 = jasmine.createSpy();

    task.interrupted(callback1);
    task.interrupted(callback2);
    task.interrupt();

    expect(callback1).toHaveBeenCalledWith(task);
    expect(callback2).toHaveBeenCalledWith(task);
  });

  it('should only trigger callbacks that are added and not removed', function() {
    var task = new taskrunner.NullTask();

    var callback1 = jasmine.createSpy();
    var callback2 = jasmine.createSpy();

    task.started(callback1, task);
    task.started(callback2, task);

    task.off(taskrunner.TaskEvent.STARTED, callback1, task);
    task.run();

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledWith(task);
  });

  it('should only trigger a callback once even if added multiple times', function() {
    var task = new taskrunner.NullTask();

    var callback = jasmine.createSpy();

    task.started(callback, task);
    task.started(callback, task);

    task.run();

    expect(callback).toHaveBeenCalledWith(task);
    expect(callback.calls.count()).toEqual(1);
  });

  it('should resume after an interrupting task completes', function() {
    var task = new taskrunner.NullTask();
    task.run();

    var interruptingTask = new taskrunner.NullTask();
    interruptingTask.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.interruptForTask(interruptingTask);

    expect(task.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(interruptingTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    interruptingTask.complete();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(interruptingTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should error after an interrupting task errors', function() {
    var task = new taskrunner.NullTask();
    task.run();

    var interruptingTask = new taskrunner.NullTask();
    interruptingTask.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.interruptForTask(interruptingTask);

    expect(task.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(interruptingTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    interruptingTask.error();

    expect(task.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(interruptingTask.getState()).toBe(taskrunner.TaskState.ERRORED);
  });

  it('should be manually re-startable after being interrupted by another task', function() {
    var task = new taskrunner.NullTask();
    task.run();

    var interruptingTask = new taskrunner.NullTask();
    interruptingTask.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.interruptForTask(interruptingTask);

    expect(task.getState()).toBe(taskrunner.TaskState.INTERRUPTED);

    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    // This should be ignored now that the task has been manually restarted
    interruptingTask.complete();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);
  });

  it('should not try to run its interrupted task', function() {
    var task = new taskrunner.NullTask();
    task.run();

    var interruptingTask = new taskrunner.NullTask();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.interruptForTask(interruptingTask);

    expect(task.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(interruptingTask.getState()).toBe(taskrunner.TaskState.INITIALIZED);

    interruptingTask.run();
    interruptingTask.complete();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);
  });
});