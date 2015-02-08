goog.provide('tr.Tween.test');
goog.setTestOnly('tr.Tween.test');

goog.require('goog.testing.MockClock');
goog.require('goog.testing.recordFunction');
goog.require('tr.MockAnimationFrame');
goog.require('tr.Tween');
goog.require('tr.enums.State');

describe('tr.Tween', function() {

  var mockAnimationFrame;
  var mockClock;
  
  beforeEach(function() {
    mockClock = new goog.testing.MockClock(true);
    mockClock.install();

    mockAnimationFrame = new tr.MockAnimationFrame();
    mockAnimationFrame.install();
  });
  
  afterEach(function() {
    mockClock.uninstall();
  });

  /**
   * Helper function updates system time and calls an animation frame.
   *
   * @param {!number} elapsedTime
   * @param {number=} id
   * @private
   */
  var callAfter = function(elapsedTime, id) {
    mockClock.tick(elapsedTime);

    if (id) {
      mockAnimationFrame.call(id);
    } else {
      mockAnimationFrame.callMostRecent();
    }
  };

  it('should error if an invalid duration is specified', function() {
    var callback = function(value) {};

    expect(function() {
      new tr.Tween(callback);
    }).toThrow();

    expect(function() {
      new tr.Tween(callback, -1);
    }).toThrow();

    expect(function() {
      new tr.Tween(callback, 0);
    }).toThrow();
  });

  it('should use a linear-tween by default', function() {
    var lastValue;
    var callback = goog.testing.recordFunction(function(value) {
      lastValue = value;
    });

    var task = new tr.Tween(callback, 100);
    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    callAfter(50);
    expect(callback.getCallCount()).toBe(1);
    expect(lastValue).toBe(.5);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    callAfter(50);
    expect(callback.getCallCount()).toBe(2);
    expect(lastValue).toBe(1);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should support a custom easing function if provided', function() {
    var lastValue;
    var easing = function(value) {
      return value / 2;
    };
    var callback = goog.testing.recordFunction(function(value) {
      lastValue = value;
    });

    var task = new tr.Tween(callback, 100, easing);
    task.run();

    callAfter(50);
    expect(lastValue).toBe(.25);

    callAfter(50);
    expect(lastValue).toBe(.5);
  });

  it('should reset tween on task reset', function() {
    var lastValue;
    var callback = goog.testing.recordFunction(function(value) {
      lastValue = value;
    });

    var task = new tr.Tween(callback, 100);
    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    callAfter(50);
    expect(callback.getCallCount()).toBe(1);
    expect(lastValue).toBe(.5);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.interrupt();
    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);

    task.reset();
    callAfter(50);
    expect(callback.getCallCount()).toBe(2);
    expect(lastValue).toBe(0);
    expect(task.getState()).toBe(tr.enums.State.INITIALIZED);
  });

  it('should cancel pending animation frames on task interruption', function() {
    var lastValue;
    var callback = goog.testing.recordFunction(function(value) {
      lastValue = value;
    });

    var task = new tr.Tween(callback, 100);
    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);
    expect(mockAnimationFrame.getAnimationFrameCount()).toBe(1);

    task.interrupt();
    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(mockAnimationFrame.getAnimationFrameCount()).toBe(0);
  });

  it('should not exceed initial duration when interrupted and resumed', function() {
    var lastValue;
    var callback = goog.testing.recordFunction(function(value) {
      lastValue = value;
    });

    var task = new tr.Tween(callback, 100);
    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    callAfter(25);
    expect(callback.getCallCount()).toBe(1);
    expect(lastValue).toBe(.25);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.interrupt();
    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(mockAnimationFrame.getAnimationFrameCount()).toBe(0);

    mockClock.tick(25);

    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    callAfter(50);
    expect(callback.getCallCount()).toBe(2);
    expect(lastValue).toBe(.75);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    callAfter(25);
    expect(callback.getCallCount()).toBe(3);
    expect(lastValue).toBe(1);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should not call tweening function with a value greater than 1 if animation frame executes after max-duration', function() {
    var lastValue;
    var callback = goog.testing.recordFunction(function(value) {
      lastValue = value;
    });

    var task = new tr.Tween(callback, 100);
    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    callAfter(150);
    expect(callback.getCallCount()).toBe(1);
    expect(lastValue).toBe(1);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should cancel pending animation frames and reschedule a new frame if a tween task is interrupte dand rerun', function() {
    var lastValue;
    var callback = goog.testing.recordFunction(function(value) {
      lastValue = value;
    });

    var task = new tr.Tween(callback, 100);
    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);
    expect(mockAnimationFrame.getAnimationFrameCount()).toBe(1);

    // interrupt() cancels any pending animation frames.
    task.interrupt();
    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(mockAnimationFrame.getAnimationFrameCount()).toBe(0);

    // reset() queues an animation frame for resettings progress to 0.
    task.reset();
    expect(task.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(mockAnimationFrame.getAnimationFrameCount()).toBe(1);
    expect(callback.getCallCount()).toBe(0);

    // run() queues a new animation frame and cancels the reset frame.
    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);
    expect(mockAnimationFrame.getAnimationFrameCount()).toBe(1);
    expect(callback.getCallCount()).toBe(0);

    callAfter(50);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);
    expect(callback.getCallCount()).toBe(1);
  });
});