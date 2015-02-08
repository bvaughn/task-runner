function initAnimation1() {
  var snap = Snap("#animationDemo");

  var createAnimationTask = function(element, properties, duration, easing) {
    return new tr.Closure(function(task) {
      element.animate(properties, duration, easing, task.complete.bind(task));
    });
  };

  var tBottom = snap.rect(125, 0, 100, 0).attr("fill", "white");
  var tTopLeft = snap.rect(125, 0, 0, 100).attr("fill", "white");
  var tTopRight = snap.rect(350, 0, 1, 100).attr("fill", "white");

  var font = {fontFamily: "Arial Black", fontSize: 200, fill: "white"}; 

  var textA = snap.paper.text(240, 300, "A").attr(font).attr({opacity: 0});
  var textS = snap.paper.text(400, 300, "S").attr(font).attr({opacity: 0});
  var textK = snap.paper.text(550, 300, "K").attr(font).attr({opacity: 0});

  var innerGroup = snap.paper.g();
  innerGroup.add(tBottom, tTopLeft, tTopRight);
  innerGroup.transform("rotate(-135 125 200);");

  var outerGroup = snap.paper.g();
  outerGroup.add(innerGroup);
  outerGroup.transform("translate(200, 100);");

  var graphTask = new tr.Graph();
  graphTask.addToEnd(
    createAnimationTask(tTopRight, {width: 225, x: 125}, 650, mina.backout));
  var sleepTaskA = new tr.Sleep(750);
  var sleepTaskB = new tr.Sleep(1150);
  graphTask.addAllToEnd([
    sleepTaskA,
    sleepTaskB,
    createAnimationTask(tBottom, {height: 400}, 1500, mina.elastic)]);
  graphTask.addAll([
      createAnimationTask(innerGroup, {transform: "rotate(0 125 200); scale(.5, .5);"}, 500, easing.easeInOut),
      createAnimationTask(outerGroup, {transform: "translate(100, 100);"}, 500, easing.easeInOut),
      createAnimationTask(tTopLeft, {width: 175, x: 0}, 350, mina.backout)
    ], [sleepTaskA]);
  graphTask.addAll([
      createAnimationTask(textA, {opacity: 1}, 1500, mina.easeInOut),
      createAnimationTask(textS, {opacity: 1}, 3000, mina.easeInOut),
      createAnimationTask(textK, {opacity: 1}, 5000, mina.easeInOut)
    ], [sleepTaskB]);
  graphTask.run();
};