/*
 ---

 name: Calendar

 script: calendar.js

 description: MUI.Calendar - A Javascript class for Mootools that adds accessible and unobtrusive date pickers to your form elements

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 note:
 Mootools 1.2 compatibility by Davorin Å ego
 Mootools 1.3 compatibility by Chris Doty
 Refactor to be MochaUI like - Chris Doty

 requires:
 - Core/Element
 - Core/Window
 - Core/Fx
 - Core/Events

 provides: [MUI.Calendar]

 ...
 */

MUI.Calendar = new NamedClass('MUI.Calendar', {

	Implements: [ Events, Options ],

	options: {
		//id:				null,	// id of input field to attach to,  if not found it will create a new text field
		//container:		null,	// the parent control in the document to add the control to
		//clearContainer:	false,	// should the control clear its parent container before it appends itself
		drawOnInit:		true,		// true to add tree to container when control is initialized
		cssClass:		'form',		// the form element/title css tag
		cssCalendar:	'calendar',	// the calendar css tag, added to the beginning of each css name
		cssClasses:		{},			// ['calendar', 'prev', 'next', 'month', 'year', 'today', 'invalid', 'valid', 'inactive', 'active', 'hover', 'hilite']

		format:			'd/m/Y',	// date format
		blocked:		[],			// dates are blocked
		hilited:		[],			// the dates to hilite on the calendar
		days:			['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], // days of the week starting at sunday
		direction:		0,			// -1 past, 0 past + future, 1 future
		draggable:		true,
		months:			['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		years:			null,		// array of valid years, if not an array it will ignore this and allow any year
		navigation:		1,			// 0 = no nav; 1 = single nav for month; 2 = dual nav for month and year
		offset:			0,			// first day of the week: 0 = sunday, 1 = monday, etc..
		tweak:			{x: 0, y: 0},// tweak calendar positioning

		//valueField:		false,	// defaults to the id on this field
		//formTitleField:	false,	// defaults to the id of this field
		//formData:			false,	// used in conjunction with the above Fields to get/set value in an object

		hasTitle:			true,
		//formTitle:		'',		// defaults to the id of this field
		//value:			'',		// current date in text form
		dvalue:			new Date()  // current date in date form

		// onHideStart: null,
		// onHideComplete: null,
		// onShowStart: null,
		// onShowComplete: null,
	},

	initialize: function(options){
		this.setOptions(options);
		this.el = {};
		options = this.options;

		// If calendar has no ID, give it one.
		this.id = options.id = options.id || 'calendar' + (++MUI.idCount);
		MUI.set(this.id, this);

		// create our classes array
		var keys = [options.cssCalendar, 'prev', 'next', 'month', 'year', 'today', 'invalid', 'valid', 'inactive', 'active', 'hover', 'hilite'];
		var values = keys.map(function(key, i){
			return (options.cssClasses[i] && options.cssClasses[i].length) ? options.cssClasses[i] : key;
		}, this);
		this._classes = values.associate(keys);

		this.isVisible = false;
		var d = new Date(); // today
		d.setDate(d.getDate() + options.direction.toInt()); // correct today for directional offset
		this._month = d.getMonth();
		this._year = d.getFullYear();

		if (options.drawOnInit) this.draw();
	},

	getFormTitle: function(){
		var o = this.options;
		if (o.formTitle) return o.formTitle;
		if (o.formTitleField) return MUI.getData(o.formData, o.formTitleField);
		if (o.formData) return MUI.getData(o.formData, o.id);
		return o.id;
	},

	draw: function(container){
		var o = this.options;
		if (!container) container = o.container;

		// look for a fieldset that contains the input field
		var isNew = false;
		var fs = o.element && o.element.nodeName == 'FIELDSET' ? o.element : $(o.id + '_field');
		if (!fs){  // create it, if it does not already exist
			fs = new Element('fieldset', {'id':o.id + '_field'});
			isNew = true;
		}
		this.el.element = fs.addClass(o.cssClass);

		var lbl = $(o.id + '_label');
		if (o.hasTitle){
			var tle = this.getFormTitle();
			lbl = new Element('label', {'id':o.id + '_label'}).inject(fs);
		} else {
			if (lbl){
				lbl.dispose();
				this.el.erase('label');
			}
		}
		if (lbl) this.el.label = lbl.set('text', tle).set('for', o.id);

		// see if we where given an input field instead
		var inp = o.element && o.element.nodeName == 'INPUT' ? o.element : $(o.id);
		if (!inp){  // create input field if none given
			inp = new Element('input', {'type':'input','id':o.id}).inject(fs);
		}
		this.el.input = inp.set('maxlength', 10).setStyle('width', o.width).addClass(o.cssClass);

		// determine value of input field
		var value = o.value;
		if (o.formData) value = MUI.getData(o.formData, (o.valueField ? o.valueField : o.id));	// get value from data if bound to a dataset
		if (!value) value = this.el.input.get('value');											// pull value from input field if we don't have one yet
		if (value && o.dvalue) value = this.format(o.dvalue, o.format);							// pull value from the data value field if we don't have one yet
		inp.set('value', value);																// set the value in the input field
		o.value = value;																		// remember the current value, so we can detect changes
		if (!o.dvalue && value) o.dvalue = this.unformat(value, o.format);						// turn string into data value

		// make sure input field is inside of the fieldset, only should happen if input field is created externally and we are attaching to it
		var parent = inp.getParent();
		if (parent && parent != fs){
			inp.dispose().inject(fs);
			fs.inject(parent);
		}

		if (inp.get('tag') == 'select'){ // select elements allow the user to manually set the date via select option
			inp.removeEvents('change').addEvent('change', function(){
				this._changed();
			}.bind(this));
		} else { // input (type text) elements restrict the user to only setting the date via the calendar
			inp.set('readonly', true);
			inp.removeEvents('focus').addEvent('focus', function(){
				this.toggle();
			}.bind(this));
		}

		this.el.button = $(o.id + '_button');
		if (!this.el.button){
			this.el.button = new Element('button', {'id':o.id + '_button', 'type': 'button', 'class':this._classes.calendar }).addEvent('click', function(){
				this.toggle();
			}.bind(this)).inject(inp, 'after');
		}

		this.el.calendar = $(o.id + '_calendar');
		if (!this.el.calendar){
			// create calendar element with css styles required for proper cal functioning
			this.el.calendar = new Element('div', {'id':o.id + '_calendar'}).inject(document.body);
		}
		this.el.calendar.setStyles({ left: '-1000px', opacity: 0, position: 'absolute', top: '-1000px', zIndex: 1000 })
				.addClass(this._classes.calendar)
				.empty();

		// iex 6 needs a transparent iframe underneath the calendar in order to not allow select elements to render through
		if (window.ie6){
			this.iframe = new Element('iframe', {
				'styles': { left: '-1000px', position: 'absolute', top: '-1000px', zIndex: 999 }
			}).inject(document.body);
			this.iframe.style.filter = 'progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=0)';
		}

		// initialize fade method
		this.fx = new Fx.Tween(this.el.calendar, {
			onStart: function(){
				if (this.el.calendar.getStyle('opacity') == 0){ // show
					if (window.ie6) this.iframe.setStyle('display', 'block');
					this.el.calendar.setStyles({'display':'block','visibility':'visible'});
					this.fireEvent('showStart', this);
				}
				else this.fireEvent('hideStart', this); // hide
			}.bind(this),
			onComplete: function(){
				if (this.el.calendar.getStyle('opacity') == 0){ // hidden
					this.el.calendar.setStyles({'display':'none','visibility':'hidden'});
					if (window.ie6) this.iframe.setStyle('display', 'none');
					this.fireEvent('hideComplete', this);
				}
				else this.fireEvent('showComplete', this); // shown
			}.bind(this)
		});

		// initialize drag method
		if (window.Drag && this.options.draggable){
			this.drag = new Drag.Move(this.el.calendar, {
				onDrag: function(){
					if (window.ie6) this.iframe.setStyles({ left: this.el.calendar.style.left, top: this.el.calendar.style.top });
				}.bind(this)
			});
		}

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (this.el.element.getParent() == null){
				if (o.clearContainer) container.empty();
				this.el.element.inject(container);
			}

			Object.append(this, this._bounds()); // abs bounds of calendar
			Object.append(this, this._values()); // valid days, months, years
			this._rebuild();
			return this;
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') return addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	},

	_blocked: function(){
		var self = this;
		var blocked = [];
		var offset = new Date(self._year, self._month, 1).getDay(); // day of the week (offset)
		var last = new Date(self._year, self._month + 1, 0).getDate(); // last day of this month

		Object.each(this.options.blocked, function(date){
			var values = date.split(' '),i;

			// preparation
			for (i = 0; i <= 3; i++){
				if (!values[i]){
					values[i] = (i == 3) ? '' : '*';
				} // make sure blocked date contains values for at least d, m and y
				values[i] = values[i].contains(',') ? values[i].split(',') : new Array(values[i]); // split multiple values
				var count = values[i].length - 1;
				for (var j = count; j >= 0; j--){
					if (values[i][j].contains('-')){ // a range
						var val = values[i][j].split('-');
						for (var k = val[0]; k <= val[1]; k++){
							if (!values[i].contains(k)) values[i].push(k + '');
						}
						values[i].splice(j, 1);
					}
				}
			}

			// execution
			if (values[2].contains(self._year + '') || values[2].contains('*')){
				if (values[1].contains(self._month + 1 + '') || values[1].contains('*')){
					values[0].each(function(val){ // if blocked value indicates this month / year
						if (val > 0) blocked.push(val.toInt()); // add date to blocked array
					});

					if (values[3]){ // optional value for day of week
						for (i = 0; i < last; i++){
							var day = (i + offset) % 7;
							if (values[3].contains(day + '')) blocked.push(i + 1); // add every date that corresponds to the blocked day of the week to the blocked array
						}
					}
				}
			}
		}, this);

		return blocked;
	},

	_bounds: function(){
		var o = this.options;
		var el = this.el.input;
		var d;
		// 1. first we assume the calendar has no bounds (or a thousand years in either direction)

		// by default the calendar will accept a millennium in either direction
		var start = new Date(1000, 0, 1); // jan 1, 1000
		var end = new Date(2999, 11, 31); // dec 31, 2999

		// 2. but if the cal is one directional we adjust accordingly
		var date = new Date().getDate() + o.direction.toInt();

		if (o.direction > 0){
			start = new Date();
			start.setDate(date);
		}

		if (o.direction < 0){
			end = new Date();
			end.setDate(date);
		}

		// 3. then we can further filter the limits by using the pre-existing values in the selects
		if (el.get('tag') == 'select'){
			if (el.format.test('(y|Y)')){ // search for a year select
				var years = [];

				el.getChildren().each(function(option){ // get options
					var values = this.unformat(option.dvalue, el.format);
					if (!years.contains(values[0])) years.push(values[0]); // add to years array
				}, this);

				years.sort(this._sort);

				if (years[0] > start.getFullYear()){
					d = new Date(years[0], start.getMonth() + 1, 0); // last day of new month
					if (start.getDate() > d.getDate()) start.setDate(d.getDate());
					start.setYear(years[0]);
				}

				if (years.getLast() < end.getFullYear()){
					d = new Date(years.getLast(), end.getMonth() + 1, 0); // last day of new month
					if (end.getDate() > d.getDate()) end.setDate(d.getDate());
					end.setYear(years.getLast());
				}
			}

			if (el.format.test('(F|m|M|n)')){ // search for a month select
				var months_start = [];
				var months_end = [];

				el.getChildren().each(function(option){ // get options
					var values = this.unformat(option.value, el.format);

					if (typeOf(values[0]) != 'number' || values[0] == years[0]){				 // if it's a year / month combo for curr year, or simply a month select
						if (!months_start.contains(values[1])) months_start.push(values[1]);	// add to months array
					}

					if (typeOf(values[0]) != 'number' || values[0] == years.getLast()){		 // if it's a year / month combo for curr year, or simply a month select
						if (!months_end.contains(values[1])) months_end.push(values[1]);		// add to months array
					}
				}, this);

				months_start.sort(this._sort);
				months_end.sort(this._sort);

				if (months_start[0] > start.getMonth()){
					d = new Date(start.getFullYear(), months_start[0] + 1, 0); // last day of new month
					if (start.getDate() > d.getDate()) start.setDate(d.getDate());
					start.setMonth(months_start[0]);
				}

				if (months_end.getLast() < end.getMonth()){
					d = new Date(start.getFullYear(), months_end.getLast() + 1, 0); // last day of new month
					if (end.getDate() > d.getDate()) end.setDate(d.getDate());
					end.setMonth(months_end.getLast());
				}
			}
		}

		return { 'start': start, 'end': end };
	},

	_caption: function(){
		var o = this.options;

		// start by assuming navigation is allowed
		var navigation = {
			prev: { 'month': true, 'year': true },
			next: { 'month': true, 'year': true }
		};

		// if we're in an out of bounds year
		if (this._year == this.start.getFullYear()){
			navigation.prev.year = false;
			if (this._month == this.start.getMonth() && o.navigation == 1){
				navigation.prev.month = false;
			}
		}
		if (this._year == this.end.getFullYear()){
			navigation.next.year = false;
			if (this._month == this.end.getMonth() && o.navigation == 1){
				navigation.next.month = false;
			}
		}

		// special case of improved navigation but months array with only 1 month we can disable all month navigation
		if (typeOf(o.months) == 'array'){
			if (o.months.length == 1 && o.navigation == 2){
				navigation.prev.month = navigation.next.month = false;
			}
		}

		var caption = new Element('caption');
		var prev = new Element('a').addClass(this._classes.prev).appendText('\x3c'); // <
		var next = new Element('a').addClass(this._classes.next).appendText('\x3e'); // >

		if (this.options.navigation == 2){
			var month = new Element('span').addClass(this._classes.month).inject(caption);
			if (navigation.prev.month){
				prev.clone().addEvent('click', function(){
					this.navigate('m', -1);
				}.bind(this)).inject(month);
			}

			month.adopt(new Element('span').appendText(this.options.months[this._month]));
			if (navigation.next.month){
				next.clone().addEvent('click', function(){
					this.navigate('m', 1);
				}.bind(this)).inject(month);
			}

			var year = new Element('span').addClass(this._classes.year).inject(caption);
			if (navigation.prev.year){
				prev.clone().addEvent('click', function(){
					this.navigate('y', -1);
				}.bind(this)).inject(year);
			}

			year.adopt(new Element('span').appendText(this._year));
			if (navigation.next.year){
				next.clone().addEvent('click', function(){
					this.navigate('y', 1);
				}.bind(this)).inject(year);
			}
		} else { // 1 or 0
			if (navigation.prev.month && this.options.navigation){
				prev.clone().addEvent('click', function(){
					this.navigate('m', -1);
				}.bind(this)).inject(caption);
			}

			caption.adopt(new Element('span').addClass(this._classes.month).appendText(this.options.months[this._month]));
			caption.adopt(new Element('span').addClass(this._classes.year).appendText(this._year));

			if (navigation.next.month && this.options.navigation){
				next.clone().addEvent('click', function(){
					this.navigate('m', 1);
				}.bind(this)).inject(caption);
			}
		}
		return caption;
	},

	_changed: function(){
		var o = this.options;
		o.value = this.read(); // update calendar val from inputs

		Object.append(this, this.values(o)); // update bounds - based on curr month

		this._rebuild(); 	// rebuild days select
		if (!o.value) return;	// in case the same date was clicked the cal has no set date we should exit

		if (o.dvalue.getDate() < o.days[0]) o.dvalue.setDate(o.days[0]);
		if (o.dvalue.getDate() > o.days.getLast()) o.dvalue.setDate(o.days.getLast());

		this.el.input.value = this.format(o.dvalue, o.format);
		if (this.isVisible) this.display();
	},

	_clicked: function(td, day){
		var o = this.options;
		o.dvalue = (this.value() == day) ? null : new Date(this._year, this._month, day); // set new value - if same then disable
		this.write();

		// ok - in the special case that it's all selects and there's always a date no matter what (at least as far as the form is concerned)
		// we can't let the calendar undo a date selection - it's just not possible!!
		if (!o.value) o.value = this.read();

		if (o.value){
			this.toggle(); // hide cal
			this.el.input.focus = true;
		} else { // remove active class and replace with valid
			td.addClass(this._classes.valid);
			td.removeClass(this._classes.active);
		}
	},

	display: function(){
		var o = this.options;
		var calendar = this.el.calendar;

		// 1. header and navigation
		calendar.empty(); // init div
		calendar.className = this._classes.calendar + ' ' + this.options.months[this._month].toLowerCase();
		var div = new Element('div').inject(calendar); // a wrapper div to help correct browser css problems with the caption element
		var table = new Element('table').inject(div).adopt(this._caption());

		// 2. day names
		var thead = new Element('thead').inject(table);
		var tr = new Element('tr').inject(thead);
		for (var i = 0; i <= 6; i++){
			var th = this.options.days[(i + this.options.offset) % 7];
			tr.adopt(new Element('th', { 'title': th }).appendText(th.substr(0, 1)));
		}

		// 3. day numbers
		var tbody = new Element('tbody').inject(table);
		tr = new Element('tr').inject(tbody);

		var d = new Date(this._year, this._month, 1);
		var offset = ((d.getDay() - this.options.offset) + 7) % 7; // day of the week (offset)
		var last = new Date(this._year, this._month + 1, 0).getDate(); // last day of this month
		var prev = new Date(this._year, this._month, 0).getDate(); // last day of previous month
		var active = this.value(); // active date (if set and within curr month)
		var valid = this.days; // valid days for curr month

		d = new Date();
		var today = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); // today obv

		for (i = 1; i < 43; i++){ // 1 to 42 (6 x 7 or 6 weeks)
			if ((i - 1) % 7 == 0)	tr = new Element('tr').inject(tbody);		// each week is it's own table row

			var td = new Element('td').inject(tr);
			var day = i - offset;
			var date = new Date(this._year, this._month, day);
			var cls = '';

			if (day === active) cls = this._classes.active;						// active
			else if (o.blocked.contains(day)) cls = this._classes.inactive;		// inactive
			else if (valid.contains(day)) cls = this._classes.valid;			// valid
			else if (day >= 1 && day <= last) cls = this._classes.invalid;		// invalid
			if (date.getTime() == today) cls = cls + ' ' + this._classes.today;	// today
			if (o.hilited.contains(day)) cls = cls + ' ' + this._classes.hilite;// hilite

			td.addClass(cls);

			if (valid.contains(day)){ // if it's a valid - clickable - day we add interaction
				td.setProperty('title', this.format(date, 'D M jS Y'));
				td.addEvents({
					'click': function(td, day){
						this._clicked(td, day);
					}.pass([td, day], this),
					'mouseover': function(td, cls){
						td.addClass(cls);
					}.pass([td, this._classes.hover]),
					'mouseout': function(td, cls){
						td.removeClass(cls);
					}.pass([td, this._classes.hover])
				});
			}

			// pad calendar with last days of prev month and first days of next month
			if (day < 1) day = prev + day;
			else if (day > last) day = day - last;

			td.appendText(day);
		}
	},

	format: function(date, format){
		var str = '';

		if (date){
			var j = date.getDate(); // 1 - 31
			var w = date.getDay(); // 0 - 6
			var l = this.options.days[w]; // Sunday - Saturday
			var n = date.getMonth() + 1; // 1 - 12
			var f = this.options.months[n - 1]; // January - December
			var y = date.getFullYear() + ''; // 19xx - 20xx

			for (var i = 0, len = format.length; i < len; i++){
				var cha = format.charAt(i); // format char

				switch (cha){
					// year cases
					case 'y': // xx - xx
						y = y.substr(2);
					case 'Y': // 19xx - 20xx
						str += y;
						break;

					// month cases
					case 'm': // 01 - 12
						if (n < 10) n = '0' + n;
					case 'n': // 1 - 12
						str += n;
						break;
					case 'M': // Jan - Dec
						f = f.substr(0, 3);
					case 'F': // January - December
						str += f;
						break;

					// day cases
					case 'd': // 01 - 31
						if (j < 10) j = '0' + j;
					case 'j': // 1 - 31
						str += j;
						break;
					case 'D': // Sun - Sat
						l = l.substr(0, 3);
					case 'l': // Sunday - Saturday
						str += l;
						break;
					case 'N': // 1 - 7
						w += 1;
					case 'w': // 0 - 6
						str += w;
						break;
					case 'S': // st, nd, rd or th (works well with j)
						if (j % 10 == 1 && j != '11') str += 'st';
						else if (j % 10 == 2 && j != '12') str += 'nd';
						else if (j % 10 == 3 && j != '13') str += 'rd';
						else str += 'th';
						break;
					default:
						str += cha;
				}
			}
		}

		return str; //  return format with values replaced
	},

	navigate: function(type, n){
		var i,o = this.options;
		switch (type){
			case 'm': // month
				if (typeOf(this.months) == 'array'){
					i = this.months.indexOf(this._month) + n;	// index of current month
					if (i < 0 || i == this.months.length){	 // out of range
						if (this.options.navigation == 1){	 // if type 1 nav we'll need to increment the year
							this.navigate('y', n);
						}
						i = (i < 0) ? this.months.length - 1 : 0;
					}
					this._month = this.months[i];
				}
				else {
					i = this._month + n;
					if (i < 0 || i == 12){
						if (this.options.navigation == 1) this.navigate('y', n);
						i = (i < 0) ? 11 : 0;
					}
					this._month = i;
				}
				break;
			case 'y': // year
				if (typeOf(o.years) == 'array'){
					i = o.years.indexOf(this._year) + n;
					this._year = this.years[i];
				}
				else this._year += n;
				break;
		}

		Object.append(this, this._values());
		if (typeOf(this.months) == 'array'){ // if the calendar has a months select
			i = this.months.indexOf(this._month); // and make sure the curr months exists for the new year
			if (i < 0) this._month = this.months[0]; // otherwise we'll reset the month
		}

		this.display();
	},

	read: function(){
		var arr = [null, null, null];
		var o = this.options;

		// returns an array which may contain empty values
		var values = this.unformat(o.value, o.format);
		values.each(function(val, i){
			if (typeOf(val) == 'number'){
				arr[i] = val;
			}
		});

		// we can update the cals month and year values
		if (typeOf(arr[0]) == 'number') this._year = arr[0];
		if (typeOf(arr[1]) == 'number') this._month = arr[1];

		var val = null;

		if (arr.every(function(i){
			return typeOf(i) == 'number';
		})){ // if valid date
			var last = new Date(arr[0], arr[1] + 1, 0).getDate(); // last day of month

			if (arr[2] > last){
				arr[2] = last;
			} // make sure we stay within the month (ex in case default day of select is 31 and month is feb)

			val = new Date(arr[0], arr[1], arr[2]);
		}

		return (o.value == val) ? null : val; // if new date matches old return null (same date clicked twice = disable)
	},

	_rebuild: function(){
		var self = this;
		var el = self.el.input;
		if (!el) return;

		if (el.get('tag') == 'select' && el.format.test('^(d|j)$')){ // special case for days-only select
			var d = this.value();

			if (!d){
				d = el.value.toInt();
			} // if the calendar doesn't have a set value, try to use value from select

			el.empty(); // initialize select

			this._days.each(function(day){
				// create an option element
				var option = new Element('option', {
					'selected': (d == day),
					'value': ((el.format == 'd' && day < 10) ? '0' + day : day)
				}).appendText(day).inject(el);
			}, this);
		}
	},

	_sort: function(a, b){
		return a - b;
	},

	toggle: function(){
		var calendar = this.el.calendar;
		var o = this.options;

		if (!this.fn){
			// hide cal on out-of-bounds click
			this.fn = function(e){
				var el = e.target;

				while (el != document.body && el.nodeType == 1){
					if (el == calendar || this.el.button == el){
						e.stop();
						return false;
					}
					else {
						el = el.parentNode;
					}
				}

				this.toggle();
			}.bind(this);
		}

		document.removeEvent('mousedown', this.fn); // always remove the current mousedown script first

		if (this.isVisible){ // simply hide curr cal
			this.isVisible = false;
			this.el.button.removeClass(this._classes.active); // active
			this.fx.start('opacity', 1, 0);
		}
		else { // otherwise show (may have to hide others)
			document.addEvent('mousedown', this.fn);
			this.isVisible = true;
			this.el.button.addClass(this._classes.active); // css c-icon-active

			var size = window.getScrollSize();
			var coord = this.el.button.getCoordinates();
			var x = coord.right + this.options.tweak.x;
			var y = coord.top + this.options.tweak.y;

			// make sure the calendar doesn't open off screen
			if (!calendar.coord) calendar.coord = calendar.getCoordinates();
			if (x + calendar.coord.width > size.x) x -= (x + calendar.coord.width - size.x);
			if (y + calendar.coord.height > size.y) y -= (y + calendar.coord.height - size.y);
			calendar.setStyles({ left: x + 'px', top: y + 'px' });

			if (window.ie6){
				this.iframe.setStyles({ height: calendar.coord.height + 'px', left: x + 'px', top: y + 'px', width: calendar.coord.width + 'px' });
			}

			this.display();
			this.fx.start('opacity', 0, 1);
		}
	},

	unformat: function(val, f){
		f = f.escapeRegExp();

		var re = {
			d: '([0-9]{2})',
			j: '([0-9]{1,2})',
			D: '(' + this.options.days.map(function(day){
				return day.substr(0, 3);
			}).join('|') + ')',
			l: '(' + this.options.days.join('|') + ')',
			S: '(st|nd|rd|th)',
			F: '(' + this.options.months.join('|') + ')',
			m: '([0-9]{2})',
			M: '(' + this.options.months.map(function(month){
				return month.substr(0, 3);
			}).join('|') + ')',
			n: '([0-9]{1,2})',
			Y: '([0-9]{4})',
			y: '([0-9]{2})'
		};

		var arr = []; // array of indexes
		var g = '';

		// convert our format string to regexp
		for (var i = 0; i < f.length; i++){
			var c = f.charAt(i);

			if (re[c]){
				arr.push(c);
				g += re[c];
			}
			else {
				g += c;
			}
		}

		// match against date
		var matches = val.match('^' + g + '$');

		var dates = new Array(3);

		if (matches){
			matches = matches.slice(1); // remove first match which is the date

			arr.each(function(c, i){
				i = matches[i];

				switch (c){
					// year cases
					case 'y':
						i = '19' + i; // 2 digit year assumes 19th century (same as JS)
					case 'Y':
						dates[0] = i.toInt();
						break;

					// month cases
					case 'F':
						i = i.substr(0, 3);
					case 'M':
						i = this.options.months.map(function(month){
							return month.substr(0, 3);
						}).indexOf(i) + 1;
					case 'm':
					case 'n':
						dates[1] = i.toInt() - 1;
						break;

					// day cases
					case 'd':
					case 'j':
						dates[2] = i.toInt();
						break;
				}
			}, this);
		}

		return dates;
	},

	value: function(){
		var o = this.options;
		return (o.dvalue && this._year == o.dvalue.getFullYear() && this._month == o.dvalue.getMonth()) ? o.dvalue.getDate() : null;
	},

	_values: function(){
		var years, months, days;
		var el = this.el.input;
		var self = this;

		if (el.get('tag') == 'select'){
			if (el.format.test('(y|Y)')){ // search for a year select
				years = [];

				el.getChildren().each(function(option){ // get options
					var values = this.unformat(option.value, el.format);

					if (!years.contains(values[0])){
						years.push(values[0]);
					} // add to years array
				}, this);

				years.sort(this._sort);
			}

			if (el.format.test('(F|m|M|n)')){ // search for a month select
				months = []; // 0 - 11 should be

				el.getChildren().each(function(option){ // get options
					var values = this.unformat(option.value, el.format);

					if (typeOf(values[0]) != 'number' || values[0] == self._year){ // if it's a year / month combo for curr year, or simply a month select
						if (!months.contains(values[1])){
							months.push(values[1]);
						} // add to months array
					}
				}, this);

				months.sort(this._sort);
			}

			if (el.format.test('(d|j)') && !el.format.test('^(d|j)$')){ // search for a day select, but NOT a days only select
				days = []; // 1 - 31

				el.getChildren().each(function(option){ // get options
					var values = this.unformat(option.value, el.format);

					// in the special case of days we dont want the value if its a days only select
					// otherwise that will screw up the options rebuilding
					// we will take the values if they are exact dates though
					if (values[0] == self._year && values[1] == self._month){
						if (!days.contains(values[2])){
							days.push(values[2]);
						} // add to days array
					}
				}, this);
			}
		}

		// we start with what would be the first and last days were there no restrictions
		var first = 1,i;
		var last = new Date(self._year, self._month + 1, 0).getDate(); // last day of the month

		// if we're in an out of bounds year
		if (self._year == self.start.getFullYear()){
			// in the special case of improved navigation but no months array, we'll need to construct one
			if (months == null && this.options.navigation == 2){
				months = [];

				for (i = 0; i < 12; i ++){
					if (i >= self.start.getMonth()){
						months.push(i);
					}
				}
			}

			// if we're in an out of bounds month
			if (self._month == self.start.getMonth()){
				first = self.start.getDate(); // first day equals day of bound
			}
		}
		if (self._year == self.end.getFullYear()){
			// in the special case of improved navigation but no months array, we'll need to construct one
			if (months == null && this.options.navigation == 2){
				months = [];

				for (i = 0; i < 12; i ++){
					if (i <= self.end.getMonth()){
						months.push(i);
					}
				}
			}

			if (self._month == self.end.getMonth()){
				last = self.end.getDate(); // last day equals day of bound
			}
		}

		// let's get our invalid days
		var blocked = this._blocked();

		// finally we can prepare all the valid days in a neat little array
		if (typeOf(days) == 'array'){ // somewhere there was a days select
			days = days.filter(function(day){
				if (day >= first && day <= last && !blocked.contains(day)){
					return day;
				}
			});
		}
		else { // no days select we'll need to construct a valid days array
			days = [];

			for (i = first; i <= last; i++){
				if (!blocked.contains(i)){
					days.push(i);
				}
			}
		}

		days.sort(this._sort); // sorting our days will give us first and last of month

		return { 'days': days, 'months': months, 'years': years };
	},

	write: function(){
		var o = this.options;
		this._rebuild();	 // in the case of options, we'll need to make sure we have the correct number of days available
		this.el.input.value = this.format(o.dvalue, o.format);
		o.value = this.el.input.value;
	}
});
