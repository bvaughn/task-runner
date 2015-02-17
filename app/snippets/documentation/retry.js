// Wraps the decorated task and restarts it in the event of an error.
// This task allows 1 second to pass in between each retry, and gives up after 3 retries.
var task = new tr.opt_taskName(taskThatMayFail, 3, 1000);
task.run();