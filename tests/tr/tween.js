describe('tr.Tween', function() {

  var mockAnimationFrame;
  
  beforeEach(function() {
    jasmine.clock().mockDate(new Date(2015, 01, 01));
    jasmine.clock().install();

    mockAnimationFrame = new MockAnimationFrame();
    mockAnimationFrame.install();
  });
  
  afterEach(function() {
    jasmine.clock().uninstall();
  });

  /**
   * Helper function updates system time and calls an animation frame.
   *
   * @param {!number} elapsedTime
   * @param {number=} id
   * @private
   */
  var callAfter = function(elapsedTime, id) {
    jasmine.clock().tick(elapsedTime);

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
    var callback = jasmine.createSpy();

    var task = new tr.Tween(callback, 100);
    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    callAfter(50);

    expect(callback).toHaveBeenCalled();
    expect(callback.calls.count()).toEqual(1);
    expect(callback.calls.mostRecent().args[0]).toEqual(.5);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    callAfter(50);
    expect(callback.calls.count()).toEqual(2);
    expect(callback.calls.mostRecent().args[0]).toEqual(1);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should support a custom easing function if provided', function() {
    var easing = function(value) {
      return value / 2;
    };

    var callback = jasmine.createSpy();

    var task = new tr.Tween(callback, 100, easing);
    task.run();

    callAfter(50);
    expect(callback).toHaveBeenCalled();
    expect(callback.calls.count()).toEqual(1);
    expect(callback.calls.mostRecent().args[0]).toEqual(.25);

    callAfter(50);
    expect(callback.calls.count()).toEqual(2);
    expect(callback.calls.mostRecent().args[0]).toEqual(.5);
  });

  it('should reset tween on task reset', function() {
    var callback = jasmine.createSpy();

    var task = new tr.Tween(callback, 100);
    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    callAfter(50);
    expect(callback).toHaveBeenCalled();
    expect(callback.calls.count()).toEqual(1);
    expect(callback.calls.mostRecent().args[0]).toEqual(.5);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.interrupt();
    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);

    task.reset();
    callAfter(50);
    expect(callback.calls.count()).toEqual(2);
    expect(callback.calls.mostRecent().args[0]).toEqual(0);
    expect(task.getState()).toBe(tr.enums.State.INITIALIZED);
  });

  it('should cancel pending animation frames on task interruption', function() {
    var callback = jasmine.createSpy();

    var task = new tr.Tween(callback, 100);
    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);
    expect(mockAnimationFrame.getAnimationFrameCount()).toBe(1);

    task.interrupt();
    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(mockAnimationFrame.getAnimationFrameCount()).toBe(0);
  });

  it('should not exceed initial duration when interrupted and resumed', function() {
    var callback = jasmine.createSpy();

    var task = new tr.Tween(callback, 100);
    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    callAfter(25);
    expect(callback).toHaveBeenCalled();
    expect(callback.calls.count()).toEqual(1);
    expect(callback.calls.mostRecent().args[0]).toEqual(.25);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.interrupt();
    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(mockAnimationFrame.getAnimationFrameCount()).toBe(0);

    jasmine.clock().tick(25);

    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    callAfter(50);
    expect(callback.calls.count()).toEqual(2);
    expect(callback.calls.mostRecent().args[0]).toEqual(.75);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    callAfter(25);
    expect(callback.calls.count()).toEqual(3);
    expect(callback.calls.mostRecent().args[0]).toEqual(1);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should not call tweening function with a value greater than 1 if animation frame executes after max-duration', function() {
    var callback = jasmine.createSpy();

    var task = new tr.Tween(callback, 100);
    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    callAfter(150);
    expect(callback).toHaveBeenCalled();
    expect(callback.calls.count()).toEqual(1);
    expect(callback.calls.mostRecent().args[0]).toEqual(1);
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should cancel pending animation frames and reschedule a new frame if a tween task is interrupte dand rerun', function() {
    var callback = jasmine.createSpy();

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
    expect(callback).not.toHaveBeenCalled();

    // run() queues a new animation frame and cancels the reset frame.
    task.run();
    expect(task.getState()).toBe(tr.enums.State.RUNNING);
    expect(mockAnimationFrame.getAnimationFrameCount()).toBe(1);
    expect(callback).not.toHaveBeenCalled();

    callAfter(50);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);
    expect(callback).toHaveBeenCalled();
    expect(callback.calls.count()).toEqual(1);
  });
});