goog.provide('goog.XHRTask.test');
goog.setTestOnly('goog.XHRTask.test');

goog.require('goog.net.XhrIo');
goog.require('goog.net.XhrManager');
goog.require('goog.testing.net.XhrIoPool');
goog.require('goog.testing.PropertyReplacer');
goog.require('taskrunner.TaskState');
goog.require('taskrunner.XHRTask');

describe('goog.XHRTask', function() {

  var xhrIo;
  var xhrManager;
  
  beforeEach(function() {
    goog.net.XhrIo = goog.testing.net.XhrIo;

    taskrunner.XHRTask.setDefaultResponseType(undefined);
  });

  it('should send a GET request if no post data is provided', function() {
    var task = new taskrunner.XHRTask('http://fake/url');
    task.run();

    expect(task.xhrRequest_.getLastMethod()).toBe('GET');
  });

  it('should send a POST request if post data is provided', function() {
    var task = new taskrunner.XHRTask('http://fake/url', {});
    task.run();

    expect(task.xhrRequest_.getLastMethod()).toBe('POST');
  });

  it('should default to JSON response-type if default response-type set and no override specified', function() {
    taskrunner.XHRTask.setDefaultResponseType(taskrunner.XHRTask.ResponseType.JSON);

    var task = new taskrunner.XHRTask('http://fake/url');

    expect(task.ResponseType_).toBe(taskrunner.XHRTask.ResponseType.JSON);
  });

  it('should default to text response-type if no override specified', function() {
    var task = new taskrunner.XHRTask('http://fake/url');

    expect(task.ResponseType_).toBe(taskrunner.XHRTask.ResponseType.TEXT);
  });

  it('should complete after a successful request that returns JSON', function() {
    var task = new taskrunner.XHRTask('http://fake/url', undefined, taskrunner.XHRTask.ResponseType.JSON);
    task.run();

    expect(task.ResponseType_).toBe(taskrunner.XHRTask.ResponseType.JSON);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.xhrRequest_.simulateResponse(200, '{ "foo": { "bar": "baz" } }', {});

    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getData()).toEqual({foo: {bar: "baz"}});
  });

  it('should complete after a successful request that returns TEXT', function() {
    var task = new taskrunner.XHRTask('http://fake/url', undefined, taskrunner.XHRTask.ResponseType.TEXT);
    task.run();

    expect(task.ResponseType_).toBe(taskrunner.XHRTask.ResponseType.TEXT);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.xhrRequest_.simulateResponse(200, 'fake response', {});

    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getData()).toBe('fake response');
  });

  it('should complete after a successful request that returns XML', function() {
    var task = new taskrunner.XHRTask('http://fake/url', undefined, taskrunner.XHRTask.ResponseType.XML);
    task.run();

    expect(task.ResponseType_).toBe(taskrunner.XHRTask.ResponseType.XML);
    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    var foo = document.createElement("foo");
    var bar = document.createElement("bar");
    var baz = document.createTextNode("baz");

    var xml = document.createElement("xml");
    xml.appendChild(foo);
    foo.appendChild(bar);
    bar.appendChild(baz);

    task.xhrRequest_.simulateResponse(200, xml, {});

    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getData()).toBe(xml);
  });

  it('should error after a failed request', function() {
    var task = new taskrunner.XHRTask('http://fake/url');
    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.xhrRequest_.simulateResponse(500, null, {});

    expect(task.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(task.getData()).toBe(goog.net.ErrorCode.HTTP_ERROR);
  });

  it('should error after a timed-out request', function() {
    var task = new taskrunner.XHRTask('http://fake/url');
    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.xhrRequest_.simulateTimeout();

    expect(task.getState()).toBe(taskrunner.TaskState.ERRORED);
    expect(task.getData()).toBe(goog.net.ErrorCode.TIMEOUT);
  });

  it('should ignore XHR events that occur while interrupted', function() {
    var task = new taskrunner.XHRTask('http://fake/url');
    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.interrupt();

    expect(task.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(task.xhrRequest_).toBeFalsy();
  });

  it('should rerun after being interrupted', function() {
    var task = new taskrunner.XHRTask('http://fake/url');
    task.run();
    task.interrupt();

    expect(task.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
    expect(task.xhrRequest_).toBeFalsy();

    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);
    expect(task.xhrRequest_).toBeTruthy();
  });

  it('should clear data on a reset and refetch data on a rerun', function() {
    var task = new taskrunner.XHRTask('http://fake/url');
    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.xhrRequest_.simulateResponse(200, 'fake response 1');

    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getData()).toBe('fake response 1');

    task.reset();

    expect(task.getState()).toBe(taskrunner.TaskState.INITIALIZED);
    expect(task.getData()).toBeFalsy();

    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.xhrRequest_.simulateResponse(200, 'fake response 2');

    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getData()).toBe('fake response 2');
  });
});
