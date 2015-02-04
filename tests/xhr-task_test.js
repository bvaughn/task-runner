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
    //xhrManager = new goog.net.XhrManager();
    //xhrManager.xhrPool_ = new goog.testing.net.XhrIoPool();
    //xhrIo = xhrManager.xhrPool_.getXhr();

    goog.net.XhrIo = goog.testing.net.XhrIo;

    //var replacer = new goog.testing.PropertyReplacer();
    //replacer.replace(goog.net.XhrIo, 'send', goog.testing.net.XhrIo.send);
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

  it('should complete after a successful request', function() {
    var task = new taskrunner.XHRTask('http://fake/url');
    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.xhrRequest_.simulateResponse(200, 'fake response', {});

    expect(task.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(task.getData()).toBe('fake response');
  });

  it('should error after a failed request', function() {
    var task = new taskrunner.XHRTask('http://fake/url');
    task.run();

    expect(task.getState()).toBe(taskrunner.TaskState.RUNNING);

    task.xhrRequest_.simulateResponse(500, '', {});

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
