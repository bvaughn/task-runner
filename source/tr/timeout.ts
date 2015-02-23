module tr {

  /**
   * Decorates a Task and enforces a max-execution time limit.
   *
   * <p>If specified time interval elapses before the decorated Task has complete it is considered to be an error.
   * The decorated Task will be interrupted in that event.
   */
  export class Timeout extends tr.Abstract {

    private decoratedTask_:tr.Task;
    private timeout_:number;
    private timeoutId_:number;
    private timeoutPause_:number = -1;
    private timeoutStart_:number = -1;

    /**
     * Constructor.
     *
     * @param task The task to decorate.
     * @param timeout Time in milliseconds to wait before timing out the decorated task.
     * @param name Optional task name.
     */
    constructor(task:tr.Task, timeout:number, name?:string) {
      super(name || "Timeout");

      this.decoratedTask_ = task;
      this.timeout_ = timeout;
    }

    /**
     * Returns the inner decorated Task.
     *
     * @return {tr.Task}
     */
    getDecoratedTask():tr.Task {
      return this.decoratedTask_;
    }

    // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////

    /** @inheritDoc */
    protected interruptImpl():void {
      this.stopTimer_();
      this.removeCallbacks_();

      this.decoratedTask_.interrupt();
      this.timeoutPause_ = new Date().getTime();
    }

    /** @inheritDoc */
    protected resetImpl():void {
      this.stopTimer_();
      this.removeCallbacks_();

      this.decoratedTask_.reset();
      this.timeoutStart_ = -1;
      this.timeoutPause_ = -1;
    }

    /** @inheritDoc */
    protected runImpl():void {
      if (this.timeoutId_) {
        throw 'A timeout for this task already exists.';
      }

      var timeout = this.timeout_;

      if (this.timeoutStart_ > -1 && this.timeoutPause_ > -1) {
        timeout += (this.timeoutStart_ - this.timeoutPause_);
      }

      timeout = Math.max(timeout, 0);

      this.timeoutId_ = setTimeout(this.onTimeout_.bind(this), timeout);
      this.timeoutStart_ = new Date().getTime();

      if (this.decoratedTask_.getState() == tr.enums.State.COMPLETED) {
        this.onDecoratedTaskCompleted_(this.decoratedTask_);
      } else if (this.decoratedTask_.getState() == tr.enums.State.ERRORED) {
        this.onDecoratedTaskErrored_(this.decoratedTask_);
      } else {
        this.decoratedTask_.completed(this.onDecoratedTaskCompleted_, this);
        this.decoratedTask_.errored(this.onDecoratedTaskErrored_, this);
        this.decoratedTask_.run();
      }
    }

    // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Event handler for when the deferred task is complete.
     * @param {!tr.Task} task
     * @private
     */
    private onDecoratedTaskCompleted_(task:tr.Task):void {
      this.stopTimer_();
      this.removeCallbacks_();

      this.completeInternal(task.getData());
    }

    /**
     * Event handler for when the deferred task errored.
     * @param {!tr.Task} task
     * @private
     */
    private onDecoratedTaskErrored_(task:tr.Task):void {
      this.stopTimer_();
      this.removeCallbacks_();

      this.errorInternal(task.getData(), task.getErrorMessage());
    }

    /**
     * Event handler for when the deferred task is complete.
     * @private
     */
    private onTimeout_():void {
      this.stopTimer_();
      this.removeCallbacks_();

      this.decoratedTask_.interrupt();
      this.errorInternal(this.decoratedTask_.getData(), 'Task timed out after ' + this.timeout_ + 'ms');
    }

    /**
     * Removes the decorated task callbacks.
     */
    private removeCallbacks_():void {
      this.decoratedTask_.off(tr.enums.Event.COMPLETED, this.onDecoratedTaskCompleted_, this);
      this.decoratedTask_.off(tr.enums.Event.ERRORED, this.onDecoratedTaskErrored_, this);
    }

    /**
     * Stops the running timer.
     */
    private stopTimer_():void {
      if (this.timeoutId_) {
        clearTimeout(this.timeoutId_);

        this.timeoutId_ = null;
      }
    }
  }
};