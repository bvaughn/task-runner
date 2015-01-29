goog.provide('goog.AbstractTask.test');
goog.setTestOnly('goog.AbstractTask.test');

goog.require('taskrunner.AbstractTask');
goog.require('taskrunner.NullTask');
goog.require('taskrunner.TaskEvent');
goog.require('taskrunner.TaskState');



/**
 * Tests for AbstractTask class.
 *
 * Some of the following tests make use of NullTask for convenience purposes.
 *
 * @constructor
 */
function AbstractTaskTest() {}


/**
 * Test task names.
 */
AbstractTaskTest.prototype.taskName = function() {
  var fooTask = new taskrunner.AbstractTask('foo');
  var barTask = new taskrunner.AbstractTask('bar');

  expectEq('foo', fooTask.getTaskName());
  expectEq('bar', barTask.getTaskName());
};


/**
 * Test that task IDs are unique.
 */
AbstractTaskTest.prototype.uniqueID = function() {
  var task1 = new taskrunner.AbstractTask();
  var task2 = new taskrunner.AbstractTask();

  expectNe(task1.getUniqueID(), task2.getUniqueID());
};


/**
 * Test that runImpl function must be implemented to run a task.
 */
AbstractTaskTest.prototype.runImplRequired = function() {
  var task = new taskrunner.AbstractTask();

  expectThat(function() {
    task.run();
  }, throwsError(/.+/));
};


/**
 * Test that trying to complete a non-running task throws an error.
 */
AbstractTaskTest.prototype.taskMustBeRunningToComplete = function() {
  var task = new taskrunner.NullTask();

  expectThat(function() {
    task.complete();
  }, throwsError(/Cannot complete an inactive task\./));
};


/**
 * Test that trying to error a non-running task throws an error.
 */
AbstractTaskTest.prototype.taskMustBeRunningToError = function() {
  var task = new taskrunner.NullTask();

  expectThat(function() {
    task.error();
  }, throwsError(/Cannot error an inactive task\./));
};


/**
 * Test start callback handlers.
 */
AbstractTaskTest.prototype.startCallbacks = function() {
  var task = new taskrunner.NullTask();
  var callback1 = createMockFunction();
  var callback2 = createMockFunction();

  task.started(callback1);
  task.started(callback2);

  expectCall(callback1)(task);
  expectCall(callback2)(task);

  task.run();
};


/**
 * Test complete callback handlers.
 */
AbstractTaskTest.prototype.completeCallbacks = function() {
  var task = new taskrunner.NullTask();
  var callback1 = createMockFunction();
  var callback2 = createMockFunction();
  var data = {};

  task.completed(callback1);
  task.completed(callback2);

  task.run();

  expectCall(callback1)(task);
  expectCall(callback2)(task);

  task.complete(data);
};


/**
 * Test error callback handlers.
 */
AbstractTaskTest.prototype.errorCallbacks = function() {
  var task = new taskrunner.NullTask();
  var callback1 = createMockFunction();
  var callback2 = createMockFunction();
  var data = {};
  var message = 'foobar';

  task.errored(callback1);
  task.errored(callback2);

  task.run();

  expectCall(callback1)(task);
  expectCall(callback2)(task);

  task.error(data, message);
};


/**
 * Test final callback handlers.
 */
AbstractTaskTest.prototype.finalCallbacks = function() {
  var task = new taskrunner.NullTask();
  var callback1 = createMockFunction();
  var callback2 = createMockFunction();

  task.final(callback1);
  task.final(callback2);

  task.run();

  expectCall(callback1)(task);
  expectCall(callback2)(task);

  task.complete();
};


/**
 * Test adding callback with scope.
 */
AbstractTaskTest.prototype.callbackWithScope = function() {
  var task = new taskrunner.NullTask();
  task.run();

  var callback = createMockFunction();
  var scope = {};
  task.on(taskrunner.TaskEvent.COMPLETED, callback, scope);

  expectCall(callback)(task).willOnce(function(t) {
    expectEq(scope, this);
  });
  task.complete();
};


/**
 * Test removing callbacks.
 */
AbstractTaskTest.prototype.removingCallbacks = function() {
  var task = new taskrunner.NullTask();
  task.run();

  var callback = createMockFunction();
  var scope = {};
  task.on(taskrunner.TaskEvent.COMPLETED, callback, scope);

  task.off(taskrunner.TaskEvent.COMPLETED, callback); // missing scope
  expectCall(callback)(task);
  task.complete();

  task.reset();
  task.run();

  task.off(taskrunner.TaskEvent.COMPLETED, callback, scope);
  task.complete();
};


/**
 * Test preventing duplicate callbacks.
 */
AbstractTaskTest.prototype.preventDuplicateCallbacks = function() {
  var task = new taskrunner.NullTask();
  var startCallback = createMockFunction();
  var errorCallback = createMockFunction();
  var completeCallback = createMockFunction();
  var finalCallback = createMockFunction();

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

  expectCall(startCallback)(task);
  task.run();

  expectCall(errorCallback)(task);
  expectCall(finalCallback)(task);
  task.error();

  task.reset();

  expectCall(startCallback)(task);
  task.run();

  expectCall(completeCallback)(task);
  expectCall(finalCallback)(task);
  task.complete();
};


/**
 * Test adding the same callback but with duplicate scopes.
 */
AbstractTaskTest.prototype.sameCallbackWithDifferentScopes = function() {
  var task = new taskrunner.NullTask();
  task.run();

  var callback = createMockFunction();
  var scope1 = {};
  var scope2 = {};
  task.final(callback, scope1).
       final(callback, scope2);

  expectCall(callback)(task).times(2);
  task.complete();
};


/**
 * Test that completed operations count are updated when a task is completed.
 */
AbstractTaskTest.prototype.operationsCount = function() {
  var task = new taskrunner.NullTask();
  expectEq(1, task.getOperationsCount());
  expectEq(0, task.getCompletedOperationsCount());

  task.run();
  task.complete();

  expectEq(1, task.getOperationsCount());
  expectEq(1, task.getCompletedOperationsCount());
};


/**
 * Test resetting a completed task and its state changes.
 */
AbstractTaskTest.prototype.resetCompletedTask = function() {
  var task = new taskrunner.NullTask();
  var data = {};
  expectEq(taskrunner.TaskState.INITIALIZED, task.getState());

  task.run();
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.complete(data);
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
  expectEq(data, task.getData());

  task.reset();
  expectEq(taskrunner.TaskState.INITIALIZED, task.getState());
  expectThat(task.getData(), isUndefined);
};


/**
 * Test resetting an errored task and its state changes.
 */
AbstractTaskTest.prototype.resetErroredTask = function() {
  var task = new taskrunner.NullTask();
  var data = {};
  var message = 'foobar';
  expectEq(taskrunner.TaskState.INITIALIZED, task.getState());

  task.run();
  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.error(data, message);
  expectEq(taskrunner.TaskState.ERRORED, task.getState());
  expectEq(data, task.getData());
  expectEq(message, task.getErrorMessage());

  task.reset();
  expectEq(taskrunner.TaskState.INITIALIZED, task.getState());
  expectThat(task.getData(), isUndefined);
  expectThat(task.getErrorMessage(), isUndefined);
};


/**
 * Test that resetting a running task throws an error.
 */
AbstractTaskTest.prototype.cannotResetARunningTask = function() {
  var task = new taskrunner.NullTask();
  task.run();

  expectThat(function() {
    task.reset();
  }, throwsError(/Cannot reset a running task\./));
};


/**
 * Test that rerunning a running task throws an error.
 */
AbstractTaskTest.prototype.cannotRunARunningTask = function() {
  var task = new taskrunner.NullTask();
  task.run();

  expectThat(function() {
    task.run();
  }, throwsError(/Cannot run a running task\./));
};


/**
 * Test rerunning a complted task.
 */
AbstractTaskTest.prototype.rerunAfterComplte = function() {
  var task = new taskrunner.NullTask();
  var data = {};

  task.run();
  task.complete(data);
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
  expectEq(data, task.getData());

  task.run();
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
  expectEq(data, task.getData());
};


/**
 * Test rerunning an errored task.
 */
AbstractTaskTest.prototype.rerunAfterError = function() {
  var task = new taskrunner.NullTask();
  var data = {};
  var message = 'foobar';

  task.run();
  task.error(data, message);
  expectEq(taskrunner.TaskState.ERRORED, task.getState());
  expectEq(data, task.getData());
  expectEq(message, task.getErrorMessage());

  task.run();
  expectEq(taskrunner.TaskState.RUNNING, task.getState());
  expectThat(task.getData(), isUndefined);
  expectThat(task.getErrorMessage(), isUndefined);

  task.complete(data);
  expectEq(taskrunner.TaskState.COMPLETED, task.getState());
  expectEq(data, task.getData());
};


/**
 * Tasks can only be interrupted when they are running.
 */
AbstractTaskTest.prototype.onlyInterruptWhenRunning = function() {
  var task = new taskrunner.NullTask();

  expectThat(function() {
    task.interrupt();
  }, throwsError(/Cannot interrupt a task that is not running\./));
};


/**
 * Tasks can be interrupted and resumed.
 */
AbstractTaskTest.prototype.interruptAndResume = function() {
  var task = new taskrunner.NullTask();
  task.run();

  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.interrupt();

  expectEq(taskrunner.TaskState.INTERRUPTED, task.getState());

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, task.getState());
};


/**
 * Interruption callbacks are invoked when a task is interrupted.
 */
AbstractTaskTest.prototype.interruptCallback = function() {
  var task = new taskrunner.NullTask();
  task.run();

  var callback1 = createMockFunction();
  var callback2 = createMockFunction();

  task.interrupted(callback1);
  task.interrupted(callback2);

  expectCall(callback1)(task);
  expectCall(callback2)(task);

  task.interrupt();
};


/**
 * Callbacks that have been removed should not be trigged.
 */
AbstractTaskTest.prototype.removedCallbacksAreNotCalled = function() {
  var task = new taskrunner.NullTask();

  var callback1 = createMockFunction();
  var callback2 = createMockFunction();

  task.started(callback1, task);
  task.started(callback2, task);

  task.off(taskrunner.TaskEvent.STARTED, callback1, task);

  expectCall(callback2)(task);

  task.run();
};


/**
 * Callbacks will only be triggered once per event even if added multiple times.
 */
AbstractTaskTest.prototype.callbacksAreOnlyCalledOnce = function() {
  var task = new taskrunner.NullTask();

  var callback = createMockFunction();

  task.started(callback, task);
  task.started(callback, task);

  expectCall(callback)(task).times(1);

  task.run();
};


/**
 * Callbacks will be executed on the proper scope, if provided.
 */
AbstractTaskTest.prototype.callbacksRespectScope = function() {
  var task = new taskrunner.NullTask();

  var that = {};
  var callback = function() {
    expectEq(that, this);
  };

  task.started(callback, that);
  task.run();
};


/**
 * Callbacks will respect a scope, if provided. The same callback may be reused
 * multiple times if different scopes are provided.
 */
AbstractTaskTest.prototype.callbacksCanSharedWithDifferentScopes = function() {
  var task = new taskrunner.NullTask();

  var scope = {};

  var callback = createMockFunction();

  task.started(callback, task);
  task.started(callback, scope);
  task.started(callback);

  expectCall(callback)(task).times(3);

  task.run();
};


/**
 * A task should resume after an interrupting task completes.
 */
AbstractTaskTest.prototype.interruptForTaskThatCompletes = function() {
  var task = new taskrunner.NullTask();
  task.run();

  var interruptingTask = new taskrunner.NullTask();
  interruptingTask.run();

  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.interruptForTask(interruptingTask);

  expectEq(taskrunner.TaskState.INTERRUPTED, task.getState());
  expectEq(taskrunner.TaskState.RUNNING, interruptingTask.getState());

  interruptingTask.complete();

  expectEq(taskrunner.TaskState.RUNNING, task.getState());
  expectEq(taskrunner.TaskState.COMPLETED, interruptingTask.getState());
};


/**
 * A task should error after an interrupting task errors.
 */
AbstractTaskTest.prototype.interruptForTaskThatErrors = function() {
  var task = new taskrunner.NullTask();
  task.run();

  var interruptingTask = new taskrunner.NullTask();
  interruptingTask.run();

  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.interruptForTask(interruptingTask);

  expectEq(taskrunner.TaskState.INTERRUPTED, task.getState());
  expectEq(taskrunner.TaskState.RUNNING, interruptingTask.getState());

  interruptingTask.error();

  expectEq(taskrunner.TaskState.ERRORED, task.getState());
  expectEq(taskrunner.TaskState.ERRORED, interruptingTask.getState());
};


/**
 * A task can be manually re-started after being interrupted by another task.
 */
AbstractTaskTest.prototype.interruptedByMultipleTasks = function() {
  var task = new taskrunner.NullTask();
  task.run();

  var interruptingTask = new taskrunner.NullTask();
  interruptingTask.run();

  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.interruptForTask(interruptingTask);

  expectEq(taskrunner.TaskState.INTERRUPTED, task.getState());

  task.run();

  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  interruptingTask.complete();

  expectEq(taskrunner.TaskState.RUNNING, task.getState());
};


/**
 * A task does not try to run its interrupted task.
 */
AbstractTaskTest.prototype.interruptingTaskIsNotAutoRun = function() {
  var task = new taskrunner.NullTask();
  task.run();

  var interruptingTask = new taskrunner.NullTask();

  expectEq(taskrunner.TaskState.RUNNING, task.getState());

  task.interruptForTask(interruptingTask);

  expectEq(taskrunner.TaskState.INTERRUPTED, task.getState());
  expectEq(taskrunner.TaskState.INITIALIZED, interruptingTask.getState());

  interruptingTask.run();
  interruptingTask.complete();

  expectEq(taskrunner.TaskState.RUNNING, task.getState());
};
