/*
CoolClock by Simon Baird (simon dot baird at gmail dot com)
Version 1.0.4 (09-Nov-2006)
See http://simonbaird.com/coolclock/

Copyright (c) Simon Baird 2006

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this
list of conditions and the following disclaimer in the documentation and/or other
materials provided with the distribution.

Neither the name of the Simon Baird nor the names of other contributors may be
used to endorse or promote products derived from this software without specific
prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
DAMAGE.
*/

window.CoolClock = function(canvasId,displayRadius,skinId,showSecondHand,gmtOffset) {
	return this.init(canvasId,displayRadius,skinId,showSecondHand,gmtOffset);
}

CoolClock.findAndCreateClocks = function() {
	var canvases = document.getElementsByTagName("canvas");
	for (var i=0;i<canvases.length;i++) {
		var fields = canvases[i].className.split(" ")[0].split(":");
		if (fields[0] == "CoolClock") {
			new CoolClock(canvases[i].id,fields[2],fields[1],fields[3]!="noSeconds",fields[4]);
		}
	}
}

CoolClock.config = {
	clockTracker: {},
	tickDelay: 1000,
	longTickDelay: 15000,
	defaultRadius: 85,
	renderRadius: 100,
	defaultSkin: "swissRail",
	skins:	{
		// more skins in moreskins.js
		// try making your own...

		swissRail: {
			outerBorder: { lineWidth: 1, radius:95, color: "black", alpha: 1 },
			smallIndicator: { lineWidth: 2, startAt: 89, endAt: 93, color: "black", alpha: 1 },
			largeIndicator: { lineWidth: 4, startAt: 80, endAt: 93, color: "black", alpha: 1 },
			hourHand: { lineWidth: 8, startAt: -15, endAt: 50, color: "black", alpha: 1 },
			minuteHand: { lineWidth: 7, startAt: -15, endAt: 75, color: "black", alpha: 1 },
			secondHand: { lineWidth: 1, startAt: -20, endAt: 85, color: "red", alpha: 1 },
			secondDecoration: { lineWidth: 1, startAt: 70, radius: 4, fillColor: "red", color: "red", alpha: 1 }
		},
		chunkySwiss: {
			outerBorder: { lineWidth: 4, radius:97, color: "black", alpha: 1 },
			smallIndicator: { lineWidth: 4, startAt: 89, endAt: 93, color: "black", alpha: 1 },
			largeIndicator: { lineWidth: 8, startAt: 80, endAt: 93, color: "black", alpha: 1 },
			hourHand: { lineWidth: 12, startAt: -15, endAt: 60, color: "black", alpha: 1 },
			minuteHand: { lineWidth: 10, startAt: -15, endAt: 85, color: "black", alpha: 1 },
			secondHand: { lineWidth: 4, startAt: -20, endAt: 85, color: "red", alpha: 1 },
			secondDecoration: { lineWidth: 2, startAt: 70, radius: 8, fillColor: "red", color: "red", alpha: 1 }
		},
		chunkySwissOnBlack: {
			outerBorder: { lineWidth: 4, radius:97, color: "white", alpha: 1 },
			smallIndicator: { lineWidth: 4, startAt: 89, endAt: 93, color: "white", alpha: 1 },
			largeIndicator: { lineWidth: 8, startAt: 80, endAt: 93, color: "white", alpha: 1 },
			hourHand: { lineWidth: 12, startAt: -15, endAt: 60, color: "white", alpha: 1 },
			minuteHand: { lineWidth: 10, startAt: -15, endAt: 85, color: "white", alpha: 1 },
			secondHand: { lineWidth: 4, startAt: -20, endAt: 85, color: "red", alpha: 1 },
			secondDecoration: { lineWidth: 2, startAt: 70, radius: 8, fillColor: "red", color: "red", alpha: 1 }
		},
		mochaUI: {
			outerBorder: { lineWidth: 185, radius:1, color: "#000", alpha: 0 },
			smallIndicator: { lineWidth: 3, startAt: 88, endAt: 94, color: "#595959", alpha: 1 },
			largeIndicator: { lineWidth: 3, startAt: 82, endAt: 94, color: "#ddd", alpha: 1 },
			hourHand: { lineWidth: 4, startAt: 0, endAt: 58, color: "#fff", alpha: 1 },
			minuteHand: { lineWidth: 4, startAt: 0, endAt: 78, color: "#fff", alpha: 1 },
			secondHand: { lineWidth: 4, startAt: 82, endAt: 94, color: "#98B8D9", alpha: 1 },
			secondDecoration: { lineWidth: 3, startAt: 0, radius: 6, fillColor: "white", color: "white", alpha: 1 }
		},
		mochaUI2: {
			outerBorder: { lineWidth: 6, radius:98, color: "#fff", alpha: 0 },
			smallIndicator: { lineWidth: 2, startAt: 86, endAt: 91, color: "#555", alpha: 1 },
			largeIndicator: { lineWidth: 3, startAt: 80, endAt: 91, color: "#555", alpha: 1 },
			hourHand: { lineWidth: 4, startAt: -1, endAt: 56, color: "#141414", alpha: 1 },
			minuteHand: { lineWidth: 4, startAt: -1, endAt: 78, color: "#141414", alpha: 1 },
			secondHand: { lineWidth: 1, startAt: -16, endAt: 80, color: "#ce1717", alpha: 1 },
			secondDecoration: { lineWidth: 2, startAt: 0, radius: 7, fillColor: "#fff", color: "#ce1717", alpha: 0 }
		},
		mochaUI3: {
			outerBorder: { lineWidth: 185, radius:1, color: "#000", alpha: 0 },
			smallIndicator: { lineWidth: 3, startAt: 88, endAt: 94, color: "#2CC2D1", alpha: 1 },
			largeIndicator: { lineWidth: 3, startAt: 82, endAt: 94, color: "#1BFFD9", alpha: 1 },
			hourHand: { lineWidth: 4, startAt: 0, endAt: 58, color: "#fff", alpha: 1 },
			minuteHand: { lineWidth: 4, startAt: 0, endAt: 78, color: "#fff", alpha: 1 },
			secondHand: { lineWidth: 4, startAt: 82, endAt: 94, color: "#EFCD5F", alpha: 1 },
			secondDecoration: { lineWidth: 0, startAt: 0, radius: 6, fillColor: "#fff", color: "#000", alpha: 1 }
		},
		mochaUI4: {
			outerBorder: { lineWidth: 185, radius:1, color: "#000", alpha: 0 },
			smallIndicator: { lineWidth: 3, startAt: 88, endAt: 94, color: "#C7C3B7", alpha: 1 },
			largeIndicator: { lineWidth: 3, startAt: 82, endAt: 94, color: "#C7C3B7", alpha: 1 },
			hourHand: { lineWidth: 4, startAt: -1, endAt: 58, color: "#C7C3B7", alpha: 1 },
			minuteHand: { lineWidth: 4, startAt: -1, endAt: 78, color: "#C7C3B7", alpha: 1 },
			secondHand: { lineWidth: 3, startAt: 82, endAt: 94, color: "#ce1717", alpha: 1 },
			secondDecoration: { lineWidth: 0, startAt: 0, radius: 6, fillColor: "#999", color: "#000", alpha: 0 }
		}
	}
};

CoolClock.prototype = {
	init: function(canvasId,displayRadius,skinId,showSecondHand,gmtOffset) {
		this.canvasId = canvasId;
		this.displayRadius = displayRadius || CoolClock.config.defaultRadius;
		this.skinId = skinId || CoolClock.config.defaultSkin;
		this.showSecondHand = typeof showSecondHand == "boolean" ? showSecondHand : true;
		this.tickDelay = CoolClock.config[ this.showSecondHand ? "tickDelay" : "longTickDelay"];

		this.canvas = document.getElementById(canvasId);
		
		if ( Browser.Engine.trident ) {			
			G_vmlCanvasManager.initElement(this.canvas);			
		}
		
		this.canvas = document.getElementById(canvasId);	

		this.canvas.setAttribute("width",this.displayRadius*2);
		this.canvas.setAttribute("height",this.displayRadius*2);

		this.canvas.style.width = this.displayRadius*2 + "px";
		this.canvas.style.height = this.displayRadius*2 + "px";

		this.renderRadius = CoolClock.config.renderRadius; 

		this.scale = this.displayRadius / this.renderRadius;
		this.ctx = this.canvas.getContext("2d");
		this.ctx.scale(this.scale,this.scale);

		this.gmtOffset = gmtOffset != null ? parseFloat(gmtOffset) : gmtOffset;

		CoolClock.config.clockTracker[canvasId] = this;
		this.initializing = true;
		this.tick();
		return this;
	},

	fullCircle: function(skin) {
		this.fullCircleAt(this.renderRadius,this.renderRadius,skin);
	},

	fullCircleAt: function(x,y,skin) {
		with (this.ctx) {
			save();
			globalAlpha = skin.alpha;
			lineWidth = skin.lineWidth;
			if (document.all)
				// excanvas doesn't scale line width so we will do it here
				lineWidth = lineWidth * this.scale;
			beginPath();	
			arc(x, y, skin.radius, 0, 2*Math.PI, false);
			closePath();
		
			if (document.all)
				// excanvas doesn't close the circle so let's color in the gap
				arc(x, y, skin.radius, -0.1, 0.1, false);
			if (skin.fillColor) {
				fillStyle = skin.fillColor
				fill();
			}
			if (skin.color) {
				// XXX why not stroke and fill
				strokeStyle = skin.color;
				stroke();
			}
			restore();
		}
	},

	reflection: function(){
		with (this.ctx) {
  			beginPath();
   			fillStyle = 'rgba(250, 250, 250, .4)';  
  			arc(100, 100, 98, 0, Math.PI, true);
  			bezierCurveTo(60, 80, 160, 80, 196, 100);    
  			fill();
		}
	},
	
	bgGradient: function(){
		var lingrad = this.ctx.createLinearGradient(0, 0, 0, 200);
		lingrad.addColorStop(0, 'rgba(190, 190, 190, 1)');
		lingrad.addColorStop(1, 'rgba(230, 230, 230, 1)');		
		with (this.ctx) {
			fillStyle = lingrad;			
			beginPath();			
			arc(100, 100, 99, 0, 2*Math.PI, false);
			closePath();
			fill();
		}
	},
	
	center: function(){		
		with (this.ctx) {
			beginPath();
			fillStyle = "#fff";				
			arc(100, 100, 7, 0, 2 * Math.PI, false);			
			fill();
			strokeStyle = "#ce1717";
			lineWidth = 2;
			arc(100, 100, 7, 0, 2 * Math.PI, false);			
			stroke();
			
		}
	},	

	radialLineAtAngle: function(angleFraction,skin) {
		with (this.ctx) {
			save();
			translate(this.renderRadius,this.renderRadius);
			rotate(Math.PI * (2 * angleFraction - 0.5));
			globalAlpha = skin.alpha;
			strokeStyle = skin.color;
			lineWidth = skin.lineWidth;
			if (document.all)
				// excanvas doesn't scale line width so we will do it here
				lineWidth = lineWidth * this.scale;
			if (skin.radius) {
				this.fullCircleAt(skin.startAt,0,skin)
			}
			else {
				beginPath();
				moveTo(skin.startAt,0)
				lineTo(skin.endAt,0);
				stroke();
			}
			restore();
		}
	},

	render: function(hour,min,sec) {
		var skin = CoolClock.config.skins[this.skinId];
		this.ctx.clearRect(0,0,this.renderRadius*2,this.renderRadius*2);

		this.bgGradient();		
		//this.fullCircle(skin.outerBorder);

		for (var i=0;i<60;i++)
			this.radialLineAtAngle(i/60,skin[ i%5 ? "smallIndicator" : "largeIndicator"]);
				
		this.radialLineAtAngle((hour+min/60)/12,skin.hourHand);
		this.radialLineAtAngle((min+sec/60)/60,skin.minuteHand);
		if (this.showSecondHand) {
			this.radialLineAtAngle(sec/60,skin.secondHand);
			if (!document.all)
				// decoration doesn't render right in IE so lets turn it off
				this.radialLineAtAngle(sec/60,skin.secondDecoration);
		}
		this.center();		
		this.reflection();
	},


	nextTick: function() {
		setTimeout("CoolClock.config.clockTracker['"+this.canvasId+"'].tick()",this.tickDelay);
	},

	stillHere: function() {
		return document.getElementById(this.canvasId) != null;
	},

	refreshDisplay: function() {
		var now = new Date();
		if (this.gmtOffset != null) {
			// use GMT + gmtOffset
			var offsetNow = new Date(now.valueOf() + (this.gmtOffset * 1000 * 60 * 60));
			this.render(offsetNow.getUTCHours(),offsetNow.getUTCMinutes(),offsetNow.getUTCSeconds());
		}
		else {
			// use local time
			var hours = now.getHours();
			var minutes = now.getMinutes();
			var seconds = now.getSeconds();
			var time;
			this.refreshTime(hours, minutes, seconds);			
			this.render(hours,minutes,seconds);
		}
	},
	
	refreshTime: function(hours, minutes, seconds){
		var now = new Date();		
		var time;
		if (hours >= 12) {
			time = " PM";
		}
		else {
			time = " AM";
		}
		if (hours > 12) {
			hours -= 12;
		}
		if (hours == 0) {
			hours = 12;
		}
		if (minutes < 10) {
			minutes = "0" + minutes;
		}
		if (seconds == 0 || this.initializing == true){
			$('clock_title').set('html', hours + ":" + minutes + time);
			if ($('clock_dockTabText')){
				$('clock_dockTabText').set('html', hours + ":" + minutes + time);
			}
			this.initializing = false;
		}
	},

	tick: function() {
		if (this.stillHere()) {
			this.refreshDisplay()
			this.nextTick();
		}
	}
}
