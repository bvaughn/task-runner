goog.provide('goog.ApplicationTask.test');
goog.setTestOnly('goog.ApplicationTask.test');

goog.require('taskrunner.ApplicationTask');
goog.require('taskrunner.NullTask');
goog.require('taskrunner.StateTask');
goog.require('taskrunner.TaskState');

describe('goog.ApplicationTask', function() {

  var applicationTask;
  var stateTaskA;
  var stateTaskB;
  
  beforeEach(function() {
    applicationTask = new taskrunner.ApplicationTask();

    stateTaskA = new taskrunner.StateTask(applicationTask);
    stateTaskB = new taskrunner.StateTask(applicationTask);
  });

  it('should automatically run when the first state is entered', function() {
    applicationTask.enterState(stateTaskA);

    expect(applicationTask.getStateTask()).toBe(stateTaskA);
    expect(applicationTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(stateTaskA.getState()).toBe(taskrunner.TaskState.RUNNING);
  });

  it('should interrupt its current state when a new state is entered', function() {
    applicationTask.enterState(stateTaskA);

    expect(applicationTask.getStateTask()).toBe(stateTaskA);
    expect(applicationTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(stateTaskA.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(stateTaskB.getState()).toBe(taskrunner.TaskState.INITIALIZED);

    applicationTask.enterState(stateTaskB);

    expect(applicationTask.getStateTask()).toBe(stateTaskB);
    expect(applicationTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(stateTaskA.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(stateTaskB.getState()).toBe(taskrunner.TaskState.RUNNING);
  });
});