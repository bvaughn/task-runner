goog.require('taskrunner.CompositeTask');
goog.require('taskrunner.NullTask');
goog.require('taskrunner.TaskState');



/**
 * Tests for CompositeTask class.
 *
 * Some of the following tests make use of NullTask for convenience purposes.
 *
 * @constructor
 */
function CompositeTaskTest() {
  // These mock functions are shared between the test methods below. We attach
  // them to this test rather than the Tasks themselves because the tasks are
  // structs. Use the helper method, this.attachMockCallbacks_,
  // below to attach callbacks to a particular task.
  this.startedCallback_ = createMockFunction();
  this.completedCallback_ = createMockFunction();
  this.erroredCallback_ = createMockFunction();
  this.interruptedCallback_ = createMockFunction();
}
registerTestSuite(CompositeTaskTest);


/**
 * CompositeTask sub-class used to expose protected methods for testing.
 * @extends {taskrunner.CompositeTask}
 * @constructor
 * @struct
 */
taskrunner.TestCompositeTask = function(parallel, opt_tasks) {
  goog.base(this, parallel, opt_tasks);
};
goog.inherits(taskrunner.TestCompositeTask, taskrunner.CompositeTask);


/**
 * Exposes flushTaskQueue() method for testing.
 */
taskrunner.TestCompositeTask.prototype.flushForTest = function(doNotComplete) {
  this.flushTaskQueue(doNotComplete);
};


/**
 * Helper function for attaching task callbacks to be used by later
 * expectations.
 * @private
 */
CompositeTaskTest.prototype.attachMockCallbacks_ = function(task) {
  task.started(this.startedCallback_);
  task.interrupted(this.interruptedCallback_);
  task.completed(this.completedCallback_);
  task.errored(this.erroredCallback_);

  return task;
};


/**
 * Composite tasks with no children should automatically complete when run.
 */
CompositeTaskTest.prototype.emptyTaskCompletes = function() {
  var task = new taskrunner.CompositeTask(true);
  task.run();

  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Trying to add a task more than once throws an error.
 */
CompositeTaskTest.prototype.cannotAddTaskMoreThanOnce = function() {
  var nullTask1 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(false, [nullTask1]);

  expectThat(function() {
    task.addTask(nullTask1);
  }, throwsError(/Cannot add task more than once./));
};


/**
 * Trying to remove a task that is not within the throws an error.
 */
CompositeTaskTest.prototype.cannotRemoveTaskNotInComposite = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(false, [nullTask1]);

  expectThat(function() {
    task.removeTask(nullTask2);
  }, throwsError(/Attempted to remove an invalid task./));
};


/**
 * Resetting a Composite tasks that has not been run does nothing.
 */
CompositeTaskTest.prototype.resetDoesNothingIfNotRun = function() {
  var nullTask1 = new taskrunner.NullTask();

  this.attachMockCallbacks_(nullTask1);

  var task = new taskrunner.CompositeTask(true, [nullTask1]);

  this.attachMockCallbacks_(task);

  task.reset();
};


/**
 * Tests parallel Composite task from run() to complete.
 */
CompositeTaskTest.prototype.parallelSuccessfulCompletion = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();
  var nullTask3 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(true,
      [nullTask1, nullTask2, nullTask3]);

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
 * Tests parallel Composite task's error handling.
 */
CompositeTaskTest.prototype.parallelErrorHandling = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();
  var nullTask3 = new taskrunner.NullTask();
  var nullTask4 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(true,
      [nullTask1, nullTask2, nullTask3, nullTask4]);

  this.attachMockCallbacks_(task);

  expectCall(this.startedCallback_)(task);

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask3.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask4.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask1.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask3.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask4.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask2.error();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.ERRORED, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask3.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask4.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask3.complete();

  expectCall(this.erroredCallback_)(task);

  nullTask4.error();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.ERRORED, nullTask2.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask3.getState());
  expectEq(taskrunner.TaskState.ERRORED, nullTask4.getState());
  expectEq(taskrunner.TaskState.ERRORED, task.getState());
};


/**
 * Tests parallel Composite task's interruption handling.
 */
CompositeTaskTest.prototype.parallelInterruptionHandling = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(true, [nullTask1, nullTask2]);

  this.attachMockCallbacks_(task);
  this.attachMockCallbacks_(nullTask1);
  this.attachMockCallbacks_(nullTask2);

  expectCall(this.startedCallback_)(nullTask1);
  expectCall(this.startedCallback_)(nullTask2);
  expectCall(this.startedCallback_)(task);

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  expectCall(this.interruptedCallback_)(nullTask1);
  expectCall(this.interruptedCallback_)(nullTask2);
  expectCall(this.interruptedCallback_)(task);

  task.interrupt();

  expectEq(taskrunner.TaskState.INTERRUPTED, nullTask1.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, nullTask2.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, task.getState());
};


/**
 * Tests parallel Composite task's reset handling.
 */
CompositeTaskTest.prototype.parallelResetHandling = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(true, [nullTask1, nullTask2]);

  task.run();
  nullTask1.complete();
  task.interrupt();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, nullTask2.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, task.getState());

  task.reset();

  expectEq(taskrunner.TaskState.INITIALIZED, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, task.getState());

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());
};


/**
 * Tests serial Composite task from run() to complete.
 */
CompositeTaskTest.prototype.serialSuccessfulCompletion = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();
  var nullTask3 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(false,
      [nullTask1, nullTask2, nullTask3]);

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
 * Tests serial Composite task's error handling.
 */
CompositeTaskTest.prototype.serialErrorHandling = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(false, [nullTask1, nullTask2]);

  this.attachMockCallbacks_(task);

  expectCall(this.startedCallback_)(task);

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  expectCall(this.erroredCallback_)(task);

  nullTask1.error();

  expectEq(taskrunner.TaskState.ERRORED, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.ERRORED, task.getState());
};


/**
 * Tests serial Composite task's interruption handling.
 */
CompositeTaskTest.prototype.serialInterruptionHandling = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(false, [nullTask1, nullTask2]);

  this.attachMockCallbacks_(task);
  this.attachMockCallbacks_(nullTask1);
  this.attachMockCallbacks_(nullTask2);

  expectCall(this.startedCallback_)(nullTask1);
  expectCall(this.startedCallback_)(task);

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  expectCall(this.interruptedCallback_)(nullTask1);
  expectCall(this.interruptedCallback_)(task);

  task.interrupt();

  expectEq(taskrunner.TaskState.INTERRUPTED, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, task.getState());
};


/**
 * Tests serial Composite task's reset handling.
 */
CompositeTaskTest.prototype.serialResetHandling = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();
  var nullTask3 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(false,
      [nullTask1, nullTask2, nullTask3]);

  task.run();
  nullTask1.complete();
  task.interrupt();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, nullTask2.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask3.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, task.getState());

  task.reset();

  expectEq(taskrunner.TaskState.INITIALIZED, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask3.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, task.getState());

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask3.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());
};


/**
 * Completing a child task while the composite is interrupted does not run
 * the next task. This test covers an edge-case where a child task's completion
 * handler causes the parent composite to be interrupted. We're testing to
 * ensure that the completion of the child task doesn't un-pause the composite.
 */
CompositeTaskTest.prototype.serialDoesNotRunNextTaskIfInterrupted = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(false, [nullTask1, nullTask2]);

  nullTask1.completed(function() {
    task.interrupt();
  });

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask1.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, task.getState());

  task.run();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask2.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask2.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Adding a task to a parallel CompositeTask that's running should run the task.
 */
CompositeTaskTest.prototype.parallelAddTaskToRunningComposite = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(true, [nullTask1]);
  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.addTask(nullTask2);

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask1.complete();

  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask2.complete();

  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Adding a task to a serial CompositeTask that's running should run the task.
 */
CompositeTaskTest.prototype.serialAddTaskToRunningComposite = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(false, [nullTask1]);
  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.addTask(nullTask2);

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
 * A child task removed before running the composite should not be run.
 */
CompositeTaskTest.prototype.removeTaskBeforeRunning = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();
  var nullTask3 = new taskrunner.NullTask();
  var nullTask4 = new taskrunner.NullTask();
  var nullTask5 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(true,
      [nullTask1, nullTask2, nullTask3, nullTask4, nullTask5]);
  task.removeTask(nullTask1);
  task.removeTask(nullTask3);
  task.removeTask(nullTask5);
  task.run();

  expectEq(taskrunner.TaskState.INITIALIZED, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask3.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask4.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask5.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());
};


/**
 * A child task removed while the composite is running should not preven the
 * composite from completing once all other children complete.
 */
CompositeTaskTest.prototype.parallelRemoveTaskAtRuntime = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();
  var nullTask3 = new taskrunner.NullTask();
  var nullTask4 = new taskrunner.NullTask();
  var nullTask5 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(true,
      [nullTask1, nullTask2, nullTask3, nullTask4, nullTask5]);
  task.run();
  task.removeTask(nullTask1);
  task.removeTask(nullTask3);
  task.removeTask(nullTask5);

  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask4.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  nullTask2.complete();
  nullTask4.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask2.getState());
  expectEq(taskrunner.TaskState.COMPLETED, nullTask4.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Removing a task within a serial sequence of tasks at runtime should not
 * prevent the sequence from continuing to the next task.
 */
CompositeTaskTest.prototype.serialRemoveCurrentTaskAtRuntime = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(false, [nullTask1, nullTask2]);
  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.removeTask(nullTask1);

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());
};


/**
 * Removing a future task within a serial sequence of tasks at runtime should
 * not prevent the sequence from continuing to the next task.
 */
CompositeTaskTest.prototype.serialRemoveFutureTaskAtRuntime = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();
  var nullTask3 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(false,
      [nullTask1, nullTask2, nullTask3]);
  task.run();

  expectEq(taskrunner.TaskState.RUNNING, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask3.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.removeTask(nullTask2);

  nullTask1.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask3.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());
};


/**
 * Removing the final task within a serial sequence of tasks at runtime should
 * cause the composite to complete.
 */
CompositeTaskTest.prototype.serialRemoveLastTaskAtRuntime = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(false, [nullTask1, nullTask2]);
  task.run();

  nullTask1.complete();

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.removeTask(nullTask2);

  expectEq(taskrunner.TaskState.COMPLETED, nullTask1.getState());
  expectEq(taskrunner.TaskState.RUNNING, nullTask2.getState());
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * Running a composite multiple times does not re-run tasks that have completed.
 */
CompositeTaskTest.prototype.safeToRunMultipleTimes = function() {
  var nullTask1 = new taskrunner.NullTask();

  var task = new taskrunner.CompositeTask(true, [nullTask1]);
  task.run();

  nullTask1.complete();

  this.attachMockCallbacks_(nullTask1);
  this.attachMockCallbacks_(task);

  task.run();
};


/**
 * Composite tasks accurately report the number of internal operations and the
 * number of completed operations.
 */
CompositeTaskTest.prototype.getOperationsCountForNestedTasks = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();
  var nullTask3 = new taskrunner.NullTask();

  var compositeTask1 = new taskrunner.CompositeTask(true);
  var compositeTask2 = new taskrunner.CompositeTask(true);

  compositeTask2.addAllTasks([nullTask2, nullTask3]);

  compositeTask1.addAllTasks([nullTask1, compositeTask2]);
  compositeTask1.run();

  expectEq(3, compositeTask1.getOperationsCount());
  expectEq(0, compositeTask1.getCompletedOperationsCount());

  nullTask1.complete();

  expectEq(3, compositeTask1.getOperationsCount());
  expectEq(1, compositeTask1.getCompletedOperationsCount());

  nullTask2.complete();

  expectEq(3, compositeTask1.getOperationsCount());
  expectEq(2, compositeTask1.getCompletedOperationsCount());

  nullTask3.complete();

  expectEq(3, compositeTask1.getOperationsCount());
  expectEq(3, compositeTask1.getCompletedOperationsCount());
};


/**
 * The current queue of tasks can be flushed.
 */
CompositeTaskTest.prototype.flushQueueAndTriggerCallbacks = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.TestCompositeTask(false, [nullTask1, nullTask2]);

  this.attachMockCallbacks_(task);
  this.attachMockCallbacks_(nullTask1);

  expectCall(this.startedCallback_)(task);
  expectCall(this.startedCallback_)(nullTask1);

  task.run();

  // The current task should be interrupted and the composite completed.
  expectCall(this.interruptedCallback_)(nullTask1);
  expectCall(this.completedCallback_)(task);

  task.flushForTest(false);

  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
};


/**
 * The current queue of tasks can be flushed without triggering completion of
 * the composite. This is a special behavior intended to allow sub-classes
 * additional runtime flexibility.
 */
CompositeTaskTest.prototype.flushQueueWithoutTriggeringCallbacks = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.TestCompositeTask(false, [nullTask1, nullTask2]);

  this.attachMockCallbacks_(task);
  this.attachMockCallbacks_(nullTask1);
  this.attachMockCallbacks_(nullTask2);

  expectCall(this.startedCallback_)(nullTask1);
  expectCall(this.startedCallback_)(task);

  task.run();

  // The currently-running task should be interrupted,
  // But no other callbacks should be invoked.
  // The composite task should still be running once the queue is empty.
  expectCall(this.interruptedCallback_)(nullTask1);

  task.flushForTest(true);

  expectEq(taskrunner.TaskState.RUNNING, task.getState());
};


/**
 * Flush queue when composite is not running should not trigger complete event.
 */
CompositeTaskTest.prototype.flushQueueWhenNotRunning = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();

  var task = new taskrunner.TestCompositeTask(false, [nullTask1, nullTask2]);

  this.attachMockCallbacks_(task);

  expectCall(this.startedCallback_)(task);

  task.flushForTest(false);

  expectCall(this.completedCallback_)(task);

  task.run();
};


/**
 * Flush queue and add new set of child tasks.
 */
CompositeTaskTest.prototype.flushAndRepopulateQueue = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();
  var nullTask3 = new taskrunner.NullTask();
  var nullTask4 = new taskrunner.NullTask();

  var task = new taskrunner.TestCompositeTask(false, [nullTask1, nullTask2]);

  this.attachMockCallbacks_(nullTask1);
  this.attachMockCallbacks_(nullTask2);
  this.attachMockCallbacks_(nullTask3);
  this.attachMockCallbacks_(nullTask4);
  this.attachMockCallbacks_(task);

  expectCall(this.startedCallback_)(nullTask1);
  expectCall(this.startedCallback_)(task);

  task.run();

  expectCall(this.completedCallback_)(nullTask1);
  expectCall(this.startedCallback_)(nullTask2);

  nullTask1.complete();

  expectCall(this.interruptedCallback_)(nullTask2);

  task.flushForTest(true);

  expectCall(this.startedCallback_)(nullTask3);

  task.addAllTasks([nullTask3, nullTask4]);

  expectCall(this.completedCallback_)(nullTask3);
  expectCall(this.startedCallback_)(nullTask4);

  nullTask3.complete();

  expectCall(this.completedCallback_)(nullTask4);
  expectCall(this.completedCallback_)(task);

  nullTask4.complete();
};


/**
 * Serial composite task resumes correctly after a child task has errored.
 */
CompositeTaskTest.prototype.serialResumeAfterSingleChild = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();
  var nullTask3 = new taskrunner.NullTask();

  var task = new taskrunner.TestCompositeTask(false,
      [nullTask1, nullTask2, nullTask3]);

  this.attachMockCallbacks_(nullTask1);
  this.attachMockCallbacks_(nullTask2);
  this.attachMockCallbacks_(nullTask3);
  this.attachMockCallbacks_(task);

  expectCall(this.startedCallback_)(task);
  expectCall(this.startedCallback_)(nullTask1);

  task.run();

  expectCall(this.completedCallback_)(nullTask1);
  expectCall(this.startedCallback_)(nullTask2);

  nullTask1.complete();

  expectCall(this.erroredCallback_)(nullTask2);
  expectCall(this.erroredCallback_)(task);

  nullTask2.error();

  expectCall(this.startedCallback_)(task);
  expectCall(this.startedCallback_)(nullTask2);

  task.run();

  expectCall(this.completedCallback_)(nullTask2);
  expectCall(this.startedCallback_)(nullTask3);

  nullTask2.complete();

  expectCall(this.completedCallback_)(nullTask3);
  expectCall(this.completedCallback_)(task);

  nullTask3.complete();
};


/**
 * Parallel composite task resumes correctly after a child task has errored.
 */
CompositeTaskTest.prototype.parallelResumeAfterErroredChild = function() {
  var nullTask1 = new taskrunner.NullTask();
  var nullTask2 = new taskrunner.NullTask();
  var nullTask3 = new taskrunner.NullTask();

  var task = new taskrunner.TestCompositeTask(true,
      [nullTask1, nullTask2, nullTask3]);

  this.attachMockCallbacks_(nullTask1);
  this.attachMockCallbacks_(nullTask2);
  this.attachMockCallbacks_(nullTask3);
  this.attachMockCallbacks_(task);

  expectCall(this.startedCallback_)(task);
  expectCall(this.startedCallback_)(nullTask1);
  expectCall(this.startedCallback_)(nullTask2);
  expectCall(this.startedCallback_)(nullTask3);

  task.run();

  // A parallel composite task will continue running until all children have
  // completed or errored.
  expectCall(this.erroredCallback_)(nullTask2);

  nullTask2.error();

  expectCall(this.completedCallback_)(nullTask1);

  nullTask1.complete();

  expectCall(this.completedCallback_)(nullTask3);
  expectCall(this.erroredCallback_)(task);

  nullTask3.complete();

  // Restarting the composite should only restart errored tasks.
  // Running tasks should be allowed to complete; completed tasks left alone.
  expectCall(this.startedCallback_)(nullTask2);
  expectCall(this.startedCallback_)(task);

  task.run();

  // Once the remaining inner tasks complete, the composite should complete.
  expectCall(this.completedCallback_)(nullTask2);
  expectCall(this.completedCallback_)(task);

  nullTask2.complete();
};
