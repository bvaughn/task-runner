describe('tr.TimerTick', function() {

  var callback;
  var interval;
  var timerTick;

  beforeEach(function() {
    jasmine.clock().mockDate(new Date(2015, 01, 01));
    jasmine.clock().install();

    callback = jasmine.createSpy();
    interval = 50;
    timerTick = new tr.TimerTick(callback, interval);
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  it('should invoke the callback after the specified interval', function () {
    timerTick.run();

    expect(callback).not.toHaveBeenCalled();

    jasmine.clock().tick(25);

    expect(callback).not.toHaveBeenCalled();

    jasmine.clock().tick(25);

    expect(callback).toHaveBeenCalled();
  });

  it('should not invoke the callback when interrupted', function () {
    timerTick.run();
    timerTick.interrupt();

    jasmine.clock().tick(100);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should resume invoking the callback when resumed', function () {
    timerTick.run();

    jasmine.clock().tick(50);

    expect(callback).toHaveBeenCalled();
    expect(callback.calls.count()).toEqual(1);

    timerTick.interrupt();

    jasmine.clock().tick(50);

    expect(callback.calls.count()).toEqual(1);

    timerTick.run();

    jasmine.clock().tick(50);

    expect(callback.calls.count()).toEqual(2);
  });

  it('should allow the interval to be updated while running', function () {
    timerTick.run();
    timerTick.setInterval(100); // Will not affect the in-flight interval

    jasmine.clock().tick(50);

    expect(callback).toHaveBeenCalled();
    expect(callback.calls.count()).toEqual(1);

    jasmine.clock().tick(50);

    expect(callback.calls.count()).toEqual(1);

    jasmine.clock().tick(50);

    expect(callback.calls.count()).toEqual(2);
  });

  it('should complete when completed', function () {
    timerTick.run();
    timerTick.complete();
    expect(timerTick.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should not invoke callback after completion', function () {
    var numTimesCalled = 0;

    var timerTick = new tr.TimerTick(
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
    timerTick.run();
    timerTick.error();
    expect(timerTick.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should handle runtime errors in the callback by erroring', function () {
    var timerTick = new tr.TimerTick(
      function() {
        throw Error("Whoops!");
      }, 50).run();

    expect(timerTick.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.clock().tick(50);

    expect(timerTick.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should ignore runtime errors in the callback if not running', function () {
    var timerTick = new tr.TimerTick(
      function(task) {
        task.complete();
        throw Error("Whoops!");
      }, 50).run();

    expect(timerTick.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.clock().tick(50);

    expect(timerTick.getState()).toBe(tr.enums.State.COMPLETED);
  });
});