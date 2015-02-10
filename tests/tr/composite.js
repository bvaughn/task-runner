goog.provide('tr.Composite.test');
goog.setTestOnly('tr.Composite.test');

goog.require('tr.Composite');
goog.require('tr.Stub');
goog.require('tr.enums.State');

describe('tr.Composite', function() {

  // These mock functions are shared between the test methods below.
  // We attach them to this test rather than the Tasks themselves because the tasks are structs.
  // Use the helper method, attachMockCallbacks(), below to attach callbacks to a particular task.
  var startedCallback;
  var completedCallback;
  var erroredCallback;
  var interruptedCallback;

  beforeEach(function() {
    startedCallback = jasmine.createSpy();
    completedCallback = jasmine.createSpy();
    erroredCallback = jasmine.createSpy();
    interruptedCallback = jasmine.createSpy();
  });

  /**
   * Helper function for attaching task callbacks to be used by later expectations.
   * @private
   */
  var attachMockCallbacks = function(task) {
    task.started(startedCallback);
    task.interrupted(interruptedCallback);
    task.completed(completedCallback);
    task.errored(erroredCallback);

    return task;
  };

  /**
   * Composite sub-class used to expose protected methods for testing.
   * @extends {tr.Composite}
   * @constructor
   * @struct
   */
  tr.TestComposite = function(parallel, opt_tasks) {
    goog.base(this, parallel, opt_tasks);
  };
  goog.inherits(tr.TestComposite, tr.Composite);

  /**
   * Exposes flushQueue() method for testing.
   */
  tr.TestComposite.prototype.flushForTest = function(doNotComplete) {
    this.flushQueue(doNotComplete);
  };

  it('should automatically complete when run with no children', function() {
    var task = new tr.Composite(true);
    task.run();

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should error if a task is added more than once', function() {
    var nullTask1 = new tr.Stub();

    var task = new tr.Composite(false, [nullTask1]);

    expect(function() {
      task.add(nullTask1);
    }).toThrow();
  });

  it('should error if a task that is not within the composite is removed', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Composite(false, [nullTask1]);

    expect(function() {
      task.remove(nullTask2);
    }).toThrow();
  });

  it('should not do anything when a task that has not been run has been reset', function() {
    var nullTask1 = new tr.Stub();

    attachMockCallbacks(nullTask1);

    var task = new tr.Composite(true, [nullTask1]);

    attachMockCallbacks(task);

    task.reset();

    expect(startedCallback.calls.count()).toEqual(0);
    expect(completedCallback.calls.count()).toEqual(0);
    expect(interruptedCallback.calls.count()).toEqual(0);
    expect(erroredCallback.calls.count()).toEqual(0);
  });

  it('should complete when tasks being run in parallel complete', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();

    var task = new tr.Composite(true, [nullTask1, nullTask2, nullTask3]);

    attachMockCallbacks(task);

    task.run();

    expect(startedCallback).toHaveBeenCalled();
    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask3.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask3.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask2.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask3.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask3.complete();

    expect(completedCallback).toHaveBeenCalled();
    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask3.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should error when tasks being run in parallel error', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();
    var nullTask4 = new tr.Stub();

    var task = new tr.Composite(true, [nullTask1, nullTask2, nullTask3, nullTask4]);

    attachMockCallbacks(task);

    task.run();

    expect(startedCallback).toHaveBeenCalled();
    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask3.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask4.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask3.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask4.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask2.error();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.ERRORED);
    expect(nullTask3.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask4.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask3.complete();
    nullTask4.error();

    expect(erroredCallback).toHaveBeenCalled();
    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.ERRORED);
    expect(nullTask3.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask4.getState()).toBe(tr.enums.State.ERRORED);
    expect(task.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should interrupt parallel children when interrupted', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Composite(true, [nullTask1, nullTask2]);

    attachMockCallbacks(task);
    attachMockCallbacks(nullTask1);
    attachMockCallbacks(nullTask2);

    task.run();

    expect(startedCallback).toHaveBeenCalledWith(nullTask1);
    expect(startedCallback).toHaveBeenCalledWith(nullTask2);
    expect(startedCallback).toHaveBeenCalledWith(task);

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.interrupt();

    expect(interruptedCallback).toHaveBeenCalledWith(nullTask1);
    expect(interruptedCallback).toHaveBeenCalledWith(nullTask2);
    expect(interruptedCallback).toHaveBeenCalledWith(task);

    expect(nullTask1.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(nullTask2.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);
  });

  it('should reset children when reset and rerun them when restarted', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Composite(true, [nullTask1, nullTask2]);

    task.run();
    nullTask1.complete();
    task.interrupt();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);

    task.reset();

    expect(nullTask1.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.INITIALIZED);

    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should complete when tasks being run in serial complete', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();

    var task = new tr.Composite(false, [nullTask1, nullTask2, nullTask3]);

    attachMockCallbacks(task);

    task.run();

    expect(startedCallback).toHaveBeenCalled();
    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(nullTask3.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask3.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask2.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask3.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask3.complete();

    expect(completedCallback).toHaveBeenCalled();
    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask3.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should error when a serial child task errors', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Composite(false, [nullTask1, nullTask2]);

    attachMockCallbacks(task);

    task.run();

    expect(startedCallback).toHaveBeenCalled();
    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.error();

    expect(erroredCallback).toHaveBeenCalled();
    expect(nullTask1.getState()).toBe(tr.enums.State.ERRORED);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should interrupt serial children when interrupted', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Composite(false, [nullTask1, nullTask2]);

    attachMockCallbacks(task);
    attachMockCallbacks(nullTask1);
    attachMockCallbacks(nullTask2);

    task.run();

    expect(startedCallback).toHaveBeenCalledWith(nullTask1);
    expect(startedCallback).not.toHaveBeenCalledWith(nullTask2);
    expect(startedCallback).toHaveBeenCalledWith(task);

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.interrupt();

    expect(interruptedCallback).toHaveBeenCalledWith(nullTask1);
    expect(interruptedCallback).not.toHaveBeenCalledWith(nullTask2);
    expect(interruptedCallback).toHaveBeenCalledWith(task);

    expect(nullTask1.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);
  });

  it('should reset serial children that have been run when composite is reset', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();

    var task = new tr.Composite(false, [nullTask1, nullTask2, nullTask3]);

    task.run();
    nullTask1.complete();
    task.interrupt();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(nullTask3.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);

    task.reset();

    expect(nullTask1.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(nullTask3.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.INITIALIZED);

    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(nullTask3.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);
  });

  /**
   * Completing a child task while the composite is interrupted does not run the next task.
   * This test covers an edge-case where a child task's completion handler causes the parent composite to be interrupted.
   * We're testing to ensure that the completion of the child task doesn't un-pause the composite.
   */
  it('should not trigger the next task when a child task completes while a serial composite is interrupted', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Composite(false, [nullTask1, nullTask2]);

    nullTask1.completed(function() {
      task.interrupt();
    });

    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);

    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask2.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should auto-run a parallel task added while the composite is running', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Composite(true, [nullTask1]);
    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.add(nullTask2);

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.complete();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask2.complete();

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should not auto-run a task added at runtime to a serial composite', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Composite(false, [nullTask1]);
    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.add(nullTask2);

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask2.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should not run a task that is removed before being run', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();
    var nullTask4 = new tr.Stub();
    var nullTask5 = new tr.Stub();

    var task = new tr.Composite(true, [nullTask1, nullTask2, nullTask3, nullTask4, nullTask5]);
    task.remove(nullTask1);
    task.remove(nullTask3);
    task.remove(nullTask5);
    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask3.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(nullTask4.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask5.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should complete even after a child task is removed while running a parallel composite', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();
    var nullTask4 = new tr.Stub();
    var nullTask5 = new tr.Stub();

    var task = new tr.Composite(true, [nullTask1, nullTask2, nullTask3, nullTask4, nullTask5]);
    task.run();
    task.remove(nullTask1);
    task.remove(nullTask3);
    task.remove(nullTask5);

    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask4.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask2.complete();
    nullTask4.complete();

    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask4.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should complete even after a child task is removed while running a serial composite', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Composite(false, [nullTask1, nullTask2]);
    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.remove(nullTask1);

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should continue to the next task after a task that is removed from a running serial', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();

    var task = new tr.Composite(false, [nullTask1, nullTask2, nullTask3]);
    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(nullTask3.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.remove(nullTask2);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(nullTask3.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should complete successfully if the final task in a serial is removed at runtime', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Composite(false, [nullTask1, nullTask2]);
    task.run();

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.remove(nullTask2);

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should not rerun completed task if the composite is rerun', function() {
    var nullTask1 = new tr.Stub();

    var task = new tr.Composite(true, [nullTask1]);

    attachMockCallbacks(nullTask1);

    task.run();

    expect(startedCallback).toHaveBeenCalled();
    expect(startedCallback.calls.count()).toEqual(1);

    nullTask1.complete();

    task.run();

    expect(startedCallback.calls.count()).toEqual(1);
  });

  it('should accurately report the number of internal operations', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();

    var compositeTask1 = new tr.Composite(true);
    var compositeTask2 = new tr.Composite(true);

    compositeTask2.addAll([nullTask2, nullTask3]);

    compositeTask1.addAll([nullTask1, compositeTask2]);
    compositeTask1.run();

    expect(compositeTask1.getOperationsCount()).toBe(3);
    expect(compositeTask1.getCompletedOperationsCount()).toBe(0);

    nullTask1.complete();

    expect(compositeTask1.getOperationsCount()).toBe(3);
    expect(compositeTask1.getCompletedOperationsCount()).toBe(1);

    nullTask2.complete();

    expect(compositeTask1.getOperationsCount()).toBe(3);
    expect(compositeTask1.getCompletedOperationsCount()).toBe(2);

    nullTask3.complete();

    expect(compositeTask1.getOperationsCount()).toBe(3);
    expect(compositeTask1.getCompletedOperationsCount()).toBe(3);
  });

  it('should support flushing the current queue of tasks', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.TestComposite(false, [nullTask1, nullTask2]);

    attachMockCallbacks(task);
    attachMockCallbacks(nullTask1);

    task.run();

    expect(startedCallback).toHaveBeenCalledWith(task);
    expect(startedCallback).toHaveBeenCalledWith(nullTask1);
    expect(startedCallback).not.toHaveBeenCalledWith(nullTask2);

    task.flushForTest(false);

    // The current task should be interrupted and the composite completed.
    expect(completedCallback).toHaveBeenCalledWith(task);
    expect(interruptedCallback).toHaveBeenCalledWith(nullTask1);
    expect(startedCallback).not.toHaveBeenCalledWith(nullTask2);

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });


  /**
   * The current queue of tasks can be flushed without triggering completion of the composite.
   * This is a special behavior intended to allow sub-classes additional runtime flexibility.
   */
  it('should enable flushing of the current queue without completing', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.TestComposite(false, [nullTask1, nullTask2]);

    attachMockCallbacks(task);
    attachMockCallbacks(nullTask1);
    attachMockCallbacks(nullTask2);

    task.run();

    expect(startedCallback).toHaveBeenCalledWith(task);
    expect(startedCallback).toHaveBeenCalledWith(nullTask1);
    expect(startedCallback).not.toHaveBeenCalledWith(nullTask2);

    task.flushForTest(true);

    // The currently-running task should be interrupted, but no other callbacks should be invoked.
    // The composite task should still be running once the queue is empty.
    expect(interruptedCallback).toHaveBeenCalledWith(nullTask1);
    expect(interruptedCallback).not.toHaveBeenCalledWith(nullTask2);

    expect(task.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should not complete if the queue is flushed when the task is not running', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.TestComposite(false, [nullTask1, nullTask2]);

    attachMockCallbacks(task);

    task.flushForTest(false);

    expect(startedCallback).not.toHaveBeenCalled();
    expect(completedCallback).not.toHaveBeenCalled();

    task.run();

    expect(startedCallback).toHaveBeenCalled();
    expect(completedCallback).toHaveBeenCalled();
  });

  it('should run correct if queue is flushed and a new queue of tasks is added', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();
    var nullTask4 = new tr.Stub();

    var task = new tr.TestComposite(false, [nullTask1, nullTask2]);

    attachMockCallbacks(nullTask1);
    attachMockCallbacks(nullTask2);
    attachMockCallbacks(nullTask3);
    attachMockCallbacks(nullTask4);
    attachMockCallbacks(task);

    task.run();

    expect(startedCallback).toHaveBeenCalledWith(task);
    expect(startedCallback).toHaveBeenCalledWith(nullTask1);
    expect(startedCallback).not.toHaveBeenCalledWith(nullTask2);
    expect(startedCallback).not.toHaveBeenCalledWith(nullTask3);
    expect(startedCallback).not.toHaveBeenCalledWith(nullTask4);

    nullTask1.complete();

    expect(completedCallback).toHaveBeenCalledWith(nullTask1);
    expect(startedCallback).toHaveBeenCalledWith(nullTask2);
    expect(startedCallback).not.toHaveBeenCalledWith(nullTask3);
    expect(startedCallback).not.toHaveBeenCalledWith(nullTask4);

    task.flushForTest(true);

    expect(interruptedCallback).not.toHaveBeenCalledWith(nullTask1);
    expect(interruptedCallback).toHaveBeenCalledWith(nullTask2);
    expect(interruptedCallback).not.toHaveBeenCalledWith(nullTask3);
    expect(interruptedCallback).not.toHaveBeenCalledWith(nullTask4);

    task.addAll([nullTask3, nullTask4]);

    expect(startedCallback).toHaveBeenCalledWith(nullTask3);
    expect(startedCallback).not.toHaveBeenCalledWith(nullTask4);

    nullTask3.complete();

    expect(completedCallback).toHaveBeenCalledWith(nullTask3);
    expect(startedCallback).toHaveBeenCalledWith(nullTask4);

    nullTask4.complete();

    expect(completedCallback).toHaveBeenCalledWith(nullTask4);
    expect(completedCallback).toHaveBeenCalledWith(task);
  });

  it('should resume correctly after a serial child has errored', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();

    var task = new tr.TestComposite(false, [nullTask1, nullTask2, nullTask3]);

    attachMockCallbacks(nullTask1);
    attachMockCallbacks(nullTask2);
    attachMockCallbacks(nullTask3);
    attachMockCallbacks(task);

    task.run();

    expect(startedCallback).toHaveBeenCalledWith(task);
    expect(startedCallback).toHaveBeenCalledWith(nullTask1);
    expect(startedCallback).not.toHaveBeenCalledWith(nullTask2);
    expect(startedCallback).not.toHaveBeenCalledWith(nullTask3);

    nullTask1.complete();

    expect(completedCallback).toHaveBeenCalledWith(nullTask1);
    expect(startedCallback).toHaveBeenCalledWith(nullTask2);

    nullTask2.error();

    expect(erroredCallback).toHaveBeenCalledWith(nullTask2);
    expect(erroredCallback).toHaveBeenCalledWith(task);

    task.run();

    expect(startedCallback).toHaveBeenCalledWith(task);
    expect(startedCallback).toHaveBeenCalledWith(nullTask2);
    expect(startedCallback).not.toHaveBeenCalledWith(nullTask3);

    nullTask2.complete();

    expect(completedCallback).toHaveBeenCalledWith(nullTask2);
    expect(startedCallback).toHaveBeenCalledWith(nullTask3);

    nullTask3.complete();

    expect(completedCallback).toHaveBeenCalledWith(nullTask3);
    expect(completedCallback).toHaveBeenCalledWith(task);
  });

  it('should resume correctly after a parallel child has errored', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();

    var task = new tr.TestComposite(true, [nullTask1, nullTask2, nullTask3]);

    attachMockCallbacks(nullTask1);
    attachMockCallbacks(nullTask2);
    attachMockCallbacks(nullTask3);
    attachMockCallbacks(task);

    task.run();

    expect(startedCallback).toHaveBeenCalledWith(task);
    expect(startedCallback).toHaveBeenCalledWith(nullTask1);
    expect(startedCallback).toHaveBeenCalledWith(nullTask2);
    expect(startedCallback).toHaveBeenCalledWith(nullTask3);

    nullTask2.error();

    // A parallel composite task will continue running until all children have completed or errored.
    expect(erroredCallback).toHaveBeenCalledWith(nullTask2);
    expect(erroredCallback).not.toHaveBeenCalledWith(task);

    nullTask1.complete();

    expect(completedCallback).toHaveBeenCalledWith(nullTask1);
    expect(erroredCallback).not.toHaveBeenCalledWith(task);

    nullTask3.complete();

    expect(completedCallback).toHaveBeenCalledWith(nullTask3);
    expect(erroredCallback).toHaveBeenCalledWith(task);

    task.run();

    // Restarting the composite should only restart errored tasks.
    // Running tasks should be allowed to complete; completed tasks left alone.
    expect(startedCallback).toHaveBeenCalledWith(task);
    expect(startedCallback).toHaveBeenCalledWith(nullTask2);

    nullTask2.complete();

    // Once the remaining inner tasks complete, the composite should complete.
    expect(completedCallback).toHaveBeenCalledWith(nullTask2);
    expect(completedCallback).toHaveBeenCalledWith(task);
  });

  it('should not continue running tasks when one task interrupts', function() {
    var nullTask1 = new tr.Stub();
    nullTask1.started(function() {
      task.interrupt();
    });
    var nullTask2 = new tr.Stub();

    var task = new tr.TestComposite(true, [nullTask1, nullTask2]);
    task.run();

    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(nullTask1.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
  });
});