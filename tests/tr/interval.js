describe('tr.Interval', function() {

  var callback;
  var interval;

  beforeEach(function() {
    jasmine.clock().mockDate(new Date(2015, 01, 01));
    jasmine.clock().install();

    callback = jasmine.createSpy();
    interval = new tr.Interval(callback, 50);
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  it('should invoke the callback after the specified interval', function () {
    interval.run();

    expect(callback).not.toHaveBeenCalled();

    jasmine.clock().tick(25);

    expect(callback).not.toHaveBeenCalled();

    jasmine.clock().tick(25);

    expect(callback).toHaveBeenCalled();
  });

  it('should not invoke the callback when interrupted', function () {
    interval.run();
    interval.interrupt();

    jasmine.clock().tick(100);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should resume invoking the callback when resumed', function () {
    interval.run();

    jasmine.clock().tick(50);

    expect(callback).toHaveBeenCalled();
    expect(callback.calls.count()).toEqual(1);

    interval.interrupt();

    jasmine.clock().tick(50);

    expect(callback.calls.count()).toEqual(1);

    interval.run();

    jasmine.clock().tick(50);

    expect(callback.calls.count()).toEqual(2);
  });

  it('should allow the interval to be updated while running', function () {
    interval.run();
    interval.setInterval(100); // Will not affect the in-flight interval

    jasmine.clock().tick(50);

    expect(callback).toHaveBeenCalled();
    expect(callback.calls.count()).toEqual(1);

    jasmine.clock().tick(50);

    expect(callback.calls.count()).toEqual(1);

    jasmine.clock().tick(50);

    expect(callback.calls.count()).toEqual(2);
  });

  it('should complete when completed', function () {
    interval.run();
    interval.complete();
    expect(interval.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should not invoke callback after completion', function () {
    var numTimesCalled = 0;

    var timerTick = new tr.Interval(
      function(task) {
        numTimesCalled++;
        task.complete();
      }, 50).run();

    jasmine.clock().tick(50);

    expect(numTimesCalled).toEqual(1);
    expect(timerTick.getState()).toBe(tr.enums.State.COMPLETED);

    jasmine.clock().tick(50);

    expect(numTimesCalled).toEqual(1);
  });

  it('should error when errored', function () {
    interval.run();
    interval.error();
    expect(interval.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should handle runtime errors in the callback by erroring', function () {
    var timerTick = new tr.Interval(
      function() {
        throw Error("Whoops!");
      }, 50).run();

    expect(timerTick.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.clock().tick(50);

    expect(timerTick.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should ignore runtime errors in the callback if not running', function () {
    var timerTick = new tr.Interval(
      function(task) {
        task.complete();
        throw Error("Whoops!");
      }, 50).run();

    expect(timerTick.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.clock().tick(50);

    expect(timerTick.getState()).toBe(tr.enums.State.COMPLETED);
  });
});