goog.provide('tr.Promise.test');
goog.setTestOnly('tr.Promise.test');

goog.require('tr.Promise');
goog.require('tr.Stub');
goog.require('tr.enums.State');

describe('tr.Promise', function() {

  var mockPromise;
  var stubTask;

  beforeEach(function() {
    mockPromise = jasmine.createSpyObj('mockPromise', ['then']);

    stubTask = new tr.Stub();
  });

  it('should require a Promise when creating a Task', function() {
    expect(function() {
      tr.Promise.promiseToTask();
    }).toThrow();
  });

  it('should require a recognized Promise library when creating a Task', function() {
    expect(function() {
      tr.Promise.promiseToTask(mockPromise);
    }).toThrow();
  });

  it('should require a Task when creating a Promise', function() {
    expect(function() {
      tr.Promise.taskToPromise();
    }).toThrow();
  });

  it('should require a recognized Promise library when creating a Promise', function() {
    expect(function() {
      tr.Promise.taskToPromise(stubTask);
    }).toThrow();
  });

  // See https://docs.angularjs.org/api/ng/service/$q
  describe('Angular', function() {
    var mockDeferred;
    var mockQ;

    beforeEach(function() {
      window.angular = {};

      mockDeferred = jasmine.createSpyObj('mockDeferred', ['resolve', 'reject']);
      mockDeferred.promise = function() {};
      mockQ = {};
      mockQ.defer = function() {};

      spyOn(mockDeferred, 'promise').and.returnValue(mockPromise);
      spyOn(mockQ, 'defer').and.returnValue(mockDeferred);
    });

    afterEach(function() {
      window.angular = undefined;
    });

    it('should reject a Promise when the decorated task errors', function() {
      var promise = tr.Promise.taskToPromise(stubTask, mockQ);

      stubTask.run();
      stubTask.error({}, 'foo');

      expect(mockDeferred.reject).toHaveBeenCalled();
      expect(mockDeferred.reject).toHaveBeenCalledWith('foo');
    });

    it('should resolve a Promise when the decorated task completes', function() {
      var promise = tr.Promise.taskToPromise(stubTask, mockQ);

      stubTask.run();
      stubTask.complete('foo');

      expect(mockDeferred.resolve).toHaveBeenCalled();
      expect(mockDeferred.resolve).toHaveBeenCalledWith('foo');
    });

    it('should complete when a Promise is resolved', function() {
      var task = tr.Promise.promiseToTask(mockPromise);
      task.run();

      expect(mockPromise.then).toHaveBeenCalled();

      var resolve = mockPromise.then.calls.mostRecent().args[0];
      resolve('foo');

      expect(task.getState()).toBe(tr.enums.State.COMPLETED);
      expect(task.getData()).toBe('foo');
    });

    it('should error when a Promise is rejected', function() {
      var task = tr.Promise.promiseToTask(mockPromise);
      task.run();

      expect(mockPromise.then).toHaveBeenCalled();

      var reject = mockPromise.then.calls.mostRecent().args[1];
      reject('foo');

      expect(task.getState()).toBe(tr.enums.State.ERRORED);
      expect(task.getData()).toBe('foo');
      expect(task.getErrorMessage()).toBe('foo');
    });

    // The following tests cover shared code and so are only repeated once (in the Angular block).

    it('should wait to complete until run if an Promise is resolved while interrupted', function() {
      var task = tr.Promise.promiseToTask(mockPromise);

      expect(mockPromise.then).toHaveBeenCalled();

      var reject = mockPromise.then.calls.mostRecent().args[1];
      reject('foo');

      expect(task.getState()).toBe(tr.enums.State.INITIALIZED);

      task.run();

      expect(task.getState()).toBe(tr.enums.State.ERRORED);
      expect(task.getData()).toBe('foo');
      expect(task.getErrorMessage()).toBe('foo');
    });

    it('should wait to erorr until run if an Promise is rejected while interrupted', function() {
      var task = tr.Promise.promiseToTask(mockPromise);

      expect(mockPromise.then).toHaveBeenCalled();

      var reject = mockPromise.then.calls.mostRecent().args[1];
      reject('foo');

      expect(task.getState()).toBe(tr.enums.State.INITIALIZED);

      task.run();

      expect(task.getState()).toBe(tr.enums.State.ERRORED);
      expect(task.getData()).toBe('foo');
      expect(task.getErrorMessage()).toBe('foo');
    });

    it('should only complete once even if the Promise is resolved multiple times', function() {
      var spy = jasmine.createSpy();

      var task = tr.Promise.promiseToTask(mockPromise);
      task.completed(spy);
      task.run();

      expect(mockPromise.then).toHaveBeenCalled();

      var resolve = mockPromise.then.calls.mostRecent().args[0];
      resolve('foo');

      expect(spy.calls.count()).toEqual(1);
      
      resolve('foo');

      expect(spy.calls.count()).toEqual(1);
    });

    it('should only error once even if the Promise is rejected multiple times', function() {
      var spy = jasmine.createSpy();

      var task = tr.Promise.promiseToTask(mockPromise);
      task.errored(spy);
      task.run();

      expect(mockPromise.then).toHaveBeenCalled();

      var reject = mockPromise.then.calls.mostRecent().args[1];
      reject('foo');

      expect(spy.calls.count()).toEqual(1);
      
      reject('foo');

      expect(spy.calls.count()).toEqual(1);
    });
  });

  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
  describe('ES6', function() {
    var rejectSpy;
    var resolveSpy;

    beforeEach(function() {
      window.Promise = function(callback) {
        rejectSpy = jasmine.createSpy();
        resolveSpy = jasmine.createSpy();

        callback(resolveSpy, rejectSpy);

        return mockPromise;
      };
    });

    afterEach(function() {
      window.Promise = undefined;
    });

    it('should reject a Promise when the decorated task errors', function() {
      var promise = tr.Promise.taskToPromise(stubTask);

      stubTask.run();
      stubTask.error({}, 'foo');

      expect(rejectSpy).toHaveBeenCalled();
      expect(rejectSpy).toHaveBeenCalledWith('foo');
    });

    it('should resolve a Promise when the decorated task completes', function() {
      var promise = tr.Promise.taskToPromise(stubTask);

      stubTask.run();
      stubTask.complete('foo');

      expect(resolveSpy).toHaveBeenCalled();
      expect(resolveSpy).toHaveBeenCalledWith('foo');
    });

    it('should complete when a Promise is resolved', function() {
      var task = tr.Promise.promiseToTask(mockPromise);
      task.run();

      expect(mockPromise.then).toHaveBeenCalled();

      var resolve = mockPromise.then.calls.mostRecent().args[0];
      resolve('foo');

      expect(task.getState()).toBe(tr.enums.State.COMPLETED);
      expect(task.getData()).toBe('foo');
    });

    it('should error when a Promise is rejected', function() {
      var task = tr.Promise.promiseToTask(mockPromise);
      task.run();

      expect(mockPromise.then).toHaveBeenCalled();

      var reject = mockPromise.then.calls.mostRecent().args[1];
      reject('foo');

      expect(task.getState()).toBe(tr.enums.State.ERRORED);
      expect(task.getData()).toBe('foo');
      expect(task.getErrorMessage()).toBe('foo');
    });
  });

  // See http://api.jquery.com/deferred.promise/
  describe('jQuery', function() {
    var deferred;

    beforeEach(function() {
      window.jQuery = {
        Deferred: function() {
          deferred = this;
        }
      };
      jQuery.Deferred.prototype.promise = function() {};
      jQuery.Deferred.prototype.reject = function() {};
      jQuery.Deferred.prototype.resolve = function() {};

      spyOn(jQuery.Deferred.prototype, 'promise').and.returnValue(mockPromise);
      spyOn(jQuery.Deferred.prototype, 'reject');
      spyOn(jQuery.Deferred.prototype, 'resolve');
    });

    afterEach(function() {
      window.jQuery = undefined;
    });

    it('should reject a Promise when the decorated task errors', function() {
      var promise = tr.Promise.taskToPromise(stubTask);

      stubTask.run();
      stubTask.error({}, 'foo');

      expect(deferred.reject).toHaveBeenCalled();
      expect(deferred.reject).toHaveBeenCalledWith('foo');
    });

    it('should resolve a Promise when the decorated task completes', function() {
      var promise = tr.Promise.taskToPromise(stubTask);

      stubTask.run();
      stubTask.complete('foo');

      expect(deferred.resolve).toHaveBeenCalled();
      expect(deferred.resolve).toHaveBeenCalledWith('foo');
    });

    it('should complete when a Promise is resolved', function() {
      var task = tr.Promise.promiseToTask(mockPromise);
      task.run();

      expect(mockPromise.then).toHaveBeenCalled();

      var resolve = mockPromise.then.calls.mostRecent().args[0];
      resolve('foo');

      expect(task.getState()).toBe(tr.enums.State.COMPLETED);
      expect(task.getData()).toBe('foo');
    });

    it('should error when a Promise is rejected', function() {
      var task = tr.Promise.promiseToTask(mockPromise);
      task.run();

      expect(mockPromise.then).toHaveBeenCalled();

      var reject = mockPromise.then.calls.mostRecent().args[1];
      reject('foo');

      expect(task.getState()).toBe(tr.enums.State.ERRORED);
      expect(task.getData()).toBe('foo');
      expect(task.getErrorMessage()).toBe('foo');
    });
  });

  // See https://github.com/kriskowal/q
  describe('Q', function() {
    var mockDeferred;
    var mockQ;

    beforeEach(function() {
      window.Q = {
        defer: function() {}
      };

      mockDeferred = jasmine.createSpyObj('mockDeferred', ['resolve', 'reject']);
      mockDeferred.promise = mockPromise;

      spyOn(mockDeferred, 'promise').and.returnValue(mockPromise);
      spyOn(window.Q, 'defer').and.returnValue(mockDeferred);
    });

    afterEach(function() {
      window.Q = undefined;
    });

    it('should reject a Promise when the decorated task errors', function() {
      var promise = tr.Promise.taskToPromise(stubTask);

      stubTask.run();
      stubTask.error({}, 'foo');

      expect(mockDeferred.reject).toHaveBeenCalled();
      expect(mockDeferred.reject).toHaveBeenCalledWith('foo');
    });

    it('should resolve a Promise when the decorated task completes', function() {
      var promise = tr.Promise.taskToPromise(stubTask);

      stubTask.run();
      stubTask.complete('foo');

      expect(mockDeferred.resolve).toHaveBeenCalled();
      expect(mockDeferred.resolve).toHaveBeenCalledWith('foo');
    });

    it('should complete when a Promise is resolved', function() {
      var task = tr.Promise.promiseToTask(mockPromise);
      task.run();

      expect(mockPromise.then).toHaveBeenCalled();

      var resolve = mockPromise.then.calls.mostRecent().args[0];
      resolve('foo');

      expect(task.getState()).toBe(tr.enums.State.COMPLETED);
      expect(task.getData()).toBe('foo');
    });

    it('should error when a Promise is rejected', function() {
      var task = tr.Promise.promiseToTask(mockPromise);
      task.run();

      expect(mockPromise.then).toHaveBeenCalled();

      var reject = mockPromise.then.calls.mostRecent().args[1];
      reject('foo');

      expect(task.getState()).toBe(tr.enums.State.ERRORED);
      expect(task.getData()).toBe('foo');
      expect(task.getErrorMessage()).toBe('foo');
    });
  });
});