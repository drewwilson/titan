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
		$(this).unbind("ajaxStop");
		$(this).ajaxStop(function(){
			equals(list.valueForKey("contents").length, 6, "count list objects");
			$(this).unbind("ajaxStop");
			start();
		});
		equals(list.valueForKey("contents").length, 5, "count list objects");
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
			equals(list.valueForKey("contents")[1].name, "updated", "updated list item");
			$(this).unbind("ajaxStop");
			start();
		});
		list.update({id: 2, name: "updated"});
	});
	list = $.controller.array("list");
	ok(list, "list controller instantiated");
});

test("Test controller.array.conditions", function(){
	stop();
	var master, detail;
	$("#test-list").ajaxStop(function(){
		$(this).unbind("ajaxStop");
		$(this).ajaxStop(function(){
			$(this).unbind("ajaxStop");
			$(this).ajaxStop(function(){
				$(this).unbind("ajaxStop");
				equals(detail.valueForKey("contents").length, 1, "count detail objects");
				start();
			});
			equals(detail.valueForKey("contents").length, 0, "count detail objects");
			master.valueForKey("selection", master.valueForKey("contents")[1]);
			detail.retrieve();
		});
		equals(master.valueForKey("contents").length, 4, "count master objects");
		detail = $.controller.array("detail", master, "parent_id");
		equals(detail.valueForKey("contents").length, 0, "count detail objects");
		master.valueForKey("selection", master.valueForKey("contents")[0]);
		detail.retrieve();
	});
	master = $.controller.array("master");
	ok(master, "list controller instantiated");
});
