goog.require('taskrunner.DependencyGraphTask');
goog.require('taskrunner.NullTask');
goog.require('taskrunner.TaskState');



/**
 * Tests for DependencyGraphTask class.
 *
 * Some of the following tests make use of NullTask for convenience purposes.
 *
 * @constructor
 */
function DependencyGraphTaskTest() {
  // These mock functions are shared between the test methods below. We attach
  // them to this test rather than the Tasks themselves because the tasks are
  // structs. Use the helper method, this.attachMockCallbacks_,
  // below to attach callbacks to a particular task.
  this.startedCallback_ = createMockFunction();
  this.completedCallback_ = createMockFunction();
  this.erroredCallback_ = createMockFunction();
  this.interruptedCallback_ = createMockFunction();
}
registerTestSuite(DependencyGraphTaskTest);


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
 * Helper function for attaching task callbacks to be used by later
 * expectations.
 * @private
 */
DependencyGraphTaskTest.prototype.attachMockCallbacks_ = function(task) {
  task.started(this.startedCallback_);
  task.interrupted(this.interruptedCallback_);
  task.completed(this.completedCallback_);
  task.errored(this.erroredCallback_);

  return task;
};


/**
 * Composite tasks with no children should automatically complete when run.
 */
DependencyGraphTaskTest.prototype.emptyTaskCompletes = function() {
  var task = new taskrunner.DependencyGraphTask();
  task.run();

  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Trying to add a task more than once throws an error.
 */
DependencyGraphTaskTest.prototype.cannotAddTaskMoreThanOnce = function() {
  var nullTask1 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();
  task.addTask(nullTask1);

  expectThat(function() {
    task.addTask(nullTask1);
  }, throwsError(/Cannot add task more than once./));
};


/**
 * Trying to remove a task that is not within the throws an error.
 */
DependencyGraphTaskTest.prototype.cannotRemoveTaskNotInComposite = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();
  task.addTask(nullTask1);

  expectThat(function() {
    task.removeTask(nullTask2);
  }, throwsError(/Cannot find the specified task./));
};


/**
 * Tests parallel tasks from run() to complete.
 */
DependencyGraphTaskTest.prototype.parallelSuccessfulCompletion = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();
  var nullTask3 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();
  task.addTask(nullTask1);
  task.addTask(nullTask2);
  task.addTask(nullTask3);

  this.attachMockCallbacks_(task);

  expectCall(this.startedCallback_)(task);

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask3.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask1.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask3.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask2.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask3.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  expectCall(this.completedCallback_)(task);

  nullTask3.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask2.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask3.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Tests serial graph from run() to complete.
 */
DependencyGraphTaskTest.prototype.serialSuccessfulCompletion = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();
  var nullTask3 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();
  task.addTask(nullTask1);
  task.addTask(nullTask2, [nullTask1]);
  task.addTask(nullTask3, [nullTask1, nullTask2]); // nt1 not strictly necessary

  this.attachMockCallbacks_(task);

  expectCall(this.startedCallback_)(task);

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask3.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask1.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask3.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask2.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask3.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  expectCall(this.completedCallback_)(task);

  nullTask3.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask2.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask3.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Callbacks are removed from non-running tasks such that events triggered when
 * graph is not running do not affect the graph.
 */
DependencyGraphTaskTest.prototype.callbacksRemovedWhenNotRunning = function() {
  var nullTask1 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();
  task.addTask(nullTask1);

  this.attachMockCallbacks_(nullTask1);
  this.attachMockCallbacks_(task);

  expectCall(this.startedCallback_)(nullTask1);
  expectCall(this.startedCallback_)(task);

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  expectCall(this.completedCallback_)(nullTask1);
  expectCall(this.completedCallback_)(task);

  nullTask1.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());

  nullTask1.reset();

  expectCall(this.startedCallback_)(nullTask1);

  nullTask1.run();

  expectCall(this.completedCallback_)(nullTask1);

  nullTask1.complete();
};


/**
 * Tests interrupting and resuming a child task while graph is running. This
 * should not cause the graph task to hang.
 */
DependencyGraphTaskTest.prototype.interruptAndResumeChildTask = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();
  task.addTask(nullTask1);
  task.addTask(nullTask2);

  this.attachMockCallbacks_(task);

  expectCall(this.startedCallback_)(task);

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask1.interrupt();

  expectEq(taskrunner.TaskState.INTERRUPTED, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask1.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  expectCall(this.completedCallback_)(task);

  nullTask1.complete();
  nullTask2.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask2.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Tests interrupting a child task and resuming the parent graph re-runs child.
 */
DependencyGraphTaskTest.prototype.interruptChildAndResumeGraph = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();
  task.addTask(nullTask1);
  task.addTask(nullTask2);
  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask2.interrupt();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.interrupt();

  expectEq(taskrunner.TaskState.INTERRUPTED, nullTask1.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, nullTask2.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, task.getState());

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask1.complete();
  nullTask2.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask2.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Tests interrupting and resuming a graph doesn't re-start completed children.
 */
DependencyGraphTaskTest.prototype.resumeGraphWithCompletedChild = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();
  task.addTask(nullTask1);
  task.addTask(nullTask2);
  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask2.complete();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.interrupt();

  expectEq(taskrunner.TaskState.INTERRUPTED, nullTask1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask2.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, task.getState());

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask1.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask2.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Tests ludicrous cyclic dependency case with a task that depends on itself.
 */
DependencyGraphTaskTest.prototype.cyclicReferenceTaskBlocksSelf = function() {
  var nullTask1 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();

  expectThat(function() {
    task.addTask(nullTask1, [nullTask1]);
  }, throwsError(/Cyclic dependency detected./));
};


/**
 * Tests invalid dependency on a task that is not within the graph.
 */
DependencyGraphTaskTest.prototype.taskBlockedByMissingTask = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();

  expectThat(function() {
    task.addTask(nullTask1, [nullTask2]);
  }, throwsError(/Invalid dependency detected./));
};


/**
 * Tests removing a dependency that results in an invalid dependency graph.
 */
DependencyGraphTaskTest.prototype.twoTasksBlockEachOther = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();
  task.addTask(nullTask1);
  task.addTask(nullTask2, [nullTask1]);

  expectThat(function() {
    task.removeTask(nullTask1);
  }, throwsError(/Invalid dependency detected./));
};


/**
 * Tests adding a task (without blockers) at runtime.
 */
DependencyGraphTaskTest.prototype.addTaskAtRuntimeWithoutBlockers = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();
  task.addTask(nullTask1);

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.addTask(nullTask2);

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask1.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask2.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask2.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Tests adding a task (with blockers) at runtime.
 */
DependencyGraphTaskTest.prototype.addTaskAtRuntimeWithBlockers = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();
  task.addTask(nullTask1);

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.addTask(nullTask2, [nullTask1]);

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask1.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask2.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask2.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Tests adding a task with invalid dependencies at runtime.
 */
DependencyGraphTaskTest.prototype.addRuntimeTaskInvalidBlockers = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();
  var nullTask3 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();
  task.addTask(nullTask1);

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  expectThat(function() {
    task.addTask(nullTask2, [nullTask3]);
  }, throwsError(/Invalid dependency detected./));
};


/**
 * Tests removing a task at runtime.
 */
DependencyGraphTaskTest.prototype.removeTaskAtRuntime = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();
  task.addTask(nullTask1);
  task.addTask(nullTask2);

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.removeTask(nullTask2);

  nullTask1.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Tests removing the last task at runtime.
 */
DependencyGraphTaskTest.prototype.removeLastTaskAtRuntime = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();
  task.addTask(nullTask1);
  task.addTask(nullTask2);

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask1.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.removeTask(nullTask2);

  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Graph task reports the current number of internal operations.
 */
DependencyGraphTaskTest.prototype.getOperationsCount = function() {
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

  expectEq(3, graphTask1.getOperationsCount());
  expectEq(0, graphTask1.getCompletedOperationsCount());

  nullTask1.complete();

  expectEq(3, graphTask1.getOperationsCount());
  expectEq(1, graphTask1.getCompletedOperationsCount());

  nullTask2.complete();

  expectEq(3, graphTask1.getOperationsCount());
  expectEq(2, graphTask1.getCompletedOperationsCount());

  nullTask3.complete();

  expectEq(3, graphTask1.getOperationsCount());
  expectEq(3, graphTask1.getCompletedOperationsCount());
};


/**
 * Graph resumes correctly after a child task has errored.
 */
DependencyGraphTaskTest.prototype.resumeGraphAfterChildErrors = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();
  var nullTask3 = new taskrunner.NullTask();

  var task = new taskrunner.DependencyGraphTask();
  task.addTask(nullTask1);
  task.addTask(nullTask2, [nullTask1]);
  task.addTask(nullTask3);

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask3.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask1.error();
  nullTask3.complete();

  expectEq(taskrunner.TaskState.ERRORED, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask3.getState());
  expectEq(taskrunner.TaskState.ERRORED, task.getState());

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask3.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask1.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask3.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask2.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask2.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask3.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Make sure the graph does not incorrectly proceed after synchronous errors.
 */
DependencyGraphTaskTest.prototype.synchronousCompletionsAndErrors = function() {
  var nullTask1 = new taskrunner.NullTask(true); // Succeeds immediately
  var nullTask2 = new taskrunner.TestSynchrousErrorTask(); // Fails immediately
  var nullTask3 = new taskrunner.NullTask(true); // Succeeds immediately

  var task = new taskrunner.DependencyGraphTask();
  task.addTask(nullTask1);
  task.addTask(nullTask2, [nullTask1]);
  task.addTask(nullTask3, [nullTask2]);
  task.run();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.ERRORED, nullTask2.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask3.getState());
  expectEq(taskrunner.TaskState.ERRORED, task.getState());
};
