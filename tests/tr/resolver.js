describe('tr.app.TransitionState', function() {

  var blockerA;
  var blockerB;
  var blockerC;
  var FailingStub;
  var resolver;
  var resolutionA;
  var resolutionB;

  beforeEach(function() {
    resolver = new tr.Resolver();

    resolutionA = new tr.Stub();
    resolutionB = new tr.Stub();

    blockerA = new tr.Stub();
    blockerB = new tr.Stub();
    blockerC = new tr.Stub();

    /**
     * Stub task used for testing purposes.
     */
    FailingStub = function() {
      tr.Stub.call(this, "FailingStub");

      this.started(
        function(task) {
          task.error();
        });
    };
    FailingStub.prototype = Object.create(tr.Stub.prototype);
  });

  it('should fail if not provided a target state', function() {
    resolver.run();

    expect(resolver.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should choose the highest priority resolution if all blockers succeed', function() {
    resolver.addResolution(resolutionA, [blockerA, blockerB]);
    resolver.addResolution(resolutionB, [blockerC]);

    resolver.run();

    expect(resolver.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockerA.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockerB.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockerC.getState()).toBe(tr.enums.State.RUNNING);

    blockerA.complete();
    blockerB.complete();
    blockerC.complete();

    expect(resolver.getChosenResolution()).toBe(resolutionA);
    expect(resolver.getData()).toBe(resolutionA);
  });

  it('should choose the next highest priority state if some blocking tasks fail', function() {
    resolver.addResolution(resolutionA, [blockerA, blockerB]);
    resolver.addResolution(resolutionB, [blockerC]);

    resolver.run();

    expect(resolver.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockerA.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockerB.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockerC.getState()).toBe(tr.enums.State.RUNNING);

    blockerA.complete();
    blockerB.error();
    blockerC.complete();

    expect(resolver.getChosenResolution()).toBe(resolutionB);
    expect(resolver.getData()).toBe(resolutionB);
  });

  it('should fail when no target states can be transitioned to due to errored blockers', function() {
    resolver.addResolution(resolutionA, [blockerA, blockerB]);
    resolver.addResolution(resolutionB, [blockerC]);

    resolver.run();

    expect(resolver.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockerA.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockerB.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockerC.getState()).toBe(tr.enums.State.RUNNING);

    blockerA.complete();
    blockerB.error();
    blockerC.error();

    expect(resolver.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should interrupt blockers when interrupted and resume them later', function() {
    resolver.addResolution(resolutionA, [blockerA, blockerB]);
    resolver.addResolution(resolutionB, [blockerC]);

    resolver.run();

    expect(resolver.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockerA.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockerB.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockerC.getState()).toBe(tr.enums.State.RUNNING);

    blockerA.complete();

    resolver.interrupt();

    expect(resolver.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(blockerA.getState()).toBe(tr.enums.State.COMPLETED);
    expect(blockerB.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(blockerC.getState()).toBe(tr.enums.State.INTERRUPTED);

    resolver.run();

    expect(resolver.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockerA.getState()).toBe(tr.enums.State.COMPLETED);
    expect(blockerB.getState()).toBe(tr.enums.State.RUNNING);
    expect(blockerC.getState()).toBe(tr.enums.State.RUNNING);
  });
});