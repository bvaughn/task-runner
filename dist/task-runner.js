var taskrunner = {DecoratorTask:function() {
}};
taskrunner.TaskEvent = {STARTED:0, INTERRUPTED:1, COMPLETED:2, ERRORED:3, FINAL:4};
taskrunner.TaskState = {INITIALIZED:0, RUNNING:1, INTERRUPTED:2, COMPLETED:3, ERRORED:4};
taskrunner.Task = function() {
};
taskrunner.AbstractTask = function(a) {
  this.taskName_ = a;
  this.uniqueID_ = taskrunner.AbstractTask.ID_++;
  this.state_ = taskrunner.TaskState.INITIALIZED;
  this.errorMessage_ = this.data_ = void 0;
  this.interruptingTask_ = null;
  this.taskCallbackMap_ = {};
};
taskrunner.AbstractTask.ID_ = 0;
taskrunner.AbstractTask.prototype.getData = function() {
  return this.data_;
};
taskrunner.AbstractTask.prototype.getErrorMessage = function() {
  return this.errorMessage_;
};
taskrunner.AbstractTask.prototype.getOperationsCount = function() {
  return 1;
};
taskrunner.AbstractTask.prototype.getCompletedOperationsCount = function() {
  return this.state_ == taskrunner.TaskState.COMPLETED ? 1 : 0;
};
taskrunner.AbstractTask.prototype.getState = function() {
  return this.state_;
};
taskrunner.AbstractTask.prototype.getTaskName = function() {
  return this.taskName_;
};
taskrunner.AbstractTask.prototype.getUniqueID = function() {
  return this.uniqueID_;
};
taskrunner.AbstractTask.prototype.executeCallbacks_ = function(a) {
  if (a = this.taskCallbackMap_[a]) {
    for (var b in a) {
      a[b].execute(this);
    }
  }
};
taskrunner.AbstractTask.prototype.run = function() {
  if (this.state_ == taskrunner.TaskState.RUNNING) {
    throw "Cannot run a running task.";
  }
  this.state_ != taskrunner.TaskState.COMPLETED && (this.interruptingTask_ = null, this.errorMessage_ = this.data_ = void 0, this.state_ = taskrunner.TaskState.RUNNING, this.executeCallbacks_(taskrunner.TaskEvent.STARTED), this.runImpl());
  return this;
};
taskrunner.AbstractTask.prototype.interrupt = function() {
  if (this.state_ != taskrunner.TaskState.RUNNING) {
    throw "Cannot interrupt a task that is not running.";
  }
  this.state_ = taskrunner.TaskState.INTERRUPTED;
  this.interruptImpl();
  this.executeCallbacks_(taskrunner.TaskEvent.INTERRUPTED);
  return this;
};
taskrunner.AbstractTask.prototype.interruptForTask = function(a) {
  this.interruptingTask_ = a;
  this.interrupt();
  a.completed(function(a) {
    a == this.interruptingTask_ && (this.interruptingTask_ = null, this.run());
  }, this);
  a.errored(function(a) {
    a == this.interruptingTask_ && (this.interruptingTask_ = null, this.state_ = taskrunner.TaskState.RUNNING, this.errorInternal(a.getData(), a.getErrorMessage()));
  }, this);
  return this;
};
taskrunner.AbstractTask.prototype.reset = function() {
  if (this.state_ == taskrunner.TaskState.RUNNING) {
    throw "Cannot reset a running task.";
  }
  this.state_ != taskrunner.TaskState.INITIALIZED && (this.errorMessage_ = this.data_ = void 0, this.state_ = taskrunner.TaskState.INITIALIZED, this.resetImpl());
  return this;
};
taskrunner.AbstractTask.prototype.on = function(a, b, c) {
  this.taskCallbackMap_[a] = this.taskCallbackMap_[a] || [];
  a = this.taskCallbackMap_[a];
  var d = -1, e;
  for (e in a) {
    var f = a[e];
    if (f.callback_ === b & f.scope_ === c) {
      d = e;
      break;
    }
  }
  -1 == d && a.push(new taskrunner.AbstractTask.TaskCallback_(b, c));
  return this;
};
taskrunner.AbstractTask.prototype.off = function(a, b, c) {
  a = this.taskCallbackMap_[a];
  var d = -1;
  if (a) {
    for (var e in a) {
      var f = a[e];
      if (f.callback_ === b & f.scope_ === c) {
        d = e;
        break;
      }
    }
  }
  -1 != d && a.splice(d, 1);
  return this;
};
taskrunner.AbstractTask.prototype.started = function(a, b) {
  return this.on(taskrunner.TaskEvent.STARTED, a, b);
};
taskrunner.AbstractTask.prototype.interrupted = function(a, b) {
  return this.on(taskrunner.TaskEvent.INTERRUPTED, a, b);
};
taskrunner.AbstractTask.prototype.completed = function(a, b) {
  return this.on(taskrunner.TaskEvent.COMPLETED, a, b);
};
taskrunner.AbstractTask.prototype.errored = function(a, b) {
  return this.on(taskrunner.TaskEvent.ERRORED, a, b);
};
taskrunner.AbstractTask.prototype.final = function(a, b) {
  return this.on(taskrunner.TaskEvent.FINAL, a, b);
};
taskrunner.AbstractTask.prototype.interruptImpl = goog.nullFunction;
taskrunner.AbstractTask.prototype.resetImpl = goog.nullFunction;
taskrunner.AbstractTask.prototype.completeInternal = function(a) {
  if (this.state_ != taskrunner.TaskState.RUNNING) {
    throw "Cannot complete an inactive task.";
  }
  this.data_ = a;
  this.state_ = taskrunner.TaskState.COMPLETED;
  this.executeCallbacks_(taskrunner.TaskEvent.COMPLETED);
  this.executeCallbacks_(taskrunner.TaskEvent.FINAL);
};
taskrunner.AbstractTask.prototype.errorInternal = function(a, b) {
  if (this.state_ != taskrunner.TaskState.RUNNING) {
    throw "Cannot error an inactive task.";
  }
  this.data_ = a;
  this.errorMessage_ = b;
  this.state_ = taskrunner.TaskState.ERRORED;
  this.executeCallbacks_(taskrunner.TaskEvent.ERRORED);
  this.executeCallbacks_(taskrunner.TaskEvent.FINAL);
};
taskrunner.AbstractTask.TaskCallback_ = function(a, b) {
  this.callback_ = a;
  this.scope_ = b;
};
taskrunner.AbstractTask.TaskCallback_.prototype.execute = function(a) {
  this.scope_ ? this.callback_.call(this.scope_, a) : this.callback_(a);
};
taskrunner.ClosureTask = function(a, b, c) {
  taskrunner.AbstractTask.call(this, c);
  this.runImplFn_ = a;
  this.autoCompleteUponRun_ = !!b;
};
goog.inherits(taskrunner.ClosureTask, taskrunner.AbstractTask);
taskrunner.ClosureTask.prototype.runImpl = function() {
  try {
    this.runImplFn_(), this.autoCompleteUponRun_ && this.completeInternal();
  } catch (a) {
    this.errorInternal(a, a.message);
  }
};
taskrunner.ClosureTask.prototype.complete = function(a) {
  this.completeInternal(a);
};
taskrunner.ClosureTask.prototype.error = function(a, b) {
  this.errorInternal(a, b);
};
taskrunner.CompositeTask = function(a, b, c) {
  taskrunner.AbstractTask.call(this, c);
  this.parallel_ = a;
  this.taskQueue_ = [];
  this.taskQueueIndex_ = 0;
  this.completedTasks_ = [];
  this.erroredTasks_ = [];
  this.flushTaskQueueInProgress_ = !1;
  b && this.addAllTasks(b);
};
goog.inherits(taskrunner.CompositeTask, taskrunner.AbstractTask);
taskrunner.CompositeTask.prototype.addAllTasks = function(a) {
  for (var b = 0;b < a.length;b++) {
    this.addTask(a[b]);
  }
  return this;
};
taskrunner.CompositeTask.prototype.addTask = function(a) {
  var b = this.taskQueue_.indexOf(a);
  if (0 <= b) {
    throw "Cannot add task more than once.";
  }
  this.taskQueue_.push(a);
  this.getState() == taskrunner.TaskState.RUNNING && (b = this.taskQueue_.indexOf(a), this.parallel_ || this.taskQueueIndex_ == b) && (this.addTaskCallbacks_(a), a.run());
  return this;
};
taskrunner.CompositeTask.prototype.removeTask = function(a) {
  var b = this.taskQueue_.indexOf(a);
  if (0 > b) {
    throw "Attempted to remove an invalid task.";
  }
  this.removeTaskCallbacks_(a);
  this.taskQueue_.splice(this.taskQueue_.indexOf(a), 1);
  this.getState() == taskrunner.TaskState.RUNNING && ((this.parallel_ || b <= this.taskQueueIndex_) && this.taskQueueIndex_--, a.getState() != taskrunner.TaskState.RUNNING && a.getState() != taskrunner.TaskState.INTERRUPTED || this.taskCompletedOrRemoved_(a));
  return this;
};
taskrunner.CompositeTask.prototype.getOperationsCount = function() {
  var a = 0;
  this.eachTaskInQueue_(function(b) {
    a += b.getOperationsCount();
  });
  return a;
};
taskrunner.CompositeTask.prototype.getCompletedOperationsCount = function() {
  var a = 0;
  this.eachTaskInQueue_(function(b) {
    a += b.getCompletedOperationsCount();
  });
  return a;
};
taskrunner.CompositeTask.prototype.runImpl = function() {
  if (this.allTasksAreCompleted_()) {
    this.completeInternal();
  } else {
    if (this.erroredTasks_ = [], this.parallel_) {
      this.eachTaskInQueue_(goog.bind(function(a) {
        this.addTaskCallbacks_(a);
        a.run();
      }, this));
    } else {
      var a = this.taskQueue_[this.taskQueueIndex_];
      this.addTaskCallbacks_(a);
      a.run();
    }
  }
};
taskrunner.CompositeTask.prototype.interruptImpl = function() {
  this.eachTaskInQueue_(function(a) {
    a.getState() == taskrunner.TaskState.RUNNING && a.interrupt();
  });
};
taskrunner.CompositeTask.prototype.resetImpl = function() {
  this.taskQueueIndex_ = 0;
  this.completedTasks_ = [];
  this.erroredTasks_ = [];
  this.eachTaskInQueue_(function(a) {
    a.reset();
  });
};
taskrunner.CompositeTask.prototype.flushTaskQueue = function(a) {
  this.flushTaskQueueInProgress_ = !!a;
  for (this.eachTaskInQueue_(function(a) {
    a.getState() == taskrunner.TaskState.RUNNING && a.interrupt();
  });0 < this.taskQueue_.length;) {
    this.removeTask(this.taskQueue_[this.taskQueue_.length - 1]);
  }
  this.completedTasks_ = [];
  this.erroredTasks_ = [];
  this.flushTaskQueueInProgress_ = !1;
};
taskrunner.CompositeTask.prototype.addTaskCallbacks_ = function(a) {
  a.completed(this.childTaskCompleted_, this);
  a.errored(this.childTaskErrored_, this);
};
taskrunner.CompositeTask.prototype.removeTaskCallbacks_ = function(a) {
  a.off(taskrunner.TaskEvent.COMPLETED, this.childTaskCompleted_, this);
  a.off(taskrunner.TaskEvent.ERRORED, this.childTaskErrored_, this);
};
taskrunner.CompositeTask.prototype.allTasksAreCompleted_ = function() {
  for (var a = 0;a < this.taskQueue_.length;a++) {
    if (this.taskQueue_[a].getState() != taskrunner.TaskState.COMPLETED) {
      return!1;
    }
  }
  return!0;
};
taskrunner.CompositeTask.prototype.checkForTaskCompletion_ = function() {
  this.flushTaskQueueInProgress_ || this.completedTasks_.length + this.erroredTasks_.length >= this.taskQueue_.length && (0 < this.erroredTasks_.length ? this.errorInternal() : this.completeInternal());
};
taskrunner.CompositeTask.prototype.taskCompletedOrRemoved_ = function(a) {
  this.taskQueueIndex_++;
  this.getState() == taskrunner.TaskState.RUNNING && (this.checkForTaskCompletion_(), !this.parallel_ && this.getState() == taskrunner.TaskState.RUNNING && (a = this.taskQueue_[this.taskQueueIndex_])) && (this.addTaskCallbacks_(a), a.run());
};
taskrunner.CompositeTask.prototype.eachTaskInQueue_ = function(a) {
  for (var b = 0;b < this.taskQueue_.length;b++) {
    a(this.taskQueue_[b]);
  }
};
taskrunner.CompositeTask.prototype.childTaskCompleted_ = function(a) {
  this.completedTasks_.push(a);
  this.taskCompletedOrRemoved_(a);
};
taskrunner.CompositeTask.prototype.childTaskErrored_ = function(a) {
  this.erroredTasks_.push(a);
  this.parallel_ ? this.checkForTaskCompletion_() : this.errorInternal(a.getData(), a.getErrorMessage());
};
taskrunner.DeferredFactoryTask = function(a, b, c, d) {
  taskrunner.AbstractTask.call(this, d);
  this.taskFactoryFn_ = a;
  this.thisArg_ = b;
  this.argsArray_ = c;
  this.deferredTask_ = null;
  this.deferredTaskErrored_ = this.recreateDeferredTaskAfterError_ = !1;
};
goog.inherits(taskrunner.DeferredFactoryTask, taskrunner.AbstractTask);
taskrunner.DeferredFactoryTask.prototype.getDecoratedTask = function() {
  return this.deferredTask_;
};
taskrunner.DeferredFactoryTask.prototype.recreateDeferredTaskAfterError = function(a) {
  this.recreateDeferredTaskAfterError_ = a;
};
taskrunner.DeferredFactoryTask.prototype.removeCallbacks_ = function() {
  this.deferredTask_ && (this.deferredTask_.off(taskrunner.TaskEvent.COMPLETED, this.onDeferredTaskCompleted_, this), this.deferredTask_.off(taskrunner.TaskEvent.ERRORED, this.onDeferredTaskErrored_, this), this.deferredTask_.off(taskrunner.TaskEvent.INTERRUPTED, this.onDeferredTaskInterrupted_, this));
};
taskrunner.DeferredFactoryTask.prototype.resetImpl = function() {
  this.removeCallbacks_();
  this.deferredTask_ && (this.deferredTask_ = null);
};
taskrunner.DeferredFactoryTask.prototype.interruptImpl = function() {
  this.deferredTask_ && (this.removeCallbacks_(), this.deferredTask_.interrupt());
};
taskrunner.DeferredFactoryTask.prototype.runImpl = function() {
  if (!this.deferredTask_ || this.recreateDeferredTaskAfterError_ && this.deferredTaskErrored_) {
    goog.isDef(this.thisArg_) ? this.deferredTask_ = this.taskFactoryFn_.apply(this.thisArg_, this.argsArray_ || []) : this.deferredTask_ = this.taskFactoryFn_.apply();
  }
  if (this.deferredTask_.getState() == taskrunner.TaskState.COMPLETED) {
    this.onDeferredTaskCompleted_(this.deferredTask_);
  } else {
    if (this.deferredTask_.getState() == taskrunner.TaskState.ERRORED) {
      this.onDeferredTaskErrored_(this.deferredTask_);
    } else {
      this.deferredTask_.completed(this.onDeferredTaskCompleted_, this), this.deferredTask_.errored(this.onDeferredTaskErrored_, this), this.deferredTask_.interrupted(this.onDeferredTaskInterrupted_, this), this.deferredTask_.run();
    }
  }
};
taskrunner.DeferredFactoryTask.prototype.onDeferredTaskCompleted_ = function(a) {
  this.removeCallbacks_();
  this.completeInternal(a.getData());
};
taskrunner.DeferredFactoryTask.prototype.onDeferredTaskErrored_ = function(a) {
  this.removeCallbacks_();
  this.deferredTaskErrored_ = !0;
  this.errorInternal(a.getData(), a.getErrorMessage());
};
taskrunner.DeferredFactoryTask.prototype.onDeferredTaskInterrupted_ = function(a) {
  this.interrupt();
};
taskrunner.DependencyGraphTask = function(a) {
  taskrunner.AbstractTask.call(this, a);
  this.taskIdToDependenciesMap_ = {};
  this.tasks_ = [];
  this.erroredTasks_ = [];
};
goog.inherits(taskrunner.DependencyGraphTask, taskrunner.AbstractTask);
taskrunner.DependencyGraphTask.prototype.addTask = function(a, b) {
  var c = this.tasks_.indexOf(a);
  goog.asserts.assert(0 > c, "Cannot add task more than once.");
  this.tasks_.push(a);
  this.taskIdToDependenciesMap_[a.getUniqueID()] = b;
  this.validateDependencies_(a);
  this.getState() == taskrunner.TaskState.RUNNING && this.runAllReadyTasks_();
  return this;
};
taskrunner.DependencyGraphTask.prototype.removeTask = function(a) {
  var b = this.tasks_.indexOf(a);
  goog.asserts.assert(0 <= b, "Cannot find the specified task.");
  this.removeCallbacksFrom_(a);
  this.tasks_.splice(this.tasks_.indexOf(a), 1);
  delete this.taskIdToDependenciesMap_[a.getUniqueID()];
  for (var c in this.tasks_) {
    this.validateDependencies_(this.tasks_[c]);
  }
  this.getState() == taskrunner.TaskState.RUNNING && this.completeOrRunNext_();
  return this;
};
taskrunner.DependencyGraphTask.prototype.getOperationsCount = function() {
  var a = 0, b;
  for (b in this.tasks_) {
    a += this.tasks_[b].getOperationsCount();
  }
  return a;
};
taskrunner.DependencyGraphTask.prototype.getCompletedOperationsCount = function() {
  var a = 0, b;
  for (b in this.tasks_) {
    a += this.tasks_[b].getCompletedOperationsCount();
  }
  return a;
};
taskrunner.DependencyGraphTask.prototype.runImpl = function() {
  this.erroredTasks_ = [];
  this.completeOrRunNext_();
};
taskrunner.DependencyGraphTask.prototype.interruptImpl = function() {
  for (var a in this.tasks_) {
    var b = this.tasks_[a];
    b.getState() == taskrunner.TaskState.RUNNING && (this.removeCallbacksFrom_(b), b.interrupt());
  }
};
taskrunner.DependencyGraphTask.prototype.resetImpl = function() {
  this.erroredTasks_ = [];
  for (var a in this.tasks_) {
    a.reset();
  }
};
taskrunner.DependencyGraphTask.prototype.addCallbacksTo_ = function(a) {
  a.completed(this.childTaskCompleted_, this);
  a.errored(this.childTaskErrored_, this);
};
taskrunner.DependencyGraphTask.prototype.removeCallbacksFrom_ = function(a) {
  a.off(taskrunner.TaskEvent.COMPLETED, this.childTaskCompleted_, this);
  a.off(taskrunner.TaskEvent.ERRORED, this.childTaskErrored_, this);
};
taskrunner.DependencyGraphTask.prototype.areAllTasksCompleted_ = function() {
  for (var a in this.tasks_) {
    if (this.tasks_[a].getState() != taskrunner.TaskState.COMPLETED) {
      return!1;
    }
  }
  return!0;
};
taskrunner.DependencyGraphTask.prototype.isAnyTaskRunning_ = function() {
  for (var a in this.tasks_) {
    if (this.tasks_[a].getState() == taskrunner.TaskState.RUNNING) {
      return!0;
    }
  }
  return!1;
};
taskrunner.DependencyGraphTask.prototype.validateDependencies_ = function(a) {
  var b = this.taskIdToDependenciesMap_[a.getUniqueID()];
  if (b) {
    goog.asserts.assert(0 > b.indexOf(a), "Cyclic dependency detected.");
    for (var c in b) {
      goog.asserts.assert(0 <= this.tasks_.indexOf(b[c]), "Invalid dependency detected.");
    }
  }
};
taskrunner.DependencyGraphTask.prototype.completeOrRunNext_ = function() {
  this.areAllTasksCompleted_() ? this.completeInternal() : 0 == this.erroredTasks_.length ? this.runAllReadyTasks_() : this.isAnyTaskRunning_() || this.errorInternal();
};
taskrunner.DependencyGraphTask.prototype.hasIncompleteBlockers_ = function(a) {
  if (a = this.taskIdToDependenciesMap_[a.getUniqueID()]) {
    for (var b in a) {
      if (a[b].getState() != taskrunner.TaskState.COMPLETED) {
        return!0;
      }
    }
  }
  return!1;
};
taskrunner.DependencyGraphTask.prototype.runAllReadyTasks_ = function() {
  for (var a in this.tasks_) {
    var b = this.tasks_[a];
    0 <= this.erroredTasks_.indexOf(b) || this.hasIncompleteBlockers_(b) || b.getState() == taskrunner.TaskState.RUNNING || b.getState() == taskrunner.TaskState.COMPLETED || (this.addCallbacksTo_(b), b.run());
  }
};
taskrunner.DependencyGraphTask.prototype.childTaskCompleted_ = function(a) {
  this.removeCallbacksFrom_(a);
  this.completeOrRunNext_();
};
taskrunner.DependencyGraphTask.prototype.childTaskErrored_ = function(a) {
  this.removeCallbacksFrom_(a);
  this.erroredTasks_.push(a);
  this.completeOrRunNext_();
};
taskrunner.NullTask = function(a, b) {
  taskrunner.ClosureTask.call(this, goog.nullFunction, a, b);
};
goog.inherits(taskrunner.NullTask, taskrunner.ClosureTask);
taskrunner.ObserverTask = function(a, b, c) {
  taskrunner.AbstractTask.call(this, c);
  this.failUponFirstError_ = !!b;
  this.observedTasks_ = [];
  if (a) {
    for (var d in a) {
      b = a[d], -1 == this.observedTasks_.indexOf(b) && this.observedTasks_.push(b);
    }
  }
};
goog.inherits(taskrunner.ObserverTask, taskrunner.AbstractTask);
taskrunner.ObserverTask.prototype.getObservedTasks = function() {
  return this.observedTasks_;
};
taskrunner.ObserverTask.prototype.observeTask = function(a) {
  -1 == this.observedTasks_.indexOf(a) && this.observedTasks_.push(a);
  this.getState() == taskrunner.TaskState.RUNNING && (a.completed(this.onObservedTaskCompleted_, this), a.errored(this.onObservedTaskErrored_, this));
};
taskrunner.ObserverTask.prototype.stopObservingTask = function(a) {
  var b = this.observedTasks_.indexOf(a);
  -1 != b && (a.off(taskrunner.TaskEvent.COMPLETED, this.onObservedTaskCompleted_, this), a.off(taskrunner.TaskEvent.ERRORED, this.onObservedTaskErrored_, this), this.observedTasks_.splice(b, 1), this.tryToFinalize_());
};
taskrunner.ObserverTask.prototype.getOperationsCount = function() {
  var a = 0, b;
  for (b in this.observedTasks_) {
    a += this.observedTasks_[b].getOperationsCount();
  }
  return a;
};
taskrunner.ObserverTask.prototype.getCompletedOperationsCount = function() {
  var a = 0, b;
  for (b in this.observedTasks_) {
    a += this.observedTasks_[b].getCompletedOperationsCount();
  }
  return a;
};
taskrunner.ObserverTask.prototype.runImpl = function() {
  if (!this.tryToFinalize_()) {
    for (var a in this.observedTasks_) {
      this.observeTask(this.observedTasks_[a]);
    }
  }
};
taskrunner.ObserverTask.prototype.onObservedTaskCompleted_ = function(a) {
  this.tryToFinalize_();
};
taskrunner.ObserverTask.prototype.onObservedTaskErrored_ = function(a) {
  this.tryToFinalize_();
};
taskrunner.ObserverTask.prototype.tryToFinalize_ = function() {
  if (this.getState() != taskrunner.TaskState.RUNNING) {
    return!1;
  }
  var a = !0, b = null, c;
  for (c in this.observedTasks_) {
    var d = this.observedTasks_[c];
    d.getState() == taskrunner.TaskState.ERRORED ? b = b || d : d.getState() != taskrunner.TaskState.COMPLETED && (a = !1);
  }
  return b && this.failUponFirstError_ ? (this.errorInternal(b.getData(), b.getErrorMessage()), !0) : b && a ? (this.errorInternal(), !0) : a ? (this.completeInternal(), !0) : !1;
};
taskrunner.RetryOnErrorTask = function(a, b, c, d) {
  taskrunner.AbstractTask.call(this, d);
  this.decoratedTask_ = a;
  this.maxRetries_ = goog.isDef(b) ? b : taskrunner.RetryOnErrorTask.MAX_RETRIES_;
  this.retryDelay_ = goog.isDef(c) ? c : taskrunner.RetryOnErrorTask.RETRY_DELAY_;
  this.retries_ = 0;
  this.timeoutId_ = null;
};
goog.inherits(taskrunner.RetryOnErrorTask, taskrunner.AbstractTask);
taskrunner.RetryOnErrorTask.MAX_RETRIES_ = 5;
taskrunner.RetryOnErrorTask.RETRY_DELAY_ = 5;
taskrunner.RetryOnErrorTask.prototype.getDecoratedTask = function() {
  return this.decoratedTask_;
};
taskrunner.RetryOnErrorTask.prototype.getRetries = function() {
  return this.retries_;
};
taskrunner.RetryOnErrorTask.prototype.removeCallbacks_ = function() {
  this.decoratedTask_.off(taskrunner.TaskEvent.COMPLETED, this.onDecoratedTaskCompleted_, this);
  this.decoratedTask_.off(taskrunner.TaskEvent.ERRORED, this.onDecoratedTaskErrored_, this);
};
taskrunner.RetryOnErrorTask.prototype.stopTimer_ = function() {
  this.timeoutId_ && (goog.global.clearTimeout(this.timeoutId_), this.timeoutId_ = null);
};
taskrunner.RetryOnErrorTask.prototype.resetImpl = function() {
  this.stopTimer_();
  this.retries_ = 0;
  this.removeCallbacks_();
  this.decoratedTask_.reset();
};
taskrunner.RetryOnErrorTask.prototype.interruptImpl = function() {
  this.stopTimer_();
  this.retries_ = 0;
  this.removeCallbacks_();
  this.decoratedTask_.getState() == taskrunner.TaskState.RUNNING && this.decoratedTask_.interrupt();
};
taskrunner.RetryOnErrorTask.prototype.runImpl = function() {
  this.decoratedTask_.completed(this.onDecoratedTaskCompleted_, this);
  this.decoratedTask_.errored(this.onDecoratedTaskErrored_, this);
  if (this.decoratedTask_.getState() == taskrunner.TaskState.COMPLETED) {
    this.onDecoratedTaskCompleted_(this.decoratedTask_);
  } else {
    this.decoratedTask_.getState() == taskrunner.TaskState.ERRORED && this.decoratedTask_.reset(), this.decoratedTask_.run();
  }
};
taskrunner.RetryOnErrorTask.prototype.onDecoratedTaskCompleted_ = function(a) {
  this.stopTimer_();
  this.removeCallbacks_();
  this.completeInternal(a.getData());
};
taskrunner.RetryOnErrorTask.prototype.onDecoratedTaskErrored_ = function(a) {
  this.retries_ >= this.maxRetries_ ? (this.stopTimer_(), this.removeCallbacks_(), this.errorInternal(a.getData(), a.getErrorMessage())) : (this.retries_++, 0 <= this.retryDelay_ ? this.timeoutId_ = goog.global.setTimeout(goog.bind(this.runImpl, this), this.retryDelay_) : this.runImpl());
};
taskrunner.TimeoutTask = function(a, b, c) {
  taskrunner.AbstractTask.call(this, c);
  this.decoratedTask_ = a;
  this.timeout_ = b;
  this.timeoutPause_ = this.timeoutStart_ = -1;
  this.timeoutId_ = null;
};
goog.inherits(taskrunner.TimeoutTask, taskrunner.AbstractTask);
taskrunner.TimeoutTask.prototype.getDecoratedTask = function() {
  return this.decoratedTask_;
};
taskrunner.TimeoutTask.prototype.removeCallbacks_ = function() {
  this.decoratedTask_.off(taskrunner.TaskEvent.COMPLETED, this.onDecoratedTaskCompleted_, this);
  this.decoratedTask_.off(taskrunner.TaskEvent.ERRORED, this.onDecoratedTaskErrored_, this);
};
taskrunner.TimeoutTask.prototype.stopTimer_ = function() {
  this.timeoutId_ && (goog.global.clearTimeout(this.timeoutId_), this.timeoutId_ = null);
};
taskrunner.TimeoutTask.prototype.resetImpl = function() {
  this.stopTimer_();
  this.removeCallbacks_();
  this.decoratedTask_.reset();
  this.timeoutPause_ = this.timeoutStart_ = -1;
};
taskrunner.TimeoutTask.prototype.interruptImpl = function() {
  this.stopTimer_();
  this.removeCallbacks_();
  this.decoratedTask_.interrupt();
  this.timeoutPause_ = goog.now();
};
taskrunner.TimeoutTask.prototype.runImpl = function() {
  if (null !== this.timeoutId_) {
    throw "A timeout for this task already exists.";
  }
  var a = this.timeout_;
  -1 < this.timeoutStart_ && -1 < this.timeoutPause_ && (a += this.timeoutStart_ - this.timeoutPause_);
  a = Math.max(a, 0);
  this.timeoutId_ = goog.global.setTimeout(goog.bind(this.onTimeout_, this), a);
  this.timeoutStart_ = goog.now();
  if (this.decoratedTask_.getState() == taskrunner.TaskState.COMPLETED) {
    this.onDecoratedTaskCompleted_(this.decoratedTask_);
  } else {
    if (this.decoratedTask_.getState() == taskrunner.TaskState.ERRORED) {
      this.onDecoratedTaskErrored_(this.decoratedTask_);
    } else {
      this.decoratedTask_.completed(this.onDecoratedTaskCompleted_, this), this.decoratedTask_.errored(this.onDecoratedTaskErrored_, this), this.decoratedTask_.run();
    }
  }
};
taskrunner.TimeoutTask.prototype.onTimeout_ = function() {
  this.stopTimer_();
  this.removeCallbacks_();
  this.decoratedTask_.interrupt();
  this.errorInternal(this.decoratedTask_.getData(), "Task timed out after " + this.timeout_ + "ms");
};
taskrunner.TimeoutTask.prototype.onDecoratedTaskCompleted_ = function(a) {
  this.stopTimer_();
  this.removeCallbacks_();
  this.completeInternal(a.getData());
};
taskrunner.TimeoutTask.prototype.onDecoratedTaskErrored_ = function(a) {
  this.stopTimer_();
  this.removeCallbacks_();
  this.errorInternal(a.getData(), a.getErrorMessage());
};
taskrunner.TweenTask = function(a, b, c, d) {
  taskrunner.AbstractTask.call(this, d);
  this.animationFrameId_ = 0;
  this.callback_ = a;
  this.duration_ = b;
  this.elapsed_ = 0;
  this.easingFunction_ = c || this.linearEase_;
  this.lastUpdateTimestamp_ = 0;
};
goog.inherits(taskrunner.TweenTask, taskrunner.AbstractTask);
taskrunner.TweenTask.prototype.interruptImpl = function() {
  this.cancelCurrentAnimationFrame_();
};
taskrunner.TweenTask.prototype.resetImpl = function() {
  this.lastUpdateTimestamp_ = this.elapsed_ = 0;
  this.queueAnimationFrame_(this.updateReset_);
};
taskrunner.TweenTask.prototype.runImpl = function() {
  this.lastUpdateTimestamp_ = goog.now();
  this.queueAnimationFrame_(this.updateRunning_);
};
taskrunner.TweenTask.prototype.linearEase_ = function(a) {
  return a;
};
taskrunner.TweenTask.prototype.cancelCurrentAnimationFrame_ = function() {
  this.animationFrameId_ && goog.global.cancelAnimationFrame(this.animationFrameId_);
};
taskrunner.TweenTask.prototype.queueAnimationFrame_ = function(a) {
  this.cancelCurrentAnimationFrame_();
  this.animationFrameId_ = goog.global.requestAnimationFrame(goog.bind(a, this));
};
taskrunner.TweenTask.prototype.updateReset_ = function(a) {
  this.animationFrameId_ = 0;
  this.callback_(this.easingFunction_(0));
};
taskrunner.TweenTask.prototype.updateRunning_ = function(a) {
  a = goog.now();
  this.animationFrameId_ = 0;
  this.elapsed_ += a - this.lastUpdateTimestamp_;
  this.lastUpdateTimestamp_ = a;
  a = this.easingFunction_(Math.min(1, this.elapsed_ / this.duration_));
  this.callback_(a);
  this.elapsed_ >= this.duration_ ? this.completeInternal() : this.queueAnimationFrame_(this.updateRunning_);
};
taskrunner.WaitTask = function(a, b, c) {
  taskrunner.AbstractTask.call(this, c);
  this.resetTimerAfterInterruption_ = !!b;
  this.timeout_ = a;
  this.timeoutPause_ = this.timeoutStart_ = -1;
  this.timeoutId_ = null;
};
goog.inherits(taskrunner.WaitTask, taskrunner.AbstractTask);
taskrunner.WaitTask.prototype.stopTimer_ = function() {
  this.timeoutId_ && (goog.global.clearTimeout(this.timeoutId_), this.timeoutId_ = null);
};
taskrunner.WaitTask.prototype.resetImpl = function() {
  this.stopTimer_();
  this.timeoutPause_ = this.timeoutStart_ = -1;
};
taskrunner.WaitTask.prototype.interruptImpl = function() {
  this.stopTimer_();
  this.timeoutPause_ = goog.now();
};
taskrunner.WaitTask.prototype.runImpl = function() {
  if (null !== this.timeoutId_) {
    throw "A timeout for this task already exists.";
  }
  var a = this.timeout_;
  !this.resetTimerAfterInterruption_ && -1 < this.timeoutStart_ && -1 < this.timeoutPause_ && (a += this.timeoutStart_ - this.timeoutPause_);
  a = Math.max(a, 0);
  this.timeoutId_ = goog.global.setTimeout(goog.bind(this.onTimeout_, this), a);
  this.timeoutStart_ = goog.now();
};
taskrunner.WaitTask.prototype.onTimeout_ = function() {
  this.stopTimer_();
  this.completeInternal();
};
taskrunner.XHRTask = function(a, b, c) {
  taskrunner.AbstractTask.call(this, c);
  this.url_ = a;
  this.postData_ = b;
};
goog.inherits(taskrunner.XHRTask, taskrunner.AbstractTask);
taskrunner.XHRTask.prototype.runImpl = function() {
  try {
    var a = this, b = new XMLHttpRequest;
    b.onreadystatechange = function() {
      4 == b.readyState && (200 == b.status ? a.completeInternal(b.responseText) : a.errorInternal(b.status, b.responseText));
    };
    if (void 0 !== this.postData_) {
      var c = [], d;
      for (d in this.postData_) {
        c.push(d + "=" + this.postData_[d]);
      }
      b.open("POST", this.url_, !0);
      b.send(c.join("&"));
    } else {
      b.open("GET", this.url_, !0), b.send();
    }
  } catch (e) {
    this.state_ == taskrunner.TaskState.RUNNING && this.errorInternal(e, e.message);
  }
};

