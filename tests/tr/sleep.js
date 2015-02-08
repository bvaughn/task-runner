goog.provide('tr.Sleep.test');
goog.setTestOnly('tr.Sleep.test');

goog.require('goog.testing.MockClock');
goog.require('tr.Sleep');
goog.require('tr.enums.State');

describe('tr.Sleep', function() {

  var mockClock;
  
  beforeEach(function() {
    mockClock = new goog.testing.MockClock(true);
  });
  
  afterEach(function() {
    mockClock.uninstall();
  });

  it('should complete after the appropriate amount of time ellapses', function() {
    var waitTask = new tr.Sleep(1000);

    waitTask.run();
    expect(waitTask.getState()).toBe(tr.enums.State.RUNNING);

    mockClock.tick(500);
    expect(waitTask.getState()).toBe(tr.enums.State.RUNNING);

    mockClock.tick(500);
    expect(waitTask.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should resume timer after an interruption', function() {
    var waitTask = new tr.Sleep(1000, false);

    waitTask.run();
    expect(waitTask.getState()).toBe(tr.enums.State.RUNNING);

    mockClock.tick(500);
    waitTask.interrupt();

    waitTask.run();
    mockClock.tick(500);
    expect(waitTask.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should reset timer after interruption', function() {
    var waitTask = new tr.Sleep(1000, true);

    waitTask.run();
    expect(waitTask.getState()).toBe(tr.enums.State.RUNNING);

    mockClock.tick(500);
    waitTask.interrupt();

    waitTask.run();
    mockClock.tick(500);
    expect(waitTask.getState()).toBe(tr.enums.State.RUNNING);

    mockClock.tick(500);
    expect(waitTask.getState()).toBe(tr.enums.State.COMPLETED);
  });
});