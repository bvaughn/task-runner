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

    private blockerIdsToFailsafeWrappersMap_:{[id:number]:tr.Failsafe} = {};
    private blockers_:Array<tr.Task> = [];
    private final_:tr.Closure;
    private prioritizedResolutions_:Array<tr.Task> = [];
    private resolution_:tr.Task;
    private runFirstAvailableResolution_:boolean;
    private taskIdToBlockingTasksMap_:{[id:number]:Array<tr.Task>} = {};

    /**
     * Constructor.
     *
     * @param runFirstAvailableResolution If TRUE, a resolution will be run as soon as it is valid.
     *                                    All remaining blockers will be interrupted.
     *                                    All remaining resolutions will be ignored.
     *                                    Defaults to FALSE.
     * @param name Optional task name.
     */
    constructor(runFirstAvailableResolution?:boolean, name?:string) {
      super(name || "Resolver");

      this.runFirstAvailableResolution_ = !!runFirstAvailableResolution;
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

        if (this.runFirstAvailableResolution_) {
          task.completed(this.checkForEarlyResolution_, this);
        }

        // Wrap it in a Failsafe so that a blocking-task failure won't interrupt the other blocking tasks.
        var failsafe:tr.Failsafe = new tr.Failsafe(task);

        // @see checkForEarlyResolution_ for why we store these references
        this.blockerIdsToFailsafeWrappersMap_[task.getUniqueID()] = failsafe;
        this.blockers_.push(task);

        this.add(failsafe);
      }

      return this;
    }

    private allBlockersFinalized_():void {
      this.chooseResolution_();

      if (this.resolution_) {
        this.addToEnd(this.resolution_);
      } else {
        this.errorInternal("No valid resolutions found.");
      }
    }

    /** @inheritDoc */
    protected beforeFirstRun():void {
      this.final_ =
        new tr.Closure(
          this.allBlockersFinalized_.bind(this), true, "Closure - state-chooser");

      // Once all of the blocker-tasks have completed, choose the most appropriate resolution.
      // This task may be short-circuited if the first available resolution is chosen.
      this.addToEnd(this.final_);
    }

    private checkForEarlyResolution_():void {
      this.chooseResolution_();

      if (this.resolution_) {
        var placeholder = new tr.Stub();

        // Interrupt and remove all blockers before running the the resolution.
        // Add a temporary placeholder stub to prevent the Graph from auto-completing once blockers are removed.
        this.add(placeholder);

        // Remove Closure task first to avoid any invalid dependencies below.
        this.remove(this.final_);

        for (var i = 0, length = this.blockers_.length; i < length; i++) {
          var blocker:tr.Task = this.blockers_[i];

          if (blocker.getState() === tr.enums.State.RUNNING) {
            blocker.off(tr.enums.Event.COMPLETED, this.checkForEarlyResolution_, this);
            blocker.interrupt();
          }

          var failsafeWrapper:tr.Failsafe = this.blockerIdsToFailsafeWrappersMap_[blocker.getUniqueID()];
          this.remove(failsafeWrapper);
        }

        this.add(this.resolution_);
        this.remove(placeholder);
      }
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

          return;
        }
      }
    }
  }
};