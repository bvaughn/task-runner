goog.provide('tr.Decorator.test');
goog.setTestOnly('tr.Decorator.test');

goog.require('tr.Decorator');
goog.require('tr.enums.State');

describe('tr.Decorator', function() {

  var decorator;
  var fullImplementation;
  var partialImplementation;

  beforeEach(function() {
    fullImplementation = {
      interrupt: function() {},
      reset: function() {},
      run: function() {}
    };

    spyOn(fullImplementation, 'interrupt');
    spyOn(fullImplementation, 'reset');
    spyOn(fullImplementation, 'run');

    partialImplementation = {
      run: function() {}
    };

    spyOn(partialImplementation, 'run');
  });

  it('should error if run() method not implemented', function() {
    expect(function() {
      new tr.Decorator({});
    }).toThrow();
  });

  it('should accept POJOs for non-Closure users', function() {
    new tr.Decorator(partialImplementation);
  });

  it('should return the decorated task', function() {
    decorator = new tr.Decorator(fullImplementation);

    expect(decorator.getDecorated()).toBe(fullImplementation);
  });

  it('should run decorated when run', function() {
    decorator = new tr.Decorator(fullImplementation);

    expect(fullImplementation.run).not.toHaveBeenCalled();

    decorator.run();

    expect(fullImplementation.run).toHaveBeenCalled();
    expect(fullImplementation.run.calls.count()).toEqual(1);
    expect(fullImplementation.run.calls.mostRecent().args.length).toEqual(2);
    expect(goog.isFunction(fullImplementation.run.calls.mostRecent().args[0])).toBeTruthy();
    expect(goog.isFunction(fullImplementation.run.calls.mostRecent().args[1])).toBeTruthy();
  });

  it('should interrupt decorated when interrupted', function() {
    decorator = new tr.Decorator(fullImplementation);
    decorator.run();

    expect(fullImplementation.interrupt).not.toHaveBeenCalled();

    decorator.interrupt();

    expect(fullImplementation.interrupt).toHaveBeenCalled();
  });

  it('should gracefully ignore POJOs that do not implement interrupt', function() {
    decorator = new tr.Decorator(partialImplementation);
    decorator.run();
    decorator.interrupt();
  });

  it('should reset decorated when reset', function() {
    decorator = new tr.Decorator(fullImplementation);
    decorator.run();
    decorator.interrupt();

    expect(fullImplementation.reset).not.toHaveBeenCalled();

    decorator.reset();

    expect(fullImplementation.reset).toHaveBeenCalled();
  });

  it('should gracefully ignore POJOs that do not implement reset', function() {
    decorator = new tr.Decorator(partialImplementation);
    decorator.run();
    decorator.interrupt();
    decorator.reset();
  });

  it('should complete when decorated completes', function() {
    decorator = new tr.Decorator(fullImplementation);
    decorator.run();

    expect(decorator.getState()).toBe(tr.enums.State.RUNNING);

    var data = {foo:'bar'};

    expect(goog.isFunction(fullImplementation.run.calls.mostRecent().args[0])).toBeTruthy();
    completedCallback = fullImplementation.run.calls.mostRecent().args[0];
    completedCallback(data);

    expect(decorator.getState()).toBe(tr.enums.State.COMPLETED);
    expect(decorator.getData()).toBe(data);
  });

  it('should error when decorated errors', function() {
    decorator = new tr.Decorator(fullImplementation);
    decorator.run();

    expect(decorator.getState()).toBe(tr.enums.State.RUNNING);

    var data = {foo:'bar'};
    var errorMessage = "foobar";

    expect(goog.isFunction(fullImplementation.run.calls.mostRecent().args[1])).toBeTruthy();
    erroredCallback = fullImplementation.run.calls.mostRecent().args[1];
    erroredCallback(data, errorMessage);

    expect(decorator.getState()).toBe(tr.enums.State.ERRORED);
    expect(decorator.getData()).toBe(data);
    expect(decorator.getErrorMessage()).toBe(errorMessage);
  });
});