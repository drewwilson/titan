module("controller", {
	setup: function() {
		$.controller.defaults.url = "server/";
		$.ajaxSetup({timeout: 1000});
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
