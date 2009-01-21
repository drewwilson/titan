// KVC/KVO/Binding support
(function($){
	function makeChain(target, keys, fn, origTarget, origPath) {
		var key = keys.shift();
		if (keys.length > 0) {
			var nextTarget = $(target).attr(key);
			var reobserveOriginal = function(){
				$(origTarget).unobserve(origPath, fn);
				$(origTarget).observe(origPath, fn);
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
			return [];
		}
	}
	
	$.kvo = {
		propertyRevision: 0,
		bindings: {},
		encode: function(obj){
			if (typeof obj != "object" || obj.encode) {
				return obj;
			}
			return $.extend(obj, $.kvo);
		},
		valueForKey: function(key, value){
			if ($.isFunction(this[key])) {
				return this[key].call(this, key, value);
			} else {
				if (value !== undefined) {
					if (this[key] !== value) {
						var old = this[key];
						this[key] = value;
						this.propertyRevision++;
						$(this).trigger(key + "-changed", {oldValue: old, newValue: this[key]});
					}
				}
				
				return $.kvo.encode(this[key]);
			}
		},
		valueForKeyPath: function(path, value){
			var obj = this;
			var keys = path.split(".");
			var key;
			while(keys.length > 1) {
				key = keys.shift();
				obj = obj.valueForKey(key);
				if (obj === undefined) {
					return undefined;
				}
			}
			key = keys.shift();
			return obj.valueForKey(key, value);
		},
		observe: function(path, fn) {
			var keys = path.split(".");
			if (keys.length > 1) {
				var chainKey = path.replace(/\./g, "_");

				var chain = $(this).data(chainKey);

				if ( ! chain) {

					chain = $(this).data(chainKey, []);
				}
				chain[$.data(fn)] = makeChain(this, keys.slice(), fn, this, path);
			} else {
				$(this).bind(path+"-changed", fn);
			}
		},
		connect: function(attr, to, toAttr) {
			var from = this;
			var binding = {
				from: this,
				to: to,
				fromAttr: attr,
				toAttr: toAttr,
				lastToPropertyRevision: 0,
				lastFromPropertyRevision: 0
			};
			from.bindings[$.data(to) + toAttr] = binding;
			from.observe(attr, function(){
				if (from.propertyRevision <= binding.lastFromPropertyRevision) {
					return;
				}
				binding.lastFromPropertyRevision = from.propertyRevision;
				to.valueForKeyPath(toAttr, from.valueForKeyPath(attr));
			});
			to.observe(toAttr, function(){
				if (to.propertyRevision <= binding.lastToPropertyRevision) {
					return;
				}
				binding.lastToPropertyRevision = to.propertyRevision;
				from.valueForKeyPath(attr, to.valueForKeyPath(toAttr));
			});
			binding.lastToPropertyRevision = to.propertyRevision;
			binding.lastFromPropertyRevision = from.propertyRevision;
			from.valueForKeyPath(attr, to.valueForKeyPath(toAttr));
		}
	}
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
		array: function(root, options){
			if (this.constructor == $.controller.array) {
				var that = this;
				this.root = root;

				if (options) {
					this.options = options;
					if (options.master) {
						this.master = options.master[0];
						this.attr = options.master[1];
						if (this.master) {
							delete this.options.master;
							this.master.observe("selection", function(){
								that.retrieve();
							});
						}
					}
				}
				this.retrieve();
			} else {
				return $.kvo.encode(new $.controller.array(root, options));
			}
		},
		object:  function(){
			if (this.constructor == $.controller.object) {
			} else {
				return new $.controller.object();
			}
		}
	};
	$.extend($.controller.array.prototype, {
		root: "",
		create: function(obj) {
			var that = this;
			var data = {};
			data[that.root] = obj;
			$.ajax({
				url : $.controller.defaults.url,
				data : $.serialize(data),
				type : "POST",
				success : function(data) {
					that.retrieve();
				}
			});
		},
		destroy: function(id) {
			var that = this;
			var data = {};
			data[that.root] = {id: id};
			$.ajax({
				url : $.controller.defaults.url + "?" + $.serialize(data),
				type : "DELETE",
				success : function(data) {
					that.retrieve();
				}
			});
		},
		update: function(obj) {
			var that = this;
			var data = {};
			data[that.root] = obj;
			$.ajax({
				url : $.controller.defaults.url + "?" + $.serialize(data),
				contentType : "application/json",
				type : "PUT",
				success : function(data) {
					that.retrieve();
				}
			});
		},
		retrieve: function() {
			var that = this;
			var data = {};
			data[that.root] = that.options ? that.options : that.master ? {} : false;

			if (that.master) {
				var selection = that.master.valueForKey("selection");
				if (selection) {
					data[that.root][that.attr] = selection.valueForKey("id");
				} else {
					$.kvo.encode(that).valueForKey("contents", []);
					return;
				}
			}

			if (data[that.root]) {
				data = $.serialize(data);
			} else {
				data = that.root;
			}
			if ($.kvo.encode(that).valueForKey("selection")) {
				that._last_id = that.valueForKeyPath("selection.id");
			}
			$.ajax({
				url : $.controller.defaults.url,
				contentType : "application/json",
				dataType : "json",
				type : "GET",
				data: data,
				success : function(data) {
					var found = false;
					if (that._last_id) {
						$(data).each(function(){
							if (that._last_id  == this.id) {
								found = true;
								that.valueForKey("selection", this);
								return false;
							}
						});
					}
					if ( ! found && data.length > 0) {
						that.valueForKey("selection", data[0]);
					}
					that.valueForKey("contents", data);
				}
			});
		}
	});
})(jQuery);

// Template Support
(function($){
	$.template = {
		defaultRenderer: function(elem, data) {
			var classes = elem.className.split(/\s+/);
			for (var i = 0; i < classes.length; i++) {
				if (/^ti_/.test(classes[i])) {
					var curData = data[classes[i].replace(/^ti_/, "")];
					if (curData != undefined) {
						if (curData.constructor == Array) {
							var newElems = $.template.visitElements(
								elem,
								$.template.defaultRenderer,
								this);
							$(elem).empty().append(newElems);
							return false;
						} else {
							$(elem).text(curData);
							return true;
						}
					}
				}
			}
			return true;
		},
		visitElements: function(root, visitor, context){
			var func, start, current, next = null;
			current = start = $(root).cloneTemplate()[0];
			do {
				if (current.nodeType == 1) {
					func = $(current).data("format") || visitor;
					if (func(current, $.kvo.encode(context))) {
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
	}
	$.fn.cloneTemplate = function() {
		var ret = this.clone(false);
		var clone = ret.find("*").andSelf();
		this.find("*").andSelf().each(function(i){
			if (this.nodeType == 3)
				return;
			var format = $.data(this, "format");
			if (format) {
				$.data(clone[i], "format", format);
			}

		});
		return ret;
	}
	$.fn.template = function(controller, formatters){
		return this.each(function() {
			var that = this;
			var tpl = $(that).data("template");
			if ( ! tpl) {
				tpl = that.cloneNode(true);
				$(that).data("template", tpl);
				if (formatters) {
					$(formatters).each(function(){
						var format = this;
						for (var sel in format) {
							$(tpl).find(sel).each(function(){
								$(this).data("format", format[sel]);
							});
						}
					});
				}
			}
			function fn(){
				var data = controller.valueForKey("contents");
				$(that).empty();
				if (data && data.length > 0) {
					$(data).each(function(){
						$(that).append($.template.visitElements(tpl, $.template.defaultRenderer, this));
					});
				}
			}
			controller.observe("contents", function(){
				fn();
			});
			fn();
		});
	};
})(jQuery);
