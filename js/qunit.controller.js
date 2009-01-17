module("controller", {
	setup: function() {
		$.controller.defaults.url = "server/";
		$.ajaxSetup({timeout: 0});
	},
	teardown: function() {
		$.ajax({
			url: "server/teardown.php",
			async: false,
			method: "GET"
		});
	}
});

test("Test ArrayController retrieve", function(){
	expect(2);
	stop();
	var list;
	$("#test-list").ajaxStop(function(){
		equals(list.valueForKey("contents").length, 5, "count list objects");
		$(this).unbind("ajaxStop");
		start();
	});
	list = $.controller.array("list");
	ok(list, "list controller instantiated");
});

test("Test controller.array.create", function(){
	expect(3);
	stop();
	var list;
	$("#test-list").ajaxStop(function(){
		equals(list.valueForKey("contents").length, 5, "count list objects");
		$(this).unbind("ajaxStop");
		$(this).ajaxStop(function(){
			equals(list.valueForKey("contents").length, 6, "count list objects");
			$(this).unbind("ajaxStop");
			start();
		});
		list.create({name: "asdf"});
	});
	list = $.controller.array("list");
	ok(list, "list controller instantiated");
});

test("Test controller.array.destroy", function(){
	expect(3);
	stop();
	var list;
	$("#test-list").ajaxStop(function(){
		equals(list.valueForKey("contents").length, 5, "count list objects");
		$(this).unbind("ajaxStop");
		$(this).ajaxStop(function(){
			equals(list.valueForKey("contents").length, 4, "count list objects");
			$(this).unbind("ajaxStop");
			start();
		});
		list.destroy(3);
	});
	list = $.controller.array("list");
	ok(list, "list controller instantiated");
});

test("Test controller.array.update", function(){
	expect(3);
	stop();
	var list;
	$("#test-list").ajaxStop(function(){
		equals(list.valueForKey("contents").length, 5, "count list objects");
		$(this).unbind("ajaxStop");
		$(this).ajaxStop(function(){
						console.log(list.valueForKey("contents"));
			//equals(list.valueForKey("contents").length, 4, "count list objects");
			equals(list.valueForKey("contents")[1].name, "updated", "updated list item");
			$(this).unbind("ajaxStop");
			start();
		});
		list.update({id: 2, name: "updated"});
	});
	list = $.controller.array("list");
	ok(list, "list controller instantiated");
});
