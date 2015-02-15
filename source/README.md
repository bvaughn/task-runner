# Task Runner

A Task is a unit of work, similar to a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) but more flexible. Tasks can be as small as a console log message or as big as an entire application. They can be bundled into collections and then treated the same as an individual task.

Tasks help break complex problems down into smaller, simpler problems.

This library provides several building-block tasks to get you started:

## Tasks used to perform common operations

These are a few built-in tasks for doing things that are common in web applications.

* `tr.Xhr`: Creates an XHR request and completes upon successful response from the server.
* `tr.Tween`: Animation-frame-based task for tweening properties.
* `tr.Listener`: Waits for an event-dispatching target to trigger a specific type of event.

## Tasks used to group other tasks

This type of task lets you treat a collection of tasks as a single task.

* `tr.Chain`: Lightweight interface to create a dependency graph task.
* `tr.Composite`: Executes a set of Tasks either in parallel or one after another.
* `tr.Graph`: Executes of a set of Tasks with dependencies on each other in the correct order.
* `tr.Observer`: Observes (but does not execute) a collection of Tasks. These tasks do not have to be related in any way.

## Tasks to help with controlling the flow of a program

* `tr.Factory`: Use this type of task when an important decision needs to be deferred.
* `tr.Failsafe`: Decorates a task and re-dispatches errors as successful completions.
* `tr.Stub`: No-op task primarily useful for unit testing of default, op-op values (that can be replaced with meaningful tasks to customize behavior).
* `tr.Retry`: Decorator for tasks that should be retried on error. This can be useful for tasks that might fail intermittently due to things like a temporary loss of Internet connectivity.
* `tr.StopOnSuccess`: Runs a series of tasks until one of them successfully completes.
* `tr.Timeout`: Decorates a Task and enforces a timeout. If the decorated task has not completed within the specified time limits, the decorator errors.
* `tr.Sleep`: Sleeps for an amount of time to pass before completing.

## Tasks that can be used to create new custom tasks

* `tr.Abstract`: Abstract implementation of Task. Extend this task to create your own task with only a few lines of code.
* `tr.Closure`: Invokes a callback function when run. Use this task when you want to do something custom but you don't want to implement a whole new type of task.

## Application framework tasks

These tasks are only available in the `dist/task-runner-enginer` version of Task Runner.

* `tr.app.Application`: Abstract application task. Use the enterState() method to start the application or to transition between states.
* `tr.app.State`: Abstract application state. Extend this base class to implement your own application states.
* `tr.app.TransitionState`: Special state used to resolve asynchronous dependencies when transitioning between other states.
* `tr.app.ApplicationRouter`: Watches for changes in the current URL and maps them to the appropriate application state. 