# Task Runner

A Task is a unit of work, similar to a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) but more flexible. Tasks can be as small as a console log message or as big as an entire application. They can be bundled into collections and then treated the same as an individual task.

Tasks help break complex problems down into smaller, simpler problems.

This library provides several building-block tasks to get you started:

## Tasks used to perform common operations

These are a few built-in tasks for doing things that are common in web applications.

* [taskrunner.XHRTask](http://rawgit.com/bvaughn/task-runner/master/docs/taskrunner.XHRTask.html): Creates an XHR request and completes upon successful response from the server.
* [taskrunner.TweenTask](http://rawgit.com/bvaughn/task-runner/master/docs/taskrunner.TweenTask.html): Animation-frame-based task for tweening properties.
* [taskrunner.EventListenerTask](http://rawgit.com/bvaughn/task-runner/master/docs/taskrunner.EventListenerTask.html): Waits for an event-dispatching target to trigger a specific type of event.

## Tasks used to group other tasks

This type of task lets you treat a collection of tasks as a single task.

* [taskrunner.CompositeTask](http://rawgit.com/bvaughn/task-runner/master/docs/taskrunner.CompositeTask.html): Executes a set of Tasks either in parallel or one after another.
* [taskrunner.DependencyGraphTask](http://rawgit.com/bvaughn/task-runner/master/docs/taskrunner.DependencyGraphTask.html): Executes of a set of Tasks with dependencies on each other in the correct order.
* [taskrunner.ObserverTask](http://rawgit.com/bvaughn/task-runner/master/docs/taskrunner.ObserverTask.html): Observes (but does not execute) a collection of Tasks. These tasks do not have to be related in any way.

## Tasks to help with controlling the flow of an application

* [taskrunner.DeferredFactoryTask](http://rawgit.com/bvaughn/task-runner/master/docs/taskrunner.DeferredFactoryTask.html): Use this type of task when an important decision needs to be deferred.
* [taskrunner.FailsafeTask](http://rawgit.com/bvaughn/task-runner/master/docs/taskrunner.FailsafeTask.html): Decorates a task and re-dispatches errors as successful completions.
* [taskrunner.NullTask](http://rawgit.com/bvaughn/task-runner/master/docs/taskrunner.NullTask.html): No-op task primarily useful for unit testing of default, op-op values (that can be replaced with meaningful tasks to customize behavior).
* [taskrunner.RetryOnErrorTask](http://rawgit.com/bvaughn/task-runner/master/docs/taskrunner.RetryOnErrorTask.html): Decorator for tasks that should be retried on error. This can be useful for tasks that might fail intermittently due to things like a temporary loss of Internet connectivity.
* [taskrunner.TimeoutTask](http://rawgit.com/bvaughn/task-runner/master/docs/taskrunner.TimeoutTask.html): Decorates a Task and enforces a timeout. If the decorated task has not completed within the specified time limits, the decorator errors.
* [taskrunner.WaitTask](http://rawgit.com/bvaughn/task-runner/master/docs/taskrunner.WaitTask.html): Waits for an amount of time to pass before completing.

## Tasks that can be used to create new custom tasks

* [taskrunner.AbstractTask](http://rawgit.com/bvaughn/task-runner/master/docs/taskrunner.AbstractTask.html): Abstract implementation of Task. Extend this task to create your own task with only a few lines of code.
* [taskrunner.ClosureTask](http://rawgit.com/bvaughn/task-runner/master/docs/taskrunner.ClosureTask.html): Invokes a callback function when run. Use this task when you want to do something custom but you don't want to implement a whole new type of task.


