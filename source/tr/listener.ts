module tr {

  /**
   * Waits for an event-dispatching target to trigger a specific type of event.
   */
  export class Listener extends tr.Abstract {

    private eventTarget_:HTMLElement;
    private eventType_:string;
    private listener_:EventListener;

    /**
     * Constructor.
     *
     * @param eventTarget Event-dispatching target.
     * @param eventType Type of event to wait for.
     * @param name Optional task name.
     */
    constructor(eventTarget:HTMLElement, eventType:string, name?:string) {
      super(name || "Listener");

      this.eventTarget_ = eventTarget;
      this.eventType_ = eventType;
    }

    /** @inheritDoc */
    protected interruptImpl():void {
      this.eventTarget_.removeEventListener(this.eventType_, this.listener_);
    }

    /** @inheritDoc */
    protected resetImpl():void {
      // No-op
    }

    /** @inheritDoc */
    protected runImpl():void {
      var that = this;

      this.listener_ = function(event:Event) {
        that.eventTarget_.removeEventListener(that.eventType_, that.listener_);

        that.completeInternal(event);
      };

      this.eventTarget_.addEventListener(this.eventType_, this.listener_);
    }
  }
};
