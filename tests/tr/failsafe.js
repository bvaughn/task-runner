describe('tr.Failsafe', function() {

  var nullTask;
  var failsafeTask;
  
  beforeEach(function() {
    nullTask = new tr.Stub();
    failsafeTask = new tr.Failsafe(nullTask);
  });

  it('should explose its decorated task', function() {
    expect(failsafeTask.getDecoratedTask()).toBe(nullTask);
  });

  it('should run the decorated task when run', function() {
    expect(failsafeTask.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(nullTask.getState()).toBe(tr.enums.State.INITIALIZED);

    failsafeTask.run();

    expect(failsafeTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(nullTask.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should interrupt the decorated task when interrupt', function() {
    failsafeTask.run();
    failsafeTask.interrupt();

    expect(failsafeTask.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(nullTask.getState()).toBe(tr.enums.State.INTERRUPTED);
  });

  it('should reset the decorated task when reset', function() {
    failsafeTask.run();
    failsafeTask.interrupt();
    failsafeTask.reset();

    expect(failsafeTask.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(nullTask.getState()).toBe(tr.enums.State.INITIALIZED);
  });

  it('should complete event when the decorated task errors', function() {
    failsafeTask.run();

    var error = {};
    var errorMessage = 'foobar';

    nullTask.error(error, errorMessage);

    expect(nullTask.getState()).toBe(tr.enums.State.ERRORED);
    expect(nullTask.getData()).toBe(error);
    expect(nullTask.getErrorMessage()).toBe(errorMessage);

    expect(failsafeTask.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should complete when the decorated task completes', function() {
    failsafeTask.run();

    var data = {};

    nullTask.complete(data);

    expect(nullTask.getState()).toBe(tr.enums.State.COMPLETED);
    expect(nullTask.getData()).toBe(data);

    expect(failsafeTask.getState()).toBe(tr.enums.State.COMPLETED);
  });
});