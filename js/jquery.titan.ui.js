(function($){
	$.fn.rearrange = function(controller, options) {
		return $(this).each(function(){
			var items;
			var container = this;
			var user_update;
			if (typeof controller == "string") {
				return $(this).sortable(controller, options);
			}
			if (options) {
				user_update = options.update;
			}
			$(this).sortable($.extend(options, {
				update: function(event, ui){
					items = $(container).sortable('option', 'items');
					$(container).find(items).each(function(idx){
						if (this === ui.item[0]) {
							
							controller.update({
								id: $(this).data("data").id,
								position: $.fn.rearrange.offset + idx});
						}
					});
					if (user_update) {
						user_update(event, ui);
					}
				}
			}));

		});
	}
	$.fn.rearrange.offset = 0;
})(jQuery);
