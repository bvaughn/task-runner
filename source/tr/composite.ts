module tr {

  /**
   * Executes a set of Tasks either in parallel or one after another.
   */
  export class Composite extends tr.Abstract {

    private completedTasks_:Array<tr.Task> = [];
    private erroredTasks_:Array<tr.Task> = [];
    private flushQueueInProgress_:boolean;
    private parallel_:boolean;
    private taskQueue_:Array<tr.Task> = [];
    private taskQueueIndex_:number = 0;

    /**
     * Constructor.
     *
     * @param parallel If TRUE, child tasks are run simultaneously;
     *                 otherwise they are run serially, in the order they were added.
     * @param tasks Initial set of child tasks.
     * @param name Optional task name.
     */
    constructor(parallel:boolean, tasks?:Array<tr.Task>, name?:string) {
      super(name || "Composite");

      this.parallel_ = parallel;

      if (tasks) {
        this.addAll(tasks);
      }
    }

    // Public interface ////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Adds a task to the list of child tasks.
     *
     * @param {!tr.Task} task Child task to be run when this task is run.
     * @return {!tr.Composite} a reference to the current task.
     * @throws {Error} if task has been added more than once
     */
    add(task:tr.Task):tr.Composite {
      var index = this.taskQueue_.indexOf(task);

      if (index >= 0) {
        throw Error("Cannot add task more than once.");
      }

      this.taskQueue_.push(task);

      if (this.getState() == tr.enums.State.RUNNING) {
        index = this.taskQueue_.indexOf(task);

        // TRICKY If the queue was just flushed, auto-run this task.
        if (this.parallel_ || this.taskQueueIndex_ == index) {
          this.addCallbacks_(task);

          task.run();
        }
      }

      return this;
    }

    /**
     * Adds a set of tasks to the list of child tasks.
     *
     * @param tasks Child tasks to be added
     * @return A reference to the current task.
     * @throws Error if tasks have been added more than once
     */
    addAll(tasks:Array<tr.Task>):tr.Composite {
      for (var i = 0; i < tasks.length; i++) {
        this.add(tasks[i]);
      }

      return this;
    }

    /**
     * Removes a task from the list of child tasks.
     *
     * @param {!tr.Task} task Child task to be removed from the graph.
     * @return {!tr.Composite} a reference to the current task.
     * @throws {Error} if the task provided is not a child of this composite.
     */
    remove(task:tr.Task):tr.Composite {
      var index = this.taskQueue_.indexOf(task);

      if (index < 0) {
        throw Error("Attempted to remove an invalid task.");
      }

      this.removeCallbacks_(task);
      this.taskQueue_.splice(this.taskQueue_.indexOf(task), 1);

      if (this.getState() == tr.enums.State.RUNNING) {
        if (this.parallel_ || index <= this.taskQueueIndex_) {
          this.taskQueueIndex_--;
        }

        if (task.getState() == tr.enums.State.RUNNING ||
          task.getState() == tr.enums.State.INTERRUPTED) {
          this.taskCompletedOrRemoved_(task);
        }
      }

      return this;
    }

    // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////

    /** @inheritDoc */
    getCompletedOperationsCount():number {
      var completedOperationsCount = 0;

      this.eachTaskInQueue_(
        function(task) {
          completedOperationsCount += task.getCompletedOperationsCount();
        });

      return completedOperationsCount;
    }

    /** @inheritDoc */
    getOperationsCount():number {
      var operationsCount = 0;

      this.eachTaskInQueue_(
        function(task) {
          operationsCount += task.getOperationsCount();
        });

      return operationsCount;
    }

    /** @inheritDoc */
    protected interruptImpl():void {
      this.eachTaskInQueue_(
        function(task) {
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
        function(task) {
          task.reset();
        });
    }

    /** @inheritDoc */
    protected runImpl():void {
      if (this.allTasksAreCompleted_()) {
        this.completeInternal();
      } else {
        this.erroredTasks_ = [];

        if (this.parallel_) {
          this.eachTaskInQueue_(
            function(task) {
              // TRICKY: Check to ensure we're still running.
              // It's possible that a child task takes an action that interrupts the graph.
              if (this.getState() !== tr.enums.State.RUNNING) {
                return;
              }

              this.addCallbacks_(task);

              task.run();
            }.bind(this));
        } else {
          var task = this.taskQueue_[this.taskQueueIndex_];

          this.addCallbacks_(task);

          task.run();
        }
      }
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
      // This lock will only be set to true if the flushQueue() is in-progress.
      // In this case we should ignore child task callbacks.
      if (this.flushQueueInProgress_) {
        return;
      }

      var finishedCount = this.completedTasks_.length + this.erroredTasks_.length;

      // When running in parallel, wait for all child tasks to complete (or fail)
      // before triggering our callbacks. Also be sure to count the failed tasks
      // when determining if the queue is empty.
      if (finishedCount >= this.taskQueue_.length) {
        if (this.erroredTasks_.length > 0) {
          this.errorInternal();
        } else {
          this.completeInternal();
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

      // Don't halt execution in parallel mode.
      // Allow tasks to finish running before bubbling the error.
      if (this.parallel_) {
        this.checkForTaskCompletion_();
      } else {
        this.errorInternal(task.getData(), task.getErrorMessage());
      }
    }

    /**
     * Invoke a callback once for each Task in the queue.
     *
     * @param callback Callback function
     */
    private eachTaskInQueue_(callback:Function):void {
      for (var i = 0; i < this.taskQueue_.length; i++) {
        var task = this.taskQueue_[i];

        callback(task);
      }
    }

    /**
     * Warning: this method is intended for a specific use-case. Please read the
     * documentation carefully to ensure that you understand that use-case before
     * using the method.
     *
     * Composite tasks may need to change direction while executing. For instance,
     * a user-input event may be received while a composite task is executing that
     * changes what should happen next. In that event this method can be used to
     * interrupt any tasks that are running, flush the current queue, and reset the
     * composite task to a pristine state.
     *
     * Furthermore this method may be instructed to leave the composite task running
     * once the queue has been flushed. This allows a new set of child tasks to be
     * added and run without triggering external callbacks.
     *
     * This behavior should only be used if the composite is going to be
     * re-populated and re-run (continued) immediately after flushing.
     *
     * @param doNotComplete Task should not complete itself nor invoke completion callbacks once the queue is empty.
     */
    protected flushQueue(doNotComplete):void {
      // Prevent completion callbacks from being invoked once the queue is empty.
      // See checkForTaskCompletion_() for more information.
      this.flushQueueInProgress_ = !!doNotComplete;

      // Manually interrupt any Task that are running.
      this.eachTaskInQueue_(
        function(task) {
          if (task.getState() == tr.enums.State.RUNNING) {
            task.interrupt();
          }
        });

      // Remove Tasks in reverse order to avoid running the next Task(s).
      while (this.taskQueue_.length > 0) {
        var task = this.taskQueue_[this.taskQueue_.length - 1];

        this.remove(task);
      }

      this.completedTasks_ = [];
      this.erroredTasks_ = [];

      this.flushQueueInProgress_ = false;
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

      if (!this.parallel_ && this.getState() == tr.enums.State.RUNNING) {
        var nextTask = this.taskQueue_[this.taskQueueIndex_];

        // TRICKY Handle edge-case where the task queue is being flushed.
        if (nextTask) {
          this.addCallbacks_(nextTask);

          nextTask.run();
        }
      }
    }
  }
};
