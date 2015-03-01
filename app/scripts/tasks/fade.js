var Fade = function(domElement, fadeIn, duration) {
  this.domElement_ = domElement;
  this.duration_ = duration || 1000;
  this.fadeIn_ = fadeIn;

  tr.Tween.call(this, this.onTween_, this.duration_, undefined, "Fade");

  if (fadeIn) {
    this.started(
      function() {
        domElement.style.display = 'inline-block';
      });
  } else {
    this.completed(
      function() {
        domElement.style.display = 'none';
      });
  }
};

Fade.prototype = Object.create(tr.Tween.prototype);

Fade.prototype.onTween_ = function(value) {
  this.domElement_.style.opacity = this.fadeIn_ ? value : 1 - value;
};