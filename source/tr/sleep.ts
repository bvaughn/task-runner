module tr {

  /**
   * Waits for an amount of time to pass before completing.
   *
   * <p>Resuming an interrupted task can either restart the timer at the beginning or resume from the interrupted point.
   */
  export class Sleep extends tr.Abstract {

    private resetTimerAfterInterruption_:boolean;
    private timeout_:number;
    private timeoutId_:number;
    private timeoutPause_:number = -1;
    private timeoutStart_:number = -1;

    /**
     * Constructor.
     *
     * @param timeout Time in milliseconds to wait before completing.
     * @param resetTimerAfterInterruption Reset the timer after interruption; defaults to false.
     * @param name Optional task name.
     */
    constructor(timeout:number, resetTimerAfterInterruption:boolean, name?:string) {
      super(name || "Sleep");

      this.resetTimerAfterInterruption_ = !!resetTimerAfterInterruption;
      this.timeout_ = timeout;
    }

    // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////

    /** @inheritDoc */
    protected resetImpl():void {
      this.stopTimer_();

      this.timeoutStart_ = -1;
      this.timeoutPause_ = -1;
    }

    /** @inheritDoc */
    protected interruptImpl():void {
      this.stopTimer_();

      this.timeoutPause_ = new Date().getTime();
    }

    /** @inheritDoc */
    protected runImpl():void {
      if (this.timeoutId_) {
        throw 'A timeout for this task already exists.';
      }

      var timeout = this.timeout_;

      // Increment counter unless the task has been configured to restart after interruptions.
      if (!this.resetTimerAfterInterruption_ && this.timeoutStart_ > -1 && this.timeoutPause_ > -1) {
        timeout += (this.timeoutStart_ - this.timeoutPause_);
      }

      timeout = Math.max(timeout, 0);

      this.timeoutId_ = setTimeout(this.onTimeout_.bind(this), timeout);
      this.timeoutStart_ = new Date().getTime();
    }

    // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Stops the running timer.
     * @private
     */
    stopTimer_():void {
      if (this.timeoutId_) {
        clearTimeout(this.timeoutId_);

        this.timeoutId_ = null;
      }
    }

    /**
     * Event handler for when the deferred task is complete.
     * @private
     */
    onTimeout_():void {
      this.stopTimer_();
      this.completeInternal();
    }
  }
};