// Observes the pair of tasks provided to it and completes or errors when they do.
var task = new tr.Observer([observedTask1, observedTask2]);
task.run();