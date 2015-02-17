new tr.StopOnSuccess([taskA, taskB]).run();

// Task A will be executed first.
// If Task A completes, StopOnSuccess will complete.
// If Task A fails, Task B will be run.
// If Task B completes, StopOnSuccess will complete.
// If Task B fails, StopOnSuccess will fail.