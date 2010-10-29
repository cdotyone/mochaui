/*
 ---

 name: Parametrics

 script: Parametrics.js

 description: MUI - Initializes the GUI Parametrics property sliders.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.Parametrics]

 ...
 */

MUI.append({

	addRadiusSlider: function(){
		if ($('radiusSliderarea')){
			var windowOptions = MUI.Windows.options;
			var sliderFirst = true;
			var mochaSlide = new Slider('radiusSliderarea', 'radiusSliderknob', {
				steps: 14,
				offset: 0,
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
				initialStep: 0,
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
});
