# Task Runner
---
**[Official website](http://bvaughn.github.io/task-runner/)** |
**[API documentation](http://bvaughn.github.io/task-runner/#/documentation/)** |
**[Report an issue](https://github.com/bvaughn/task-runner/issues/new)**

Task Runner is a collection of low-level libraries designed to make JavaScript application development easier. Check out the [Task Runner website](http://bvaughn.github.io/task-runner/) for information on working with tasks as well as sample code and demos.

Please feel free to contact me directly with any suggestions or requests!

## Installing Task Runner

Get Task Runner can be installed in any of the following ways:

* Clone & [build](README.md#building-task-runner) this repository.
* Download a [release](https://github.com/bvaughn/task-runner/tree/master/dist).
* Bia Bower, by running `bower install task-runner`.
* Via NPM, by running `npm install task-runner-js`.

Task Runner is available in two flavors:

* `dist/task-runner`: This is the base, task library. It's compatible with all browsers (as well as Node JS) and can be used with any JavaScript frameworks (Angular, React, Ember, etc.).
* `dist/task-runner-engine`: This includes all of the above features *in addition to* an application engine that can be used to create single-page-apps. Tasks that are only in this package are explicitly marked in [the documentation](http://rawgit.com/bvaughn/task-runner/master/docs/index.html).

Debug logging can be enabled for Task Runner by setting a `window.DEBUG` environment variable to `TRUE`. If debug mode is enabled, tasks will also track the context (stack) when they are created. This information can be accessed using the `getCreationContext()` method.

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

Begin by running `npm install` to install the [TypeScript compiler](http://www.typescriptlang.org/) and gulp dependencies. Then run the following command from the root of the Task Runner checkout:

```bash
gulp build
```