
# Task Runner
---
**[Official website](http://bvaughn.github.io/task-runner/)** |
**[API documentation](http://rawgit.com/bvaughn/task-runner/master/docs/index.html)** |
**[Report an issue](https://github.com/bvaughn/task-runner/issues/new)**

---

A Task is a unit of work, similar to a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) but more flexible. Tasks can be as small as a console log message or as big as an entire application. They can be bundled into collections and then treated the same as an individual task.

Tasks help break complex problems down into smaller, simpler problems.

Check out the [Task Runner website](http://bvaughn.github.io/task-runner/) to learn more!

## Get Started

Get Task Runner in one of the following ways:

* Clone & [build](README.md#Building) this repository.
* Download the [release](https://github.com/bvaughn/task-runner/tree/master/dist).
* Bia Bower, by running `bower install task-runner`.
* Via NPM, by running `npm install task-runner-js`.


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

Begin by running `npm install` to install [Karma](https://karma-runner.github.io) and other dependencies.

Documentation is generated using with [JsDoc3](https://github.com/jsdoc3/jsdoc) special thanks to [jaguarjs-jsdoc templates](https://github.com/davidshimjs/jaguarjs-jsdoc).

```bash
node_modules/.bin/jsdoc \
  -t node_modules/jaguarjs-jsdoc/ \
  -d docs/ \
  --readme source/README.md \
  --recurse \
  source/
```