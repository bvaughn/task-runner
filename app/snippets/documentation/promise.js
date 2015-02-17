var aNewTask = tr.Promise.promiseToTask(yourPromise);
// You can treat this task like any other Task.

var aNewPromise = tr.Promise.taskToPromise(yourTask);
// This promise can be treated like any other Promise.