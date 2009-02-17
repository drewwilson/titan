$(function(){
	$.controller.defaults.url = "server/index.php";
	var list = $.controller.array("list");
	$("ul").template(list);
	$("ul").rearrange(list);
});
