
# Task Runner
---
**[Official website](http://bvaughn.github.io/task-runner/)** |
**[API documentation](http://rawgit.com/bvaughn/task-runner/master/docs/index.html)** |
**[Report an issue](https://github.com/bvaughn/task-runner/issues/new)**

Task Runner is a collection of low-level libraries designed to make JavaScript application development easier.

## What is a Task?

A task encapsulates a unit of work. Like a [JavaScript Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), once a task is run it will eventually *complete* or *error* to indicate the outcome. Unlike a Promise, tasks can also be *interrupted and resumed*, making them ideal for things like animations, sounds, etc.

Tasks can be as small as a console log message or as big as an entire application. They can be synchronous or asynchronous.

Tasks have many advantages over other methods of asynchronous programming, such as callbacks:

* Performing several tasks in a row will not create nested "pyramid" code as you would get when using only callbacks.
* Tasks are fully composable, allowing you to perform branching, parallelism, and complex error handling, without the spaghetti code of having many named callbacks.
* You can arrange task-based code in the order that it executes, rather than having to split your logic across scattered callback functions.

For more information on the above benefits, see the [chaining tasks](https://github.com/bvaughn/task-runner#chaining-tasks) section below.

## Creating Tasks

Task Runner includes several [reusable tasks](http://rawgit.com/bvaughn/task-runner/master/docs/index.html) but you can also create your own. There are 2 basic approaches:

### Creating Tasks via Inheritance

Extend `tr.Abstract` task and override the runImpl, interruptImpl, and resetImpl methods.

```js
var CustomTask = function() {
  tr.Abstract.call(this); // call super constructor.
};

CustomTask.prototype = Object.create(tr.Abstract.prototype);

CustomTask.prototype.runImpl = function() {
  // Start the work.
};

CustomTask.prototype.interruptImpl = function() {
  // Pause anything that was started.
};

CustomTask.prototype.resetImpl = function() {
  // Restore the task to its initial state so that it can be rerun.
};

```

### Creating Tasks via Composition

Use the built in `tr.Closure` task to decorate functions and automatically turn them *into* tasks.

```js
new Closure(
  function(thisTask) {
    // Do some work and when you're finished call...
    thisTask.complete();
  });
```

Check out the [Task Runner website](http://bvaughn.github.io/task-runner/) for more examples and documentation!

## Chaining Tasks

Once you've created some tasks, what do you do with them? By itself a task is only a little better than a Promise- (it can paused and resumed)- but what about the other benefits that were mentioned above?

The beauty of Task Runner is shown in the way tasks can be connected to each other. Task Runner provides several such ways to group and organize tasks, the simplest of which is `tr.Chain`. Here's an example of how it works

```js
new tr.Chain().first(taskA, taskB)
              .then(taskC)
              .then(taskE, taskD)
              .or(taskF)
              .then(taskG)
              .run();
```

The above code creates a graph of composite of tasks that will run in the following order:

1. First Task A and B will be run (in parallel).
1. If they succeed Task C will be run next.
1. If Task C succeeds, Task D and E will be run next (in parallel).
1. If either Task D or E fails, Task F will be run. Otherwise it will be skipped.
1. Lastly Task G will be run.

If any of the above tasks fail (with the exception of Tasks D or E) the chain of execution will stop. Otherwise it will run until the last task (Task G) completes.

Chain tasks, like all tasks, support callbacks. To be notified of a failed chain, just attach an error handler as shown below:

```js
new tr.Chain(completedCallback, errorCallback)
  // Add other tasks here
  .run();
```

If you need even more find-grained control over the order of your tasks, check out `tr.Graph` in the [API documentation](http://rawgit.com/bvaughn/task-runner/master/docs/index.html).

## Working with Promises

Tasks may be more useful than Promises, but they're not as popular. That's okay! Task Runner provides built-in methods for working with Promises. The following types of Promises are supported:

* **ES6 (Promise.prototype)**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
* **Q**: https://github.com/kriskowal/q
* **Angular $q**: https://docs.angularjs.org/api/ng/service/$q
* **jQuery**: http://api.jquery.com/promise/

If you're working with a library that returns Promises (e.g. jQuery), you can convert them to tasks automatically like so:

```js
var aNewTask = tr.Promise.promiseToTask(yourPromise);
// You can treat this task like any other Task.
```

You may be working with a library that *expects* Promises (e.g. Angular's UI Router). In this case you can convert any Task *to* a Promise like so:

```js
var aNewPromise = tr.Promise.taskToPromise(yourTask);
// This promise can be treated like any other Promise.
```

For more information, refer to the `tr.Promise` task in the [API documentation](http://rawgit.com/bvaughn/task-runner/master/docs/index.html).

## Get Started

Get Task Runner can be installed in any of the following ways:

* Clone & [build](README.md#building-task-runner) this repository.
* Download a [release](https://github.com/bvaughn/task-runner/tree/master/dist).
* Bia Bower, by running `bower install task-runner`.
* Via NPM, by running `npm install task-runner-js`.

Task Runner is available in two flavors:

* `dist/task-runner`: This is the base, task library. It's compatible with all browsers (as well as Node JS) and can be used with any JavaScript frameworks (Angular, React, Ember, etc.).
* `dist/task-runner-enginer`: This includes all of the above features *in addition to* an application engine that can be used to create single-page-apps. Tasks that are only in this package are explicitly marked in [the documentation](http://rawgit.com/bvaughn/task-runner/master/docs/index.html).

Each of the above bundles includes both a `debug.js` and a `compressed.js`. The debug build is pretty-printed for easier debugging and also logs task state-change events to the console. The compressed version is minified and does not include logging.

## Building

### Task Runner automated tests

Begin by running `npm install` to install [Karma](https://karma-runner.github.io) and other dependencies.

You can then run tests once using:
```bash
gulp test
```

Or you can run tests each time a file in the `source` or `tests` directory changes using:
```bash
gulp test:watch
```

### Building Task Runner

Begin by running `bower install` to install the [Closure Compiler](https://github.com/google/closure-compiler) and [Closure Library](https://github.com/google/closure-library) components and `npm install` to install gulp dependencies.

Then run the following command from the root of the Task Runner checkout:

```bash
gulp build
```

### Generating Documentation

Begin by running `npm install` to install [gulp-doxx](https://github.com/filipovskii/gulp-doxx/).

Then run the following command from the root of the Task Runner checkout:

```bash
gulp docs
```