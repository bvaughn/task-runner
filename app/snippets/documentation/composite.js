// Creates a composite task that will execute child tasks A, B, and C in parallel
var task = new tr.Composite(true);
task.add(childTaskA);
task.add(childTaskB);
task.add(childTaskC);
task.run();
 
// Creates a composite task that will execute child tasks A, then B, then C in order
var task = new tr.Composite(false, [childTaskA, childTaskB, childTaskC]);
task.run();