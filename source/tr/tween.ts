module tr {

  /**
   * Animation-frame-based task for tweening properties.
   *
   * <p>This task invokes a callback on each animation frame and passes a 0..1 value representing the progress of the overall tween.
   */
  export class Tween extends tr.Abstract {

    private animationFrameId_:number;
    private callback_:(value:number) => void;
    private duration_:number;
    private easingFunction_:(value:number) => number;
    private elapsed_:number = 0;
    private lastUpdateTimestamp_:number = 0;

    /**
     * Constructor.
     *
     * @param callback Callback invoked on animation frame with a number (0..1) representing the position of the tween.
     * @param duration Duration of tween in milliseconds.
     * @param easingFunction Optional easing function used to convert input time to an eased time.
     *                       If no function is specified, a linear ease (no ease) will be used.
     * @param name Optional task name.
     */
    constructor(callback:(val:number) => void, duration:number, easingFunction:(val:number) => number, name?:string) {
      super(name || "Tween");

      if (isNaN(duration) || duration <= 0) {
        throw Error("Invalid tween duration provided.");
      }

      this.callback_ = callback;
      this.duration_ = duration;
      this.easingFunction_ = easingFunction || this.linearEase_;
    }

    // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////

    /** @inheritDoc */
    protected interruptImpl():void {
      this.cancelCurrentAnimationFrame_();
    }

    /** @inheritDoc */
    protected resetImpl():void {
      this.elapsed_ = 0;
      this.lastUpdateTimestamp_ = 0;

      // One final animation frame to reset the progress value to 0.
      this.queueAnimationFrame_(this.updateReset_.bind(this));
    }

    /** @inheritDoc */
    protected runImpl():void {
      this.lastUpdateTimestamp_ = new Date().getTime();

      this.queueAnimationFrame_(this.updateRunning_.bind(this));
    }

    // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////

    private cancelCurrentAnimationFrame_():void {
      if (this.animationFrameId_) {
        window.cancelAnimationFrame(this.animationFrameId_);

        this.animationFrameId_ = null;
      }
    }

    private linearEase_(value:number):number {
      return value;
    }

    private queueAnimationFrame_(callback:FrameRequestCallback):void {
      this.cancelCurrentAnimationFrame_();

      this.animationFrameId_ = window.requestAnimationFrame(callback);
    }

    private updateReset_():void {
      this.animationFrameId_ = null;

      this.callback_(this.easingFunction_(0));
    }

    private updateRunning_():void {
      var timestamp:number = new Date().getTime();

      this.animationFrameId_ = null;
      this.elapsed_ += timestamp - this.lastUpdateTimestamp_;
      this.lastUpdateTimestamp_ = timestamp;

      var value = this.easingFunction_(Math.min(1, this.elapsed_ / this.duration_));

      this.callback_(value);

      // Check for complete or queue another animation frame.
      if (this.elapsed_ >= this.duration_) {
        this.completeInternal();
      } else {
        this.queueAnimationFrame_(this.updateRunning_.bind(this));
      }
    }
  }
}