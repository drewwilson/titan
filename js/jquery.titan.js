// KVC/KVO/Binding support
(function($){
	function makeChain(target, keys, fn, origTarget, origPath) {
		var key = keys.shift();
		if (keys.length > 0) {
			var nextTarget = $(target).attr(key);
			var reobserveOriginal = function(){
				$(origTarget).unobserve(origPath, fn);
				$(origTarget).observe(origPath, fn);
				fn();
			};
			var undoChainLink = function(){
				$(target).unbind(key+"-changed", reobserveOriginal);
			};
			if (nextTarget) {
				$(target).bind(key+"-changed", reobserveOriginal);
				return [undoChainLink].concat(makeChain(nextTarget, keys, fn, origTarget, origPath));
			}
		} else {
			$(target).bind(key+"-changed", fn);
		}
		return [];
	}
	
	$.extend({
		valueForKey: function(obj, key, value){
			if ($.isFunction(obj[key])) {
				return obj[key].call(obj, key, value);
			} else {
				if (value !== undefined) {
					if (obj[key] !== value) {
						var old = obj[key];
						obj[key] = value;
						$(obj).data("propertyRevision", $(obj).data("propertyRevision")+1);
						$(obj).trigger(key + "-changed", {
							oldValue: old,
							newValue: obj[key]});
					}
				}
				return obj[key];
			}
		},
		valueForKeyPath: function(obj, path, value){
			var keys = path.split(".");
			var key;
			while(keys.length > 1) {
				key = keys.shift();
				obj = $(obj).valueForKey(key);
				if (obj === undefined) {
					return undefined;
				}
			}
			key = keys.shift();
			return $(obj).valueForKey(key, value);
		},
		observe: function(obj, path, fn) {
			var keys = path.split(".");
			var chainKey = path.replace(/\./g, "_");
			chain = $(obj).data(chainKey, {});
			if (keys.length > 1) {
				var chain = $(obj).data(chainKey);
				var tmp = makeChain(obj, keys.slice(), fn, obj, path);
				chain[$.data(fn)] = tmp;
			} else {
				$(obj).bind(path+"-changed", fn);
			}
			return fn;
		},
		unobserve: function(obj, path, fn) {
			var keys = path.split(".");
			if (keys.length > 1) {
				var chainKey = path.replace(/\./g, "_");
				var chain = $(obj).data(chainKey);
				$(chain[$.data(fn)]).each(function(){
					this();
				});
			} else {
				$(obj).unbind(path+"-changed", fn);
			}
			return fn;
		},
		connect: function(from, fromAttr, to, toAttr) {
			var binding = {
				from: from,
				to: to,
				fromAttr: fromAttr,
				toAttr: toAttr,
				lastToPropertyRevision: 0,
				lastFromPropertyRevision: 0
			};
			$(from).data(fromAttr + $.data(to) + toAttr, binding);
			binding.fromFn = $(from).observe(fromAttr, function(){
				if (from.propertyRevision <= binding.lastFromPropertyRevision) {
					return;
				}
				binding.lastFromPropertyRevision = $(from).data("propertyRevision");
				$(to).valueForKeyPath(toAttr, $(from).valueForKeyPath(fromAttr));
			});
			binding.toFn = $(to).observe(toAttr, function(){
				if ($(to).propertyRevision <= binding.lastToPropertyRevision) {
					return;
				}
				binding.lastToPropertyRevision = $(to).data("propertyRevision");
				$(from).valueForKeyPath(fromAttr, $(to).valueForKeyPath(toAttr));
			});
			binding.lastToPropertyRevision = $(to).data("propertyRevision");
			binding.lastFromPropertyRevision = $(from).data("propertyRevision");
			$(from).valueForKeyPath(fromAttr, $(to).valueForKeyPath(toAttr));
		},
		disconnect: function(obj, fromAttr, to, toAttr) {
			var binding = $(obj).data(fromAttr + $.data(to) + toAttr);
			binding.to.unobserve(toAttr, binding.toFn);
			binding.from.unobserve(fromAttr, binding.fromFn);
		}
	});
	$.fn.extend({
		valueForKey: function(key, value){
			if (value === undefined) {
				return $.valueForKey(this[0], key);
			}
			return this.each(function(){
				$.valueForKey(this, key, value);
			});
		},
		valueForKeyPath: function(path, value){
			if (value === undefined) {
				return $.valueForKeyPath(this[0], path);
			}
			return this.each(function(){
				$.valueForKeyPath(this, path, value);
			});
		},
		observe: function(path, fn) {
			return this.each(function(){
				$.observe(this, path, fn);
			});
		},
		unobserve: function(path, fn) {
			return this.each(function(){
				$.unobserve(this, path, fn);
			});
		},
		connect: function(attr, to, toAttr) {
			return this.each(function(){
				$.connect(this, attr, to, toAttr);
			});
		},
		disconnect: function(attr, to, toAttr) {
			return this.each(function(){
				$.disconnect(this, attr, to, toAttr);
			});
		}
		
	});
})(jQuery);

//Recursive encodeURIComponent
(function($){
	$.serialize = function(object){
		var values = []; 
		var prefix = '';
		values = $.serialize.recursive_serialize(object, values, prefix);
		param_string = values.join('&');
		return param_string;
	};
	$.serialize.recursive_serialize = function(object, values, prefix){
		for (key in object) {
			if (typeof object[key] == 'object') {
				if (prefix.length > 0) {
					prefix += '['+key+']';
				} else {
					prefix += key;
				}
				values = $.serialize.recursive_serialize(object[key], values, prefix);
				prefixes = prefix.split('[');
				if (prefixes.length > 1) {
					prefix = prefixes.slice(0,prefixes.length-1).join('[');
				} else {
					prefix = prefixes[0];
				}
			} else {
				value = encodeURIComponent(object[key]);
				if (prefix.length > 0) {
					prefixed_key = prefix+'['+key+']';
				} else {
					prefixed_key = key;
				}
				prefixed_key = encodeURIComponent(prefixed_key);
				if (value) values.push(prefixed_key + '=' + value);
			}
		}
		return values;
	};
})(jQuery);

// Controller Support
(function($){
	$.controller = {
		defaults: {},
		array: function(model, conditions){
			if (this.constructor == $.controller.array) {
				var that = this;
				this.model = model;

				if (conditions) {
					this.conditions = conditions;
					if (conditions.master) {
						this.master = conditions.master[0];
						this.attr = conditions.master[1];
						if (this.master) {
							delete this.conditions.master;
							$(this.master).observe("selection", function(){
								that.retrieve();
							});
						}
					}
				}
				this.retrieve();
			} else {
				return new $.controller.array(model, conditions);
			}
		},
		object:  function(){
			if (this.constructor == $.controller.object) {
			} else {
				return new $.controller.object();
			}
		},
		create: function(model, obj, options){
			var that = this;
			var data = {};
			data[model] = obj;
			$.ajax($.extend({
				url : $.controller.defaults.url,
				data : $.serialize(data),
				type : "POST"
			}, options));
		},
		destroy: function(model, id, options){
			var data = {};
			data[model] = {id: id};
			$.ajax($.extend({
				url : $.controller.defaults.url + "?" + $.serialize(data),
				type : "DELETE"
			}, options));
		},
		update: function(model, obj, options){
			var data = {};
			data[model] = obj;
			$.ajax($.extend({
				url : $.controller.defaults.url + "?" + $.serialize(data),
				contentType : "application/json",
				type : "PUT"
			}, options));
		},
		retrieve: function(model, conditions, options){
			var that = this;
			var data = {};
			if (conditions && conditions != {}) {
				data[model] = conditions;
				data = $.serialize(data);
				if (data == "") {
					data = model;
				}
			}
			$.ajax($.extend({
				url : $.controller.defaults.url,
				contentType : "application/json",
				dataType : "json",
				type : "GET",
				data: data
			}, options));
		}
	};
	$.extend($.controller.array.prototype, {
		root: "",
		create: function(obj) {
			var that = this;
			$.controller.create(that.model, obj, {
				success:function(data) {
					that.retrieve();
				}
			});
		},
		destroy: function(id) {
			var that = this;
			$.controller.destroy(that.model, id, {
				success : function(data) {
					that.retrieve();
				}
			});
		},
		update: function(obj) {
			var that = this;
			$.controller.update(that.model, obj, {
				success : function(data) {
					that.retrieve();
				}
			});
		},
		retrieve: function() {
			var that = this;
			var conditions = {};

			if (that.master) {
				var selection = $(that.master).valueForKey("selection");
				if (selection) {
					conditions[that.attr] = $(selection).valueForKey("id");
				} else {
					$(that).valueForKey("contents", []);
					return;
				}
			}
			if ($(that).valueForKey("selection") !== undefined) {
				that._last_id = $(that).valueForKeyPath("selection.id");
			}
			$.controller.retrieve(that.model, $.extend(conditions, this.conditions), {
				success : function(data) {
					var found = false;
					if (that._last_id) {
						$(data).each(function(){
							if (that._last_id  == this.id) {
								found = true;
								$(that).valueForKey("selection", this);
								return false;
							}
						});
					}
					if ( ! found && data.length > 0) {
						$(that).valueForKey("selection", data[0]);
					}
					$(that).valueForKey("contents", data);
				}
			});
		}
	});
})(jQuery);

// Template Support
(function($){
	$.template = function(root, controller) {
		var tpl = this;
		tpl.root = root;
		tpl.pristine = $(root).cloneTemplate(false)[0];
		tpl.contents = [];
		tpl.controller = controller;
		$(tpl).observe("contents", function(){
			tpl.render();
		});
		$(this).connect("contents", controller, "contents");
	}
	$.template.defaultRender = function(elem, data) {
		if ($(elem).data("format")) {
			return $(elem).data("format").call(this, elem, data);
		} else {
			var classes = elem.className.split(/\s+/);
			for (var i = 0; i < classes.length; i++) {
				if (/^ti_/.test(classes[i])) {
					var curData = data[classes[i].replace(/^ti_/, "")];
					if (curData != undefined) {
						if (curData.constructor == Array) {
							var tmp = $("<div></div>");
							$(curData).each(function(){
								$(tmp).append(
									$.visit(
										$(elem).cloneTemplate(false)[0],
										this,
										$.template.defaultRender));
							});
							$(elem).empty();
							$(elem).append($(tmp).contents());
							return false;
						} else {
							$(elem).text(curData);
							return true;
						}
					}
				}
			}
			return true;
		}
	},
	$.template.prototype = {
		deactivate: function(root){
			if (this.children) {
				$(this.children).each(function(){
					this.deactivate(false);
				});
			}
			if ( ! root) {
				$(this).disconnect("contents", this.controller, "contents");
				delete this.controller;
			}
		},
		render: function(){
			var tpl = this;
			var contents = $(tpl).valueForKey("contents");
			if (contents) {
				$(tpl.root).empty();
				$(contents).each(function(i){
					$(tpl.root).append($.visit(
						$(tpl.pristine).cloneTemplate(false)[0],
						this,
						$.template.defaultRender));
				});
			}
		}
	}
	$.visit = function(root, data, fn){
		var func, start, current, next = null;
		current = start = root;
		do {
			if (current.nodeType == 1) {
				if (fn.call(this, current, data)) {
					next = current.firstChild || current.nextSibling;
				} else {
					next = current.nextSibling;
				}
			} else {
				next = current.firstChild || current.nextSibling;
			}
			var tmp = current;
			if ( ! next) {
				var tmp = current;
				do {
					next = tmp.parentNode || start;
					if (next == start) break;
					tmp = next;
					next = next.nextSibling;
				} while ( ! next);
			}
			current = next;
		} while (current != start);
		return $(start).contents();
	}
	
	$.fn.cloneTemplate = function(events){
		var ret = $(this).clone(events);
		var clone = ret.find("*").andSelf();
		$(this).find("*").andSelf().each(function(i){
			if (this.nodeType == 3)
				return;
			var format = $.data(this, "format");
			if (format) {
				$.data(clone[i], "format", format);
			}
		});
		return ret;
	}
	$.fn.format = function(fn) {
		return $(this).data("format", fn);
	}
	$.fn.template = function(controller){
		return this.each(function(){
			$(this).data("template", new $.template(this, controller))
		});
	}
})(jQuery)
