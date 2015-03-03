var Untype = function(domElement) {
  this.domElement_ = domElement;

  tr.Interval.call(this, this.eraseACharacter_, 25, "Untype");
};

// Extend the built-in tr.Interval task.
Untype.prototype = Object.create(tr.Interval.prototype);

// Callback to be invoked each timer-tick.
Untype.prototype.eraseACharacter_ = function() {
  var text = this.domElement_.innerHTML;
  
  if (text.length > 0) {
    this.domElement_.innerHTML = text.substring(0, text.length - 1);
  } else {
    this.complete();
  }
};