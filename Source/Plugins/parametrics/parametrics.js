/*
 ---

 name: Parametrics

 script: Parametrics.js

 description: Creates a window and initializes sliders.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core
 - MUI.Window

 provides: [Parametrics.createwindow]

 ...
 */

var Parametrics = {

	createwindow: function(){

		MUI.create({
			control: 'MUI.Window',
			id: 'parametrics',
			title: 'Window Parametrics',
			content: {
				url: '{plugins}parametrics/demo.html',
				require: {
					js: ['{plugins}parametrics/parametrics.js'] //,
					// onload: function(){} // either use onload here or Window/onLoaded further down
				}
			},
			width: 305,
			height: 210,
			x: 570,
			y: 160,
			padding: {top: 12, right: 12, bottom: 10, left: 12},
			resizable: false,
			minimizable: true,
			maximizable: false,
			onDragStart: function(instance){
				if (!Browser.ie) instance.el.windowEl.setStyle('opacity', 0.5);
				// VML doesn't render opacity nicely on the shadow
			},
			onDragComplete: function(instance){
				if (!Browser.ie) instance.el.windowEl.setStyle('opacity', 1);
			},
			onLoaded: function(){
				Parametrics.addRadiusSlider();
				Parametrics.addShadowSlider();
				Parametrics.addOffsetXSlider();
				Parametrics.addOffsetYSlider();
			}
		});
	},
	
	addRadiusSlider: function(){
		if ($('radiusSliderarea')){
			var windowOptions = MUI.Windows.options;
			var sliderFirst = true;
			var mochaSlide = new Slider('radiusSliderarea', 'radiusSliderknob', {
				steps: 14,
				offset: 0,
				initialStep: windowOptions.cornerRadius,
				onChange: function(pos){
					// Don't redraw windows the first time the slider is initialized
					if (sliderFirst){
						sliderFirst = false;
						return;
					}

					$('radiusUpdatevalue').set('html', pos);
					// Change default corner radius of the original class
					windowOptions.cornerRadius = pos;
					MUI.Window.implement({ options: windowOptions });

					// Change corner radius of all active classes and their windows
					MUI.each(function(instance){
						if (instance.className != 'MUI.Window') return;
						instance.options.cornerRadius = pos;
						instance.redraw();
					}.bind(this));
				}.bind(this)
			}).set(windowOptions.cornerRadius);
		}
	},

	addShadowSlider: function(){
		if ($('shadowSliderarea')){
			var windowOptions = MUI.Windows.options;
			var sliderFirst = true;
			var mochaSlide = new Slider('shadowSliderarea', 'shadowSliderknob', {
				range: [1, 10],
				offset: 0,
				initialStep:  windowOptions.shadowBlur,
				onChange: function(pos){
					// Don't redraw windows the first time the slider is initialized
					if (sliderFirst){
						sliderFirst = false;
						return;
					}

					$('shadowUpdatevalue').set('html', pos);
					// Change default shadow width of the original class
					windowOptions.shadowBlur = pos;
					MUI.Window.implement({ options: windowOptions });

					// Change shadow width of all active classes and their windows
					MUI.each(function(instance){
						if (instance.className != 'MUI.Window') return;
						var oldShadowBlur = instance.options.shadowBlur;
						instance.options.shadowBlur = pos;

						if (!instance.useCSS3){
							instance.el.windowEl.setStyles({
								'top': instance.el.windowEl.getStyle('top').toInt() - (instance.options.shadowBlur - oldShadowBlur),
								'left': instance.el.windowEl.getStyle('left').toInt() - (instance.options.shadowBlur - oldShadowBlur)
							});
						}

						instance.redraw();
					}.bind(this));
				}.bind(this),
				onComplete: function(){
					MUI.each(function(instance){
						if (instance.className != 'MUI.Window') return;
						if (instance.options.resizable){
							instance._adjustHandles();
						}
					});
				}
			}).set(windowOptions.shadowBlur);
		}
	},

	addOffsetXSlider: function(){
		if ($('offsetXSliderarea')){
			var windowOptions = MUI.Windows.options;
			var sliderFirst = true;
			var mochaSlide = new Slider('offsetXSliderarea', 'offsetXSliderknob', {
				range: [-5, 5],
				offset: 0,
				initialStep: windowOptions.shadowOffset.x,
				onChange: function(pos){
					// Don't redraw windows the first time the slider is initialized
					if (sliderFirst){
						sliderFirst = false;
						return;
					}

					$('offsetXUpdatevalue').set('text', pos);
					windowOptions.shadowOffset.x = pos;
					MUI.Window.implement({ options: windowOptions });

					// Change shadow position of all active classes and their windows
					MUI.each(function(instance){
						if (instance.className != 'MUI.Window') return;
						var oldOffsetX = instance.options.shadowOffset.x;
						instance.options.shadowOffset.x = pos;
						if (!instance.useCSS3) instance.el.windowEl.setStyle('left', instance.el.windowEl.getStyle('left').toInt() - (oldOffsetX - pos));
						instance.redraw();
					}.bind(this));
				}.bind(this),
				onComplete: function(){
					MUI.each(function(instance){
						if (instance.className != 'MUI.Window') return;
						if (instance.options.resizable){
							instance._adjustHandles();
						}
					});
				}
			}).set(windowOptions.shadowOffset.x);
		}
	},

	addOffsetYSlider: function(){
		if ($('offsetYSliderarea')){
			var windowOptions = MUI.Windows.options;
			var sliderFirst = true;
			var mochaSlide = new Slider('offsetYSliderarea', 'offsetYSliderknob', {
				range: [-5, 5],
				offset: 0,
				initialStep: windowOptions.shadowOffset.y,
				onChange: function(pos){
					// Don't redraw windows the first time the slider is initialized
					if (sliderFirst){
						sliderFirst = false;
						return;
					}

					$('offsetYUpdatevalue').set('text', pos);
					windowOptions.shadowOffset.y = pos;
					MUI.Window.implement({ options: windowOptions });

					// Change shadow position of all active classes and their windows
					MUI.each(function(instance){
						if (instance.className != 'MUI.Window') return;
						var oldOffsetY = instance.options.shadowOffset.y;
						instance.options.shadowOffset.y = pos;
						if (!instance.useCSS3) instance.el.windowEl.setStyle('top', instance.el.windowEl.getStyle('top').toInt() - (oldOffsetY - pos));
						instance.redraw();
					}.bind(this));
				}.bind(this),
				onComplete: function(){
					MUI.each(function(instance){
						if (instance.className != 'MUI.Window') return;
						if (instance.options.resizable){
							instance._adjustHandles();
						}
					});
				}
			}).set(windowOptions.shadowOffset.y);
		}
	}
};

MUI.register('Parametrics.createwindow',Parametrics.createwindow);