function initDemo2() {
  var graphTask = new tr.Graph();

  tr.Xhr.setDefaultResponseType(tr.Xhr.ResponseType.JSON);

  var waitForClickTask;

  // Sequence to load IP address JSON
  var getIpTask = new tr.Xhr('http://httpbin.org/ip');
  waitForClickTask = new tr.Listener(document.getElementById('loadIpButton'), 'click');
  graphTask.add(waitForClickTask);
  graphTask.add(getIpTask, [waitForClickTask]);
  graphTask.add(
    new tr.Closure(
      function() {
        var data = getIpTask.getData();

        document.getElementById('ipLabel').innerText = data['origin'];
      }, true),
    [getIpTask]);

  // Sequence to load user agent JSON
  var getUserAgentTask = new tr.Xhr('http://httpbin.org/user-agent');
  waitForClickTask = new tr.Listener(document.getElementById('loadUserAgentButton'), 'click');
  graphTask.add(waitForClickTask);
  graphTask.add(getUserAgentTask, [waitForClickTask]);
  graphTask.add(
    new tr.Closure(
      function() {
        var data = getUserAgentTask.getData();

        document.getElementById('userAgentLabel').innerText = data['user-agent'];
      }, true),
    [getUserAgentTask]);

  // Sequence to load arbitrary text
  var getTextTask = new tr.Xhr('http://httpbin.org/html', undefined, tr.Xhr.ResponseType.TEXT);
  waitForClickTask = new tr.Listener(document.getElementById('loadTextButton'), 'click');
  graphTask.add(waitForClickTask);
  graphTask.add(getTextTask, [waitForClickTask]);
  graphTask.add(
    new tr.Closure(
      function() {
        var data = getTextTask.getData();

        document.getElementById('textLabel').innerText = data.substring(0, 100) + '...';
      }, true),
    [getTextTask]);

  // Sequence to load arbitrary XML
  var getXmlTask = new tr.Xhr('http://httpbin.org/xml', undefined, tr.Xhr.ResponseType.XML);
  waitForClickTask = new tr.Listener(document.getElementById('loadXmlButton'), 'click');
  graphTask.add(waitForClickTask);
  graphTask.add(getXmlTask, [waitForClickTask]);
  graphTask.add(
    new tr.Closure(
      function() {
        var data = getXmlTask.getData();

        document.getElementById('xmlLabel').innerText = new XMLSerializer().serializeToString(data).substring(0, 100) + '...';
      }, true),
    [getXmlTask]);

  // Run all of the above sequences in parallel.
  graphTask.run();
};