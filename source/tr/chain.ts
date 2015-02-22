module tr {

  /**
   * Lightweight interface to create a dependency graph task.
   */
  export class Chain extends tr.Abstract {

    private graph_:tr.Graph;
    private mostRecentTaskArgs_:Array<any> = [];

    /**
     * Constructor.
     *
     * @param completedCallback Optional on-complete callback method.
     * @param erroredCallback Optional on-error callback method.
     * @param name Optional task name.
     */
    constructor(completedCallback?:Function, erroredCallback?:Function, name?:string) {
      super(name || "Chain");

      this.graph_ = new tr.Graph();
      this.graph_.completed(this.completeInternal.bind(this));
      this.graph_.errored(this.errorInternal.bind(this));

      if (completedCallback !== undefined) {
        this.completed(completedCallback);
      }

      if (erroredCallback !== undefined) {
        this.errored(erroredCallback);
      }
    }

    // Public interface ////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Alias for "or".
     *
     * @param ...tasks One or more tasks
     * @return A reference to the current task.
     */
    else(...tasks:tr.Task[]):tr.Chain {
      return this.or.apply(this, tasks);
    }

    /**
     * Add one or more tasks to the beginning of the chain.
     *
     * @param ...tasks One or more tasks
     * @return A reference to the current task.
     * @throws Error if this method is called once tasks have already been added to the chain.
     */
    first(...tasks:tr.Task[]):tr.Chain {
      if (this.graph_.getOperationsCount() > 0) {
        throw Error("Cannot call first after tasks have been added");
      }

      this.then.apply(this, tasks);

      return this;
    }

    /**
     * Returns the inner decorated Graph task.
     */
    getDecoratedTask():tr.Graph {
      return this.graph_;
    }

    /**
     * Add one or more tasks to be run only if one of the previously-added tasks fail.
     *
     * @param ...tasks One or more tasks
     * @return A reference to the current task.
     */
    or(...tasks:tr.Task[]):tr.Chain {
      // Remove the most recent batch of tasks (added with the previous call to or() or then()) from the Graph.
      this.graph_.removeAll(this.mostRecentTaskArgs_);

      // Use StopOnSuccess to ensure the correct continue-only-on-failure behavior.
      var stopOnSuccess = new tr.StopOnSuccess();

      // Wrap them in a parallel group (to preserve then() behavior).
      stopOnSuccess.add(
        new tr.Composite(true, this.mostRecentTaskArgs_));

      // Wrap the new batch of tasks in a parallel group as well.
      if (tasks.length > 1) {
        stopOnSuccess.add(
          new tr.Composite(true, tasks));
      } else {
        stopOnSuccess.add(tasks[0]);
      }

      // Re-add the new composite to the end of the Graph.
      this.graph_.addToEnd(stopOnSuccess);

      // Update our most-recent pointer to the newly-added composite in case an or() call follows.
      this.mostRecentTaskArgs_ = [stopOnSuccess];

      return this;
    }

    /**
     * Alias for "or".
     *
     * @param ...tasks One or more tasks
     * @return A reference to the current task.
     */
    otherwise(...tasks:tr.Task[]):tr.Chain {
      return this.or.apply(this, tasks);
    }

    /**
     * Add one or more tasks to be run after the tasks already in this chain have been run.
     *
     * @param ...tasks One or more tasks
     * @return A reference to the current task.
     */
    then(...tasks:tr.Task[]):tr.Chain {
      this.mostRecentTaskArgs_ = tasks;

      this.graph_.addAllToEnd(tasks);

      return this;
    }

    // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////

    /** @inheritDoc */
    getOperationsCount():number {
      return this.graph_.getOperationsCount();
    }

    /** @inheritDoc */
    getCompletedOperationsCount():number {
      return this.graph_.getCompletedOperationsCount();
    }

    /** @inheritDoc */
    protected runImpl():void {
      this.graph_.run();
    }

    /** @inheritDoc */
    protected interruptImpl():void {
      this.graph_.interrupt();
    }

    /** @inheritDoc */
    protected resetImpl():void {
      this.graph_.reset();
    }
  }
}