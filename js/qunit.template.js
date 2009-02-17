module("template", {
	setup: function() {
		$.controller.defaults.url = "server/index.php";
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

test("Test template connected to a detail controller", function(){
	var master, detail;
	expect(3);
	stop();
	$("#main").ajaxStop(function(){
		$(this).unbind("ajaxStop");
		$(this).ajaxStop(function(){
			$(this).unbind("ajaxStop");
			equals($("#test-list span").length, 1, "master with 0 details");
			equals($("#test-list span").text(), "blah", "details name is 'blah'");
			start();
		});
		equals($("#test-list span").length, 0, "master with 0 details");
		$(master).valueForKey("selection", $(master).valueForKey("contents")[1]);
	});
	master = $.controller.array("master");
	detail = $.controller.array("detail", {master: [master, "parent_id"]});
	$("#test-list").template(detail);
});

test("Test template formatter", function(){
	expect(2);
	var master, detail;
	stop();
	$("#main").ajaxStop(function(){
		$(this).unbind("ajaxStop");
		$(this).ajaxStop(function(){
			$(this).unbind("ajaxStop");
			$("#test-list span").each(function(){
				equals($(this).text(), "blahcustom", "check custom formatter");
			});
			start();
		});
		equals($("#test-list span").length, 0, "master with 0 details");
		$(master).valueForKey("selection", $(master).valueForKey("contents")[1]);
	});
	master = $.controller.array("master");
	detail = $.controller.array("detail", {master: [master, "parent_id"]});
	$("#test-list span").format(function(elem, data){
		$(data).observe("name", function(){
			$(elem).text(data.valueForKey("name") + "custom");
		});
		$(elem).text($(data).valueForKey("name") + "custom");
		return true;
	});
	$("#test-list").template(detail);
});

test("Test complex template", function(){
	expect(7);
	stop();
	var complex;
	$("#main").ajaxStop(function(){
		$(this).unbind("ajaxStop");
		equals($("#test-complex div span").length, 6, "6 entries");
		$("#test-complex div span").each(function(){
			equals($(this).text(), "custom", "test complex custom formatter");
		})
		start();
	});
	$("#test-complex div span").format(function(elem,data){
		$(elem).text("custom");
	});
	complex = $.controller.array("complex");
	$("#test-complex").template(complex);
});

test("Test success callback", function(){
	expect(2);
	var list;
	stop();
	ok($("#main").template, "check template");
	$("#main").ajaxStop(function(){
		$(this).unbind("ajaxStop");
		start();
	});
	list = $.controller.array("list");
	$("#test-list").template(list, {success: function(){ok(true, "called callback");}});
});