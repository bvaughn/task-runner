function initDemo2() {

  // Sequence to load IP address JSON
  var ipComposite =
    new tr.Composite(false, [
      new tr.Listener(document.getElementById('loadIpButton'), 'click'),
      new tr.Xhr('http://httpbin.org/ip', undefined, tr.Xhr.ResponseType.JSON)
        .completed(
          function(xhrTask) {
            document.getElementById('ipLabel').innerText = xhrTask.getData()['origin'];
          })
    ]);

  // Sequence to load user agent JSON
  var userAgentComposite =
    new tr.Composite(false, [
      new tr.Listener(document.getElementById('loadUserAgentButton'), 'click'),
      new tr.Xhr('http://httpbin.org/user-agent', undefined, tr.Xhr.ResponseType.JSON)
        .completed(
          function(xhrTask) {
            document.getElementById('userAgentLabel').innerText = xhrTask.getData()['user-agent'];
          })
    ]);

  // Sequence to load arbitrary text
  var textComposite =
    new tr.Composite(false, [
      new tr.Listener(document.getElementById('loadTextButton'), 'click'),
      new tr.Xhr('http://httpbin.org/html', undefined, tr.Xhr.ResponseType.TEXT)
        .completed(
          function(xhrTask) {
            var data = xhrTask.getData();

            document.getElementById('textLabel').innerText = data.substring(0, 100).replace(/\n/g, "") + '...';
          })
    ]);

  // Sequence to load arbitrary XML
  var xmlComposite =
    new tr.Composite(false, [
      new tr.Listener(document.getElementById('loadXmlButton'), 'click'),
      new tr.Xhr('http://httpbin.org/xml', undefined, tr.Xhr.ResponseType.XML)
        .completed(
          function(xhrTask) {
          var data = xhrTask.getData();

            document.getElementById('xmlLabel').innerText = new XMLSerializer().serializeToString(data).substring(0, 100) + '...';
          })
    ]);

  // Run the above tasks in parallel, and then update the DOM on completion
  new tr.Composite(true, [ipComposite, userAgentComposite, textComposite, xmlComposite])
    .completed(
      function() {
        document.getElementById('task-complete-alert').className = "alert alert-info";
      })
    .run();
};