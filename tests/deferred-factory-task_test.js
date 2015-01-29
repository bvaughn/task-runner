goog.provide('goog.DeferredFactoryTask.test');
goog.setTestOnly('goog.DeferredFactoryTask.test');

goog.require('taskrunner.DeferredFactoryTask');
goog.require('taskrunner.NullTask');
goog.require('taskrunner.TaskState');



/**
 * Tests for DeferredFactoryTask class.
 *
 * @constructor
 */
function DeferredFactoryTaskTest() {}


/**
 * Tests creating DeferredFactoryTask without scope and arguments.
 */
DeferredFactoryTaskTest.prototype.taskFactoryFnWithoutArgs = function() {
  var taskFactoryFn = createMockFunction();
  var deferredFactoryTask = new taskrunner.DeferredFactoryTask(taskFactoryFn);
  expectThat(deferredFactoryTask.getDecoratedTask(), isNull);

  expectCall(taskFactoryFn)().willOnce(returnWith(new taskrunner.NullTask()));
  deferredFactoryTask.run();
  expectThat(deferredFactoryTask.getDecoratedTask(), not(isNull));
};


/**
 * Tests creating DeferredFactoryTask with scope and arguments.
 */
DeferredFactoryTaskTest.prototype.taskFactoryFnWithArgs = function() {
  var taskFactoryFn = createMockFunction();
  var deferredFactoryTask = new taskrunner.DeferredFactoryTask(
      taskFactoryFn, {}, [1, 2, 3]);
  expectThat(deferredFactoryTask.getDecoratedTask(), isNull);

  expectCall(taskFactoryFn)(1, 2, 3).willOnce(returnWith(
      new taskrunner.NullTask()));
  deferredFactoryTask.run();
  expectThat(deferredFactoryTask.getDecoratedTask(), not(isNull));
};


/**
 * Tests completing a DeferredFactoryTask through the deferred task.
 */
DeferredFactoryTaskTest.prototype.completingTask = function() {
  var taskFactoryFn = createMockFunction();
  var deferredFactoryTask = new taskrunner.DeferredFactoryTask(taskFactoryFn);

  var stubTask;
  expectCall(taskFactoryFn)().willOnce(function() {
    stubTask = new taskrunner.NullTask();
    return stubTask;
  });
  deferredFactoryTask.run();
  expectEq(taskrunner.TaskState.RUNNING, deferredFactoryTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, stubTask.getState());

  stubTask.complete();
  expectEq(taskrunner.TaskState.COMPLETED, deferredFactoryTask.getState());
  expectEq(taskrunner.TaskState.COMPLETED, stubTask.getState());
};


/**
 * Tests erroring a DeferredFactoryTask through the deferred task.
 */
DeferredFactoryTaskTest.prototype.erroringTask = function() {
  var taskFactoryFn = createMockFunction();
  var deferredFactoryTask = new taskrunner.DeferredFactoryTask(taskFactoryFn);

  var stubTask;
  expectCall(taskFactoryFn)().willOnce(function() {
    stubTask = new taskrunner.NullTask();
    return stubTask;
  });
  deferredFactoryTask.run();
  expectEq(taskrunner.TaskState.RUNNING, deferredFactoryTask.getState());
  expectEq(taskrunner.TaskState.RUNNING, stubTask.getState());

  stubTask.error();
  expectEq(taskrunner.TaskState.ERRORED, deferredFactoryTask.getState());
  expectEq(taskrunner.TaskState.ERRORED, stubTask.getState());
};



/**
 * Tests that resetting a DeferredFactoryTask clears the defered task reference.
 */
DeferredFactoryTaskTest.prototype.resettingTask = function() {
  var taskFactoryFn = createMockFunction();
  var deferredFactoryTask = new taskrunner.DeferredFactoryTask(taskFactoryFn);

  var stubTask;
  expectCall(taskFactoryFn)().willOnce(function() {
    stubTask = new taskrunner.NullTask(true);
    return stubTask;
  });
  deferredFactoryTask.run();

  deferredFactoryTask.reset();
  expectEq(taskrunner.TaskState.INITIALIZED, deferredFactoryTask.getState());
  expectThat(deferredFactoryTask.getDecoratedTask(), isNull);
};



/**
 * Tests recreating deferred task after error.
 */
DeferredFactoryTaskTest.prototype.recreateDeferredTaskAfterError = function() {
  var taskFactoryFn = createMockFunction();
  var deferredFactoryTask = new taskrunner.DeferredFactoryTask(taskFactoryFn);
  deferredFactoryTask.recreateDeferredTaskAfterError(true);

  var stubTask;
  expectCall(taskFactoryFn)().willOnce(function() {
    stubTask = new taskrunner.NullTask();
    return stubTask;
  });
  deferredFactoryTask.run();

  stubTask.error();
  expectEq(taskrunner.TaskState.ERRORED, deferredFactoryTask.getState());
  expectEq(taskrunner.TaskState.ERRORED, stubTask.getState());

  expectCall(taskFactoryFn)().willOnce(returnWith(new taskrunner.NullTask()));
  deferredFactoryTask.run();
  expectNe(stubTask, deferredFactoryTask.getDecoratedTask());
};



/**
 * Tests not recreating deferred task after error.
 */
DeferredFactoryTaskTest.prototype.notRecreateDeferredTaskAfterError =
    function() {
  var taskFactoryFn = createMockFunction();
  var deferredFactoryTask = new taskrunner.DeferredFactoryTask(taskFactoryFn);
  deferredFactoryTask.recreateDeferredTaskAfterError(false);

  var stubTask;
  expectCall(taskFactoryFn)().willOnce(function() {
    stubTask = new taskrunner.NullTask();
    return stubTask;
  });
  deferredFactoryTask.run();

  stubTask.error();
  expectEq(taskrunner.TaskState.ERRORED, deferredFactoryTask.getState());
  expectEq(taskrunner.TaskState.ERRORED, stubTask.getState());

  deferredFactoryTask.run();
  expectEq(stubTask, deferredFactoryTask.getDecoratedTask());
};


/**
 * Tests completing deferred task during interruption.
 */
DeferredFactoryTaskTest.prototype.completingDeferredTaskDuringInterruption =
    function() {
  var taskFactoryFn = createMockFunction();
  var deferredFactoryTask = new taskrunner.DeferredFactoryTask(taskFactoryFn);
  deferredFactoryTask.recreateDeferredTaskAfterError(false);

  var stubTask;
  expectCall(taskFactoryFn)().willOnce(function() {
    stubTask = new taskrunner.NullTask();
    return stubTask;
  });
  deferredFactoryTask.run();
  deferredFactoryTask.interrupt();
  expectEq(taskrunner.TaskState.INTERRUPTED, deferredFactoryTask.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, stubTask.getState());

  // Completing the deferred task while the factory task task in interrupted.
  stubTask.run();
  stubTask.complete();
  expectEq(taskrunner.TaskState.COMPLETED, stubTask.getState());
  expectEq(taskrunner.TaskState.INTERRUPTED, deferredFactoryTask.getState());

  // Factory task should auto complete upon rerun.
  deferredFactoryTask.run();
  expectEq(taskrunner.TaskState.COMPLETED, stubTask.getState());
  expectEq(taskrunner.TaskState.COMPLETED, deferredFactoryTask.getState());
};
