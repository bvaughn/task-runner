new tr.Chain().first(taskA, taskB)
              .then(taskC)
              .then(taskE, taskD)
              .or(taskF)
              .then(taskG)
              .run();