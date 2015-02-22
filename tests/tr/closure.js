describe('tr.Closure', function() {

  it('should auto completing upon running when enabled', function() {
    var method = jasmine.createSpy();

    var task = new tr.Closure(method, true);
    task.run();

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
    expect(method).toHaveBeenCalled();
    expect(method.calls.count()).toEqual(1);
  });

  it('should not auto completing upon running when disabled', function() {
    var method = jasmine.createSpy();

    var task = new tr.Closure(method, false);
    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);
    expect(method).toHaveBeenCalled();
    expect(method.calls.count()).toEqual(1);

    task.complete();
    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should not error when told to auto-complete if the callback completes the task', function() {
    var method = function() {
      task.complete()
    };

    var task = new tr.Closure(method, true);
    task.run();

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should not error when told to auto-complete if the callback errors the task', function() {
    var method = function() {
      task.error()
    };

    var task = new tr.Closure(method, true);
    task.run();

    expect(task.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should not error when told to auto-complete if the callback interrupts the task', function() {
    var method = function() {
      task.interrupt()
    };

    var task = new tr.Closure(method, true);
    task.run();

    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);
  });

  it('should pass a reference to itself to runImpl', function() {
    var method = jasmine.createSpy();

    var task = new tr.Closure(method, false);
    task.run();

    expect(method).toHaveBeenCalledWith(task);
  });

  it('should error if wrapped function throws an error', function() {
    var error = new Error('test');

    var method = function() {
      throw error;
    };

    var task = new tr.Closure(method, true);
    task.run();

    expect(task.getState()).toBe(tr.enums.State.ERRORED);
    expect(task.getData()).toBe(error);
    expect(task.getErrorMessage()).toBe('test');
  });

  // Weird edge-case that could be triggered if a Closure task invokes another Closure task that errors.
  it('should not error if callback throws an error but interrupts the running task', function() {
    var error = new Error('test');

    var method = function() {
      task.interrupt();

      throw error;
    };

    var task = new tr.Closure(method, true);
    task.run();

    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);
  });

  it('should rerun wrapped function if reset and rerun', function() {
    var method = jasmine.createSpy();

    var task = new tr.Closure(method);
    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);
    expect(method).toHaveBeenCalled();
    expect(method.calls.count()).toEqual(1);

    task.complete();

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);

    task.reset();

    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);
    expect(method.calls.count()).toEqual(2);
  });
});