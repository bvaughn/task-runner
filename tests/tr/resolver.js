describe('tr.app.TransitionState', function() {

  var blockerA;
  var blockerB;
  var blockerC;
  var FailingStub;
  var resolver;
  var resolutionA;
  var resolutionB;

  beforeEach(function() {
    resolutionA = new tr.Stub(false, "Resolution-A");
    resolutionB = new tr.Stub(false, "Resolution-A");

    blockerA = new tr.Stub(false, "Blocker-A");
    blockerB = new tr.Stub(false, "Blocker-B");
    blockerC = new tr.Stub(false, "Blocker-C");

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

  describe('wait until all blockers finished', function() {
    beforeEach(function() {
      resolver = new tr.Resolver(false);
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
      expect(resolutionA.getState()).toBe(tr.enums.State.RUNNING);

      resolutionA.complete();

      expect(resolver.getState()).toBe(tr.enums.State.COMPLETED);
      expect(resolutionA.getState()).toBe(tr.enums.State.COMPLETED);
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
      expect(resolutionB.getState()).toBe(tr.enums.State.RUNNING);

      resolutionB.complete();

      expect(resolver.getState()).toBe(tr.enums.State.COMPLETED);
      expect(resolutionB.getState()).toBe(tr.enums.State.COMPLETED);
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

  describe('choose a resolution as soon as one becomes valid', function() {
    beforeEach(function() {
      resolver = new tr.Resolver(true);
    });

    it('should error if all blockers complete and no resolutions are valid', function() {
      resolver.addResolution(resolutionA, [blockerA]);
      resolver.addResolution(resolutionB, [blockerB]);
      resolver.run();

      blockerA.error();
      blockerB.error();

      expect(resolver.getState()).toBe(tr.enums.State.ERRORED);
      expect(resolutionA.getState()).toBe(tr.enums.State.INITIALIZED);
      expect(resolutionB.getState()).toBe(tr.enums.State.INITIALIZED);
    });

    it('should run the first valid resolution as soon as its dependencies are satisfied', function() {
      resolver.addResolution(resolutionA, [blockerA, blockerB]);
      resolver.addResolution(resolutionB, [blockerC]);
      resolver.run();

      blockerA.error();
      blockerC.complete();

      expect(resolutionA.getState()).toBe(tr.enums.State.INITIALIZED);
      expect(resolutionB.getState()).toBe(tr.enums.State.RUNNING);
    });

    it('should interrupt incomplete blockers once a resolution has been chosen', function() {
      resolver.addResolution(resolutionA, [blockerA]);
      resolver.addResolution(resolutionB, [blockerB]);
      resolver.run();

      blockerA.complete();

      expect(blockerB.getState()).toBe(tr.enums.State.INTERRUPTED);
    });

    it('should ignore completions in blockers after a resolution has been chosen', function() {
      resolver.addResolution(resolutionA, [blockerA]);
      resolver.addResolution(resolutionB, [blockerB]);
      resolver.run();

      blockerB.complete();

      expect(resolver.getState()).toBe(tr.enums.State.RUNNING);
      expect(resolutionA.getState()).toBe(tr.enums.State.RUNNING);
      expect(resolutionB.getState()).toBe(tr.enums.State.INITIALIZED);

      blockerA.run();
      blockerA.complete();

      expect(resolver.getState()).toBe(tr.enums.State.RUNNING);
      expect(resolutionA.getState()).toBe(tr.enums.State.RUNNING);
      expect(resolutionB.getState()).toBe(tr.enums.State.INITIALIZED);
    });

    it('should ignore errors in blockers after a resolution has been chosen', function() {
      resolver.addResolution(resolutionA, [blockerA]);
      resolver.addResolution(resolutionB, [blockerB]);
      resolver.run();

      blockerB.complete();

      expect(resolver.getState()).toBe(tr.enums.State.RUNNING);
      expect(resolutionA.getState()).toBe(tr.enums.State.RUNNING);
      expect(resolutionB.getState()).toBe(tr.enums.State.INITIALIZED);

      blockerA.run();
      blockerA.error();

      expect(resolver.getState()).toBe(tr.enums.State.RUNNING);
      expect(resolutionA.getState()).toBe(tr.enums.State.RUNNING);
      expect(resolutionB.getState()).toBe(tr.enums.State.INITIALIZED);
    });
  });
});