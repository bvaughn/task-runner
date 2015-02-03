goog.provide('goog.StateTransitioningTask.test');
goog.setTestOnly('goog.StateTransitioningTask.test');

goog.require('taskrunner.ApplicationTask');
goog.require('taskrunner.NullTask');
goog.require('taskrunner.StateTask');
goog.require('taskrunner.StateTransitioningTask');
goog.require('taskrunner.TaskState');

describe('goog.StateTransitioningTask', function() {

  var applicationTask;
  var blockingNullTaskA;
  var blockingNullTaskB;
  var blockingNullTaskC;
  var stateTaskA;
  var stateTaskB;
  var stateTransitioningTask;
  
  beforeEach(function() {
    applicationTask = new taskrunner.ApplicationTask();

    stateTransitioningTask = new taskrunner.StateTransitioningTask(applicationTask);

    stateTaskA = new taskrunner.StateTask();
    stateTaskB = new taskrunner.StateTask();

    blockingNullTaskA = new taskrunner.NullTask();
    blockingNullTaskB = new taskrunner.NullTask();
    blockingNullTaskC = new taskrunner.NullTask();
  });

  it('should fail if not provided a target state', function() {
    applicationTask.enterState(stateTransitioningTask);

    expect(stateTransitioningTask.getState()).toBe(taskrunner.TaskState.ERRORED);
  });

  it('should choose the highest priority state if all blocking tasks succeed', function() {
    stateTransitioningTask.addTargetState(stateTaskA, [blockingNullTaskA, blockingNullTaskB]);
    stateTransitioningTask.addTargetState(stateTaskB, [blockingNullTaskC]);

    applicationTask.enterState(stateTransitioningTask);

    expect(applicationTask.getStateTask()).toBe(stateTransitioningTask);

    expect(stateTransitioningTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(blockingNullTaskA.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(blockingNullTaskB.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(blockingNullTaskC.getState()).toBe(taskrunner.TaskState.RUNNING);

    blockingNullTaskA.complete();
    blockingNullTaskB.complete();
    blockingNullTaskC.complete();

    expect(applicationTask.getStateTask()).toBe(stateTaskA);
  });

  it('should choose the next highest priority state if some blocking tasks fail', function() {
    stateTransitioningTask.addTargetState(stateTaskA, [blockingNullTaskA, blockingNullTaskB]);
    stateTransitioningTask.addTargetState(stateTaskB, [blockingNullTaskC]);

    applicationTask.enterState(stateTransitioningTask);

    expect(applicationTask.getStateTask()).toBe(stateTransitioningTask);

    expect(stateTransitioningTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(blockingNullTaskA.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(blockingNullTaskB.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(blockingNullTaskC.getState()).toBe(taskrunner.TaskState.RUNNING);

    blockingNullTaskA.complete();
    blockingNullTaskB.error();
    blockingNullTaskC.complete();

    expect(applicationTask.getStateTask()).toBe(stateTaskB);
  });

  it('should fail no target states can be transitioned to due to errored blockers', function() {
    stateTransitioningTask.addTargetState(stateTaskA, [blockingNullTaskA, blockingNullTaskB]);
    stateTransitioningTask.addTargetState(stateTaskB, [blockingNullTaskC]);

    applicationTask.enterState(stateTransitioningTask);

    expect(applicationTask.getStateTask()).toBe(stateTransitioningTask);

    expect(stateTransitioningTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(blockingNullTaskA.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(blockingNullTaskB.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(blockingNullTaskC.getState()).toBe(taskrunner.TaskState.RUNNING);

    blockingNullTaskA.complete();
    blockingNullTaskB.error();
    blockingNullTaskC.error();

    expect(stateTransitioningTask.getState()).toBe(taskrunner.TaskState.ERRORED);
  });

  it('should interrupt blockers when interrupted and resume them later', function() {
    stateTransitioningTask.addTargetState(stateTaskA, [blockingNullTaskA, blockingNullTaskB]);
    stateTransitioningTask.addTargetState(stateTaskB, [blockingNullTaskC]);

    applicationTask.enterState(stateTransitioningTask);

    expect(applicationTask.getStateTask()).toBe(stateTransitioningTask);

    expect(stateTransitioningTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(blockingNullTaskA.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(blockingNullTaskB.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(blockingNullTaskC.getState()).toBe(taskrunner.TaskState.RUNNING);

    blockingNullTaskA.complete();

    stateTransitioningTask.interrupt();

    expect(stateTransitioningTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(blockingNullTaskA.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(blockingNullTaskB.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(blockingNullTaskC.getState()).toBe(taskrunner.TaskState.INTERRUPTED);

    stateTransitioningTask.run();

    expect(stateTransitioningTask.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(blockingNullTaskA.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(blockingNullTaskB.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(blockingNullTaskC.getState()).toBe(taskrunner.TaskState.RUNNING);
  });
});