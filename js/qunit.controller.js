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
	$("#test-list").ajaxStop(function(){
		equals(list.valueForKey("contents").length, 5, "count list objects");
		$(this).unbind("ajaxStop");
		start();
	});
	var list = $.controller.array("list");
	ok(list, "list controller instantiated");
});

test("Test controller.array.create", function(){
	expect(3);
	stop();
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
	var list = $.controller.array("list");
	ok(list, "list controller instantiated");
});
