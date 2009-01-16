module("bindings");

test("Test observe(key)", function(){
	expect(2);
	var object = {prop:"old"};
	$.kvo.encode(object);
	object.observe("prop", function(){
		ok(true, "got a change notification");
		equals(object.valueForKey("prop"), "new", "prop set to 'new'");
	});
	object.valueForKey("prop", "new");
});
test("Test observe(path)", function(){
	expect(2);
	var object = {path:{key:"old"}};
	$.kvo.encode(object);
	object.observe("path.key", function(){
		ok(true, "got a change notification");
		equals(object.valueForKeyPath("path.key"), "new", "path.key set to 'new'");
	});
	object.valueForKeyPath("path.key", "new");
});
