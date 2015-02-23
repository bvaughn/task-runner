module tr {

  /**
   * Runs a series of tasks until one of them successfully completes.
   *
   * <p>This type of task completes successfully if at least one of its children complete.
   * If all of its children error, this task will also error.
   */
  export class StopOnSuccess extends tr.Abstract {

    private completedTasks_:Array<tr.Task> = [];
    private erroredTasks_:Array<tr.Task> = [];
    private taskQueue_:Array<tr.Task> = [];
    private taskQueueIndex_:number = 0;

    /**
     * Constructor.
     *
     * @param tasks Initial set of child tasks.
     * @param name Optional task name.
     */
    constructor(tasks?:Array<tr.Task>, name?:string) {
      super(name || "StopOnSuccess");

      if (tasks) {
        this.addAll(tasks);
      }
    }

    // Public interface ////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Adds a set of tasks to the list of child tasks.
     *
     * <p>This method should only be called before the task is run.
     * Adding child tasks while running is not a supported operation.
     *
     * @param tasks Child tasks to be added
     * @return A reference to the current task.
     * @throws Error if the composite task has already been run.
     * @throws Error if tasks have been added more than once.
     */
    addAll(tasks:Array<tr.Task>):tr.StopOnSuccess {
      for (var i = 0; i < tasks.length; i++) {
        this.add(tasks[i]);
      }

      return this;
    }

    /**
     * Adds a task to the list of child tasks.
     *
     * <p>This method should only be called before the task is run.
     * Adding child tasks while running is not a supported operation.
     *
     * @param task Child task to be run when this task is run.
     * @return A reference to the current task.
     * @throws Error if the composite task has already been run.
     * @throws Error if task has been added more than once
     */
    add(task:tr.Task):tr.StopOnSuccess {
      if (this.getState() === tr.enums.State.RUNNING) {
        throw Error("Cannot add task while running.");
      }

      var index = this.taskQueue_.indexOf(task);

      if (index >= 0) {
        throw 'Cannot add task more than once.';
      }

      this.taskQueue_.push(task);

      return this;
    }

    /**
     * Removes a task from the list of child tasks.
     *
     * <p>This method should only be called before the task is run.
     * Removing child tasks while running is not a supported operation.
     *
     * @param {!tr.Task} task Child task to be removed from the graph.
     * @return {!tr.StopOnSuccess} a reference to the current task.
     * @throws {Error} if the composite task has already been run.
     * @throws {Error} if the task provided is not a child of this composite.
     */
    remove(task:tr.Task):tr.StopOnSuccess {
      if (this.getState() === tr.enums.State.RUNNING) {
        throw Error("Cannot remove  task while running.");
      }

      var index = this.taskQueue_.indexOf(task);

      if (index < 0) {
        throw Error("Attempted to remove an invalid task.");
      }

      this.removeCallbacks_(task);
      this.taskQueue_.splice(this.taskQueue_.indexOf(task), 1);

      return this;
    }

    // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////

    /** @inheritDoc */
    getCompletedOperationsCount():number {
      if (this.getState() === tr.enums.State.COMPLETED) {
        return this.getOperationsCount();
      } else {
        var completedOperationsCount = 0;

        this.eachTaskInQueue_(
          function(task:tr.Task) {
            completedOperationsCount += task.getCompletedOperationsCount();
          });

        return completedOperationsCount;
      }
    }

    /** @inheritDoc */
    getOperationsCount():number {
      var operationsCount = 0;

      this.eachTaskInQueue_(
        function(task:tr.Task) {
          operationsCount += task.getOperationsCount();
        });

      return operationsCount;
    }

    /** @inheritDoc */
    protected runImpl():void {
      if (this.allTasksAreCompleted_()) {
        this.completeInternal();
      } else {
        this.erroredTasks_ = [];

        var task = this.taskQueue_[this.taskQueueIndex_];

        this.addCallbacks_(task);

        task.run();
      }
    }

    /** @inheritDoc */
    protected interruptImpl():void {
      this.eachTaskInQueue_(
        function(task:tr.Task) {
          if (task.getState() == tr.enums.State.RUNNING) {
            task.interrupt();
          }
        });
    }

    /** @inheritDoc */
    protected resetImpl():void {
      this.taskQueueIndex_ = 0;
      this.completedTasks_ = [];
      this.erroredTasks_ = [];

      this.eachTaskInQueue_(
        function(task:tr.Task) {
          task.reset();
        });
    }

    // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Adds completed and errored callback handlers to child Task.
     *
     * @param task Child task
     */
    private addCallbacks_(task:tr.Task):void {
      task.completed(this.childTaskCompleted_, this);
      task.errored(this.childTaskErrored_, this);
    }

    /**
     * Are all child tasks completed?
     */
    private allTasksAreCompleted_():boolean {
      for (var i = 0; i < this.taskQueue_.length; i++) {
        var task = this.taskQueue_[i];

        if (task.getState() != tr.enums.State.COMPLETED) {
          return false;
        }
      }

      return true;
    }

    /**
     * Checks for completion (or failure) of child tasks and triggers callbacks.
     */
    private checkForTaskCompletion_():void {
      if (this.completedTasks_.length > 0) {
        this.completeInternal();
      } else {
        var finishedCount = this.completedTasks_.length + this.erroredTasks_.length;

        if (finishedCount >= this.taskQueue_.length) {
          if (this.erroredTasks_.length > 0) {
            this.errorInternal();
          } else {
            this.completeInternal();
          }
        }
      }
    }

    /**
     * Callback for child task completions.
     *
     * @param task Task that has just completed.
     */
    private childTaskCompleted_(task:tr.Task):void {
      this.completedTasks_.push(task);

      this.taskCompletedOrRemoved_(task);
    }

    /**
     * Callback for child task errors.
     *
     * @param task Task that has just errored.
     */
    private childTaskErrored_(task:tr.Task):void {
      this.erroredTasks_.push(task);

      this.taskCompletedOrRemoved_(task);
    }

    /**
     * Invoke a callback once for each Task in the queue.
     *
     * @param callback Callback function
     */
    private eachTaskInQueue_(callback:(task:tr.Task) => void):void {
      for (var i = 0; i < this.taskQueue_.length; i++) {
        var task = this.taskQueue_[i];

        callback(task);
      }
    }

    /**
     * Removes completed and errored callback handlers from child Task.
     *
     * @param task Child task
     */
    private removeCallbacks_(task:tr.Task):void {
      task.off(tr.enums.Event.COMPLETED, this.childTaskCompleted_, this);
      task.off(tr.enums.Event.ERRORED, this.childTaskErrored_, this);
    }

    /**
     * Convenience method for handling a completed Task and executing the next.
     *
     * @param task Task that has either been removed from the queue or has completed successfully.
     */
    private taskCompletedOrRemoved_(task:tr.Task):void {
      this.taskQueueIndex_++;

      // TRICKY Ensure we are still running before continuing.
      // Callbacks attached to child tasks may have interrupted the composite.
      if (this.getState() != tr.enums.State.RUNNING) {
        return;
      }

      this.checkForTaskCompletion_();

      if (this.getState() == tr.enums.State.RUNNING) {
        var nextTask = this.taskQueue_[this.taskQueueIndex_];

        if (nextTask) {
          this.addCallbacks_(nextTask);

          nextTask.run();
        }
      }
    }
  }
}