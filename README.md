
# Task Runner
---
**[Official website](http://bvaughn.github.io/task-runner/)** |
**[API documentation](http://rawgit.com/bvaughn/task-runner/master/docs/index.html)** |
**[Report an issue](https://github.com/bvaughn/task-runner/issues/new)**

Task Runner is a collection of low-level libraries designed to make JavaScript application development easier. It does not require any third party libraries or frameworks.

Task Runner includes:

* *Tasks*, which make organization of complex asynchronous code more manageable. A task is kind of like a [JavaScript Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) but more powerful.
* A optional, barebones application framework and router (based on [UI Router](https://github.com/angular-ui/ui-router/)) to aid in the creation of task-based applications. (This code is bundled separately, as an add-on.)

For more information, see the [Task Runner API documentation](http://rawgit.com/bvaughn/task-runner/master/docs/index.html).

## Tasks

A *task* encapsulates a unit of work. Tasks can be as small as a console log message or as big as an entire application. They can be synchronous or asynchronous.

Tasks have many advantages over other methods of asynchronous programming, such as callbacks:

* Performing several tasks in a row will not create nested "pyramid" code as you would get when using only callbacks.
* Tasks are fully composable, allowing you to perform branching, parallelism, and complex error handling, without the spaghetti code of having many named callbacks.
* You can arrange task-based code in the order that it executes, rather than having to split your logic across scattered callback functions.

## Creating Tasks

Task Runner includes several [reusable tasks](http://rawgit.com/bvaughn/task-runner/master/docs/index.html) but you can also create your own. There are 2 basic approaches:

* **Inheritance**: Extend `tr.Abstract` task and override the run, interrupt, and reset methods.
* **Composition**: Use the built in `tr.Closure` task to decorate functions and automatically turn them *into* tasks.

Check out the [Task Runner website](http://bvaughn.github.io/task-runner/) for examples and additional documentation!

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