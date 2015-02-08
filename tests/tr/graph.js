goog.provide('tr.Graph.test');
goog.setTestOnly('tr.Graph.test');

goog.require('tr.Graph');
goog.require('tr.Stub');
goog.require('tr.enums.State');

describe('tr.Graph', function() {

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
   * Test task that errors immediately (synchronously) after running.
   * @extends {tr.Closure}
   * @constructor
   * @struct
   */
  tr.TestSynchrousErrorTask = function() {
    goog.base(this, goog.bind(function() {
      this.error();
    }, this));
  };
  goog.inherits(tr.TestSynchrousErrorTask, tr.Closure);


  /**
   * Test task that tracks the number of times 'addsBeforeFirstRun' has been run.
   * @extends {tr.Graph}
   * @constructor
   * @struct
   */
  tr.TestGraph = function() {
    goog.base(this);

    this.addsBeforeFirstRunCount_ = 0;
  };
  goog.inherits(tr.TestGraph, tr.Graph);

  /** @override */
  tr.TestGraph.prototype.addsBeforeFirstRun = function() {
    this.addsBeforeFirstRunCount_++;
  };


  it('should complete when run without children', function() {
    var task = new tr.Graph();
    task.run();

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should error if a task is added more than once', function() {
    var nullTask1 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);

    expect(function() {
      task.add(nullTask1);
    }).toThrow();
  });

  it('should error if a task that is not within the graph is removed', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);

    expect(function() {
      task.remove(nullTask2);
    }).toThrow();
  });

  it('should complete successfully when a parallel graph completes', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);
    task.add(nullTask2);
    task.add(nullTask3);

    attachMockCallbacks(task);

    task.run();

    expect(startedCallback).toHaveBeenCalledWith(task);

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

    expect(completedCallback).toHaveBeenCalledWith(task);

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask3.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should complete successfully when a serial graph completes', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);
    task.add(nullTask2, [nullTask1]);
    task.addToEnd(nullTask3);

    attachMockCallbacks(task);

    task.run();

    expect(startedCallback).toHaveBeenCalledWith(task);

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

    expect(completedCallback).toHaveBeenCalledWith(task);

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask3.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should not change state due to state-changes with inactive tasks within the graph', function() {
    var nullTask1 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);

    attachMockCallbacks(nullTask1);
    attachMockCallbacks(task);

    task.run();

    expect(startedCallback).toHaveBeenCalledWith(task);
    expect(startedCallback).toHaveBeenCalledWith(nullTask1);
    expect(startedCallback.calls.count()).toEqual(2);

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.complete();

    expect(completedCallback).toHaveBeenCalledWith(task);
    expect(completedCallback).toHaveBeenCalledWith(nullTask1);
    expect(completedCallback.calls.count()).toEqual(2);

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);

    nullTask1.reset();
    nullTask1.run();

    expect(startedCallback).toHaveBeenCalledWith(nullTask1);
    expect(startedCallback.calls.count()).toEqual(3);

    nullTask1.complete();

    expect(completedCallback).toHaveBeenCalledWith(nullTask1);
    expect(completedCallback.calls.count()).toEqual(3);
  });

  it('should complete successfully if a child task is interrupted and rerun', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);
    task.add(nullTask2);

    attachMockCallbacks(task);

    task.run();

    expect(startedCallback).toHaveBeenCalledWith(task);

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.interrupt();

    expect(nullTask1.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.complete();
    nullTask2.complete();

    expect(completedCallback).toHaveBeenCalledWith(task);

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should rerun interrupted child tasks if graph is rerun', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);
    task.add(nullTask2);
    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask2.interrupt();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.interrupt();

    expect(nullTask1.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(nullTask2.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);

    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.complete();
    nullTask2.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should not rerun completed children when a graph is interrupted and rerun', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);
    task.add(nullTask2);
    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask2.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.interrupt();

    expect(nullTask1.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);

    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should error when a task is added that depends on itself', function() {
    var nullTask1 = new tr.Stub();

    var task = new tr.Graph();

    expect(function() {
      task.add(nullTask1, [nullTask1]);
    }).toThrow();
  });

  it('should error when a task is added that depends on anothert ask not within the graph', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Graph();

    expect(function() {
      task.add(nullTask1, [nullTask2]);
    }).toThrow();
  });

  it('should error if a task is removed that leaves the graph in an invalid state', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);
    task.add(nullTask2, [nullTask1]);

    expect(function() {
      task.remove(nullTask1);
    }).toThrow();
  });

  it('should run a task that is added to the graph at runtime that does not have dependencies', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);

    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.add(nullTask2);

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
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

  it('should not run a task that is added to the graph at runtime with blocking dependencies', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);

    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.add(nullTask2, [nullTask1]);

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

  it('should error if a task with invalid dependencies is added at runtime', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);

    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    expect(function() {
      task.add(nullTask2, [nullTask3]);
    }).toThrow();
  });

  it('should allow tasks to be removed at runtime', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);
    task.add(nullTask2);

    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.remove(nullTask2);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should complete if the last incomplete task ir removed at runtime', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);
    task.add(nullTask2);

    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.remove(nullTask2);

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should report the correct number of internal operations', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();

    var graphTask1 = new tr.Graph();
    var graphTask2 = new tr.Graph();

    graphTask2.add(nullTask2);
    graphTask2.add(nullTask3);

    graphTask1.add(nullTask1);
    graphTask1.add(graphTask2);
    graphTask1.run();

    expect(graphTask1.getOperationsCount()).toBe(3);
    expect(graphTask1.getCompletedOperationsCount()).toBe(0);

    nullTask1.complete();

    expect(graphTask1.getOperationsCount()).toBe(3);
    expect(graphTask1.getCompletedOperationsCount()).toBe(1);

    nullTask2.complete();

    expect(graphTask1.getOperationsCount()).toBe(3);
    expect(graphTask1.getCompletedOperationsCount()).toBe(2);

    nullTask3.complete();

    expect(graphTask1.getOperationsCount()).toBe(3);
    expect(graphTask1.getCompletedOperationsCount()).toBe(3);
  });

  it('should resume correctly after a child task errors', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);
    task.add(nullTask2, [nullTask1]);
    task.add(nullTask3);

    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(nullTask3.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.error();

    expect(nullTask1.getState()).toBe(tr.enums.State.ERRORED);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(nullTask3.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(task.getState()).toBe(tr.enums.State.ERRORED);

    task.run();
    
    nullTask3.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(nullTask3.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask3.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    nullTask2.complete();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask3.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should not proceed after synchronous errors', function() {
    var nullTask1 = new tr.Stub(true); // Succeeds immediately
    var nullTask2 = new tr.TestSynchrousErrorTask(); // Fails immediately
    var nullTask3 = new tr.Stub(true); // Succeeds immediately

    var task = new tr.Graph();
    task.add(nullTask1);
    task.add(nullTask2, [nullTask1]);
    task.add(nullTask3, [nullTask2]);
    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.ERRORED);
    expect(nullTask3.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should reset all children when the graph is reset', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);
    task.add(nullTask2);

    task.run();

    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.interrupt();
    task.reset();

    expect(nullTask1.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getState()).toBe(tr.enums.State.INITIALIZED);
  });

  it('should invoke addsBeforeFirstRun before running', function() {
    var task = new tr.TestGraph();
    task.add(new tr.Stub());
    task.run();

    expect(task.addsBeforeFirstRunCount_).toBe(1);
  });

  it('should only invoke addsBeforeFirstRun once', function() {
    var task = new tr.TestGraph();
    task.add(new tr.Stub());
    task.run();

    expect(task.addsBeforeFirstRunCount_).toBe(1);

    task.interrupt();
    task.run();

    expect(task.addsBeforeFirstRunCount_).toBe(1);

    task.interrupt();
    task.reset();
    task.run();

    expect(task.addsBeforeFirstRunCount_).toBe(1);
  });

  it('should interrupt any children running in parallel in the event of an error', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();

    var graphTask = new tr.Graph();
    graphTask.add(nullTask1);
    graphTask.add(nullTask2);
    graphTask.add(nullTask3);
    graphTask.run();

    expect(graphTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask3.getState()).toBe(tr.enums.State.RUNNING);

    nullTask1.complete();

    expect(graphTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask3.getState()).toBe(tr.enums.State.RUNNING);

    nullTask3.error();

    expect(graphTask.getState()).toBe(tr.enums.State.ERRORED);
    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(nullTask3.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should add a set of tasks to the end of the graph', function() {
    var nullTask1 = new tr.Stub();
    var nullTask2 = new tr.Stub();
    var nullTask3 = new tr.Stub();

    var task = new tr.Graph();
    task.add(nullTask1);
    task.addAllToEnd([nullTask2, nullTask3]);

    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask1.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask2.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(nullTask3.getState()).toBe(tr.enums.State.INITIALIZED);

    nullTask1.complete();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask3.getState()).toBe(tr.enums.State.RUNNING);

    nullTask2.complete();
    nullTask3.complete();

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask2.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask3.getState()).toBe(tr.enums.State.COMPLETED);
  });
});