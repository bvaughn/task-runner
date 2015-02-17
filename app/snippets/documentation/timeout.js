// Wraps the decorated task and enforces a 5-second maximum timeout.
var task = new tr.Timeout(decoratedTask, 5000);
task.run();