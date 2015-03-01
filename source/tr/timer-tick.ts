module tr {

  /**
   * Invokes a callback at an interval until instructed to stop.
   *
   * <p>This type of task can be used to perform open-ended or non-deterministic actions.
   * It will run until instructed to complete (or error) by the provided callback.
   */
  export class TimerTick extends tr.Abstract {

    protected callback_:(task:tr.TimerTick) => void;
    private interval_:number;
    private timeoutId_:number;

    /**
     * Constructor.
     *
     * @param callback Callback invoked once per timer tick.
     * @param interval Time in milliseconds between ticks.
     * @param name Optional task name.
     */
    constructor(callback:(task:tr.TimerTick) => void, interval:number, name?:string) {
      super(name || "TimerTick");

      this.callback_ = callback;
      this.interval_ = interval;
    }

    /**
     * Complete this task.
     *
     * @param data Task data to be later accessible via getData().
     */
    complete(data?:any):void {
      this.completeInternal(data);
    }

    /**
     * Error this task.
     *
     * @param data Error data to be later accessible via getData().
     * @param errorMessage Error message to be later accessible via getErrorMessage()
     */
    error(data?:any, errorMessage?:string):void {
      this.errorInternal(data, errorMessage);
    }

    /**
     * Adjust the interval between timer ticks.
     */
    setInterval(interval:number) {
      this.interval_ = interval;
    }

    // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////

    /** @inheritDoc */
    protected interruptImpl():void {
      this.stopTimer_();
    }

    /** @inheritDoc */
    protected resetImpl():void {
    }

    /** @inheritDoc */
    protected runImpl():void {
      this.queueNextTick_();
    }

    // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////

    private queueNextTick_():void {
      this.timeoutId_ = setTimeout(this.onTimeout_.bind(this), this.interval_);
    }

    private stopTimer_():void {
      if (this.timeoutId_) {
        clearTimeout(this.timeoutId_);

        this.timeoutId_ = null;
      }
    }

    // Event handlers //////////////////////////////////////////////////////////////////////////////////////////////////

    private onTimeout_():void {
      try {
        this.callback_(this);

        if (this.getState() === tr.enums.State.RUNNING) {
          this.queueNextTick_();
        }

      } catch (error) {

        // Edge case that could be triggered if callback interrupts/completes this task, but synchronously errors.
        if (this.getState() === tr.enums.State.RUNNING) {
          this.errorInternal(error, error.message);
        }
      }
    }
  }
};