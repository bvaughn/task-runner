goog.provide('goog.XHRTask.test');
goog.setTestOnly('goog.XHRTask.test');

goog.require('goog.testing.PropertyReplacer');
goog.require('taskrunner.TaskState');
goog.require('taskrunner.XHRTask');

describe('goog.XHRTask', function() {

  var mockXMLHttpRequest;
  var xhrIoPool;
  
  beforeEach(function() {
    mockXMLHttpRequest = function() {
      mockXMLHttpRequest = this; // Give test a reference to the active XHR
    };
    mockXMLHttpRequest.prototype.abort = function() {
      this.aborted_ = true;
    };
    mockXMLHttpRequest.prototype.open = function(method, url, asynchronous) {
      this.asynchronous_ = asynchronous;
      this.method_ = method;
      this.url_ = url;
    };
    mockXMLHttpRequest.prototype.send = function(data) {
      this.sent_ = true;
      this.data_ = data;
    };
    mockXMLHttpRequest.prototype.simulateResponse = function(status, responseText) {
      this.readyState = 4;
      this.status = status;
      this.responseText = responseText;

      this.onreadystatechange();
    };

    var replacer = new goog.testing.PropertyReplacer();
    replacer.set(goog.global, 'XMLHttpRequest', mockXMLHttpRequest);
  });

  it('should send a GET request if no post data is provided', function() {
    var task = new taskrunner.XHRTask('http://fake/url');
    task.run();

    expect(mockXMLHttpRequest.method_).toBe('GET');
  });

  it('should send a POST request if post data is provided', function() {
    var task = new taskrunner.XHRTask('http://fake/url', {});
    task.run();

    expect(mockXMLHttpRequest.method_).toBe('POST');
  });

  it('should complete after a successful request', function() {
    var task = new taskrunner.XHRTask('http://fake/url');
    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    mockXMLHttpRequest.simulateResponse(200, 'fake response');

    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getData()).toBe('fake response');
  });

  it('should error after a failed request', function() {
    var task = new taskrunner.XHRTask('http://fake/url');
    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    mockXMLHttpRequest.simulateResponse(500, 'fake error');

    expect(task.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(task.getData()).toBe(500);
    expect(task.getErrorMessage()).toBe('fake error');
  });

  it('should ignore XHR events that occur while interrupted', function() {
    var task = new taskrunner.XHRTask('http://fake/url');
    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.interrupt();

    expect(task.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(mockXMLHttpRequest.aborted_).toBe(true);

    mockXMLHttpRequest.simulateResponse(200, 'fake response');

    expect(task.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
  });

  it('should rerun after being interrupted', function() {
    var task = new taskrunner.XHRTask('http://fake/url');
    task.run();
    task.interrupt();

    mockXMLHttpRequest.simulateResponse(200, 'fake response');

    expect(task.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(mockXMLHttpRequest.aborted_).toBe(true);

    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);
  });

  it('should clear data on a reset and refetch data on a rerun', function() {
    var task = new taskrunner.XHRTask('http://fake/url');
    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    mockXMLHttpRequest.simulateResponse(200, 'fake response 1');

    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getData()).toBe('fake response 1');

    task.reset();

    expect(task.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(task.getData()).toBeFalsy();

    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    mockXMLHttpRequest.simulateResponse(200, 'fake response 2');

    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getData()).toBe('fake response 2');
  });
});
