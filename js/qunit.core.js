module("core");

test("Basic requirements", function(){
	ok($.controller.array, "$.controller.array");
	ok($.controller.object, "$.controller.array");
	ok($.controller.defaults, "$.controller.defaults");
});
