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

test("Test controller.array.retrieve", function(){
	expect(2);
	stop();
	var list;
	$("#test-list").ajaxStop(function(){
		equals($(list).valueForKey("contents").length, 5, "count list objects");
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
			equals($(list).valueForKey("contents").length, 6, "count list objects");
			$(this).unbind("ajaxStop");
			start();
		});
		equals($(list).valueForKey("contents").length, 5, "count list objects");
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
		equals($(list).valueForKey("contents").length, 5, "count list objects");
		$(this).unbind("ajaxStop");
		$(this).ajaxStop(function(){
			equals($(list).valueForKey("contents").length, 4, "count list objects");
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
		equals($(list).valueForKey("contents").length, 5, "count list objects");
		$(this).unbind("ajaxStop");
		$(this).ajaxStop(function(){
			equals($(list).valueForKey("contents")[1].name, "updated", "updated list item");
			$(this).unbind("ajaxStop");
			start();
		});
		list.update({id: 2, name: "updated"});
	});
	list = $.controller.array("list");
	ok(list, "list controller instantiated");
});

test("Test master-detail controllers", function(){
	expect(6);
	stop();
	var master = 0, detail;
	$("#test-list").ajaxStop(function(){
		$(this).unbind("ajaxStop");
		$(this).ajaxStop(function(){
			$(this).unbind("ajaxStop");
			$(this).ajaxStop(function(){
				$(this).unbind("ajaxStop");
				$(this).ajaxStop(function(){
					$(this).unbind("ajaxStop");
					equals($(detail).valueForKey("contents").length, 1, "still one detail on master reload");
					start();
				});
				equals($(detail).valueForKey("contents").length, 1, "selected master with one details");
				master.retrieve();
			});
			equals($(detail).valueForKey("contents").length, 0, "detail objects at start");
			$(master).valueForKey("selection", $(master).valueForKey("contents")[1]);
		});
		equals($(master).valueForKey("contents").length, 4, "count master objects");
		detail = $.controller.array("detail", {master: [master, "parent_id"]});
		ok(detail, "detail controller instantiated");
	});
	master = $.controller.array("master");
	ok(master, "master controller instantiated");
});

