goog.provide('tr.Timeout.test');
goog.setTestOnly('tr.Timeout.test');

goog.require('goog.testing.MockClock');
goog.require('tr.Stub');
goog.require('tr.Timeout');
goog.require('tr.enums.State');

describe('tr.Timeout', function() {

  var mockClock;
  
  beforeEach(function() {
    mockClock = new goog.testing.MockClock(true);
  });
  
  afterEach(function() {
    mockClock.uninstall();
  });

  it('should complete if decorated task completes within timeout', function() {
    var decoratedTask = new tr.Stub();
    var timeoutTask = new tr.Timeout(decoratedTask, 1000);

    timeoutTask.run();
    expect(decoratedTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(timeoutTask.getState()).toBe(tr.enums.State.RUNNING);

    mockClock.tick(500);

    decoratedTask.complete();
    expect(decoratedTask.getState()).toBe(tr.enums.State.COMPLETED);
    expect(timeoutTask.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should error if decorated task errors within timeout', function() {
    var decoratedTask = new tr.Stub();
    var timeoutTask = new tr.Timeout(decoratedTask, 1000);

    timeoutTask.run();
    expect(decoratedTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(timeoutTask.getState()).toBe(tr.enums.State.RUNNING);

    mockClock.tick(500);

    decoratedTask.error();
    expect(decoratedTask.getState()).toBe(tr.enums.State.ERRORED);
    expect(timeoutTask.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should error if decorated task does not complete within timeout', function() {
    var decoratedTask = new tr.Stub();
    var timeoutTask = new tr.Timeout(decoratedTask, 1000);

    timeoutTask.run();
    expect(decoratedTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(timeoutTask.getState()).toBe(tr.enums.State.RUNNING);

    mockClock.tick(1500);
    expect(decoratedTask.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(timeoutTask.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should not error if timeout is exceeded after wrapper task is interrupted', function() {
    var decoratedTask = new tr.Stub();
    var timeoutTask = new tr.Timeout(decoratedTask, 1000);

    timeoutTask.run();
    expect(decoratedTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(timeoutTask.getState()).toBe(tr.enums.State.RUNNING);

    mockClock.tick(500);
    timeoutTask.interrupt();

    timeoutTask.run();
    mockClock.tick(500);
    expect(decoratedTask.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(timeoutTask.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should not complete if a decorated task completes while wrapper task is interrupted', function() {
    var decoratedTask = new tr.Stub();
    var timeoutTask = new tr.Timeout(decoratedTask, 1000);

    timeoutTask.run();
    timeoutTask.interrupt();
    expect(decoratedTask.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(timeoutTask.getState()).toBe(tr.enums.State.INTERRUPTED);

    // Completing the decorated task while the timeout task in interrupted.
    decoratedTask.run();
    decoratedTask.complete();
    expect(decoratedTask.getState()).toBe(tr.enums.State.COMPLETED);
    expect(timeoutTask.getState()).toBe(tr.enums.State.INTERRUPTED);

    // Timeout task should auto complete upon rerun.
    timeoutTask.run();
    expect(decoratedTask.getState()).toBe(tr.enums.State.COMPLETED);
    expect(timeoutTask.getState()).toBe(tr.enums.State.COMPLETED);
  });
});