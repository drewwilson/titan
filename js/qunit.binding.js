module("bindings");

test("Test observe(key)", function(){
	expect(2);
	var object = {prop:"old"};
	$(object).observe("prop", function(){
		ok(true, "got a change notification");
		equals($(object).valueForKey("prop"), "new", "prop set to 'new'");
	});
	$(object).valueForKey("prop", "new");
});
test("Test observe(path)", function(){
	expect(4);
	var object = {path:{key:"old"}};
	var fn = function(){
		ok(true, "got a change notification");
		equals($(object).valueForKeyPath("path.key"), "new", "path.key set to 'new'");
	};
	$(object).observe("path.key", fn);
	$(object).valueForKeyPath("path.key", "new");
	$(object).unobserve("path.key", fn);
	$(object).observe("path.key", function(){
		ok(true, "got a change notification");
		equals($(object).valueForKeyPath("path.key"), "old", "path.key set back to 'old'");
	});
	$(object).valueForKey("path", {key: "old"});
});
test("Test connect functionality", function(){
	var obj1 = {prop1: ""};
	var obj2 = {prop2: "asdf"};
	
	ok($(obj1).connect, "object has connect method");
	
	$(obj1).connect("prop1", obj2, "prop2");
	equals($(obj1).valueForKey("prop1"), "asdf", "sets obj1.prop1 to bound value");
	
	$(obj2).valueForKey("prop2", "asdfasdf");
	equals($(obj1).valueForKey("prop1"), "asdfasdf", "sets obj1.prop1 to new bound value");
	
	$(obj1).valueForKey("prop1", "asdf");
	equals($(obj2).valueForKey("prop2"), "asdf", "sets obj2.prop2 to new bound value");
});