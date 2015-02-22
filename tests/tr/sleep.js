describe('tr.Sleep', function() {

  beforeEach(function() {
    jasmine.clock().mockDate(new Date(2015, 01, 01));
    jasmine.clock().install();
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  it('should complete after the appropriate amount of time elapses', function() {
    var waitTask = new tr.Sleep(1000);

    waitTask.run();
    expect(waitTask.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.clock().tick(500);
    expect(waitTask.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.clock().tick(500);
    expect(waitTask.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should resume timer after an interruption', function() {
    var waitTask = new tr.Sleep(1000, false);

    waitTask.run();
    expect(waitTask.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.clock().tick(500);
    waitTask.interrupt();

    waitTask.run();
    jasmine.clock().tick(500);
    expect(waitTask.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should reset timer after interruption', function() {
    var waitTask = new tr.Sleep(1000, true);

    waitTask.run();
    expect(waitTask.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.clock().tick(500);
    waitTask.interrupt();

    waitTask.run();
    jasmine.clock().tick(500);
    expect(waitTask.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.clock().tick(500);
    expect(waitTask.getState()).toBe(tr.enums.State.COMPLETED);
  });
});