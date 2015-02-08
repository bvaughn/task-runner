goog.provide('tr.Closure.test');
goog.setTestOnly('tr.Closure.test');

goog.require('tr.Closure');
goog.require('tr.enums.State');

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