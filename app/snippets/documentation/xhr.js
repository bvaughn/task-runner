// Sends a POST request to "returns-json" with URL args "bar=1&baz=two"
var task = new tr.Xhr("returns-json", {bar: 1, baz: "two"});
task.run();

// Sends a GET request to that returns XML
var task = new tr.Xhr("returns-xml", null, tr.Xhr.ResponseType.XML);
task.run();