describe('tr.Xhr', function() {

  beforeEach(function() {
    jasmine.clock().install();
    jasmine.Ajax.install();

    tr.Xhr.setDefaultResponseType(undefined);
  });

  afterEach(function() {
    jasmine.clock().uninstall();
    jasmine.Ajax.uninstall();
  });

  it('should send a GET request if no post data is provided', function() {
    var task = new tr.Xhr('http://fake/url');
    task.run();

    expect(jasmine.Ajax.requests.mostRecent().url).toBe('http://fake/url');
  });

  it('should send a POST request if post data is provided', function() {
    var task = new tr.Xhr('http://fake/url', {});
    task.run();

    expect(jasmine.Ajax.requests.mostRecent().url).toBe('http://fake/url');
  });

  it('should default to JSON response-type if default response-type set and no override specified', function() {
    tr.Xhr.setDefaultResponseType(tr.enums.XhrResponseType.JSON);

    var task = new tr.Xhr('http://fake/url');

    expect(task.getResponseType()).toBe(tr.enums.XhrResponseType.JSON);
  });

  it('should default to text response-type if no override specified', function() {
    var task = new tr.Xhr('http://fake/url');

    expect(task.getResponseType()).toBe(tr.enums.XhrResponseType.TEXT);
  });

  it('should complete after a successful request that returns JSON', function() {
    var task = new tr.Xhr('http://fake/url', undefined, tr.enums.XhrResponseType.JSON);
    task.run();

    expect(task.getResponseType()).toBe(tr.enums.XhrResponseType.JSON);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 200,
      responseText: '{ "foo": { "bar": "baz" } }'
    });

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getData()).toEqual({foo: {bar: "baz"}});
  });

  it('should complete after a successful request that returns TEXT', function() {
    var task = new tr.Xhr('http://fake/url', undefined, tr.enums.XhrResponseType.TEXT);
    task.run();

    expect(task.getResponseType()).toBe(tr.enums.XhrResponseType.TEXT);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 200,
      responseText: 'fake response'
    });

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getData()).toBe('fake response');
  });

  it('should complete after a successful request that returns XML', function() {
    var task = new tr.Xhr('http://fake/url', undefined, tr.enums.XhrResponseType.XML);
    task.run();

    expect(task.getResponseType()).toBe(tr.enums.XhrResponseType.XML);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    var foo = document.createElement("foo");
    var bar = document.createElement("bar");
    var baz = document.createTextNode("baz");

    var xml = document.createElement("xml");
    xml.appendChild(foo);
    foo.appendChild(bar);
    bar.appendChild(baz);

    var xmlString = new XMLSerializer().serializeToString(xml);

    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 200,
      contentType: "text/xml",
      responseText: xmlString
    });

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getData()).toBeTruthy();
    expect(new XMLSerializer().serializeToString(task.getData())).toBe(xmlString);
  });

  it('should error after a failed request', function() {
    var task = new tr.Xhr('http://fake/url');
    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.Ajax.requests.mostRecent().responseError();

    expect(task.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should error after an aborted request', function() {
    var task = new tr.Xhr('http://fake/url');
    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.Ajax.requests.mostRecent().abort();

    expect(task.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should error after a timed-out request', function() {
    var task = new tr.Xhr('http://fake/url');
    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.Ajax.requests.mostRecent().responseTimeout();

    expect(task.getState()).toBe(tr.enums.State.ERRORED);
  });

  it('should error (but not throw) if invalid JSON is returned', function() {
    var task = new tr.Xhr('http://fake/url', undefined, tr.enums.XhrResponseType.JSON);
    task.run();

    expect(task.getResponseType()).toBe(tr.enums.XhrResponseType.JSON);
    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 200,
      responseText: 'invalid'
    });

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
    expect(task.xhr_).toBeTruthy();
  });

  it('should clear data on a reset and refetch data on a rerun', function() {
    var task = new tr.Xhr('http://fake/url');
    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 200,
      responseText: 'fake response 1'
    });

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getData()).toBe('fake response 1');

    task.reset();

    expect(task.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task.getData()).toBeFalsy();

    task.run();

    expect(task.getState()).toBe(tr.enums.State.RUNNING);

    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 200,
      responseText: 'fake response 2'
    });

    expect(task.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task.getData()).toBe('fake response 2');
  });
});
