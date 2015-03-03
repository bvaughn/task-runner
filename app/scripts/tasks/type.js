var Type = function(domElement, textToWrite) {
  this.domElement_ = domElement;
  this.textToWrite_ = textToWrite;
  this.length_ = textToWrite.length;
  this.index_ = -1;

  tr.Interval.call(this, this.typeNextCharacter_, this.getHumanizedInterval_(), "Type");
};

// Extend the built-in tr.Interval task.
Type.prototype = Object.create(tr.Interval.prototype);

// Generates varied pauses between characters to simulate more "human" typing.
Type.prototype.getHumanizedInterval_ = function(isWhitespace) {
  return isWhitespace ? Math.round(Math.random() * 125) + 50 : Math.round(Math.random() * 50) + 25; 
};

// Callback to be invoked each timer-tick.
Type.prototype.typeNextCharacter_ = function() {
  if (++this.index_ < this.length_) {
    this.domElement_.innerHTML = this.textToWrite_.substring(0, this.index_ + 1);

    var character = this.textToWrite_.charAt(this.index_);
    var isWhitespace = character.match(/\s/);

    this.setInterval(this.getHumanizedInterval_(isWhitespace));
  } else {
    this.complete();

    this.index_ = -1;
  }
};