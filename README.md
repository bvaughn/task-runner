# Task Runner
Task Runner is a JavaScript library designed to simplify the implementation of asynchronous processes.

## Build instructions

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