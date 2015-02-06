function init() {
  window.dependencyGraphTask = new taskrunner.DependencyGraphTask();

  taskrunner.XHRTask.setDefaultResponseType(taskrunner.XHRTask.ResponseType.JSON);

  var waitForClickTask;

  // Sequence to load IP address JSON
  var getIpTask = new taskrunner.XHRTask('http://httpbin.org/ip');
  waitForClickTask = new taskrunner.EventListenerTask(document.getElementById('loadIpButton'), 'click');
  dependencyGraphTask.addTask(waitForClickTask);
  dependencyGraphTask.addTask(getIpTask, [waitForClickTask]);
  dependencyGraphTask.addTask(
    new taskrunner.ClosureTask(
      function() {
        var data = getIpTask.getData();

        document.getElementById('ipLabel').innerText = data['origin'];
      }, true),
    [getIpTask]);

  // Sequence to load user agent JSON
  var getUserAgentTask = new taskrunner.XHRTask('http://httpbin.org/user-agent');
  waitForClickTask = new taskrunner.EventListenerTask(document.getElementById('loadUserAgentButton'), 'click');
  dependencyGraphTask.addTask(waitForClickTask);
  dependencyGraphTask.addTask(getUserAgentTask, [waitForClickTask]);
  dependencyGraphTask.addTask(
    new taskrunner.ClosureTask(
      function() {
        var data = getUserAgentTask.getData();

        document.getElementById('userAgentLabel').innerText = data['user-agent'];
      }, true),
    [getUserAgentTask]);

  // Sequence to load arbitrary text
  var getTextTask = new taskrunner.XHRTask('http://httpbin.org/html', undefined, taskrunner.XHRTask.ResponseType.TEXT);
  waitForClickTask = new taskrunner.EventListenerTask(document.getElementById('loadTextButton'), 'click');
  dependencyGraphTask.addTask(waitForClickTask);
  dependencyGraphTask.addTask(getTextTask, [waitForClickTask]);
  dependencyGraphTask.addTask(
    new taskrunner.ClosureTask(
      function() {
        var data = getTextTask.getData();

        document.getElementById('textLabel').innerText = data.substring(0, 100) + '...';
      }, true),
    [getTextTask]);

  // Sequence to load arbitrary XML
  var getXmlTask = new taskrunner.XHRTask('http://httpbin.org/xml', undefined, taskrunner.XHRTask.ResponseType.XML);
  waitForClickTask = new taskrunner.EventListenerTask(document.getElementById('loadXmlButton'), 'click');
  dependencyGraphTask.addTask(waitForClickTask);
  dependencyGraphTask.addTask(getXmlTask, [waitForClickTask]);
  dependencyGraphTask.addTask(
    new taskrunner.ClosureTask(
      function() {
        var data = getXmlTask.getData();

        document.getElementById('xmlLabel').innerText = new XMLSerializer().serializeToString(data).substring(0, 100) + '...';
      }, true),
    [getXmlTask]);

  // Run all of the above sequences in parallel.
  dependencyGraphTask.run();
};