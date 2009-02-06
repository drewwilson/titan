$(function(){
	$.controller.defaults.url = "server/";
	$("#test-list span").formatDate("F, jS, Y | g:i a", "date");

	list = $.controller.array("list");
	$("#test-list").template(list);
});
