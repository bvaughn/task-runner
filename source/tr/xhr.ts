module tr {

  /**
   * Creates an XHR request and completes upon successful response from the server.
   *
   * <p>The type of request created depends on whether a data object is provided:
   *
   * <ul>
   *  <li>If a data object is provided it will be converted to a URL-args string and a POST request will be created.
   *  <li>If a data object is provided a GET request will be created.
   * </ul>
   */
  export class Xhr extends tr.Abstract {

    private static DEFAULT_RESPONSE_TYPE:tr.enums.XhrResponseType;

    private postData_:Object;
    private responseType_:tr.enums.XhrResponseType;
    private url_:string;
    private xhr_:XMLHttpRequest;

    /**
     * Constructor.
     *
     * @param url URL to load.
     * @param postData_ Object containing POST data; if undefined a GET request will be used.
     * @param responseType Expected response type.
     *                     If undefined the static value set with tr.Xhr.setDefaultResponseType will be used.
     *                     If no default response-type is set this value defaults to tr.Xhr.ResponseType.TEXT.
     * @param name Optional task name.
     */
    constructor(url:string, postData_?:Object, responseType?:tr.enums.XhrResponseType, name?:string) {
      super(name || "Xhr");

      this.postData_ = postData_;
      this.responseType_ = responseType || Xhr.DEFAULT_RESPONSE_TYPE || tr.enums.XhrResponseType.TEXT;
      this.url_ = url;
    }

    /**
     * Set the default response-type for all XHR requests that do not otherwise specify a response-type.
     */
    static setDefaultResponseType(responseType:tr.enums.XhrResponseType):void {
      this.DEFAULT_RESPONSE_TYPE = responseType;
    }

    /**
     * The default response-type for this XHR requests.
     */
    getResponseType():tr.enums.XhrResponseType {
      return this.responseType_;
    }

    // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////

    /** @inheritDoc */
    protected interruptImpl():void {
      if (this.xhr_ !== undefined) {
        this.xhr_.abort();
        this.xhr_ = undefined;
      }
    }

    /** @inheritDoc */
    protected resetImpl():void {
      this.xhr_ = undefined;
    }

    /** @inheritDoc */
    protected runImpl():void {
      try {
        var method = postDataString === undefined ? 'GET' : 'POST';
        var postDataString = this.createPostDataString_();

        this.xhr_ = new XMLHttpRequest();
        this.xhr_.addEventListener("load", this.onXhrRequestSuccess_.bind(this));
        this.xhr_.addEventListener("abort", this.onXhrRequestErrorOrTimeout_.bind(this));
        this.xhr_.addEventListener("error", this.onXhrRequestErrorOrTimeout_.bind(this));
        this.xhr_.addEventListener("timeout", this.onXhrRequestErrorOrTimeout_.bind(this));
        this.xhr_.open(method, this.url_, true);
        this.xhr_.send(postDataString);

      } catch (error) {
        if (this.getState() === tr.enums.State.RUNNING) {
          this.errorInternal(error, error.message);
        }
      }
    }

    // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////

    private createPostDataString_():string {
      if (this.postData_ !== undefined) {
        return this.serialize(this.postData_);
      }

      return undefined;
    }

    private serialize(object:Object, prefix?:string):string {
      var strings = [];

      for(var property in object) {
        if (object.hasOwnProperty(property)) {
          var k:string = prefix ? prefix + "[" + property + "]" : property, v = object[property];

          strings.push(
            typeof v == "object" ? this.serialize(v, k) : encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }
      }

      return strings.join("&");
    }

    // Event handlers //////////////////////////////////////////////////////////////////////////////////////////////////

    /** @private */
    private onXhrRequestSuccess_():void {
      if (this.getState() === tr.enums.State.RUNNING) {
        try {
          var data;

          switch (this.responseType_) {
            case tr.enums.XhrResponseType.JSON:
              data = JSON.parse(this.xhr_.responseText);
              break;
            case tr.enums.XhrResponseType.TEXT:
              data = this.xhr_.responseText;
              break;
            case tr.enums.XhrResponseType.XML:
              data = this.xhr_.responseXML;
              break;
          }

          this.completeInternal(data);
        } catch (error) {
          this.errorInternal(error, "Invalid response");
        }
      }
    }

    /** @private */
    private onXhrRequestErrorOrTimeout_():void {
      if (this.getState() === tr.enums.State.RUNNING) {
        this.errorInternal(
          this.xhr_.status,
          this.xhr_.statusText);
      }
    }
  }
};
