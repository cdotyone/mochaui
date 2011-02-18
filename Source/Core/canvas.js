/*
 ---

 script: canvas.js

 description: Namespace for all canvas drawing functions.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires: [MochaUI/MUI]

 provides: [MUI.Canvas]

 ...
 */

MUI.Canvas = Object.append((MUI.Canvas || {}), {

	drawBox: function(ctx, width, height, shadowBlur, shadowOffset, shadows, headerHeight, cornerRadius, bodyBgColor, headerStartColor, headerStopColor){
		var shadowBlur2x = shadowBlur * 2;

		// This is the drop shadow. It is created onion style.
		if (shadows){
			for (var x = 0; x <= shadowBlur; x++){
				this.roundedRect(
					ctx,
					shadowOffset.x + x,
					shadowOffset.y + x,
					width - (x * 2) - shadowOffset.x,
					height - (x * 2) - shadowOffset.y,
					cornerRadius + (shadowBlur - x),
					[0, 0, 0],
					x == shadowBlur ? .29 : .065 + (x * .01)
				);
			}
		}

		// Window body.
		this._drawBodyRoundedRect(
			ctx, // context
			shadowBlur - shadowOffset.x, // x
			shadowBlur - shadowOffset.y, // y
			width - shadowBlur2x, // width
			height - shadowBlur2x, // height
			cornerRadius, // corner radius
			bodyBgColor // Footer color
		);

		if (headerHeight){
			// Window header.
			this._drawTopRoundedRect(
				ctx, // context
				shadowBlur - shadowOffset.x, // x
				shadowBlur - shadowOffset.y, // y
				width - shadowBlur2x, // width
				headerHeight, // height
				cornerRadius, // corner radius
				headerStartColor, // Header gradient's top color
				headerStopColor // Header gradient's bottom color
			);
		}
	},

	drawGauge: function(ctx, width, height, shadowBlur, shadowOffset, shadows, canvasHeader, headerHeight, bodyBgColor, useCSS3){
		if (shadows && !useCSS3){
			if (Browser.webkit){
				var color=Asset.getCSSRule('.mochaCss3Shadow').style.backgroundColor;
				ctx.shadowColor = color.replace(/rgb/g,'rgba');
				ctx.shadowOffsetX = shadowOffset.x;
				ctx.shadowOffsetY = shadowOffset.y;
				ctx.shadowBlur = shadowBlur;
			} else for (var x = 0; x <= shadowBlur; x++){
				MUI.Canvas.circle(
					ctx,
					width * .5 + shadowOffset.x,
					(height + headerHeight) * .5 + shadowOffset.x,
					(width * .5) - (x * 2) - shadowOffset.x,
					[0, 0, 0],
					x == shadowBlur ? .75 : .075 + (x * .04)
				);
			}
		}
		MUI.Canvas.circle(
			ctx,
			width * .5 - shadowOffset.x,
			(height + headerHeight) * .5 - shadowOffset.y,
			(width * .5) - shadowBlur,
			bodyBgColor,
			1
		);

		if (Browser.webkit){
			ctx.shadowColor = "rgba(0,0,0,0)";
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
			ctx.shadowBlur = 0;
		}

		if(canvasHeader) {
			// Draw gauge header
			canvasHeader.setStyles({
				'top': shadowBlur - shadowOffset.y,
				'left': shadowBlur - shadowOffset.x
			});
			ctx = canvasHeader.getContext('2d');
			ctx.clearRect(0, 0, width, 100);
			ctx.beginPath();
			ctx.lineWidth = 24;
			ctx.lineCap = 'round';
			ctx.moveTo(13, 13);
			ctx.lineTo(width - (shadowBlur * 2) - 13, 13);
			ctx.strokeStyle = 'rgba(0, 0, 0, .65)';
			ctx.stroke();
		}
	},

	drawBoxCollapsed: function(ctx, width, height, shadowBlur, shadowOffset, shadows, headerHeight, cornerRadius, headerStartColor, headerStopColor){
		var shadowBlur2x = shadowBlur * 2;

		// This is the drop shadow. It is created onion style.
		if (shadows){
			for (var x = 0; x <= shadowBlur; x++){
				this.roundedRect(
					ctx,
					shadowOffset.x + x,
					shadowOffset.y + x,
					width - (x * 2) - shadowOffset.x,
					height - (x * 2) - shadowOffset.y,
					cornerRadius + (shadowBlur - x),
					[0, 0, 0],
					x == shadowBlur ? .3 : .06 + (x * .01)
				);
			}
		}

		// Window header
		this._drawTopRoundedRect2(
			ctx, // context
			shadowBlur - shadowOffset.x, // x
			shadowBlur - shadowOffset.y, // y
			width - shadowBlur2x, // width
			headerHeight + 2, // height
			shadowBlur,
			cornerRadius, // corner radius
			headerStartColor, // Header gradient's top color
			headerStopColor // Header gradient's bottom color
		);

	},

	drawMaximizeButton: function(ctx, x, y, rgbBg, aBg, rgb, a){
		// Circle
		ctx.beginPath();
		ctx.arc(x, y, 7, 0, Math.PI * 2, true);
		ctx.fillStyle = 'rgba(' + rgbBg.join(',') + ',' + aBg + ')';
		ctx.fill();
		// X sign
		ctx.strokeStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(x, y - 3.5);
		ctx.lineTo(x, y + 3.5);
		ctx.moveTo(x - 3.5, y);
		ctx.lineTo(x + 3.5, y);
		ctx.stroke();
	},

	drawCloseButton: function(ctx, x, y, rgbBg, aBg, rgb, a){
		// Circle
		ctx.beginPath();
		ctx.arc(x, y, 7, 0, Math.PI * 2, true);
		ctx.fillStyle = 'rgba(' + rgbBg.join(',') + ',' + aBg + ')';
		ctx.fill();
		// Plus sign
		ctx.strokeStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(x - 3, y - 3);
		ctx.lineTo(x + 3, y + 3);
		ctx.moveTo(x + 3, y - 3);
		ctx.lineTo(x - 3, y + 3);
		ctx.stroke();
	},

	drawMinimizeButton: function(ctx, x, y, rgbBg, aBg, rgb, a){
		// Circle
		ctx.beginPath();
		ctx.arc(x, y, 7, 0, Math.PI * 2, true);
		ctx.fillStyle = 'rgba(' + rgbBg.join(',') + ',' + aBg + ')';
		ctx.fill();
		// Minus sign
		ctx.strokeStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(x - 3.5, y);
		ctx.lineTo(x + 3.5, y);
		ctx.stroke();
	},

	roundedRect: function(ctx, x, y, width, height, radius, rgb, a){
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.beginPath();
		ctx.moveTo(x, y + radius);
		ctx.lineTo(x, y + height - radius);
		ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
		ctx.lineTo(x + width - radius, y + height);
		ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
		ctx.lineTo(x + width, y + radius);
		ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
		ctx.lineTo(x + radius, y);
		ctx.quadraticCurveTo(x, y, x, y + radius);
		ctx.fill();
	},

	triangle: function(ctx, x, y, width, height, rgb, a){
		ctx.beginPath();
		ctx.moveTo(x + width, y);
		ctx.lineTo(x, y + height);
		ctx.lineTo(x + width, y + height);
		ctx.closePath();
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.fill();
	},

	circle: function(ctx, x, y, diameter, rgb, a){
		ctx.beginPath();
		ctx.arc(x, y, diameter, 0, Math.PI * 2, true);
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.fill();
	},

	_drawBodyRoundedRect: function(ctx, x, y, width, height, radius, rgb){
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ', 1)';
		ctx.beginPath();
		ctx.moveTo(x, y + radius);
		ctx.lineTo(x, y + height - radius);
		ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
		ctx.lineTo(x + width - radius, y + height);
		ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
		ctx.lineTo(x + width, y + radius);
		ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
		ctx.lineTo(x + radius, y);
		ctx.quadraticCurveTo(x, y, x, y + radius);
		ctx.fill();
	},

	_drawTopRoundedRect: function(ctx, x, y, width, height, radius, headerStartColor, headerStopColor){
		var lingrad = ctx.createLinearGradient(0, 0, 0, height);
		lingrad.addColorStop(0, 'rgb(' + headerStartColor.join(',') + ')');
		lingrad.addColorStop(1, 'rgb(' + headerStopColor.join(',') + ')');
		ctx.fillStyle = lingrad;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x, y + height);
		ctx.lineTo(x + width, y + height);
		ctx.lineTo(x + width, y + radius);
		ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
		ctx.lineTo(x + radius, y);
		ctx.quadraticCurveTo(x, y, x, y + radius);
		ctx.fill();
	},

	_drawTopRoundedRect2: function(ctx, x, y, width, height, shadowBlur, radius, headerStartColor, headerStopColor){
		// Chrome is having trouble rendering the LinearGradient in this particular case
		if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1){
			ctx.fillStyle = 'rgba(' + headerStopColor.join(',') + ', 1)';
		} else {
			var lingrad = ctx.createLinearGradient(0, shadowBlur - 1, 0, height + shadowBlur + 3);
			lingrad.addColorStop(0, 'rgb(' + headerStartColor.join(',') + ')');
			lingrad.addColorStop(1, 'rgb(' + headerStopColor.join(',') + ')');
			ctx.fillStyle = lingrad;
		}
		ctx.beginPath();
		ctx.moveTo(x, y + radius);
		ctx.lineTo(x, y + height - radius);
		ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
		ctx.lineTo(x + width - radius, y + height);
		ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
		ctx.lineTo(x + width, y + radius);
		ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
		ctx.lineTo(x + radius, y);
		ctx.quadraticCurveTo(x, y, x, y + radius);
		ctx.fill();
	}

});