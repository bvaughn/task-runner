module tr {

  /**
   * Decorates a task and re-dispatches errors as successful completions.
   *
   * <p>This can be used to decorate tasks that are not essential.
   */
  export class Failsafe extends tr.Abstract {

    private decoratedTask_:tr.Task;

    /**
     * Constructor.
     *
     * @param decoratedTask Decorated task to be run when this task is run.
     * @param name Optional task name.
     */
    constructor(decoratedTask:tr.Task, name?:string) {
      super(name || "Failsafe for " + decoratedTask.getName());

      this.decoratedTask_ = decoratedTask;
    }

    /**
     * Returns the inner decorated Task.
     */
    getDecoratedTask():tr.Task {
      return this.decoratedTask_;
    }

    /** @inheritDoc */
    protected interruptImpl():void {
      this.decoratedTask_.interrupt();
    }

    /** @inheritDoc */
    protected resetImpl():void {
      this.decoratedTask_.reset();
    }

    /** @inheritDoc */
    protected runImpl():void {
      this.decoratedTask_.completed(
          function(task:tr.Task) {
            this.completeInternal();
          }.bind(this));

      this.decoratedTask_.errored(
          function(task:tr.Task) {
            this.completeInternal();
          }.bind(this));

      this.decoratedTask_.run();
    }
  }
};
