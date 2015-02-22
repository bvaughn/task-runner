module tr {

  /**
   * Observes (but does not execute) a collection of Tasks.
   *
   * <p>This task can be used to monitor the execution of 1 or more running Tasks.
   * These tasks do not have to be related in any way.
   * Tasks can be added (or removed) while the observer is running.
   * It will complete only once all observed Tasks has completed.
   *
   * <p>If this Task is executed with no observed Tasks it will instantly complete.
   * The same is true if all of its observed Tasks have already completed by the time it has been executed.
   */
  export class Observer extends tr.Abstract {

    private failUponFirstError_:boolean;
    private observedTasks_:Array<tr.Task>;

    /**
     * Constructor.
     *
     * @param tasks The array of Tasks to observe.
     * @param failUponFirstError Whether to error the observer task immediately when one of the observed tasks errors.
     * @param name Optional task name.
     */
    constructor(tasks:Array<tr.Task>, failUponFirstError:boolean, name?:string) {
      super(name || "Observer");

      this.failUponFirstError_ = failUponFirstError;
      this.observedTasks_ = [];

      if (tasks) {
        for (var i in tasks) {
          var task = tasks[i];
          if (this.observedTasks_.indexOf(task) == -1) {
            this.observedTasks_.push(task);
          }
        }
      }
    }

    /**
     * Returns a list of observed tasks.
     */
    getObservedTasks():Array<tr.Task> {
      return this.observedTasks_;
    }

    /**
     * Add an additional Task to observe.
     * @param task
     * @return A reference to the current task.
     */
    observe(task:tr.Task):tr.Observer {
      if (this.observedTasks_.indexOf(task) == -1) {
        this.observedTasks_.push(task);
      }

      if (this.getState() == tr.enums.State.RUNNING) {
        task.completed(this.onObservedTaskCompleted_, this);
        task.errored(this.onObservedTaskErrored_, this);
      }

      return this;
    }

    /**
     * Stops a Task from being observed.
     * @param task
     * @return A reference to the current task.
     */
    stopObserving(task:tr.Task):tr.Observer {
      var index = this.observedTasks_.indexOf(task);

      if (index >= 0) {
        task.off(tr.enums.Event.COMPLETED, this.onObservedTaskCompleted_, this);
        task.off(tr.enums.Event.ERRORED, this.onObservedTaskErrored_, this);

        this.observedTasks_.splice(index, 1);
        this.tryToFinalize_();
      }

      return this;
    }

    // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////

    /** @override */
    getCompletedOperationsCount():number {
      var count = 0;
      for (var i in this.observedTasks_) {
        var task = this.observedTasks_[i];
        count += task.getCompletedOperationsCount();
      }
      return count;
    }

    /** @override */
    getOperationsCount():number {
      var count = 0;
      for (var i in this.observedTasks_) {
        var task = this.observedTasks_[i];
        count += task.getOperationsCount();
      }
      return count;
    }

    /** @override */
    protected runImpl():void {
      if (!this.tryToFinalize_()) {
        for (var i in this.observedTasks_) {
          var task = this.observedTasks_[i];
          this.observe(task);
        }
      }
    }

    // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Event handler for when the observed task is complete.
     */
    private onObservedTaskCompleted_(task:tr.Task):void {
      this.tryToFinalize_();
    }

    /**
     * Event handler for when the observed task errored.
     */
    private onObservedTaskErrored_(task:tr.Task):void {
      this.tryToFinalize_();
    }

    /**
     * Try to complete or error the observer task based on the states of the observed tasks, if the observer is running.
     */
    private tryToFinalize_():boolean {
      if (this.getState() != tr.enums.State.RUNNING) {
        return false;
      }

      var allFinal = true;
      var firstError = null;

      for (var i in this.observedTasks_) {
        var task = this.observedTasks_[i];
        if (task.getState() == tr.enums.State.ERRORED) {
          firstError = firstError || task;
        } else if (task.getState() != tr.enums.State.COMPLETED) {
          allFinal = false;
        }
      }

      if (firstError && this.failUponFirstError_) {
        this.errorInternal(firstError.getData(), firstError.getErrorMessage());
        return true;
      } else if (firstError && allFinal) {
        this.errorInternal();
        return true;
      } else if (allFinal) {
        this.completeInternal();
        return true;
      }

      return false;
    }
  }
};