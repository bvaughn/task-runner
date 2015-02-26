/// <reference path="graph.ts" />

module tr {

  /**
   * Runs a series of tasks and chooses the highest priority resolution (task) based on their outcome.
   *
   * <p>Once a resolution is chosen, it is added to the graph and run (last) before completion.
   * This type of task can be used to creating branching logic within the flow or a larger sequence of tasks.
   *
   * <p>If no resolutions are valid, this task will error.
   */
  export class Conditional extends tr.Graph {

    private allConditionsHaveCompletedClosure_:tr.Closure;
    private chooseFirstAvailableOutcome_:boolean;
    private chosenOutcome_:tr.Task;
    private conditionIdsToFailsafeWrappersMap_:{[id:number]:tr.Failsafe} = {};
    private conditions_:Array<tr.Task> = [];
    private outcomeIdToBlockingTasksMap_:{[id:number]:Array<tr.Task>} = {};
    private prioritizedOutcomes_:Array<tr.Task> = [];

    /**
     * Constructor.
     *
     * @param chooseFirstAvailableOutcome If TRUE, the first available outcome will be run.
     *                                    All remaining conditions will be interrupted and ignored.
     *                                    This value defaults to FALSE,
     *                                    Meaning that all pre-conditions will be allowed to finish before an outcome is chosen.
     * @param name Optional task name.
     */
    constructor(chooseFirstAvailableOutcome?:boolean, name?:string) {
      super(name || "Conditional");

      this.chooseFirstAvailableOutcome_ = !!chooseFirstAvailableOutcome;
    }

    /**
     * The outcome that was chosen based on the result of the condition tasks.
     * This method may return `undefined` if no outcome has been chosen.
     */
    getChosenOutcome():tr.Task {
      return this.chosenOutcome_;
    }

    /**
     * Adds a conditional outcome to the task.
     * The outcome's conditions are in the form of {@link tr.Task}.
     * If all of the specified conditions succeed, the outcome will be run.
     *
     L* ike an IF/ELSE block, conditions should be added in the order of highest-to-lowest priority.
     * Also like an IF/ELSE block, only one outcome is chosen as a result of this task.
     *
     * Note that priority (order) will be ignored if `runFirstAvailableResolution` is set to true.
     *
     * @param outcome Task to be chosen if all of the specified conditions succeed.
     * @param conditions Tasks that are pre-requisites to complete before the outcome can be entered.
     * @return A reference to the resolver.
     * @throws Error if more than one outcome is added without conditions.
     * @throws Error if chooseFirstAvailableOutcome is TRUE and no conditions are specified.
     */
    addOutcome(outcome:tr.Task, conditions?:Array<tr.Task>):tr.Conditional {
      conditions = conditions || [];

      if (conditions.length === 0) {
        if (this.chooseFirstAvailableOutcome_) {
          throw Error('Cannot added outcome without conditions while chooseFirstAvailableOutcome is TRUE');
        }

        for (var i = 0, length = this.prioritizedOutcomes_.length; i < length; i++) {
          var preexistingOutcome:tr.Task = this.prioritizedOutcomes_[i];
          var preexistingConditions:Array<tr.Task> =
            this.outcomeIdToBlockingTasksMap_[preexistingOutcome.getUniqueID()];

          if (preexistingConditions.length === 0) {
            throw Error('Cannot add more than one outcome without conditions');
          }
        }
      }

      this.prioritizedOutcomes_.push(outcome);
      this.outcomeIdToBlockingTasksMap_[outcome.getUniqueID()] = conditions;

      for (var i = 0, length = conditions.length; i < length; i++) {
        var condition = conditions[i];

        if (this.conditions_.indexOf(condition) >= 0) {
          continue;
        }

        if (this.chooseFirstAvailableOutcome_) {
          condition.completed(this.maybeChooseEarlyOutcome_, this);
        }

        // Wrap it in a Failsafe so that a condition-failure won't interrupt the other conditions tasks.
        var failsafe:tr.Failsafe = new tr.Failsafe(condition);

        // @see maybeChooseEarlyOutcome_ for why we store these references
        this.conditionIdsToFailsafeWrappersMap_[condition.getUniqueID()] = failsafe;
        this.conditions_.push(condition);

        this.add(failsafe);
      }

      return this;
    }

    /**
     * Alias for addOutcome().
     *
     * @see addOutcome()
     */
    addIf(outcome:tr.Task, conditions:Array<tr.Task>):tr.Conditional {
      return this.addOutcome(outcome, conditions);
    }

    /**
     * Alias for addOutcome().
     *
     * @see addOutcome()
     */
    addElse(outcome:tr.Task):tr.Conditional {
      return this.addOutcome(outcome);
    }

    // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////

    private allConditionsHaveCompleted_():void {
      this.chooseOutcomeIfValid_();

      if (this.chosenOutcome_) {
        this.addToEnd(this.chosenOutcome_);
      } else {
        this.errorInternal("No valid outcomes found.");
      }
    }

    /** @inheritDoc */
    protected beforeFirstRun():void {
      this.allConditionsHaveCompletedClosure_ =
        new tr.Closure(
          this.allConditionsHaveCompleted_.bind(this), true, "Outcome-choosing-Closure");

      // Once all of the blocker-tasks have completed, choose the most appropriate resolution.
      // This task may be short-circuited if the first available resolution is chosen.
      this.addToEnd(this.allConditionsHaveCompletedClosure_);
    }

    /**
     * Picks the highest priority resolution (task) that meets all blocking dependencies.
     * @private
     */
    private chooseOutcomeIfValid_():void {
      for (var i = 0; i < this.prioritizedOutcomes_.length; i++) {
        var resolution = this.prioritizedOutcomes_[i];
        var blockers = this.outcomeIdToBlockingTasksMap_[resolution.getUniqueID()];
        var blockersSatisfied = true;

        for (var x = 0; x < blockers.length; x++) {
          var blockingTask = blockers[x];

          if (blockingTask.getState() === tr.enums.State.ERRORED) {
            blockersSatisfied = false;

            break;
          }
        }

        if (blockersSatisfied) {
          this.chosenOutcome_ = resolution;

          return;
        }
      }
    }

    private maybeChooseEarlyOutcome_():void {
      this.chooseOutcomeIfValid_();

      if (this.chosenOutcome_) {
        var placeholder = new tr.Stub();

        // Interrupt and remove all blockers before running the the resolution.
        // Add a temporary placeholder stub to prevent the Graph from auto-completing once blockers are removed.
        this.add(placeholder);

        // Remove Closure task first to avoid any invalid dependencies below.
        this.remove(this.allConditionsHaveCompletedClosure_);

        for (var i = 0, length = this.conditions_.length; i < length; i++) {
          var blocker:tr.Task = this.conditions_[i];

          if (blocker.getState() === tr.enums.State.RUNNING) {
            blocker.off(tr.enums.Event.COMPLETED, this.maybeChooseEarlyOutcome_, this);
            blocker.interrupt();
          }

          var failsafeWrapper:tr.Failsafe = this.conditionIdsToFailsafeWrappersMap_[blocker.getUniqueID()];
          this.remove(failsafeWrapper);
        }

        this.add(this.chosenOutcome_);
        this.remove(placeholder);
      }
    }
  }
};