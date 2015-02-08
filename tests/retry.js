goog.provide('tr.Retry.test');
goog.setTestOnly('tr.Retry.test');

goog.require('goog.testing.MockClock');
goog.require('tr.Retry');
goog.require('tr.Stub');
goog.require('tr.enums.State');

describe('tr.Retry', function() {

  var mockClock;
  
  beforeEach(function() {
    mockClock = new goog.testing.MockClock(true);
  });
  
  afterEach(function() {
    mockClock.uninstall();
  });

  it('should (synchronously) retry in the event of errors when configured to be synchronous', function() {
    var decoratedTask = new tr.Stub();
    var retryOnErrorTask = new tr.Retry(decoratedTask, 3, -1);

    retryOnErrorTask.run();
    expect(decoratedTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.RUNNING);

    // 1st retry
    decoratedTask.error();
    expect(decoratedTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.RUNNING);

    // 2nd retry
    decoratedTask.error();
    expect(decoratedTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.RUNNING);

    // 3rd retry
    decoratedTask.error();
    expect(decoratedTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.RUNNING);

    // Error
    decoratedTask.error();
    expect(decoratedTask.getState()).toBe(tr.enums.State.ERRORED);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should (asynchronously) retry in the event of errors when configured to be asynchronous', function() {
    var decoratedTask = new tr.Stub();
    var retryOnErrorTask = new tr.Retry(decoratedTask, 2, 10);

    retryOnErrorTask.run();
    expect(decoratedTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.RUNNING);

    // 1st retry
    decoratedTask.error();
    expect(decoratedTask.getState()).toBe(tr.enums.State.ERRORED);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.RUNNING);
    mockClock.tick(5);
    expect(decoratedTask.getState()).toBe(tr.enums.State.ERRORED);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.RUNNING);
    mockClock.tick(5);
    expect(decoratedTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.RUNNING);

    // 2nd retry
    decoratedTask.error();
    expect(decoratedTask.getState()).toBe(tr.enums.State.ERRORED);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.RUNNING);
    mockClock.tick(10);
    expect(decoratedTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.RUNNING);

    // Complete
    decoratedTask.complete();
    expect(decoratedTask.getState()).toBe(tr.enums.State.COMPLETED);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should reset retry count on interruption', function() {
    var decoratedTask = new tr.Stub();
    var retryOnErrorTask = new tr.Retry(decoratedTask, 1, -1);

    retryOnErrorTask.run();
    expect(decoratedTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.RUNNING);

    decoratedTask.error();
    expect(retryOnErrorTask.getRetries()).toBe(1);
    expect(decoratedTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.RUNNING);

    retryOnErrorTask.interrupt();
    expect(retryOnErrorTask.getRetries()).toBe(0);
    expect(decoratedTask.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.INTERRUPTED);
  });

  it('should not complete if decorated task completes while retry task is interrupted', function() {
    var decoratedTask = new tr.Stub();
    var retryOnErrorTask = new tr.Retry(decoratedTask, 1, -1);

    retryOnErrorTask.run();
    retryOnErrorTask.interrupt();
    expect(decoratedTask.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.INTERRUPTED);

    // Completing the decorated task while the retry task in interrupted.
    decoratedTask.run();
    decoratedTask.complete();
    expect(decoratedTask.getState()).toBe(tr.enums.State.COMPLETED);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.INTERRUPTED);

    // Retry task should auto complete upon rerun.
    retryOnErrorTask.run();
    expect(decoratedTask.getState()).toBe(tr.enums.State.COMPLETED);
    expect(retryOnErrorTask.getState()).toBe(tr.enums.State.COMPLETED);
  });
});