# Task Runner
Task Runner is a JavaScript library designed to simplify the implementation of asynchronous processes.

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

## Task Runner automated tests

Begin by running `npm install` to install [Karma](https://karma-runner.github.io) and other dependencies.

Then run the following command from the root of the Task Runner checkout:

```bash
./node_modules/karma/bin/karma start karma.conf.js --log-level debug .
```

At this point, open the following URL in your browser to execute tests: http://localhost:9876/

## Building Task Runner

Begin by running `bower install` to install the [Closure Compiler](https://github.com/google/closure-compiler) and [Closure Library](https://github.com/google/closure-library) components.

Then run the following command from the root of the Task Runner checkout:

```bash
bower_components/closure-library/closure/bin/build/closurebuilder.py \
  --root=bower_components/closure-library/ \
  --root=source/ \
  --namespace="taskrunner" \
  --output_mode=compiled \
  --compiler_jar=bower_components/closure-compiler/compiler.jar \
  --compiler_flags="--language_in=ECMASCRIPT5" \
  > dist/task-runner.js
```