goog.require('taskrunner.ClosureTask');
goog.require('taskrunner.TaskState');



/**
 * Tests for ClosureTask class.
 *
 * @constructor
 */
function ClosureTaskTest() {}
registerTestSuite(ClosureTaskTest);


/**
 * Test auto completing upon running a closure task.
 */
ClosureTaskTest.prototype.autoComplete = function() {
  var runImplFn = createMockFunction();
  var closureTask = new taskrunner.ClosureTask(runImplFn, true);

  var executed = false;
  expectCall(runImplFn)().willOnce(function() {
    executed = true;
  });
  closureTask.run();
  expectTrue(executed);
  expectEq(taskrunner.TaskState.COMPLETED, closureTask.getState());
};


/**
 * Test not auto completing upon running a closure task.
 */
ClosureTaskTest.prototype.notAutoComplete = function() {
  var runImplFn = createMockFunction();
  var closureTask = new taskrunner.ClosureTask(runImplFn);

  var executed = false;
  expectCall(runImplFn)().willOnce(function() {
    executed = true;
  });
  closureTask.run();
  expectTrue(executed);
  expectEq(taskrunner.TaskState.RUNNING, closureTask.getState());

  closureTask.complete();
  expectEq(taskrunner.TaskState.COMPLETED, closureTask.getState());
};


/**
 * Test runtime error handling in closure function.
 */
ClosureTaskTest.prototype.handleRuntimeError = function() {
  var runImplFn = createMockFunction();
  var closureTask = new taskrunner.ClosureTask(runImplFn, true);

  var error = new Error('test');
  expectCall(runImplFn)().willOnce(function() {
    throw error;
  });
  closureTask.run();
  expectEq(taskrunner.TaskState.ERRORED, closureTask.getState());
  expectEq(error, closureTask.getData());
  expectEq('test', closureTask.getErrorMessage());
};


/**
 * Test reset and re-run a closure task.
 */
ClosureTaskTest.prototype.resetAndRerun = function() {
  var runImplFn = createMockFunction();
  var closureTask = new taskrunner.ClosureTask(runImplFn);

  expectCall(runImplFn)();

  closureTask.run();

  expectEq(taskrunner.TaskState.RUNNING, closureTask.getState());

  closureTask.complete();

  expectEq(taskrunner.TaskState.COMPLETED, closureTask.getState());

  closureTask.reset();

  expectCall(runImplFn)();

  closureTask.run();

  expectEq(taskrunner.TaskState.RUNNING, closureTask.getState());
};
