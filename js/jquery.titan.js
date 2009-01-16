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

// Controller Support
(function($){
	$.controller = {
		defaults: {},
		array: function(root){
			if (this.constructor == $.controller.array) {
				var that = this;
				$.ajax({
					url : $.controller.defaults.url,
					contentType : "application/json",
					dataType : "json",
					type : "GET",
					data: root,
					success : function(data) {
						that.valueForKey("contents", data);
					}
				});
			} else {
				return $.kvo.encode(new $.controller.array(root));
			}
		},
		object:  function(){
			if (this.constructor == $.controller.object) {
			} else {
				return new $.controller.object();
			}
		}
	};
})(jQuery);
