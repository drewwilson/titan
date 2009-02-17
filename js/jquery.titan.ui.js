(function($){
	$.fn.rearrange = function(controller, options) {
		return $(this).each(function(){
			var items;
			var container = this;
			var user_update;
			if (options) {
				user_update = options.update;
			}
			$(this).sortable($.extend(options, {
				update: function(event, ui){
					items = $(container).sortable('option', 'items');
					$(container).find(items).each(function(idx){
						if (this === ui.item[0]) {
							controller.update({
								id: controller.contents[idx].id,
								position: $.fn.rearrange.offset + idx});
						}
					});
					if (user_update) {
						user_update(event, ui);
					}
				}
			}));
			$(this).sortable()
		});
	}
	$.fn.rearrange.offset = 0;
})(jQuery);
