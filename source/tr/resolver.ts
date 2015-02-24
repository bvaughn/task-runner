module tr {

  /**
   * Runs a series of tasks and chooses the highest priority resolution (task) based on their outcome.
   *
   * <p>Once a resolution is chosen, it is added to the graph and run (last) before completion.
   * This type of task can be used to creating branching logic within the flow or a larger sequence of tasks.
   *
   * <p>If no resolutions are valid, this task will error.
   */
  export class Resolver extends tr.Graph {

    private blockers_:Array<tr.Task> = [];
    private prioritizedResolutions_:Array<tr.Task> = [];
    private resolution_:tr.Task;
    private taskIdToBlockingTasksMap_:{[id:number]:Array<tr.Task>} = {};

    /**
     * Constructor.
     *
     * @param name Optional task name.
     */
    constructor(name?:string) {
      super(name || "Resolver");
    }

    /**
     * Returns the highest priority resolution that was able to be matched once the blockers finished running.
     */
    getChosenResolution():tr.Task {
      return this.resolution_;
    }

    /**
     * Add a resolution (a {@link tr.Task}) and its prerequisite blocking {@link tr.Task}s.
     * Resolutions should be added in the order of highest-to-lowest priority.
     *
     * @param resolution Task to be chosen if all of the specified blockers succeed.
     * @param blockers Tasks that are pre-requisites to complete before the resolution can be entered.
     * @return A reference to the resolver.
     */
    addResolution(resolution:tr.Task, blockers:Array<tr.Task>):tr.Resolver {
      blockers = blockers || [];

      this.prioritizedResolutions_.push(resolution);
      this.taskIdToBlockingTasksMap_[resolution.getUniqueID()] = blockers;

      for (var i = 0, length = blockers.length; i < length; i++) {
        var task = blockers[i];

        if (this.blockers_.indexOf(task) >= 0) {
          continue;
        }

        this.blockers_.push(task);

        // Wrap it in a Failsafe so that a blocking-task failure won't interrupt the other blocking tasks.
        this.add(new tr.Failsafe(task));
      }

      return this;
    }

    /** @inheritDoc */
    protected beforeFirstRun():void {
      // Once all of the blocker-tasks have completed, choose the most appropriate resolution.
      this.addToEnd(
        new tr.Closure(
          this.chooseResolution_.bind(this), true, "Closure - state-chooser"));
    }

    /**
     * Picks the highest priority resolution (task) that meets all blocking dependencies.
     * @private
     */
    private chooseResolution_():void {
      for (var i = 0; i < this.prioritizedResolutions_.length; i++) {
        var resolution = this.prioritizedResolutions_[i];
        var blockers = this.taskIdToBlockingTasksMap_[resolution.getUniqueID()];
        var blockersSatisfied = true;

        for (var x = 0; x < blockers.length; x++) {
          var blockingTask = blockers[x];

          if (blockingTask.getState() === tr.enums.State.ERRORED) {
            blockersSatisfied = false;

            break;
          }
        }

        if (blockersSatisfied) {
          this.resolution_ = resolution;

          this.addToEnd(resolution);

          return;
        }
      }

      this.errorInternal("No valid resolutions found.");
    }
  }
};