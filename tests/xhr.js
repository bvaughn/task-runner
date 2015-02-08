goog.provide('tr.Xhr.test');
goog.setTestOnly('tr.Xhr.test');

goog.require('goog.net.XhrIo');
goog.require('goog.net.XhrManager');
goog.require('goog.testing.net.XhrIoPool');
goog.require('goog.testing.PropertyReplacer');
goog.require('tr.Xhr');
goog.require('tr.enums.State');

describe('tr.Xhr', function() {

  var xhrIo;
  var xhrManager;
  
  beforeEach(function() {
    goog.net.XhrIo = goog.testing.net.XhrIo;

    tr.Xhr.setDefaultResponseType(undefined);
  });

  it('should send a GET request if no post data is provided', function() {
    var task = new tr.Xhr('http://fake/url');
    task.run();

    expect(task.xhrRequest_.getLastMethod()).toBe('GET');
  });

  it('should send a POST request if post data is provided', function() {
    var task = new tr.Xhr('http://fake/url', {});
    task.run();

    expect(task.xhrRequest_.getLastMethod()).toBe('POST');
  });

  it('should default to JSON response-type if default response-type set and no override specified', function() {
    tr.Xhr.setDefaultResponseType(tr.Xhr.ResponseType.JSON);

    var task = new tr.Xhr('http://fake/url');

    expect(task.ResponseType_).toBe(tr.Xhr.ResponseType.JSON);
  });

  it('should default to text response-type if no override specified', function() {
    var task = new tr.Xhr('http://fake/url');

    expect(task.ResponseType_).toBe(tr.Xhr.ResponseType.TEXT);
  });

  it('should complete after a successful request that returns JSON', function() {
    var task = new tr.Xhr('http://fake/url', undefined, tr.Xhr.ResponseType.JSON);
    task.run();

    expect(task.ResponseType_).toBe(tr.Xhr.ResponseType.JSON);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.xhrRequest_.simulateResponse(200, '{ "foo": { "bar": "baz" } }', {});

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getData()).toEqual({foo: {bar: "baz"}});
  });

  it('should complete after a successful request that returns TEXT', function() {
    var task = new tr.Xhr('http://fake/url', undefined, tr.Xhr.ResponseType.TEXT);
    task.run();

    expect(task.ResponseType_).toBe(tr.Xhr.ResponseType.TEXT);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.xhrRequest_.simulateResponse(200, 'fake response', {});

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getData()).toBe('fake response');
  });

  it('should complete after a successful request that returns XML', function() {
    var task = new tr.Xhr('http://fake/url', undefined, tr.Xhr.ResponseType.XML);
    task.run();

    expect(task.ResponseType_).toBe(tr.Xhr.ResponseType.XML);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    var foo = document.createElement("foo");
    var bar = document.createElement("bar");
    var baz = document.createTextNode("baz");

    var xml = document.createElement("xml");
    xml.appendChild(foo);
    foo.appendChild(bar);
    bar.appendChild(baz);

    task.xhrRequest_.simulateResponse(200, xml, {});

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getData()).toBe(xml);
  });

  it('should error after a failed request', function() {
    var task = new tr.Xhr('http://fake/url');
    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.xhrRequest_.simulateResponse(500, null, {});

    expect(task.getState()).toBe(tr.enums.State.ERRORED);
    expect(task.getData()).toBe(goog.net.ErrorCode.HTTP_ERROR);
  });

  it('should error after a timed-out request', function() {
    var task = new tr.Xhr('http://fake/url');
    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.xhrRequest_.simulateTimeout();

    expect(task.getState()).toBe(tr.enums.State.ERRORED);
    expect(task.getData()).toBe(goog.net.ErrorCode.TIMEOUT);
  });

  it('should error (but not throw) if invalid JSON is returned', function() {
    var task = new tr.Xhr('http://fake/url', undefined, tr.Xhr.ResponseType.JSON);
    task.run();

    expect(task.ResponseType_).toBe(tr.Xhr.ResponseType.JSON);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.xhrRequest_.simulateResponse(200, 'invalid', {});

    expect(task.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should ignore XHR events that occur while interrupted', function() {
    var task = new tr.Xhr('http://fake/url');
    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.interrupt();

    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(task.xhrRequest_).toBeFalsy();
  });

  it('should rerun after being interrupted', function() {
    var task = new tr.Xhr('http://fake/url');
    task.run();
    task.interrupt();

    expect(task.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(task.xhrRequest_).toBeFalsy();

    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);
    expect(task.xhrRequest_).toBeTruthy();
  });

  it('should clear data on a reset and refetch data on a rerun', function() {
    var task = new tr.Xhr('http://fake/url');
    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.xhrRequest_.simulateResponse(200, 'fake response 1');

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getData()).toBe('fake response 1');

    task.reset();

    expect(task.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getData()).toBeFalsy();

    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    task.xhrRequest_.simulateResponse(200, 'fake response 2');

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getData()).toBe('fake response 2');
  });
});
