module tr {

  /**
   * Creates and decorates a task returned by the callback.
   *
   * <p>Use this type of task when an important decision needs to be deferred.
   * For example if you need a task to load some data, but the specifics aren't known when your application is initialized.
   * This type of task allows for just-in-time evaluation of data resolved by previous Tasks.
   */
  export class Factory extends tr.Abstract {

    private taskFactoryFn_:(...args:any[]) => tr.Task;
    private thisArg_:any;
    private argsArray_:Array<any>;
    private deferredTask_:tr.Task;
    private recreateDeferredTaskAfterError_:boolean = false;
    private deferredTaskErrored_:boolean = false;

    /**
     * Constructor.
     *
     * @param taskFactoryFunction The function to create an Task object.
     * @param thisArg Optional 'this' argument to invoke taskFactoryFn with.
     * @param argsArray Optional arguments array to invoke taskFactoryFn with.
     * @param name Optional task name.
     */
    constructor(taskFactoryFunction:(...args:any[]) => tr.Task, thisArg?:any, argsArray?:Array<any>, name?:string) {
      super(name || "Factory");

      this.argsArray_ = argsArray;
      this.taskFactoryFn_ = taskFactoryFunction;
      this.thisArg_ = this;
    }

    /**
     * Returns the decorated Task, created by the factory function.
     */
    getDecoratedTask():tr.Task {
      return this.deferredTask_;
    }

    /**
     * Set whether to recreate the deferred task after an error occurred.
     * This property is sticky for all consecutive reruns until set again.
     */
    recreateDeferredTaskAfterError(value:boolean):void {
      this.recreateDeferredTaskAfterError_ = value;
    }

    // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////

    /** @inheritDoc */
    protected resetImpl():void {
      this.removeCallbacks_();

      if (this.deferredTask_) {
        this.deferredTask_ = null;
      }
    }

    /** @inheritDoc */
    protected interruptImpl():void {
      if (!this.deferredTask_) {
        return;
      }
      this.removeCallbacks_();
      this.deferredTask_.interrupt();
    }

    /** @inheritDoc */
    protected runImpl():void {
      if (!this.deferredTask_ ||
        this.recreateDeferredTaskAfterError_ && this.deferredTaskErrored_) {
        if (this.thisArg_) {
          this.deferredTask_ = this.taskFactoryFn_.apply(this.thisArg_, this.argsArray_ || []);
        } else {
          this.deferredTask_ = this.taskFactoryFn_();
        }
      }

      if (this.deferredTask_.getState() == tr.enums.State.COMPLETED) {
        this.onDeferredTaskCompleted_(this.deferredTask_);
      } else if (this.deferredTask_.getState() == tr.enums.State.ERRORED) {
        this.onDeferredTaskErrored_(this.deferredTask_);
      } else {
        this.deferredTask_.completed(this.onDeferredTaskCompleted_, this);
        this.deferredTask_.errored(this.onDeferredTaskErrored_, this);
        this.deferredTask_.interrupted(this.onDeferredTaskInterrupted_, this);
        this.deferredTask_.run();
      }
    }

    // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Event handler for when the deferred task is complete.
     */
    private onDeferredTaskCompleted_(task:tr.Task):void {
      this.removeCallbacks_();
      this.completeInternal(task.getData());
    }

    /**
     * Event handler for when the deferred task errored.
     */
    private onDeferredTaskErrored_(task:tr.Task):void {
      this.removeCallbacks_();
      this.deferredTaskErrored_ = true;
      this.errorInternal(task.getData(), task.getErrorMessage());
    }

    /**
     * Event handler for when the deferred task is interrupted.
     */
    private onDeferredTaskInterrupted_(task:tr.Task):void {
      this.interrupt();
    }

    /**
     * Removes the deferred task callbacks.
     */
    private removeCallbacks_():void {
      if (!this.deferredTask_) {
        return;
      }
      this.deferredTask_.off(tr.enums.Event.COMPLETED, this.onDeferredTaskCompleted_, this);
      this.deferredTask_.off(tr.enums.Event.ERRORED, this.onDeferredTaskErrored_, this);
      this.deferredTask_.off(tr.enums.Event.INTERRUPTED, this.onDeferredTaskInterrupted_, this);
    }
  }
};