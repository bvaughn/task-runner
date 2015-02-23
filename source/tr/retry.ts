module tr {

  /**
   * Decorator for tasks that should be retried on error.
   *
   * <p>For example, you may wish to decorator a Task that relies on Internet connectivity in order to complete.
   * The decorated Task is allowed to fail a specified number of times before the error condition is reported externally.
   *
   * <p>This decorator can also be configured to delay for a set amount of time before re-running its internal tasks.
   * This delay may allow certain types of external error conditions (e.g. temporary loss of Internet connectivity)
   * to resolve before the operation is attempted again.
   */
  export class Retry extends tr.Abstract {

    /**
     * The default max number of times to reset and re-run the decorated Task before erroring the retry task.
     */
    static MAX_RETRIES_:Number = 5;

    /**
     * The default amount of time to delay before resetting and re-running the decorated Task.
     */
    static RETRY_DELAY_:number = 5;

    private decoratedTask_:tr.Task;
    private maxRetries_:number;
    private retries_:number = 0;
    private retryDelay_:number;
    private timeoutId_:number;

    /**
     * Constructor.
     *
     * @param task The task to decorate.
     * @param maxRetries Number of times to reset and re-run the decorated Task before erroring the retry task.
     *                   If not specified this defaults to 5.
     * @param retryDelay The amount of time to delay before resetting and re-running the decorated Task.
     *                   A value < 0 seconds will result in a synchronous retry.
     *                   If not specified this defaults to 1000 ms.
     * @param name Optional task name.
     */
    constructor(task:tr.Task, maxRetries:number, retryDelay:number, name?:string) {
      super(name || "Retry");

      this.decoratedTask_ = task;
      this.maxRetries_ = maxRetries || 5;
      this.retryDelay_ = retryDelay || 1000;
    }

    /**
     * The inner decorated Task.
     */
    getDecoratedTask():tr.Task {
      return this.decoratedTask_;
    }

    /**
     * The number of retries attempted.
     */
    getRetries():number {
      return this.retries_;
    }

    // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////

    /** @inheritDoc */
    protected interruptImpl():void {
      this.stopTimer_();
      this.retries_ = 0; // Interruption resets the number of retries.

      this.removeCallbacks_();
      if (this.decoratedTask_.getState() == tr.enums.State.RUNNING) {
        this.decoratedTask_.interrupt();
      }
    }

    /** @inheritDoc */
    protected resetImpl():void {
      this.stopTimer_();
      this.retries_ = 0;

      this.removeCallbacks_();
      this.decoratedTask_.reset();
    }

    /** @inheritDoc */
    protected runImpl():void {
      this.decoratedTask_.completed(this.onDecoratedTaskCompleted_, this);
      this.decoratedTask_.errored(this.onDecoratedTaskErrored_, this);

      if (this.decoratedTask_.getState() == tr.enums.State.COMPLETED) {
        this.onDecoratedTaskCompleted_(this.decoratedTask_);
        return;
      }
      if (this.decoratedTask_.getState() == tr.enums.State.ERRORED) {
        this.decoratedTask_.reset();
      }
      this.decoratedTask_.run();
    }

    // Private methods /////////////////////////////////////////////////////////////////////////////////////////////////

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
      if (this.retries_ >= this.maxRetries_) {
        this.stopTimer_();
        this.removeCallbacks_();

        this.errorInternal(task.getData(), task.getErrorMessage());

        return;
      }

      this.retries_++;

      if (this.retryDelay_ >= 0) {
        this.timeoutId_ = setTimeout(this.runImpl.bind(this), this.retryDelay_);
      } else {
        this.runImpl();
      }
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