goog.provide('tr.Graph');

goog.require('goog.asserts');
goog.require('tr.Abstract');

/**
 * Executes of a set of Tasks in a specific order.
 * 
 * <p>This type of task allows a dependency graph (of child tasks) to be created.
 * It then executes all of its children in the order needed to satisfy dependencies,
 * and completes (or fails) once the child tasks have completed (or failed).
 * 
 * <p>In the event of an error, the graph will stop and error.
 * All tasks that are running will be interrupted.
 * If the graph is re-run, any incomplete child tasks will be resumed.
 *
 * @example
 * // Creates a graph task that will execute tasks in the order required by their dependencies.
 * var task = new tr.Graph();
 * task.add(childTaskA);
 * task.add(childTaskB);
 * task.add(childTaskC, [childTaskA]);
 * task.add(childTaskD, [childTaskB]);
 * task.add(childTaskE, [childTaskC, childTaskD]);
 * task.run();
 *
 * @param {string=} opt_taskName Optional defaulttask name.
 * @extends {tr.Abstract}
 * @constructor
 * @struct
 */
tr.Graph = function(opt_taskName) {
  goog.base(this, opt_taskName || "Graph");

  /**
   * @type {!Object}
   * @private
   */
  this.taskIdToDependenciesMap_ = {};

  /**
   * @type {!Array.<!tr.Task>}
   * @private
   */
  this.tasks_ = [];

  /**
   * @type {!Array.<!tr.Task>}
   * @private
   */
  this.erroredTasks_ = [];

  /**
   * @type {boolean}
   * @private
   */
  this.beforeFirstRunInvoked_ = false;
};
goog.inherits(tr.Graph, tr.Abstract);

/**
 * Adds a child task to the dependency graph and ensures that its blocking dependencies (if any) are valid.
 *
 * @param {!tr.Task} task Child task to be run when this task is run.
 * @param {Array.<!tr.Task>=} blockers Blocking tasks that must complete
 *     successfully before this task can be run. This parameter can be ommitted
 *     for tasks that do not have blocking dependencies.
 * @return {!tr.Graph} a reference to the current task.
 * @throws {Error} if task has been added more than once.
 * @throws {Error} if cyclic dependencies are detected.
 */
tr.Graph.prototype.add = function(task, blockers) {
  var index = this.tasks_.indexOf(task);

  goog.asserts.assert(index < 0, 'Cannot add task more than once.');

  this.tasks_.push(task);
  this.taskIdToDependenciesMap_[task.getUniqueID()] = blockers;

  this.validateDependencies_(task);

  if (this.getState() == tr.enums.State.RUNNING) {
    this.runAllReadyTasks_();
  }

  return this;
};

/**
 * Adds child tasks to the dependency graph and ensures that their blocking dependencies (if any) are valid.
 *
 * @param {!Array.<!tr.Task>} tasks Child tasks to be run when this task is run.
 * @param {Array.<!tr.Task>=} blockers Blocking tasks that must complete
 *     successfully before this task can be run. This parameter can be ommitted
 *     for tasks that do not have blocking dependencies.
 * @return {!tr.Graph} a reference to the current task.
 * @throws {Error} if task has been added more than once.
 * @throws {Error} if cyclic dependencies are detected.
 */
tr.Graph.prototype.addAll = function(tasks, blockers) {
  for (var i = 0, length = tasks.length; i < length; i++) {
    this.add(tasks[i], blockers);
  }

  return this;
};

/**
 * Convenience method for adding a task to the "end" of the depepdency graph.
 * In othe words, this task will be blocked by all tasks already in the graph.
 *
 * @param {!tr.Task} task Child task to be run when this task is run.
 * @return {!tr.Graph} a reference to the current task.
 * @throws {Error} if task has been added more than once.
 * @throws {Error} if cyclic dependencies are detected.
 */
tr.Graph.prototype.addToEnd = function(task) {
  return this.add(task, this.tasks_.slice());
};

/**
 * Convenience method for adding multiple tasks to the "end" of the depepdency graph.
 * In othe words, these tasks will be blocked by all tasks already in the graph.
 *
 * @param {!Array.<!tr.Task>} tasks Child tasks to be run when this task is run.
 * @return {!tr.Graph} a reference to the current task.
 * @throws {Error} if task has been added more than once.
 */
tr.Graph.prototype.addAllToEnd = function(tasks) {
  return this.addAll(tasks, this.tasks_.slice());
};

/**
 * Removes a child task from the dependency graph and ensures that the remaining dependencies are still valid.
 *
 * @param {!tr.Task} task Child task to be removed from the graph.
 * @return {!tr.Graph} a reference to the current task.
 * @throws {Error} if the task provided is not within the depenency graph, or if removing the task invalidates any other, blocked tasks.
 */
tr.Graph.prototype.remove = function(task) {
  var index = this.tasks_.indexOf(task);

  goog.asserts.assert(index >= 0, 'Cannot find the specified task.');

  this.removeCallbacksFrom_(task);

  this.tasks_.splice(this.tasks_.indexOf(task), 1);

  delete this.taskIdToDependenciesMap_[task.getUniqueID()];

  for (var i in this.tasks_) {
    this.validateDependencies_(this.tasks_[i]);
  }

  if (this.getState() == tr.enums.State.RUNNING) {
    this.completeOrRunNext_();
  }

  return this;
};

/**
 * Removes child tasks from the dependency graph and ensures that the remaining dependencies are still valid.
 *
 * @param {!Array.<!tr.Task>} tasks Child tasks to be removed.
 * @return {!tr.Graph} a reference to the current task.
 * @throws {Error} if the task provided is not within the depenency graph, or if removing the task invalidates any other, blocked tasks.
 */
tr.Graph.prototype.removeAll = function(tasks) {
  for (var i = 0, length = tasks.length; i < length; i++) {
    this.remove(tasks[i]);
  }

  return this;
};

/**
 * @inheritDoc
 */
tr.Graph.prototype.getOperationsCount = function() {
  var operationsCount = 0;

  for (var i in this.tasks_) {
    operationsCount += this.tasks_[i].getOperationsCount();
  }

  return operationsCount;
};

/**
 * @inheritDoc
 */
tr.Graph.prototype.getCompletedOperationsCount =
    function() {
  var completedOperationsCount = 0;

  for (var i in this.tasks_) {
    completedOperationsCount += this.tasks_[i].getCompletedOperationsCount();
  }

  return completedOperationsCount;
};

/**
 * @override
 * @inheritDoc
 */
tr.Graph.prototype.runImpl = function() {
  this.erroredTasks_ = [];

  if ( !this.beforeFirstRunInvoked_ ) {
    this.beforeFirstRun();
    this.beforeFirstRunInvoked_ = true;
  }

  this.completeOrRunNext_();
};

/**
 * @override
 * @inheritDoc
 */
tr.Graph.prototype.interruptImpl = function() {
  for (var i in this.tasks_) {
    var task = this.tasks_[i];

    if (task.getState() == tr.enums.State.RUNNING) {
      this.removeCallbacksFrom_(task);

      task.interrupt();
    }
  }
};

/**
 * @override
 * @inheritDoc
 */
tr.Graph.prototype.resetImpl = function() {
  this.erroredTasks_ = [];

  for (var i in this.tasks_) {
    this.tasks_[i].reset();
  }
};

/**
 * Subclasses may override this method to just-in-time add child Tasks before the composite is run.
 */
tr.Graph.prototype.beforeFirstRun = goog.nullFunction;

/**
 * Add callbacks to the specified task.
 *
 * @param {!tr.Task} task Child task
 * @private
 */
tr.Graph.prototype.addCallbacksTo_ = function(task) {
  task.completed(this.childTaskCompleted_, this);
  task.errored(this.childTaskErrored_, this);
};

/**
 * Add callbacks from the specified task.
 *
 * @param {!tr.Task} task Child task
 * @private
 */
tr.Graph.prototype.removeCallbacksFrom_ = function(task) {
  task.off(tr.enums.Event.COMPLETED, this.childTaskCompleted_, this);
  task.off(tr.enums.Event.ERRORED, this.childTaskErrored_, this);
};

/**
 * @return {boolean} All child tasks have completed.
 * @private
 */
tr.Graph.prototype.areAllTasksCompleted_ = function() {
  for (var i in this.tasks_) {
    if (this.tasks_[i].getState() != tr.enums.State.COMPLETED) {
      return false;
    }
  }

  return true;
};

/**
 * @return {boolean} At least one child task is running.
 * @private
 */
tr.Graph.prototype.isAnyTaskRunning_ = function() {
  for (var i in this.tasks_) {
    if (this.tasks_[i].getState() == tr.enums.State.RUNNING) {
      return true;
    }
  }

  return false;
};

/**
 * Checks the specified task to ensure that it does not have any cyclic
 * dependencies (tasks that are mutually dependent) or dependencies on tasks
 * that are not in the current graph.
 *
 * @param {!tr.Task} task Child task
 * @throws {Error} if cyclic or invalid dependencies are detected.
 * @private
 */
tr.Graph.prototype.validateDependencies_ = function(task) {
  var blockers = this.taskIdToDependenciesMap_[task.getUniqueID()];

  if (blockers) {

    // Task cannot depend on itself
    goog.asserts.assert(blockers.indexOf(task) < 0,
        'Cyclic dependency detected.');

    for (var i in blockers) {
      var blocker = blockers[i];

      // Blocking task must be within the graph
      goog.asserts.assert(this.tasks_.indexOf(blocker) >= 0,
          'Invalid dependency detected.');
    }
  }
};

/**
 * Check child tasks to see if the graph has completed or errored.
 * If not, this method will run the next task(s).
 *
 * @private
 */
tr.Graph.prototype.completeOrRunNext_ = function() {

  // Handle edge-case where :started handler results in an interruption of this Graph
  if (this.getState() !== tr.enums.State.RUNNING) {
    return;
  }

  if (this.areAllTasksCompleted_()) {
    this.completeInternal();
  } else if (this.erroredTasks_.length == 0) {
    this.runAllReadyTasks_();
  } else {
    for (var i in this.tasks_) {
      var task = this.tasks_[i];

      if (task.getState() === tr.enums.State.RUNNING) {
        task.interrupt();
      }
    }

    this.errorInternal();
  }
};

/**
 * Determines if a task is safe to run by analyzing its blocking dependencies.
 *
 * @param {!tr.Task} task Child task
 * @return {boolean} The specified task has incomplete blocking tasks.
 * @private
 */
tr.Graph.prototype.hasIncompleteBlockers_ =
    function(task) {

  var blockers = this.taskIdToDependenciesMap_[task.getUniqueID()];

  if (blockers) {
    for (var i in blockers) {
      var blockingTask = blockers[i];

      if (blockingTask.getState() != tr.enums.State.COMPLETED) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Run every non-running task that is not blocked by another incomplete task.
 *
 * @private
 */
tr.Graph.prototype.runAllReadyTasks_ = function() {
  for (var i in this.tasks_) {
    var task = this.tasks_[i];

    // TRICKY: Check to ensure we're still running.
    // It's possible that a child task takes an action that interrupts the graph.
    if (this.getState() !== tr.enums.State.RUNNING) {
      return;
    }

    // TRICKY: If a task synchronously completes it will lead to another, simultaneous invocation of this method.
    // If this 2nd invocation starts a task that synchronously errors,
    // we run the risk of re-executing that failed Task when we return to this method.
    // To avoid this, check to make sure that the Task we are examining has not already errored.
    // Don't rely on task.getState() to check for an error,
    // because it may have errored on a previous run in which case we should retry it now.
    if (this.erroredTasks_.indexOf(task) >= 0) {
      continue;
    }

    if (this.hasIncompleteBlockers_(task)) {
      continue;
    }

    if (task.getState() != tr.enums.State.RUNNING &&
        task.getState() != tr.enums.State.COMPLETED) {
      this.addCallbacksTo_(task);

      task.run();
    }
  }
};

/**
 * Callback for child task completions.
 *
 * @param {!tr.Task} task Task that has just completed.
 * @private
 */
tr.Graph.prototype.childTaskCompleted_ = function(task) {
  this.removeCallbacksFrom_(task);

  this.completeOrRunNext_();
};

/**
 * Callback for child task errors.
 *
 * @param {!tr.Task} task Task that has just errored.
 * @private
 */
tr.Graph.prototype.childTaskErrored_ = function(task) {
  this.removeCallbacksFrom_(task);

  this.erroredTasks_.push(task);

  this.completeOrRunNext_();
};

