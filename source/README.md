# Task Runner

A Task is a unit of work, similar to a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) but more flexible. Tasks can be as small as a console log message or as big as an entire application. They can be bundled into collections and then treated the same as an individual tr.

Tasks help break complex problems down into smaller, simpler problems.

This library provides several building-block tasks to get you started:

## Tasks used to perform common operations

These are a few built-in tasks for doing things that are common in web applications.

* [tr.Xhr](http://rawgit.com/bvaughn/task-runner/master/docs/tr.Xhr.html): Creates an XHR request and completes upon successful response from the server.
* [tr.Tween](http://rawgit.com/bvaughn/task-runner/master/docs/tr.Tween.html): Animation-frame-based task for tweening properties.
* [tr.Listener](http://rawgit.com/bvaughn/task-runner/master/docs/tr.Listener.html): Waits for an event-dispatching target to trigger a specific type of event.

## Tasks used to group other tasks

This type of task lets you treat a collection of tasks as a single tr.

* [tr.Composite](http://rawgit.com/bvaughn/task-runner/master/docs/tr.Composite.html): Executes a set of Tasks either in parallel or one after another.
* [tr.Graph](http://rawgit.com/bvaughn/task-runner/master/docs/tr.Graph.html): Executes of a set of Tasks with dependencies on each other in the correct order.
* [tr.Observer](http://rawgit.com/bvaughn/task-runner/master/docs/tr.Observer.html): Observes (but does not execute) a collection of Tasks. These tasks do not have to be related in any way.

## Tasks to help with controlling the flow of an application

* [tr.Factory](http://rawgit.com/bvaughn/task-runner/master/docs/tr.Factory.html): Use this type of task when an important decision needs to be deferred.
* [tr.Failsafe](http://rawgit.com/bvaughn/task-runner/master/docs/tr.Failsafe.html): Decorates a task and re-dispatches errors as successful completions.
* [tr.Stub](http://rawgit.com/bvaughn/task-runner/master/docs/tr.Stub.html): No-op task primarily useful for unit testing of default, op-op values (that can be replaced with meaningful tasks to customize behavior).
* [tr.Retry](http://rawgit.com/bvaughn/task-runner/master/docs/tr.Retry.html): Decorator for tasks that should be retried on error. This can be useful for tasks that might fail intermittently due to things like a temporary loss of Internet connectivity.
* [tr.Timeout](http://rawgit.com/bvaughn/task-runner/master/docs/tr.Timeout.html): Decorates a Task and enforces a timeout. If the decorated task has not completed within the specified time limits, the decorator errors.
* [tr.Sleep](http://rawgit.com/bvaughn/task-runner/master/docs/tr.Sleep.html): Sleeps for an amount of time to pass before completing.

## Tasks that can be used to create new custom tasks

* [tr.Abstract](http://rawgit.com/bvaughn/task-runner/master/docs/tr.Abstract.html): Abstract implementation of Task. Extend this task to create your own task with only a few lines of code.
* [tr.Closure](http://rawgit.com/bvaughn/task-runner/master/docs/tr.Closure.html): Invokes a callback function when run. Use this task when you want to do something custom but you don't want to implement a whole new type of tr.


