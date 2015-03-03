describe('tr.Abstract', function() {

  it('should report the correct name', function() {
    var fooTask = new tr.Abstract('foo');
    var barTask = new tr.Abstract('bar');

    expect(fooTask.getName()).toBe('foo');
    expect(barTask.getName()).toBe('bar');
  });

  it('should generate unique ids for each task', function() {
    var task1 = new tr.Abstract();
    var task2 = new tr.Abstract();

    expect(task1.getUniqueID()).not.toBe(task2.getUniqueID());
  });

  it('should require runImpl method to be implemented', function() {
    var task = new tr.Abstract();

    expect(function() {
      task.run();
    }).toThrow();
  });

  it('should error if a task that is not running is told to enter an complete-state', function() {
    var task = new tr.Stub();

    expect(function() {
      task.complete();
    }).toThrow();
  });

  it('should error if a task that is not running is told to enter an error-state', function() {
    var task = new tr.Stub();

    expect(function() {
      task.error();
    }).toThrow();
  });

  it('should call started callback handlers', function() {
    var task = new tr.Stub();
    var callback1 = jasmine.createSpy();
    var callback2 = jasmine.createSpy();

    task.started(callback1);
    task.started(callback2);
    task.run();

    expect(callback1).toHaveBeenCalledWith(task);
    expect(callback2).toHaveBeenCalledWith(task);
  });

  it('should call completed callback handlers', function() {
    var task = new tr.Stub();
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
    var task = new tr.Stub();
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
    var task = new tr.Stub();
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
    var task = new tr.Stub();
    task.run();

    var scope = {};
    var calledWithScope;

    var callback = function() {
      calledWithScope = this;
    };

    task.on(tr.enums.Event.COMPLETED, callback, scope);
    task.complete();

    expect(calledWithScope).toBe(scope);
  });

  it('should allow callbacks to be removed', function() {
    var task = new tr.Stub();
    task.run();

    var callback = jasmine.createSpy();
    var scope = {};
    task.on(tr.enums.Event.COMPLETED, callback, scope);

    task.off(tr.enums.Event.COMPLETED, callback); // missing scope
    task.complete();

    expect(callback).toHaveBeenCalledWith(task);
    expect(callback.calls.count()).toEqual(1);

    task.reset();
    task.run();

    task.off(tr.enums.Event.COMPLETED, callback, scope);
    task.complete();
    
    expect(callback.calls.count()).toEqual(1);
  });

  it('should not trigger a duplicate callback multiple times per state-change', function() {
    var task = new tr.Stub();
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
    
    var task = new tr.Stub();
    task.run();
    task.final(callback, scope1).
         final(callback, scope2);
    task.complete();

    expect(callback).toHaveBeenCalledWith(task);
    expect(callback.calls.count()).toEqual(2);
  });

  it('should update completed operations count when a task is completed', function() {
    var task = new tr.Stub();
    expect(task.getOperationsCount()).toBe(1);
    expect(task.getCompletedOperationsCount()).toBe(0);

    task.run();
    task.complete();

    expect(task.getOperationsCount()).toBe(1);
    expect(task.getCompletedOperationsCount()).toBe(1);
  });

  it('should reset task state to initialized when a completed task is reset', function() {
    var task = new tr.Stub();
    var data = {};
    expect(task.getState()).toBe(tr.enums.State.INITIALIZED);

    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.complete(data);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getData()).toBe(data);

    task.reset();
    expect(task.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getData()).toBeUndefined();
  });

  it('should reset task state to initialized when an errored task is reset', function() {
    var task = new tr.Stub();
    var data = {};
    var message = 'foobar';
    expect(task.getState()).toBe(tr.enums.State.INITIALIZED);

    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.error(data, message);
    expect(task.getState()).toBe(tr.enums.State.ERRORED);
    expect(task.getData()).toBe(data);
    expect(task.getErrorMessage()).toBe(message);

    task.reset();
    expect(task.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getData()).toBeUndefined();
    expect(task.getErrorMessage()).toBeUndefined();
  });

  it('should not allow a running task to be reset', function() {
    var task = new tr.Stub();
    task.run();

    expect(function() {
      task.reset();
    }).toThrow();
  });

  it('should not allow a running task to be run again', function() {
    var task = new tr.Stub();
    task.run();

    expect(function() {
      task.run();
    }).toThrow();
  });

  it('should allow a completed task to be reset and rerun', function() {
    var task = new tr.Stub();
    var data = {};

    task.run();
    task.complete(data);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getData()).toBe(data);

    task.reset();
    expect(task.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getData()).toBeUndefined();

    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should allow an errored task to be reset and rerun', function() {
    var task = new tr.Stub();
    var data = {};
    var message = 'foobar';

    task.run();
    task.error(data, message);
    expect(task.getState()).toBe(tr.enums.State.ERRORED);
    expect(task.getData()).toBe(data);
    expect(task.getErrorMessage()).toBe(message);

    task.reset();
    expect(task.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getData()).toBeUndefined();

    task.run();
    expect(tr.enums.State.RUNNING, task.getState());
    expect(task.getData()).toBeUndefined();
    expect(task.getErrorMessage()).toBeUndefined();

    task.complete(data);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getData()).toBe(data);
  });

  it('should only allow running tasks to be interrupted', function() {
    var task = new tr.Stub();

    expect(function() {
      task.interrupt();
    }).toThrow();
  });

  it('should allow running tasks to be interrupted', function() {
    var task = new tr.Stub();
    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.interrupt();

    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);

    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should invoke interrupted callbacks when a task is interrupted', function() {
    var task = new tr.Stub();
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
    var task = new tr.Stub();

    var callback1 = jasmine.createSpy();
    var callback2 = jasmine.createSpy();

    task.started(callback1, task);
    task.started(callback2, task);

    task.off(tr.enums.Event.STARTED, callback1, task);
    task.run();

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledWith(task);
  });

  it('should only trigger a callback once even if added multiple times', function() {
    var task = new tr.Stub();

    var callback = jasmine.createSpy();

    task.started(callback, task);
    task.started(callback, task);

    task.run();

    expect(callback).toHaveBeenCalledWith(task);
    expect(callback.calls.count()).toEqual(1);
  });

  it('should resume after an interrupting task completes', function() {
    var task = new tr.Stub();
    task.run();

    var interruptingTask = new tr.Stub();
    interruptingTask.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.interruptFor(interruptingTask);

    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(interruptingTask.getState()).toBe(tr.enums.State.RUNNING);

    interruptingTask.complete();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);
    expect(interruptingTask.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should error after an interrupting task errors', function() {
    var task = new tr.Stub();
    task.run();

    var interruptingTask = new tr.Stub();
    interruptingTask.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.interruptFor(interruptingTask);

    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(interruptingTask.getState()).toBe(tr.enums.State.RUNNING);

    interruptingTask.error();

    expect(task.getState()).toBe(tr.enums.State.ERRORED);
    expect(interruptingTask.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should be manually re-startable after being interrupted by another task', function() {
    var task = new tr.Stub();
    task.run();

    var interruptingTask = new tr.Stub();
    interruptingTask.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.interruptFor(interruptingTask);

    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);

    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    // This should be ignored now that the task has been manually restarted
    interruptingTask.complete();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should not try to run its interrupted task', function() {
    var task = new tr.Stub();
    task.run();

    var interruptingTask = new tr.Stub();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.interruptFor(interruptingTask);

    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(interruptingTask.getState()).toBe(tr.enums.State.INITIALIZED);

    interruptingTask.run();
    interruptingTask.complete();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);
  });

  describe('exposes convenience functions for shared state enums', function() {
    it('should return TRUE for isInitialized when getState() === tr.enums.State.INITIALIZED', function() {
      var task = new tr.Stub();
      expect(task.isInitialized()).toBeTruthy();
    });

    it('should return TRUE for isRunning when getState() === tr.enums.State.RUNNING', function() {
      var task = new tr.Stub();
      task.run();
      expect(task.isRunning()).toBeTruthy();
    });

    it('should return TRUE for isInterrupted when getState() === tr.enums.State.INTERRUPTED', function() {
      var task = new tr.Stub();
      task.run();
      task.interrupt();
      expect(task.isInterrupted()).toBeTruthy();
    });

    it('should return TRUE for isCompleted when getState() === tr.enums.State.COMPLETED', function() {
      var task = new tr.Stub();
      task.run();
      task.complete({});
      expect(task.isCompleted()).toBeTruthy();
    });

    it('should return TRUE for isErrored when getState() === tr.enums.State.ERRORED', function() {
      var task = new tr.Stub();
      task.run();
      task.error({});
      expect(task.isErrored()).toBeTruthy();
    });
  });

  describe('log errors for tasks without errored callbacks', function() {
    var mockConsole;
    var originalConsole;
    var originalDEBUG;

    beforeEach(function() {
      originalDEBUG = window.DEBUG;
      window.DEBUG = true;

      originalConsole = window.console;
      window.console = mockConsole = {
        error: jasmine.createSpy(),
        log: jasmine.createSpy()
      };
    });

    afterEach(function() {
      window.console = originalConsole;
      window.DEBUG = originalDEBUG;
    });


    it('should re-throw Error objects', function () {
      new tr.Closure(
        function(task) {
          task.error(new Error('I am an error'));
        }).run();

      expect(mockConsole.error).toHaveBeenCalled();
      expect(mockConsole.error.calls.count()).toEqual(2);
    });

    it('should throw Errors with errorMessage', function () {
      new tr.Closure(
        function(task) {
          task.error(null, "I am an error message");
        }).run();

      expect(mockConsole.error).toHaveBeenCalled();
      expect(mockConsole.error.calls.count()).toEqual(1);
    });

    it('should throw Errors with default error message', function () {
      new tr.Closure(
        function(task) {
          task.error({data: 'Not a real Error'});
        }).run();

      expect(mockConsole.error).toHaveBeenCalled();
      expect(mockConsole.error.calls.count()).toEqual(2);
    });

    it('should not throw Errors when errored callbacks are present', function () {
      new tr.Closure(
        function(task) {
          task.error(new Error('I am an error'));
        }).errored(function() {
          // No-op
        }).run();

      expect(mockConsole.error).not.toHaveBeenCalled();
    });
  });
});