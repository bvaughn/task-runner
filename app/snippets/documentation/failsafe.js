// Sends a fire-and-forget style XHR to log data (and ignores failures)
var task = new tr.Failsafe(
  return new tr.Xhr('some-logging-url', someLoggingData));
task.run();