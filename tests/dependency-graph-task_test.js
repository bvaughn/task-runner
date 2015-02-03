goog.provide('goog.DependencyGraphTask.test');
goog.setTestOnly('goog.DependencyGraphTask.test');

goog.require('taskrunner.DependencyGraphTask');
goog.require('taskrunner.NullTask');
goog.require('taskrunner.TaskState');

describe('goog.DependencyGraphTask', function() {

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
   * @extends {taskrunner.ClosureTask}
   * @constructor
   * @struct
   */
  taskrunner.TestSynchrousErrorTask = function() {
    goog.base(this, goog.bind(function() {
      this.error();
    }, this));
  };
  goog.inherits(taskrunner.TestSynchrousErrorTask, taskrunner.ClosureTask);


  /**
   * Test task that tracks the number of times 'addTasksBeforeFirstRun' has been run.
   * @extends {taskrunner.DependencyGraphTask}
   * @constructor
   * @struct
   */
  taskrunner.TestDependencyGraphTask = function() {
    goog.base(this);

    this.addTasksBeforeFirstRunCount_ = 0;
  };
  goog.inherits(taskrunner.TestDependencyGraphTask, taskrunner.DependencyGraphTask);

  /** @override */
  taskrunner.TestDependencyGraphTask.prototype.addTasksBeforeFirstRun = function() {
    this.addTasksBeforeFirstRunCount_++;
  };


  it('should complete when run without children', function() {
    var task = new taskrunner.DependencyGraphTask();
    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should error if a task is added more than once', function() {
    var nullTask1 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);

    expect(function() {
      task.addTask(nullTask1);
    }).toThrow();
  });

  it('should error if a task that is not within the graph is removed', function() {
    var nullTask1 = new taskrunner.NullTask();
    var nullTask2 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);

    expect(function() {
      task.removeTask(nullTask2);
    }).toThrow();
  });

  it('should complete successfully when a parallel graph completes', function() {
    var nullTask1 = new taskrunner.NullTask();
    var nullTask2 = new taskrunner.NullTask();
    var nullTask3 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);
    task.addTask(nullTask2);
    task.addTask(nullTask3);

    attachMockCallbacks(task);

    task.run();

    expect(startedCallback).toHaveBeenCalledWith(task);

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask3.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask3.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask2.complete();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask3.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask3.complete();

    expect(completedCallback).toHaveBeenCalledWith(task);

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask3.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should complete successfully when a serial graph completes', function() {
    var nullTask1 = new taskrunner.NullTask();
    var nullTask2 = new taskrunner.NullTask();
    var nullTask3 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);
    task.addTask(nullTask2, [nullTask1]);
    task.addTaskToEnd(nullTask3);

    attachMockCallbacks(task);

    task.run();

    expect(startedCallback).toHaveBeenCalledWith(task);

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(nullTask3.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask3.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask2.complete();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask3.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask3.complete();

    expect(completedCallback).toHaveBeenCalledWith(task);

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask3.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should not change state due to state-changes with inactive tasks within the graph', function() {
    var nullTask1 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);

    attachMockCallbacks(nullTask1);
    attachMockCallbacks(task);

    task.run();

    expect(startedCallback).toHaveBeenCalledWith(task);
    expect(startedCallback).toHaveBeenCalledWith(nullTask1);
    expect(startedCallback.calls.count()).toEqual(2);

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask1.complete();

    expect(completedCallback).toHaveBeenCalledWith(task);
    expect(completedCallback).toHaveBeenCalledWith(nullTask1);
    expect(completedCallback.calls.count()).toEqual(2);

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);

    nullTask1.reset();
    nullTask1.run();

    expect(startedCallback).toHaveBeenCalledWith(nullTask1);
    expect(startedCallback.calls.count()).toEqual(3);

    nullTask1.complete();

    expect(completedCallback).toHaveBeenCalledWith(nullTask1);
    expect(completedCallback.calls.count()).toEqual(3);
  });

  it('should complete successfully if a child task is interrupted and rerun', function() {
    var nullTask1 = new taskrunner.NullTask();
    var nullTask2 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);
    task.addTask(nullTask2);

    attachMockCallbacks(task);

    task.run();

    expect(startedCallback).toHaveBeenCalledWith(task);

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask1.interrupt();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask1.run();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask1.complete();
    nullTask2.complete();

    expect(completedCallback).toHaveBeenCalledWith(task);

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should rerun interrupted child tasks if graph is rerun', function() {
    var nullTask1 = new taskrunner.NullTask();
    var nullTask2 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);
    task.addTask(nullTask2);
    task.run();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask2.interrupt();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.interrupt();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(task.getState()).toBe(taskrunner.TaskState.INTERRUPTED);

    task.run();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask1.complete();
    nullTask2.complete();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should not rerun completed children when a graph is interrupted and rerun', function() {
    var nullTask1 = new taskrunner.NullTask();
    var nullTask2 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);
    task.addTask(nullTask2);
    task.run();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask2.complete();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.interrupt();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getState()).toBe(taskrunner.TaskState.INTERRUPTED);

    task.run();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should error when a task is added that depends on itself', function() {
    var nullTask1 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();

    expect(function() {
      task.addTask(nullTask1, [nullTask1]);
    }).toThrow();
  });

  it('should error when a task is added that depends on anothert ask not within the graph', function() {
    var nullTask1 = new taskrunner.NullTask();
    var nullTask2 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();

    expect(function() {
      task.addTask(nullTask1, [nullTask2]);
    }).toThrow();
  });

  it('should error if a task is removed that leaves the graph in an invalid state', function() {
    var nullTask1 = new taskrunner.NullTask();
    var nullTask2 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);
    task.addTask(nullTask2, [nullTask1]);

    expect(function() {
      task.removeTask(nullTask1);
    }).toThrow();
  });

  it('should run a task that is added to the graph at runtime that does not have dependencies', function() {
    var nullTask1 = new taskrunner.NullTask();
    var nullTask2 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);

    task.run();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.addTask(nullTask2);

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask2.complete();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should not run a task that is added to the graph at runtime with blocking dependencies', function() {
    var nullTask1 = new taskrunner.NullTask();
    var nullTask2 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);

    task.run();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.addTask(nullTask2, [nullTask1]);

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask2.complete();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should error if a task with invalid dependencies is added at runtime', function() {
    var nullTask1 = new taskrunner.NullTask();
    var nullTask2 = new taskrunner.NullTask();
    var nullTask3 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);

    task.run();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    expect(function() {
      task.addTask(nullTask2, [nullTask3]);
    }).toThrow();
  });

  it('should allow tasks to be removed at runtime', function() {
    var nullTask1 = new taskrunner.NullTask();
    var nullTask2 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);
    task.addTask(nullTask2);

    task.run();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.removeTask(nullTask2);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should complete if the last incomplete task ir removed at runtime', function() {
    var nullTask1 = new taskrunner.NullTask();
    var nullTask2 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);
    task.addTask(nullTask2);

    task.run();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.removeTask(nullTask2);

    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should report the correct number of internal operations', function() {
    var nullTask1 = new taskrunner.NullTask();
    var nullTask2 = new taskrunner.NullTask();
    var nullTask3 = new taskrunner.NullTask();

    var graphTask1 = new taskrunner.DependencyGraphTask();
    var graphTask2 = new taskrunner.DependencyGraphTask();

    graphTask2.addTask(nullTask2);
    graphTask2.addTask(nullTask3);

    graphTask1.addTask(nullTask1);
    graphTask1.addTask(graphTask2);
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
    var nullTask1 = new taskrunner.NullTask();
    var nullTask2 = new taskrunner.NullTask();
    var nullTask3 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);
    task.addTask(nullTask2, [nullTask1]);
    task.addTask(nullTask3);

    task.run();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(nullTask3.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask1.error();
    nullTask3.complete();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(nullTask3.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getState()).toBe(taskrunner.TaskState.ERRORED);

    task.run();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(nullTask3.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask1.complete();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask3.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTask2.complete();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask3.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });

  it('should not proceed after synchronous errors', function() {
    var nullTask1 = new taskrunner.NullTask(true); // Succeeds immediately
    var nullTask2 = new taskrunner.TestSynchrousErrorTask(); // Fails immediately
    var nullTask3 = new taskrunner.NullTask(true); // Succeeds immediately

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);
    task.addTask(nullTask2, [nullTask1]);
    task.addTask(nullTask3, [nullTask2]);
    task.run();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(nullTask3.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(task.getState()).toBe(taskrunner.TaskState.ERRORED);
  });

  it('should reset all children when the graph is reset', function() {
    var nullTask1 = new taskrunner.NullTask();
    var nullTask2 = new taskrunner.NullTask();

    var task = new taskrunner.DependencyGraphTask();
    task.addTask(nullTask1);
    task.addTask(nullTask2);

    task.run();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.interrupt();
    task.reset();

    expect(nullTask1.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(nullTask2.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(task.getState()).toBe(taskrunner.TaskState.INITIALIZED);
  });

  it('should invoke addTasksBeforeFirstRun before running', function() {
    var task = new taskrunner.TestDependencyGraphTask();
    task.addTask(new taskrunner.NullTask());
    task.run();

    expect(task.addTasksBeforeFirstRunCount_).toBe(1);
  });

  it('should only invoke addTasksBeforeFirstRun once', function() {
    var task = new taskrunner.TestDependencyGraphTask();
    task.addTask(new taskrunner.NullTask());
    task.run();

    expect(task.addTasksBeforeFirstRunCount_).toBe(1);

    task.interrupt();
    task.run();

    expect(task.addTasksBeforeFirstRunCount_).toBe(1);

    task.interrupt();
    task.reset();
    task.run();

    expect(task.addTasksBeforeFirstRunCount_).toBe(1);
  });
});