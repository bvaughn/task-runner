var Crossfade = function(domElementToShow, domElementToHide, duration) {
  this.domElementToShow_ = domElementToShow;
  this.domElementToHide_ = domElementToHide;
  this.duration_ = duration || 1000;

  tr.Tween.call(this, this.onTween_, this.duration_, undefined, "Crossfade");
};

Crossfade.prototype = Object.create(tr.Tween.prototype);

Crossfade.prototype.onTween_ = function(value) {
  this.domElementToShow_.style.opacity = value;
  this.domElementToHide_.style.opacity = 1 - value;
};