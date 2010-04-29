if (Browser.Engine.webkit) {
	MUI.Window.implement({
		shadowStart: function(ctx, shadowBlur, shadowOffset) {
			ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
			ctx.shadowOffsetX = shadowOffset.x;
			ctx.shadowOffsetY = shadowOffset.y;
			ctx.shadowBlur = shadowBlur;
		},
		shadowStop: function(ctx) {
			ctx.shadowColor = "rgba(0,0,0,0)";
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
			ctx.shadowBlur = 0;
		},
		
		drawBox: function(ctx, width, height, shadowBlur, shadowOffset, shadows){

			var shadowBlur2x = shadowBlur * 2;
			var cornerRadius = this.options.cornerRadius;
	
			if ( shadows != false ) { // start the shadowing
				this.shadowStart(ctx, shadowBlur, shadowOffset);
			}
			// Window body.
			this.bodyRoundedRect(
				ctx,                          // context
				shadowBlur - shadowOffset.x,  // x
				shadowBlur - shadowOffset.y,  // y
				width - shadowBlur2x,         // width
				height - shadowBlur2x,        // height
				cornerRadius,                 // corner radius
				this.options.bodyBgColor      // Footer color
			);
			
			this.shadowStop(ctx); // stop the shadowing
			
			if (this.options.type != 'notification'){
			// Window header.
				this.topRoundedRect(
					ctx,                            // context
					shadowBlur - shadowOffset.x,    // x
					shadowBlur - shadowOffset.y,    // y
					width - shadowBlur2x,           // width
					this.options.headerHeight,      // height
					cornerRadius,                   // corner radius
					this.options.headerStartColor,  // Header gradient's top color
					this.options.headerStopColor    // Header gradient's bottom color
				);
			}	
		},
		
		drawBoxCollapsed: function(ctx, width, height, shadowBlur, shadowOffset, shadows){

			var options = this.options;
			var shadowBlur2x = shadowBlur * 2;
			var cornerRadius = options.cornerRadius;
		
			if ( shadows != false ){
				this.shadowStart(ctx, shadowBlur, shadowOffset);
			}
	
			// Window header
			this.topRoundedRect2(
				ctx,                          // context
				shadowBlur - shadowOffset.x,  // x
				shadowBlur - shadowOffset.y,  // y
				width - shadowBlur2x,         // width
				options.headerHeight + 2,     // height
				cornerRadius,                 // corner radius
				options.headerStartColor,     // Header gradient's top color
				options.headerStopColor       // Header gradient's bottom color
			);
			this.shadowStop(ctx);
	
		},	
		
		drawBoxCollapsed: function(ctx, width, height, shadowBlur, shadowOffset, shadows){

			var options = this.options;
			var shadowBlur2x = shadowBlur * 2;
			var cornerRadius = options.cornerRadius;
		
			if ( shadows != false ){
				this.shadowStart(ctx, shadowBlur, shadowOffset);
			}
	
			// Window header
			this.topRoundedRect2(
				ctx,                          // context
				shadowBlur - shadowOffset.x,  // x
				shadowBlur - shadowOffset.y,  // y
				width - shadowBlur2x,         // width
				options.headerHeight + 2,     // height
				cornerRadius,                 // corner radius
				options.headerStartColor,     // Header gradient's top color
				options.headerStopColor       // Header gradient's bottom color
			);
			this.shadowStop(ctx);
		},
		
		drawGauge: function(ctx, width, height, shadowBlur, shadowOffset, shadows){
			var options = this.options;
			var radius = (width * .5) - (shadowBlur) + 16;
			if ( shadows != false ){
				this.shadowStart(ctx, shadowBlur, shadowOffset);
			}
			MUI.circle(
				ctx,
				width * .5  - shadowOffset.x,
				(height + options.headerHeight) * .5  - shadowOffset.y,
				(width *.5) - shadowBlur,
				options.bodyBgColor,
				1
			);
			this.shadowStop(ctx);
	
			// Draw gauge header
			this.canvasHeaderEl.setStyles({
				'top': shadowBlur - shadowOffset.y,
				'left': shadowBlur - shadowOffset.x
			});		
			var ctx = this.canvasHeaderEl.getContext('2d');
			ctx.clearRect(0, 0, width, 100);
			ctx.beginPath();
			ctx.lineWidth = 24;
			ctx.lineCap = 'round';
			ctx.moveTo(13, 13);
			ctx.lineTo(width - (shadowBlur*2) - 13, 13);
			ctx.strokeStyle = 'rgba(0, 0, 0, .65)';
			ctx.stroke();
		}
	});
}