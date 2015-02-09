goog.provide('tr.app.TransitionState.test');
goog.setTestOnly('tr.app.TransitionState.test');

goog.require('tr.app.Application');
goog.require('tr.Stub');
goog.require('tr.app.State');
goog.require('tr.app.TransitionState');
goog.require('tr.enums.State');

describe('tr.app.TransitionState', function() {

  var application;
  var blockingNullTaskA;
  var blockingNullTaskB;
  var blockingNullTaskC;
  var stateTaskA;
  var stateTaskB;
  var stateTransitioningTask;
  
  beforeEach(function() {
    application = new tr.Application();

    stateTransitioningTask = new tr.app.TransitionState(application);

    stateTaskA = new tr.app.State();
    stateTaskB = new tr.app.State();

    blockingNullTaskA = new tr.Stub();
    blockingNullTaskB = new tr.Stub();
    blockingNullTaskC = new tr.Stub();
  });

  it('should fail if not provided a target state', function() {
    application.enterState(stateTransitioningTask);

    expect(stateTransitioningTask.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should choose the highest priority state if all blocking tasks succeed', function() {
    stateTransitioningTask.addTargetState(stateTaskA, [blockingNullTaskA, blockingNullTaskB]);
    stateTransitioningTask.addTargetState(stateTaskB, [blockingNullTaskC]);

    application.enterState(stateTransitioningTask);

    expect(application.getState()).toBe(stateTransitioningTask);

    expect(stateTransitioningTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockingNullTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockingNullTaskB.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockingNullTaskC.getState()).toBe(tr.enums.State.RUNNING);

    blockingNullTaskA.complete();
    blockingNullTaskB.complete();
    blockingNullTaskC.complete();

    expect(application.getState()).toBe(stateTaskA);
  });

  it('should choose the next highest priority state if some blocking tasks fail', function() {
    stateTransitioningTask.addTargetState(stateTaskA, [blockingNullTaskA, blockingNullTaskB]);
    stateTransitioningTask.addTargetState(stateTaskB, [blockingNullTaskC]);

    application.enterState(stateTransitioningTask);

    expect(application.getState()).toBe(stateTransitioningTask);

    expect(stateTransitioningTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockingNullTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockingNullTaskB.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockingNullTaskC.getState()).toBe(tr.enums.State.RUNNING);

    blockingNullTaskA.complete();
    blockingNullTaskB.error();
    blockingNullTaskC.complete();

    expect(application.getState()).toBe(stateTaskB);
  });

  it('should fail no target states can be transitioned to due to errored blockers', function() {
    stateTransitioningTask.addTargetState(stateTaskA, [blockingNullTaskA, blockingNullTaskB]);
    stateTransitioningTask.addTargetState(stateTaskB, [blockingNullTaskC]);

    application.enterState(stateTransitioningTask);

    expect(application.getState()).toBe(stateTransitioningTask);

    expect(stateTransitioningTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockingNullTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockingNullTaskB.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockingNullTaskC.getState()).toBe(tr.enums.State.RUNNING);

    blockingNullTaskA.complete();
    blockingNullTaskB.error();
    blockingNullTaskC.error();

    expect(stateTransitioningTask.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should interrupt blockers when interrupted and resume them later', function() {
    stateTransitioningTask.addTargetState(stateTaskA, [blockingNullTaskA, blockingNullTaskB]);
    stateTransitioningTask.addTargetState(stateTaskB, [blockingNullTaskC]);

    application.enterState(stateTransitioningTask);

    expect(application.getState()).toBe(stateTransitioningTask);

    expect(stateTransitioningTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockingNullTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockingNullTaskB.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockingNullTaskC.getState()).toBe(tr.enums.State.RUNNING);

    blockingNullTaskA.complete();

    stateTransitioningTask.interrupt();

    expect(stateTransitioningTask.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(blockingNullTaskA.getState()).toBe(tr.enums.State.COMPLETED);
    expect(blockingNullTaskB.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(blockingNullTaskC.getState()).toBe(tr.enums.State.INTERRUPTED);

    stateTransitioningTask.run();

    expect(stateTransitioningTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockingNullTaskA.getState()).toBe(tr.enums.State.COMPLETED);
    expect(blockingNullTaskB.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockingNullTaskC.getState()).toBe(tr.enums.State.RUNNING);
  });
});