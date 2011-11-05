/**
 * CoolClock 2.1.4
 * Copyright 2010, Simon Baird
 * Released under the BSD License.
 *
 * Display an analog clock using canvas.
 * http://randomibis.com/coolclock/
 *
 */

// Constructor for CoolClock objects
window.CoolClock = function(options) {
	return this.init(options);
};
CoolClock.config = CoolClock.config || {};

// Config contains some defaults, and clock skins
Object.each({
	defaultRadius: 75,    // The ACTUAL radius at which the clock will be SHOWN ON SCREEN; the ratio of this one and 'renderRadius' determines the scaling applied to the skin.
	renderRadius: 100,    // the radius at which all elements are rendered, i.e. the radius assumed by all the skins. Keep at 100.
	defaultSkin: "chunkySwiss",

	skins:  {
		// There are more skins in moreskins.js
		// Try making your own skin by copy/pasting one of these and tweaking it
		swissRail: {
			/*
			 NOTES:
				- 'alpha' affects both color AND fillColor application since v2.x

				- when a skin item has the fillColor specified, the 'color' value
				  remains unused as only the fill is drawn (the border is not drawn then!)

				- radius and other sizes are all based on the 'renderRadius' norm (default: 100); the
				  instance's 'displayRadius' determines how large a clock the user gets to see.
			*/
			outerBorder:      { lineWidth: 2, radius:95, color: "black", alpha: 1 },
			smallIndicator:   { lineWidth: 2, startAt: 88, endAt: 92, color: "black", alpha: 1 },
			largeIndicator:   { lineWidth: 4, startAt: 79, endAt: 92, color: "black", alpha: 1 },
			hourHand:         { lineWidth: 8, startAt: -15, endAt: 50, color: "black", alpha: 1 },
			minuteHand:       { lineWidth: 7, startAt: -15, endAt: 75, color: "black", alpha: 1 },
			secondHand:       { lineWidth: 1, startAt: -20, endAt: 85, color: "red", alpha: 1 },
			secondDecoration: { lineWidth: 1, startAt: 70, radius: 4, fillColor: "red", color: "red", alpha: 1 },
			/* set .showDigitalSeconds to 'false' instead of this two-element array when you want 24 hours display */
			digital:          { fillColor: 'black', font: '15px sans-serif', showDigitalSeconds: false, AmPm: [' AM', ' PM'] }
		},
		chunkySwiss: {
			outerBorder:      { lineWidth: 4, radius:97, color: "black", alpha: 1 },
			smallIndicator:   { lineWidth: 4, startAt: 89, endAt: 93, color: "black", alpha: 1 },
			largeIndicator:   { lineWidth: 8, startAt: 80, endAt: 93, color: "black", alpha: 1 },
			hourHand:         { lineWidth: 12, startAt: -15, endAt: 60, color: "black", alpha: 1 },
			minuteHand:       { lineWidth: 10, startAt: -15, endAt: 85, color: "black", alpha: 1 },
			secondHand:       { lineWidth: 4, startAt: -20, endAt: 85, color: "red", alpha: 1 },
			secondDecoration: { lineWidth: 2, startAt: 70, radius: 8, fillColor: "red", color: "red", alpha: 1 },
			digital:          { fillColor: 'black', font: '15px sans-serif', showDigitalSeconds: false, AmPm: [' AM', ' PM'] }
		},
		chunkySwissOnBlack: {
			outerBorder:      { lineWidth: 4, radius:97, color: "white", alpha: 1 },
			smallIndicator:   { lineWidth: 4, startAt: 89, endAt: 93, color: "white", alpha: 1 },
			largeIndicator:   { lineWidth: 8, startAt: 80, endAt: 93, color: "white", alpha: 1 },
			hourHand:         { lineWidth: 12, startAt: -15, endAt: 60, color: "white", alpha: 1 },
			minuteHand:       { lineWidth: 10, startAt: -15, endAt: 85, color: "white", alpha: 1 },
			secondHand:       { lineWidth: 4, startAt: -20, endAt: 85, color: "red", alpha: 1 },
			secondDecoration: { lineWidth: 2, startAt: 70, radius: 8, fillColor: "red", color: "red", alpha: 1 },
			digital:          { fillColor: 'white', font: '15px sans-serif', showDigitalSeconds: false, AmPm: [' AM', ' PM'] }
		}
	},

	// Test for IE so we can nurse excanvas in a couple of places
	isIE: (!!document.all && typeof G_vmlCanvasManager === 'object' && G_vmlCanvasManager.initElement),

	// Will store (a reference to) each clock here, indexed by the id of the canvas element
	clockTracker: {},

	// For giving a unique id to coolclock canvases with no id
	noIdCount: 0,

	// the clock interval timer: common for all clocks
	tickInterval: null
}, function(item,key) {
	if(key != 'skins') {
		CoolClock.config[key]=item;
	}
});

// Define the CoolClock object's methods
CoolClock.prototype = {

	// Initialise using the parameters parsed from the colon delimited class
	init: function(options) {
		// Parse and store the options
		this.canvasId       = options.canvasId;
		this.skinId         = options.skinId || CoolClock.config.defaultSkin;
		this.displayRadius  = options.displayRadius || CoolClock.config.defaultRadius;
		this.showSecondHand = typeof options.showSecondHand === "boolean" ? options.showSecondHand : true;
		this.smoothMinutesHand = typeof options.smoothMinutesHand === "boolean" ? options.smoothMinutesHand : false;
		this.gmtOffset      = (options.gmtOffset != null && options.gmtOffset !== '') ? parseFloat(options.gmtOffset) : null;
		this.showDigital    = typeof options.showDigital === "boolean" ? options.showDigital : false;
		this.logClock       = typeof options.logClock === "boolean" ? options.logClock : false;
		this.logClockRev    = typeof options.logClock === "boolean" ? options.logClockRev : false;
		this.showAmPm       = typeof options.showAmPm === "boolean" ? options.showAmPm : true;
		this.showDigitalSeconds = typeof options.showDigitalSeconds === "boolean" ? options.showDigitalSeconds : true;
		this.renderDigitalOffsetX = 0;
		this.renderDigitalOffsetY = 0;
		this.fetchCurrentTime = typeof options.fetchCurrentTime === "function" ? options.fetchCurrentTime : function() {
			return new Date();
		};

		this.lastDrawnState = false;

		// Dynamically initialize canvas using excanvas. This is only required by IE
		if (CoolClock.config.isIE)
		{
			G_vmlCanvasManager.initElement(cv);
		}

		// Get the canvas element
		this.canvas = document.getElementById(this.canvasId);

		// Make the canvas the requested size. It's always square.
		this.canvas.setAttribute("width",this.displayRadius*2);
		this.canvas.setAttribute("height",this.displayRadius*2);
		this.canvas.style.width = this.displayRadius*2 + "px";
		this.canvas.style.height = this.displayRadius*2 + "px";

		// Explain me please...?
		this.renderRadius = CoolClock.config.renderRadius;
		this.scale = this.displayRadius / this.renderRadius;

		// Initialise canvas context
		this.ctx = this.canvas.getContext("2d");
		this.ctx.scale(this.scale,this.scale);

		// Keep track of this object
		CoolClock.config.clockTracker[this.canvasId] = this;

		// should we be running the clock?
		this.active = true;

		// Start the clock going
		if (!CoolClock.config.tickInterval) {
			CoolClock.config.tickInterval = setInterval(function() {
				// for each clock, fire the redraw/render code at least ten times as fast as we do expect visual change:
				// the render optimization will take of that, while we ensure a superb visual result over time
				// (less frequest render attempts result in a visual 'jitter' of the second hand, for one)
				for (var key in CoolClock.config.clockTracker)
				{
					var cc = CoolClock.config.clockTracker[key];
					// skip anything in there that's not a clock:
					if (!cc || !cc.tick)
						continue;

					cc.tick();
				}
			}, 100);
		}
		this.tick();

		return this;
	},

	// Draw a circle at point x,y with params as defined in skin
	fullCircleAt: function(x,y,skin) {
		var lineWidth = skin.lineWidth;                 // [i_a] keep track of lineWidth ourselves; FF4 mutates the value in the .ctx.lineWidth!
		this.ctx.save();
		this.ctx.globalAlpha = skin.alpha;
		this.ctx.lineWidth = lineWidth;

		if (!CoolClock.config.isIE) {
			this.ctx.beginPath();
		}

		if (CoolClock.config.isIE) {
			// excanvas doesn't scale line width so we will do it here
			this.ctx.lineWidth = lineWidth * this.scale;
		}

		this.ctx.arc(x, y, skin.radius, 2*Math.PI, 0, true);

		// prevent FF4 from yakking about canvas: "an attempt to set strokeStyle or fillStyle to a value that is neither a string, a CanvasGradient, or a CanvasPattern was ignored."
		//
		// also prevent FF4 from drawing strokes of /intended/ lineWidth==0 as (mutated by FF4 in .ctx.lineWidth) lineWidth==1
		if (skin.fillColor && skin.color && lineWidth > 0) {
			this.ctx.fillStyle = skin.fillColor;
			this.ctx.fill();
			this.ctx.strokeStyle = skin.color;
			this.ctx.stroke();
		}
		else if (skin.fillColor) {
			// only fill
			this.ctx.fillStyle = skin.fillColor;
			this.ctx.fill();
		}
		else if (skin.color && lineWidth > 0) {
			// only stroke
			this.ctx.strokeStyle = skin.color;
			this.ctx.stroke();
		}
		this.ctx.restore();
	},

	// Draw some text centered vertically and horizontally
	drawTextAt: function(theText, x, y, skin) {
		var lineWidth = skin.lineWidth;                 // [i_a] keep track of lineWidth ourselves; FF4 mutates the value in the .ctx.lineWidth!

		this.ctx.save();
		this.ctx.font = skin.font;
		if (skin.alpha) { this.ctx.globalAlpha = skin.alpha; }
		this.ctx.lineWidth = lineWidth;

		if (CoolClock.config.isIE) {
			// excanvas doesn't scale line width so we will do it here
			this.ctx.lineWidth = lineWidth * this.scale;
		}

		this.ctx.textBaseline = 'middle';
		this.ctx.textAlign = 'center';

		// prevent FF4 from yakking about canvas: "an attempt to set strokeStyle or fillStyle to a value that is neither a string, a CanvasGradient, or a CanvasPattern was ignored."
		//
		// also prevent FF4 from drawing strokes of /intended/ lineWidth==0 as (mutated by FF4 in .ctx.lineWidth) lineWidth==1
		if (skin.fillColor && skin.color && lineWidth > 0) {
			this.ctx.fillStyle = skin.fillColor;
			this.ctx.fillText(theText,x,y);
			this.ctx.strokeStyle = skin.color;
			this.ctx.strokeText(theText,x,y);
		}
		else if (skin.fillColor) {
			// only fill
			this.ctx.fillStyle = skin.fillColor;
			this.ctx.fillText(theText,x,y);
		}
		else if (skin.color && lineWidth > 0) {
			// only stroke
			this.ctx.strokeStyle = skin.color;
			this.ctx.strokeText(theText,x,y);
		}
		this.ctx.restore();
	},

	lpad2: function(num) {
		return (num < 10 ? '0' : '') + num;
	},

	tickAngle: function(second) {
		// Log algorithm by David Bradshaw
		var tweak = 3; // If it's lower the one second mark looks wrong (?)
		if (this.logClock) {
			return second == 0 ? 0 : (Math.log(second*tweak) / Math.log(60*tweak));
		}
		else if (this.logClockRev) {
			// Flip the seconds then flip the angle (trickiness)
			second = (60 - second) % 60;
			return 1.0 - (second == 0 ? 0 : (Math.log(second*tweak) / Math.log(60*tweak)));
		}
		else {
			return second/60.0;
		}
	},

	timeText: function(hour,min,sec,skin) {
		var am_pm = (this.showAmPm ? skin.AmPm : false);
		var ss = (skin.showDigitalSeconds !== false && this.showDigitalSeconds);    // when 'showDigitalSeconds' is not an element of the skin, it is ASSUMED to be TRUE
		return '' +
			(am_pm ? ((hour % 12) == 0 ? 12 : (hour % 12)) : hour) + ':' +
			this.lpad2(min) +
			(ss ? ':' + this.lpad2(sec) : '') +
			(am_pm ? am_pm[1 * (hour < 12)] : '');
	},

	// Draw a radial line by rotating then drawing a straight line
	// Ha ha, I think I've accidentally used Taus, (see http://tauday.com/)
	radialLineAtAngle: function(angleFraction,skin) {
		var lineWidth = skin.lineWidth;                 // [i_a] keep track of lineWidth ourselves; FF4 mutates the value in the .ctx.lineWidth!
		this.ctx.save();
		this.ctx.translate(this.renderRadius,this.renderRadius);
		this.ctx.rotate(Math.PI * (2.0 * angleFraction - 0.5));
		this.ctx.globalAlpha = skin.alpha;
		this.ctx.strokeStyle = skin.color;
		this.ctx.lineWidth = lineWidth;

		if (CoolClock.config.isIE) {
			// excanvas doesn't scale line width so we will do it here
			this.ctx.lineWidth = lineWidth * this.scale;
		}

		// prevent FF4 from yakking about canvas: "an attempt to set strokeStyle or fillStyle to a value that is neither a string, a CanvasGradient, or a CanvasPattern was ignored."
		//
		// also prevent FF4 from drawing strokes of /intended/ lineWidth==0 as (mutated by FF4 in .ctx.lineWidth) lineWidth==1
		if (skin.radius) {
			this.fullCircleAt(skin.startAt,0,skin);
		}
		else if (lineWidth > 0) {
			this.ctx.beginPath();
			this.ctx.moveTo(skin.startAt,0);
			this.ctx.lineTo(skin.endAt,0);
			this.ctx.stroke();
		}
		this.ctx.restore();
	},

	/*
	 * Internal Use Only:
	 *
	 * calculates a state hash of the time stamp and the important CoolClock settings: these are combined
	 * to detect any change in the settings and timestamp, which would mean a redraw/render is required.
	 */
	calc_state_hash: function(hour, min, sec, skin) {
		var ss = ((skin.secondHand || skin.secondDecoration) && this.showSecondHand) || (skin.digital && this.showDigital);
		var h = hour * 3600 + min * 60 + (ss ? sec : 0);
		var c = 1 * this.showDigital + 2 * this.showSecondHand + 4 * this.logClock + 8 * this.logClockRev + 16 * this.showAmPm + 64 * this.showDigitalSeconds + 128 * this.smoothMinutesHand;

		h = h * 256 + c;

		// as skinId is a string, we append it after we're done mixing the integer and boolean items into a single state/hash number:
		h = '' + (this.skinId ? this.skinId : '-') + ':' + h + ':' + this.displayRadius + ':' + this.gmtOffset + ':' + this.renderDigitalOffsetX + ':' + this.renderDigitalOffsetY;

		return h;
	},

	getSkinnedTextPosition: function(pos, skin) {
		// simple check for X and Y; printing this test centered at (0,0) would clip ~ damage the text anyway, so we don't need to specifically check for undefined, null or false here
		if (skin.textPosX) {
			pos.x = skin.textPosX;
		}
		if (skin.textPosY) {
			pos.y = skin.textPosY;
		}
		return pos;
	},

	/*
	 * [i_a] CoolClock records the timestamp of the last rendering of the clock:
	 * when render() is invoked multiple times for the same timestamp, only the first call
	 * will actually render the clock, thus keeping the CPU load at a minimum.
	 *
	 * You can reset the render state to FORCE a redraw:
	 *
	 *   this.lastDrawnState = false; // resets draw state.
	 */
	render: function(hour,min,sec) {
		var i;

		// Get the skin
		var skin = CoolClock.config.skins[this.skinId];
		if (!skin) { skin = CoolClock.config.skins[CoolClock.config.defaultSkin]; }

		// should we draw or have we done the same before already?
		var h = this.calc_state_hash(hour, min, sec, skin);
		if (h === this.lastDrawnState)
			return;

		// Clear
		this.ctx.clearRect(0,0,this.renderRadius*2,this.renderRadius*2);

		// Draw the outer edge of the clock
		if (skin.outerBorder) {
			this.fullCircleAt(this.renderRadius,this.renderRadius,skin.outerBorder);
		}

		// Draw the tick marks. Every 5th one is a big one
		for (i = 0; i < 60; i++) {
			if ((i%5)  && skin.smallIndicator) { this.radialLineAtAngle(this.tickAngle(i),skin.smallIndicator); }
			if ((i%5) === 0 && skin.largeIndicator) { this.radialLineAtAngle(this.tickAngle(i),skin.largeIndicator); }
		}

		// Write the time
		if (this.showDigital && skin.digital) {
			var pos = this.getSkinnedTextPosition({
				x: this.renderRadius,
				y: this.renderRadius * 1.5
			}, ((skin.digital && skin.digital.timeTextPosition) ? skin.digital.timeTextPosition : {}));

			pos.x += this.renderDigitalOffsetX;
			pos.y += this.renderDigitalOffsetY;

			this.drawTextAt(
				this.timeText(hour,min,sec, skin.digital),
				pos.x,
				pos.y,
				skin.digital
			);
		}

		// Draw the hands
		if (skin.hourHand) {
			this.radialLineAtAngle(this.tickAngle(((hour%12)*5 + min/12.0)),skin.hourHand);
		}

		if (skin.minuteHand) {
			var sm = (this.smoothMinutesHand && skin.smoothMinutesHand !== false);          // when this setting isn't in the skin, assume TRUE for the skin.
			this.radialLineAtAngle(this.tickAngle((min + (sm ? sec/60.0 : 0))),skin.minuteHand);
		}

		if (this.showSecondHand && skin.secondHand) {
			this.radialLineAtAngle(this.tickAngle(sec),skin.secondHand);
		}

		if (this.showSecondHand && skin.secondDecoration) {
			this.radialLineAtAngle(this.tickAngle(sec),skin.secondDecoration);
		}

		// and remember we did this, so we don't have to do the same all over again:
		this.lastDrawnState = h;
	},

	// Check the time and display the clock
	refreshDisplay: function() {
		var now = this.fetchCurrentTime();
		if (this.gmtOffset != null) {
			// Use GMT + gmtOffset
			var offsetNow = new Date(now.valueOf() + (this.gmtOffset * 1000 * 60 * 60));
			this.render(offsetNow.getUTCHours(),offsetNow.getUTCMinutes(),offsetNow.getUTCSeconds());
		}
		else {
			// Use local time
			this.render(now.getHours(),now.getMinutes(),now.getSeconds());
		}
	},

	// Check the canvas element hasn't been removed
	stillHere: function() {
		return document.getElementById(this.canvasId) != null;
	},

	// Stop this clock
	stop: function() {
		this.active = false;
	},

	// Start this clock
	start: function() {
		this.active = true;
	},

	// Main tick handler. Refresh the clock.
	tick: function() {
		if (this.stillHere() && this.active) {
			this.refreshDisplay();
		}
	}
};

// Find all canvas elements that have the CoolClock class and turns them into clocks
CoolClock.findAndCreateClocks = function(el) {
	var i, cv;
	// (Let's not use a jQuery selector here so it's easier to use frameworks other than jQuery)
	// [i_a] jQuery sends the jQuery object as argument to any ready() handler, so 'el' can be a /function/ then! Reject it then and fall back to the document.
	var canvases = ((typeof el !== 'function' ? el : null) || document).getElementsByTagName("canvas");

	for (i = 0; i < canvases.length; i++) {
		var elemID = canvases[i].id;
		if (elemID)
		{
			cv = $(elemID);
			if (cv && cv.retrieve)
			{
				var clkcls = cv.retrieve('coolclock');
				if (clkcls && clkcls.fullCircleAt)
				{
					// CoolClock instance for this one already exists!
					continue;
				}
			}
		}

		// Pull out the fields from the class. Example "CoolClock:chunkySwissOnBlack:1000"
		var fields = canvases[i].className.split(" ")[0].split(":");
		if (fields[0] === "CoolClock") {
			if (!canvases[i].id) {
				// If there's no id on this canvas element then give it one
				elemID = canvases[i].id = '_coolclock_auto_id_' + CoolClock.config.noIdCount++;
			}

			cv = $(elemID);

			// Create a clock object for this element
			var clki = new CoolClock({
				canvasId:       canvases[i].id,
				skinId:         fields[1],
				displayRadius:  fields[2],
				showSecondHand: fields[3]!=='noSeconds',
				smoothMinutesHand: fields.length <= 3 || fields[3]==='smoothMinutesHand',
				gmtOffset:      fields[4],
				showDigital:    fields[5]==='showDigital',
				logClock:       fields[6]==='logClock',
				logClockRev:    fields[6]==='logClockRev',
				showAmPm:       fields.length <= 7 || fields[7]==='showAmPm',
				showDigitalSeconds: fields.length <= 8 || fields[8]==='showDigitalSeconds'
			});

			if (cv && cv.store)
			{
				cv.store('coolclock', clki);
			}
		}
	}
};

if (0)	// MUI loads any clocks manually...
{
	// If you don't have jQuery then you need a body onload like this: <body onload="CoolClock.findAndCreateClocks()">
	// If you do have jQuery and it's loaded already then we can do it right now
	if (window.jQuery)
	{
		jQuery(document).ready(CoolClock.findAndCreateClocks);
	}
	if (window.MooTools)
	{
		window.addEvent('load', function()
		{
			CoolClock.findAndCreateClocks();
		});
	}
}

