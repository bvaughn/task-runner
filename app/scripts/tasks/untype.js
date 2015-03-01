var Untype = function(domElement) {
  this.domElement_ = domElement;

  tr.Interval.call(this, this.eraseACharacter_, 25, "Untype");
};

// Extend the built-in tr.Interval task.
Untype.prototype = Object.create(tr.Interval.prototype);

// Callback to be invoked each timer-tick.
Untype.prototype.eraseACharacter_ = function() {
  var text = this.domElement_.innerText;
  
  if (text.length > 0) {
    this.domElement_.innerText = text.substring(0, text.length - 1);
  } else {
    this.complete();
  }
};