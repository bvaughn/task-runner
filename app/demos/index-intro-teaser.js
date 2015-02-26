var prismTeasers = document.getElementById('prismTeasers');

new tr.Xhr('/app/snippets/index-intro-teaser.js')
  .completed(function(xhr) {
    var lines = xhr.getData().split("\n");
    var elements = [];

    for (var i = 0, length = lines.length; i < length; i++) {
      var element = document.createElement("code");
      element.innerText = lines[i];
      element.style.opacity = 0;

      prismTeasers.appendChild(element);
      prismTeasers.appendChild(document.createElement("br"));

      Prism.highlightElement(element);

      elements.push(element);
    }

    var chain = new tr.Chain();

    for (var i = 0, length = elements.length; i < length; i++) {
      chain.then(
        new tr.Tween(
          function(opacity) {
            this.style.opacity = opacity;
          }.bind(elements[i]), 1000 + (length - i) / length * 1000));
    }

    chain.run();
  })
  .run();