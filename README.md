# Task Runner
Task Runner is a JavaScript library designed to simplify the implementation of asynchronous processes.

## Build instructions

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