goog.provide('tr.Chain.test');
goog.setTestOnly('tr.Chain.test');

goog.require('tr.Chain');
goog.require('tr.Closure');
goog.require('tr.Stub');
goog.require('tr.enums.State');

describe('tr.Chain', function() {

  var stubTaskA, stubTaskB, stubTaskC, stubTaskD, stubTaskE, stubTaskF;

  beforeEach(function() {
    stubTaskA = new tr.Stub(false, "StubA");
    stubTaskB = new tr.Stub(false, "StubB");
    stubTaskC = new tr.Stub(false, "StubC");
    stubTaskD = new tr.Stub(false, "StubD");
    stubTaskE = new tr.Stub(false, "StubE");
    stubTaskF = new tr.Stub(false, "StubF");
  });

  it('should automatically complete when run with no children', function() {
    var chain = new tr.Chain();
    chain.run();

    expect(chain.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should invoke the optional completed callback on success', function() {
    var callback = jasmine.createSpy();
    
    var chain = new tr.Chain(callback).run();

    expect(chain.getState()).toBe(tr.enums.State.COMPLETED);
    expect(callback).toHaveBeenCalled();
  });

  it('should invoke the optional errorred callback on failure', function() {
    var callback = jasmine.createSpy();
    
    var chain = new tr.Chain(null, callback).first(stubTaskA).run();

    stubTaskA.error();

    expect(chain.getState()).toBe(tr.enums.State.ERRORED);
    expect(callback).toHaveBeenCalled();
  });

  it('should start with the task passed to first()', function() {
    var chain = new tr.Chain().first(stubTaskA).run();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);

    stubTaskA.complete();

    expect(chain.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskA.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should start with the task passed to then() if none is passed to first()', function() {
    var chain = new tr.Chain().then(stubTaskA).run();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);

    stubTaskA.complete();

    expect(chain.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskA.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should fail if first() is called after stubTasks have been added to the chain', function() {
    expect(function() {
      new tr.Chain().first(stubTaskA).first(stubTaskB).run();
    }).toThrow();
  });

  it('should continue from a completed task to the next task passed to then()', function() {
    var chain = new tr.Chain().first(stubTaskA).then(stubTaskB).run();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskA.complete();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.RUNNING);

    stubTaskB.complete();

    expect(chain.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskA.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should execute multiple stubTasks in parallel if they are passed to then then()', function() {
    var chain = new tr.Chain().first(stubTaskA).then(stubTaskB, stubTaskC).run();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskA.complete();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskC.getState()).toBe(tr.enums.State.RUNNING);

    stubTaskB.complete();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.RUNNING);

    stubTaskC.complete();

    expect(chain.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskA.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should execute all of the stubTask(s) passed to or() if the proceeding task fails', function() {
    var chain = new tr.Chain().first(stubTaskA).or(stubTaskB, stubTaskC).run();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskA.error();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskC.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should continue if all tasks passed to or() complete', function() {
    var chain = new tr.Chain().first(stubTaskA).or(stubTaskB, stubTaskC).run();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskA.error();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskC.getState()).toBe(tr.enums.State.RUNNING);

    stubTaskB.complete();
    stubTaskC.complete();

    expect(chain.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should fail if some of the tasks passed to a single or() error', function() {
    var chain = new tr.Chain().first(stubTaskA).or(stubTaskB, stubTaskC).run();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskA.error();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskC.getState()).toBe(tr.enums.State.RUNNING);

    stubTaskB.error();
    stubTaskC.complete();

    expect(chain.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should not execute the task passed to or() if the proceeding task suceeds', function() {
    var chain = new tr.Chain().first(stubTaskA).or(stubTaskB).then(stubTaskC).run();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskA.complete();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.RUNNING);

    stubTaskC.complete();

    expect(chain.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskA.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should error if no or() task follows a failed stubTask', function() {
    var chain = new tr.Chain().first(stubTaskA).then(stubTaskB).run();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskA.error();

    expect(chain.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);
  });

  it('should error if none of the tasks provided to or() complete', function() {
    var chain = new tr.Chain().first(stubTaskA).or(stubTaskB, stubTaskC).run();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskA.error();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskC.getState()).toBe(tr.enums.State.RUNNING);

    stubTaskB.error();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.RUNNING);

    stubTaskC.error();

    expect(chain.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should allow or() calls to be chained', function() {
    var chain = new tr.Chain().first(stubTaskA).or(stubTaskB).or(stubTaskC).run();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskA.error();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskC.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskB.error();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.RUNNING);

    stubTaskC.complete();

    expect(chain.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should interrupt children when interrupted', function() {
    var chain = new tr.Chain().first(stubTaskA).then(stubTaskB).run();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskA.complete();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.RUNNING);

    chain.interrupt();

    expect(chain.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(stubTaskA.getState()).toBe(tr.enums.State.COMPLETED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INTERRUPTED);
  });

  it('should reset children when reset', function() {
    var chain = new tr.Chain().first(stubTaskA).then(stubTaskB).run();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskA.error();

    expect(chain.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);

    chain.reset();

    expect(chain.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(stubTaskA.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);
  });

  it('should return the correct number of children', function() {
    var chain = new tr.Chain().first(stubTaskA).then(stubTaskB, stubTaskC).then(stubTaskD).or(stubTaskE).then(stubTaskF).run();

    expect(chain.getOperationsCount()).toBe(6);

    stubTaskA.complete();

    expect(chain.getCompletedOperationsCount()).toBe(1);

    stubTaskB.complete();

    expect(chain.getCompletedOperationsCount()).toBe(2);

    stubTaskC.complete();

    expect(chain.getCompletedOperationsCount()).toBe(3);

    stubTaskD.complete();

    expect(chain.getCompletedOperationsCount()).toBe(5);

    stubTaskF.complete();

    expect(chain.getCompletedOperationsCount()).toBe(6);
  });

  it('should preserve the parallal behavior of then() when followed by or()', function() {
    var chain = new tr.Chain().first(stubTaskA, stubTaskB).or(stubTaskC).run();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskB.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskC.getState()).toBe(tr.enums.State.INITIALIZED);
  });

  it('should alias or() with else() and otherwise()', function() {
    var chain = new tr.Chain().first(stubTaskA).else(stubTaskB).otherwise(stubTaskC).run();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskB.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskA.error();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskC.getState()).toBe(tr.enums.State.INITIALIZED);

    stubTaskB.error();

    expect(chain.getState()).toBe(tr.enums.State.RUNNING);
    expect(stubTaskA.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskB.getState()).toBe(tr.enums.State.ERRORED);
    expect(stubTaskC.getState()).toBe(tr.enums.State.RUNNING);
  });
});