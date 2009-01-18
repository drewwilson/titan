module("template", {
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

test("Test connecting a controller to a template", function(){
	expect(7);
	var list;
	stop();
	ok($("#main").template, "check template");
	$("#main").ajaxStop(function(){
		$(this).unbind("ajaxStop");
		$("#main").ajaxStop(function(){
			$(this).unbind("ajaxStop");
			equals($("#test-list span").length, 4, "remove a list element");
			$("#test-list span").each(function(){
				equals($(this).text(), "asdf", "check text of each span");
			});
			start();
		});
		equals($("#test-list span").length, 5, "attach 5 list items to div");
		list.destroy(3);
	});
	list = $.controller.array("list");
	$("#test-list").template(list);
});
