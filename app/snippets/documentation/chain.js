new Chain().first(taskA, taskB).then(taskC).then(taskE, taskD).or(taskF).then(taskG).run();

// First Task A and B will be run in parallel.
// If they succeed Task C will be run next.
// If Task C succeeds, Task D and E will be run next, in parallel.
// If either Task D or E fails, Task F will be run; otherwise it will be skipped.
// Lastly Task G will be run.