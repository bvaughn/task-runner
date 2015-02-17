// Creates a graph task that will execute tasks in the order required by their dependencies.
var task = new tr.Graph();
task.add(childTaskA);
task.add(childTaskB);
task.add(childTaskC, [childTaskA]);
task.add(childTaskD, [childTaskB]);
task.add(childTaskE, [childTaskC, childTaskD]);
task.run();