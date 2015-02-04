# Task Runner
Task Runner is a JavaScript library designed to simplify the implementation of asynchronous processes.

Task Runner is built with the [Closure Compiler](https://github.com/google/closure-compiler). It uses a subset of the [Closure Library](https://github.com/google/closure-library) runtime (included with the distro) so that it can be used with any JavaScript framework- Angular, React, jQuery, etc.

If your project uses the full Closure library, you should use the Task Runner source and let Closure compile it along with the rest of your application.

Here are some links of interest:
* [API documentation](http://rawgit.com/bvaughn/task-runner/master/docs/index.html)
* [Example usage](https://gist.github.com/bvaughn/0e178b3fe5ef916d0389)

## Why use Task Runner?

Web programming often requires coordination between multiple, asynchronous operations (e.g. load a file then play a sound then prompt the user for input). For the purposes of this document, we’ll refer to these operations as *tasks*.

JavaScript applications have traditionally managed tasks by chaining together events or callbacks (often packaged as Promises). Using the above example, an application might create an Audio file and attach an event listener to be notified when it has loaded. Once loading is complete, another event handler might be used to notify when the audio has finished playing, and so forth.

This is simple enough when the number of tasks is small but it can get very complicated with larger applications. Common sources of this complexity include managing the order of tasks, handling unexpected errors or interruptions, and resuming or re-starting after interruptions. The code responsible for managing these operations is often larger and more complex than the meat of your application- the *tasks* themselves.

Task Runner offers a solution to much of the above complexity:
* It defines an interface to encapsulate any type of blocking or asynchronous operation: Task. An abstract implementation of this interface is provided, making it easy to create custom tasks for your application.
* It provides several powerful, built-in ways to compose tasks. Task Runner analyzes dependencies (e.g. Task A depends on Task B) and calculates the optimal sequence in which a set of tasks should be run.
* It supports the ability to pause and resume sequences of tasks, or to retry from the point of failure in the event of an unexpected error. Error-handling for common web pitfalls (e.g. loss of internet connection or HTTP request failure) is primarily handled by the framework and does not clutter up your application’s business logic.

## Life-cycle of a Task

Tasks have 5 basic states, enumerated in TaskState. The diagram below shows these states and how they are related. Each time a task changes state it invokes all registered callbacks that are associated with that state. Available callbacks are enumerated in TaskEvent.

<img src="https://s3.amazonaws.com/media.briandavidvaughn.com/images/task-runner-task-lifecycle.png" width="625" height="330" title="Task Runner: Task Lifecycle">

## Browser Support

Task Runner supports IE8+ except as noted below:
* Function.prototype.bind ([IE9+](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Browser_compatibility), [polyfill](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Polyfill))
* [TweenTask](file:///Users/bvaughn/Documents/git/task-runner/docs/taskrunner.TweenTask.html) only: requestAnimationFrame, cancelAnimationFrame ([IE10+](http://caniuse.com/#feat=requestanimationframe), [polyfill](https://gist.github.com/mrdoob/838785#file-requestanimationframe-js))
* [XHRTask](file:///Users/bvaughn/Documents/git/task-runner/docs/taskrunner.XHRTask.html) only: XMLHttpRequest ([IE10+](http://caniuse.com/#feat=xhr2), [polyfill](https://github.com/moxiecode/moxie))

## Task Runner automated tests

Begin by running `npm install` to install [Karma](https://karma-runner.github.io) and other dependencies.

You can then run tests once using:
```bash
gulp test
```

Or you can run tests each time a file in the `source` or `tests` directory changes using:
```bash
gulp watch
```

## Building Task Runner

Begin by running `bower install` to install the [Closure Compiler](https://github.com/google/closure-compiler) and [Closure Library](https://github.com/google/closure-library) components and `npm install` to install gulp dependencies.

Then run the following command from the root of the Task Runner checkout:

```bash
gulp build
```

## Generating Documentation

Begin by running `npm install` to install [Karma](https://karma-runner.github.io) and other dependencies.

Documentation is generated using with [JsDoc3](https://github.com/jsdoc3/jsdoc) special thanks to [jaguarjs-jsdoc templates](https://github.com/davidshimjs/jaguarjs-jsdoc).

```bash
node_modules/.bin/jsdoc -t node_modules/jaguarjs-jsdoc/ -d docs/ ./source/
```