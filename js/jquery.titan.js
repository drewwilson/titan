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
		object:	 function(){
			if (this.constructor == $.controller.object) {
			} else {
				return new $.controller.object();
			}
		},
		create: function(model, obj, options){
			var that = this;
			var data = {};
			if (model) {
				data = obj;
				data = $.serialize(data);
			} else {
				data = obj;
			}
			$.ajax($.extend({
				url : $.controller.defaults.url + "/" + model,
				data : data,
				type : "POST"
			}, options));
		},
		destroy: function(model, id, options){
			var data = {};
			data = {id: id};
			$.ajax($.extend({
				url : $.controller.defaults.url + "/" + model + "?" + $.serialize(data),
				type : "DELETE"
			}, options));
		},
		update: function(model, obj, options){
			var data = {};
			data = obj;
			$.ajax($.extend({
				url : $.controller.defaults.url + "/" + model + "?" + $.serialize(data),
				contentType : "application/json",
				type : "PUT"
			}, options));
		},
		retrieve: function(model, conditions, options){
			var that = this;
			var data = {};
			if (conditions && conditions != {}) {
				data = $.serialize(conditions);
			}
			$.ajax($.extend({
				url : $.controller.defaults.url + "/" + model,
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
})(jQuery);

// Text template support
(function($){
	$.fillIn = function(obj, data) {
		obj = $.extend({}, obj);
		for(attr in obj) {
			if (obj[attr].constructor == Array) {
				$(obj[attr]).each(function(){
					obj[attr] = $.fillIn(obj[attr], data);
				});
			} else if (typeof obj[attr] == "object") {
				obj[attr] = $.fillIn(obj[attr], data);
			} else if (typeof obj[attr] == "string") {
				obj[attr] = obj[attr].replace(/{([^{}]*)}/g,
					function (tag, name) {
						var value = data[name];
						return typeof value === 'string' || typeof value === 'number' ? value : tag;
					}
				);
			}
		}
		return obj;
	}
})(jQuery);

// Format helpers
(function($){
	function date ( format, timestamp ) {
		// Format a local time/date
		// 
		// +	discuss at: http://kevin.vanzonneveld.net/techblog/article/javascript_equivalent_for_phps_date/
		// +	   version: 901.1301
		// +   original by: Carlos R. L. Rodrigues (http://www.jsfromhell.com)
		// +	  parts by: Peter-Paul Koch (http://www.quirksmode.org/js/beat.html)
		// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
		// +   improved by: MeEtc (http://yass.meetcweb.com)
		// +   improved by: Brad Touesnard
		// +   improved by: Tim Wiel
		// +   improved by: Bryan Elliott
		// +   improved by: Brett Zamir
		// +   improved by: David Randall
		// *	 example 1: date('H:m:s \\m \\i\\s \\m\\o\\n\\t\\h', 1062402400);
		// *	 returns 1: '09:09:40 m is month'
		// *	 example 2: date('F j, Y, g:i a', 1062462400);
		// *	 returns 2: 'September 2, 2003, 2:26 am'
		// *	 example 3: date('Y W o', 1062462400);
		// *	 returns 3: '2003 36 2003'
		// *	 example 4: x = date('Y m d', (new Date()).getTime()/1000); // 2009 01 09
		// *	 example 4: (x+'').length == 10
		// *	 returns 4: true

		var a, jsdate=(
			(typeof(timestamp) == 'undefined') ? new Date() : // Not provided
			(typeof(timestamp) == 'number') ? new Date(timestamp*1000) : // UNIX timestamp
			new Date(timestamp) // Javascript Date()
		);
		var pad = function(n, c){
			if( (n = n + "").length < c ) {
				return new Array(++c - n.length).join("0") + n;
			} else {
				return n;
			}
		};
		var txt_weekdays = ["Sunday","Monday","Tuesday","Wednesday",
			"Thursday","Friday","Saturday"];
		var txt_ordin = {1:"st",2:"nd",3:"rd",21:"st",22:"nd",23:"rd",31:"st"};
		var txt_months =  ["", "January", "February", "March", "April",
			"May", "June", "July", "August", "September", "October", "November",
			"December"];

		var f = {
			// Day
				d: function(){
					return pad(f.j(), 2);
				},
				D: function(){
					var t = f.l();
					return t.substr(0,3);
				},
				j: function(){
					return jsdate.getDate();
				},
				l: function(){
					return txt_weekdays[f.w()];
				},
				N: function(){
					return f.w() + 1;
				},
				S: function(){
					return txt_ordin[f.j()] ? txt_ordin[f.j()] : 'th';
				},
				w: function(){
					return jsdate.getDay();
				},
				z: function(){
					return (jsdate - new Date(jsdate.getFullYear() + "/1/1")) / 864e5 >> 0;
				},

			// Week
				W: function(){
					var a = f.z(), b = 364 + f.L() - a;
					var nd2, nd = (new Date(jsdate.getFullYear() + "/1/1").getDay() || 7) - 1;

					if(b <= 2 && ((jsdate.getDay() || 7) - 1) <= 2 - b){
						return 1;
					} else{

						if(a <= 2 && nd >= 4 && a >= (6 - nd)){
							nd2 = new Date(jsdate.getFullYear() - 1 + "/12/31");
							return date("W", Math.round(nd2.getTime()/1000));
						} else{
							return (1 + (nd <= 3 ? ((a + nd) / 7) : (a - (7 - nd)) / 7) >> 0);
						}
					}
				},

			// Month
				F: function(){
					return txt_months[f.n()];
				},
				m: function(){
					return pad(f.n(), 2);
				},
				M: function(){
					t = f.F(); return t.substr(0,3);
				},
				n: function(){
					return jsdate.getMonth() + 1;
				},
				t: function(){
					var n;
					if( (n = jsdate.getMonth() + 1) == 2 ){
						return 28 + f.L();
					} else{
						if( n & 1 && n < 8 || !(n & 1) && n > 7 ){
							return 31;
						} else{
							return 30;
						}
					}
				},

			// Year
				L: function(){
					var y = f.Y();
					return (!(y & 3) && (y % 1e2 || !(y % 4e2))) ? 1 : 0;
				},
				o: function(){
					if (f.n() === 12 && f.W() === 1) {
						return jsdate.getFullYear()+1;
					}
					if (f.n() === 1 && f.W() >= 52) {
						return jsdate.getFullYear()-1;
					}
					return jsdate.getFullYear();
				},
				Y: function(){
					return jsdate.getFullYear();
				},
				y: function(){
					return (jsdate.getFullYear() + "").slice(2);
				},

			// Time
				a: function(){
					return jsdate.getHours() > 11 ? "pm" : "am";
				},
				A: function(){
					return f.a().toUpperCase();
				},
				B: function(){
					// peter paul koch:
					var off = (jsdate.getTimezoneOffset() + 60)*60;
					var theSeconds = (jsdate.getHours() * 3600) +
									 (jsdate.getMinutes() * 60) +
									  jsdate.getSeconds() + off;
					var beat = Math.floor(theSeconds/86.4);
					if (beat > 1000) beat -= 1000;
					if (beat < 0) beat += 1000;
					if ((String(beat)).length == 1) beat = "00"+beat;
					if ((String(beat)).length == 2) beat = "0"+beat;
					return beat;
				},
				g: function(){
					return jsdate.getHours() % 12 || 12;
				},
				G: function(){
					return jsdate.getHours();
				},
				h: function(){
					return pad(f.g(), 2);
				},
				H: function(){
					return pad(jsdate.getHours(), 2);
				},
				i: function(){
					return pad(jsdate.getMinutes(), 2);
				},
				s: function(){
					return pad(jsdate.getSeconds(), 2);
				},
				u: function(){
					return pad(jsdate.getMilliseconds()*1000, 6);
				},

			// Timezone
				//e not supported yet
				I: function(){
					var DST = (new Date(jsdate.getFullYear(),6,1,0,0,0));
					DST = DST.getHours()-DST.getUTCHours();
					var ref = jsdate.getHours()-jsdate.getUTCHours();
					return ref != DST ? 1 : 0;
				},
				O: function(){
				   var t = pad(Math.abs(jsdate.getTimezoneOffset()/60*100), 4);
				   if (jsdate.getTimezoneOffset() > 0) t = "-" + t; else t = "+" + t;
				   return t;
				},
				P: function(){
					var O = f.O();
					return (O.substr(0, 3) + ":" + O.substr(3, 2));
				},
				//T not supported yet
				Z: function(){
				   var t = -jsdate.getTimezoneOffset()*60;
				   return t;
				},

			// Full Date/Time
				c: function(){
					return f.Y() + "-" + f.m() + "-" + f.d() + "T" + f.h() + ":" + f.i() + ":" + f.s() + f.P();
				},
				r: function(){
					return f.D()+', '+f.d()+' '+f.M()+' '+f.Y()+' '+f.H()+':'+f.i()+':'+f.s()+' '+f.O();
				},
				U: function(){
					return Math.round(jsdate.getTime()/1000);
				}
		};

		return format.replace(/[\\]?([a-zA-Z])/g, function(t, s){
			if( t!=s ){
				// escaped
				ret = s;
			} else if( f[s] ){
				// a date function exists
				ret = f[s]();
			} else{
				// nothing special
				ret = s;
			}

			return ret;
		});
	}// }}}
	
	$.formatDate = function(format, prop) {
		return function(elem, data){
			var ca = $(data).valueForKey(prop);
			var m = ca.match(/(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d)/);
			var t = new Date(m[1], m[2]-1, m[3], m[4], m[5], m[6]).getTime()*0.001;
			$(elem).text(date(format, t));
		}
	}
	
	$.fn.formatDate = function(format, prop) {
		return $(this).format($.formatDate(format, prop));
	}

	function number_format( number, decimals, dec_point, thousands_sep ) {
		// http://kevin.vanzonneveld.net
		// +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
		// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
		// +     bugfix by: Michael White (http://getsprink.com)
		// +     bugfix by: Benjamin Lupton
		// +     bugfix by: Allan Jensen (http://www.winternet.no)
		// +    revised by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
		// +     bugfix by: Howard Yeend
		// +    revised by: Luke Smith (http://lucassmith.name)
		// +     bugfix by: Diogo Resende
		// *     example 1: number_format(1234.56);
		// *     returns 1: '1,235'
		// *     example 2: number_format(1234.56, 2, ',', ' ');
		// *     returns 2: '1 234,56'
		// *     example 3: number_format(1234.5678, 2, '.', '');
		// *     returns 3: '1234.57'
		// *     example 4: number_format(67, 2, ',', '.');
		// *     returns 4: '67,00'
 
		var n = number, prec = decimals, dec = dec_point, sep = thousands_sep;
		n = !isFinite(+n) ? 0 : +n;
		prec = !isFinite(+prec) ? 0 : Math.abs(prec);
		sep = sep == undefined ? ',' : sep;
 
		var s = n.toFixed(prec),
			abs = Math.abs(n).toFixed(prec),
			_, i;
 
		if (abs > 1000) {
			_ = abs.split(/\D/);
			i = _[0].length % 3 || 3;

			_[0] = s.slice(0,i + (n < 0)) +
				_[0].slice(i).replace(/(\d{3})/g, sep+'$1');

			s = _.join(dec || '.');
		} else {
			s = abs.replace('.', dec_point);
		}
 
		return s;
	}

	$.fn.formatNumber = function(number, options) {
		var defaults = {
			decimals: 0,
			dec_point: ".",
			thousands_sep: ""
		};
		var opts = $.extend(defaults, options);
		return $(this).format(function(elem, data){
			var val = $(data).valueForKey(number);
			decimals = opts.decimals;
			dec_point = opts.dec_point;
			thousands_sep = opts.thousands_sep;
			$(elem).text(number_format(val, decimals, dec_point, thousands_sep));
		});
	}

	$.fn.formatLink = function(text, href, options) {
		var defaults = {
			title: "",
			class_name: "",
			target: ""
		};
		return $(this).format(function(elem, data){
			var opts = $.extend(defaults, {text: text, href: href}, options);
			opts = $.fillIn(opts, data);
			$(elem).text(opts.text);
			$(elem).attr("href", opts.href);
			if (opts.title != ""){
				$(elem).attr("title", opts.title);
			}
			if (opts.class_name != ""){
				$(elem).addClass(opts.class_name);
			}
			if (opts.target != ""){
				$(elem).attr("target", opts.target);
			}
		});
	}

	$.fn.formatForm = function(controller, options){
		return $(this).format(function(elem, data){
			$(elem).submit(function(event){
				event.preventDefault();
				var data = $(elem).serialize();
				if (options) {
					data = data + "&" + $.serialize(options);
				}
				$.controller.create(false, data, {
					success: function(){
						controller.retrieve();
					}
				});
			});
		});
	}
})(jQuery);
