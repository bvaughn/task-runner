goog.provide('tr.StopOnSuccess.test');
goog.setTestOnly('tr.StopOnSuccess.test');

goog.require('tr.StopOnSuccess');
goog.require('tr.Closure');
goog.require('tr.Stub');
goog.require('tr.enums.State');

describe('tr.StopOnSuccess', function() {

  var stubTaskA, stubTaskB, stubTaskC;
  var stopOnSuccess;

  beforeEach(function() {
    stubTaskA = new tr.Stub(false, "StubA");
    stubTaskB = new tr.Stub(false, "StubB");

    stopOnSuccess = new tr.StopOnSuccess([stubTaskA, stubTaskB]);
  });

  it('should not execute any subsequent children once one completes', function() {
    stopOnSuccess.run();

    expect(stopOnSuccess.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskA.complete();

    expect(stopOnSuccess.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskA.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);
  });

  it('should complete if at least one child completes, even if others error', function() {
    stopOnSuccess.run();

    expect(stopOnSuccess.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskA.error();

    expect(stopOnSuccess.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.RUNNING);

    stubTaskB.complete();

    expect(stopOnSuccess.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should error if no children complete', function() {
    stopOnSuccess.run();

    expect(stopOnSuccess.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskA.error();

    expect(stopOnSuccess.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.RUNNING);

    stubTaskB.error();

    expect(stopOnSuccess.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should return a completed count of all tasks once one has completed', function() {
    stopOnSuccess.run();

    expect(stopOnSuccess.getOperationsCount()).toBe(2);
    expect(stopOnSuccess.getCompletedOperationsCount()).toBe(0);

    stubTaskA.complete();

    expect(stopOnSuccess.getOperationsCount()).toBe(2);
    expect(stopOnSuccess.getCompletedOperationsCount()).toBe(2);
  });
});