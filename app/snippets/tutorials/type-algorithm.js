var domElement = document.createElement("p");
var text = "I am some text to type";
var characterIndex = -1;

while (++characterIndex < text.length) {
  domElement.innerText += text.charAt(characterIndex);
}