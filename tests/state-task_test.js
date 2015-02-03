goog.provide('goog.StateTask.test');
goog.setTestOnly('goog.StateTask.test');

goog.require('taskrunner.ApplicationTask');
goog.require('taskrunner.NullTask');
goog.require('taskrunner.StateTask');
goog.require('taskrunner.TaskState');

describe('goog.StateTask', function() {

  var applicationTask;
  var nullTaskA;
  var nullTaskB;
  
  beforeEach(function() {
    applicationTask = new taskrunner.ApplicationTask();

    nullTaskA = new taskrunner.NullTask();
    nullTaskB = new taskrunner.NullTask();
  });

  it('should run until completed or errored manually, to avoid leaving the application without a state', function() {
    var stateTask = new taskrunner.StateTask(applicationTask);
    stateTask.addTask(nullTaskA);
    stateTask.addTask(nullTaskB);
    stateTask.run();

    expect(stateTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    nullTaskA.complete();
    nullTaskB.complete();

    expect(stateTask.getState()).toBe(taskrunner.TaskState.RUNNING);
  });
});