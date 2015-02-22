module tr {

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
   */
  export class Graph extends tr.Abstract {

    private beforeFirstRunInvoked_:boolean;
    private erroredTasks_:Array<tr.Task> = [];
    private taskIdToDependenciesMap_:{ [id: number]: Array<tr.Task>; } = {};
    private tasks_:Array<tr.Task> = [];

    /**
     * Constructor.
     *
     * @param name Optional task name.
     */
    constructor(name?) {
      super(name || "Graph");
    }

    // Public interface ////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Adds a child task to the dependency graph and ensures that its blocking dependencies (if any) are valid.
     *
     * @param task Child task to be run when this task is run.
     * @param blockers Blocking tasks that must complete successfully before this task can be run.
     *                 This parameter can be omitted for tasks that do not have blocking dependencies.
     * @return A reference to the current task.
     * @throws Error if task has been added more than once.
     * @throws Error if cyclic dependencies are detected.
     */
    add(task:tr.Task, blockers?:Array<tr.Task>):tr.Graph {
      if (this.tasks_.indexOf(task) >= 0) {
        throw Error("Cannot add task more than once.");
      }

      this.tasks_.push(task);

      this.updateBlockers_([task], blockers);
      this.validateDependencies_(task);

      if (this.getState() == tr.enums.State.RUNNING) {
        this.runAllReadyTasks_();
      }

      return this;
    }

    /**
     * Adds child tasks to the dependency graph and ensures that their blocking dependencies (if any) are valid.
     *
     * @param tasks Child tasks to be run when this task is run.
     * @param blockers Blocking tasks that must complete successfully before this task can be run.
     *                 This parameter can be omitted for tasks that do not have blocking dependencies.
     * @return A reference to the current task.
     * @throws Error if task has been added more than once.
     * @throws Error if cyclic dependencies are detected.
     */
    addAll(tasks:Array<tr.Task>, blockers?:Array<tr.Task>):tr.Graph {
      for (var i = 0, length = tasks.length; i < length; i++) {
        this.add(tasks[i], blockers);
      }

      return this;
    }

    /**
     * Convenience method for adding a task to the "end" of the dependency graph.
     * In other words, this task will be blocked by all tasks already in the graph.
     *
     * @param task Child task to be run when this task is run.
     * @return A reference to the current task.
     * @throws Error if task has been added more than once.
     * @throws Error if cyclic dependencies are detected.
     */
    addToEnd(task:tr.Task):tr.Graph {
      return this.add(task, this.tasks_.slice(0));
    }

    /**
     * Convenience method for adding multiple tasks to the "end" of the dependency graph.
     * In other words, these tasks will be blocked by all tasks already in the graph.
     *
     * @param tasks Child tasks to be run when this task is run.
     * @return A reference to the current task.
     * @throws Error if task has been added more than once.
     */
    addAllToEnd(tasks:Array<tr.Task>):tr.Graph {
      return this.addAll(tasks, this.tasks_.slice(0));
    }

    /**
     * Adds blocking dependencies (tasks) to tasks in the graph.
     *
     * <p>If the graph is running, blockers must not be added to tasks that are already running.
     *
     * @param blockers Blocking dependencies to add.
     * @param tasks Tasks from which to add the blockers.
     * @return A reference to the current task.
     * @throws Error if either the blockers or the tasks are not in the graph.
     * @throws Error if blockers have been added to tasks that are already running.
     */
    addBlockersTo(blockers:Array<tr.Task>, tasks:Array<tr.Task>):tr.Graph {
      this.updateBlockers_(tasks, blockers);

      return this;
    }

    /**
     * Removes a child task from the dependency graph and ensures that the remaining dependencies are still valid.
     *
     * @param task Child task to be removed from the graph.
     * @return A reference to the current task.
     * @throws Error if the task provided is not within the dependency graph,
     *         or if removing the task invalidates any other, blocked tasks.
     */
    remove(task:tr.Task):tr.Graph {
      this.verifyInGraph_([task]);

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
    }

    /**
     * Removes child tasks from the dependency graph and ensures that the remaining dependencies are still valid.
     *
     * @param {!Array.<!tr.Task>} tasks Child tasks to be removed.
     * @return {!tr.Graph} a reference to the current task.
     * @throws Error if any of the tasks provided is not within the dependency graph,
     *         or if removing them invalidates any other, blocked tasks.
     */
    removeAll(tasks:Array<tr.Task>):tr.Graph {
      for (var i = 0, length = tasks.length; i < length; i++) {
        this.remove(tasks[i]);
      }

      return this;
    }

    /**
     * Removes blocking dependencies (tasks) from tasks in the graph.
     *
     * <p>If the graph is running, any newly-unblocked tasks will be automatically run.
     *
     * @param blockers Blocking dependencies to remove.
     * @param tasks Tasks from which to remove the blockers.
     * @return A reference to the current task.
     * @throws Error if either the blockers or the tasks are not in the graph.
     */
    removeBlockersFrom(blockers:Array<tr.Task>, tasks:Array<tr.Task>):tr.Graph {
      this.verifyInGraph_(blockers);
      this.verifyInGraph_(tasks);

      var taskIdToDependenciesMap = this.taskIdToDependenciesMap_;

      for (var i = 0, length = tasks.length; i < length; i++) {
        var task = tasks[i];
        var dependencies = taskIdToDependenciesMap[task.getUniqueID()] || [];

        for (var i = 0, length = blockers.length; i < length; i++) {
          var blocker = blockers[i];
          var index = dependencies.indexOf(blocker);

          if (index >= 0) {
            dependencies.splice(index, 1);
          }
        }

        taskIdToDependenciesMap[task.getUniqueID()] = dependencies;
      }

      if (this.getState() === tr.enums.State.RUNNING) {
        this.completeOrRunNext_();
      }

      return this;
    }

    // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////

    /** @inheritDoc */
    getOperationsCount():number {
      var operationsCount = 0;

      for (var i in this.tasks_) {
        operationsCount += this.tasks_[i].getOperationsCount();
      }

      return operationsCount;
    }

    /** @inheritDoc */
    getCompletedOperationsCount():number {
      var completedOperationsCount = 0;

      for (var i in this.tasks_) {
        completedOperationsCount += this.tasks_[i].getCompletedOperationsCount();
      }

      return completedOperationsCount;
    }

    /** @inheritDoc */
    protected runImpl():void {
      this.erroredTasks_ = [];

      if (!this.beforeFirstRunInvoked_) {
        this.beforeFirstRun();
        this.beforeFirstRunInvoked_ = true;
      }

      this.completeOrRunNext_();
    }

    /** @inheritDoc */
    protected interruptImpl():void {
      for (var i in this.tasks_) {
        var task = this.tasks_[i];

        if (task.getState() == tr.enums.State.RUNNING) {
          this.removeCallbacksFrom_(task);

          task.interrupt();
        }
      }
    }

    /** @inheritDoc */
    protected resetImpl():void {
      this.erroredTasks_ = [];

      for (var i in this.tasks_) {
        this.tasks_[i].reset();
      }
    }

    // Hook methods ////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Subclasses may override this method to just-in-time add child Tasks before the composite is run.
     */
    beforeFirstRun():void {
      // No-op
    }

    // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Add callbacks to the specified task.
     *
     * @param task Child task
     */
    addCallbacksTo_(task:tr.Task):void {
      task.completed(this.childTaskCompleted_, this);
      task.errored(this.childTaskErrored_, this);
    }

    /**
     * @return {boolean} All child tasks have completed.
     * @private
     */
    areAllTasksCompleted_() {
      for (var i in this.tasks_) {
        if (this.tasks_[i].getState() != tr.enums.State.COMPLETED) {
          return false;
        }
      }

      return true;
    }

    /**
     * Callback for child task completions.
     *
     * @param task Task that has just completed.
     */
    childTaskCompleted_(task:tr.Task):void {
      this.removeCallbacksFrom_(task);

      this.completeOrRunNext_();
    }

    /**
     * Callback for child task errors.
     *
     * @param task Task that has just errored.
     */
    childTaskErrored_(task:tr.Task):void {
      this.removeCallbacksFrom_(task);

      this.erroredTasks_.push(task);

      this.completeOrRunNext_();
    }

    /**
     * Check child tasks to see if the graph has completed or errored.
     * If not, this method will run the next task(s).
     */
    completeOrRunNext_():void {

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
    }

    /**
     * Determines if a task is safe to run by analyzing its blocking dependencies.
     *
     * @param task Child task
     * @return The specified task has incomplete blocking tasks.
     */
    hasIncompleteBlockers_(task:tr.Task):boolean {
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
    }

    /**
     * Is at least one child task is running?
     */
    isAnyTaskRunning_():boolean {
      for (var i in this.tasks_) {
        if (this.tasks_[i].getState() == tr.enums.State.RUNNING) {
          return true;
        }
      }

      return false;
    }

    /**
     * Add callbacks from the specified task.
     *
     * @param task Child task
     */
    removeCallbacksFrom_(task:tr.Task):void {
      task.off(tr.enums.Event.COMPLETED, this.childTaskCompleted_, this);
      task.off(tr.enums.Event.ERRORED, this.childTaskErrored_, this);
    }

    /**
     * Run every non-running task that is not blocked by another incomplete task.
     */
    runAllReadyTasks_():void {
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
    }

    /**
     * Helper function to updates blocking dependencies for the specified task.
     *
     * @param tasks Array of tasks for which to add blockers.
     * @param blockers Array of blocking tasks to be added.
     * @throws Error if either tasks or blockers are not already in the graph.
     * @throws Error if blockers have been added to tasks that are already running.
     */
    updateBlockers_(tasks:Array<tr.Task>, blockers:Array<tr.Task>):void {
      if (!blockers || blockers.length === 0) {
        return;
      }

      this.verifyInGraph_(tasks);
      this.verifyInGraph_(blockers);

      for (var i = 0, length = tasks.length; i < length; i++) {
        var task = tasks[i];

        if (task.getState() !== tr.enums.State.INITIALIZED) {
          throw Error("Cannot add blocking dependency to running task.");
        }

        var dependencies = this.taskIdToDependenciesMap_[task.getUniqueID()] || [];

        for (var i = 0, length = blockers.length; i < length; i++) {
          var blocker = blockers[i];

          if (dependencies.indexOf(blocker) < 0) {
            dependencies.push(blocker);
          }
        }

        this.taskIdToDependenciesMap_[task.getUniqueID()] = dependencies;
      }
    }

    /**
     * Checks the specified task to ensure that it does not have any cyclic
     * dependencies (tasks that are mutually dependent) or dependencies on tasks
     * that are not in the current graph.
     *
     * @param task Child task
     * @throws Error if cyclic or invalid dependencies are detected.
     */
    validateDependencies_(task:tr.Task):void {
      var blockers = this.taskIdToDependenciesMap_[task.getUniqueID()];

      if (blockers) {
        // Task cannot depend on itself
        if (blockers.indexOf(task) >= 0) {
          throw Error("Cyclic dependency detected.");
        }

        // Task cannot depend on blocking tasks that aren't within the graph
        this.verifyInGraph_(blockers);
      }
    }

    /**
     * Verifies that all of the specified tasks are within the graph.
     *
     * @param tasks Array of tasks.
     * @throws Error if any of the tasks are not in the graph.
     */
    verifyInGraph_(tasks:Array<tr.Task>):void {
      for (var i = 0, length = tasks.length; i < length; i++) {
        if (this.tasks_.indexOf(tasks[i]) < 0) {
          throw Error("Task not in graph.");
        }
      }
    }
  }
}
;