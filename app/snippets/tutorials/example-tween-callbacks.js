// Animated fade-in effect...
function(value) {
  domElement.style.opacity = value;
}

// Animated resize effect (animating width from 100px to 200px)...
function(value) {
  domElement.style.width = 100 + 100 * value + 'px';
}

// Animated shrinking effect...
function(value) {
  var inverted = (1 - value);

  domElement.style.width = domElement.style.height = 100 * inverted + 'px';
}