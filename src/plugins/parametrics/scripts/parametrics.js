/*

Script: Parametrics.js
	Initializes the GUI property sliders.

Copyright:
	Copyright (c) 2007-2008 Greg Houston, <http://greghoustondesign.com/>.	

License:
	MIT-style license.

Requires:
	Core.js, Window.js

*/

MUI.extend({
	addRadiusSlider: function(){
		if ($('radiusSliderarea')) {
			var windowOptions = MUI.Windows.windowOptions;
			var sliderFirst = true;
			var mochaSlide = new Slider($('radiusSliderarea'), $('radiusSliderknob'), {
				steps: 14,
				offset: 0,
				onChange: function(pos){
					$('radiusUpdatevalue').set('html', pos);
					// Change default corner radius of the original class
					windowOptions.cornerRadius = pos;
					MUI.Window.implement({ options: windowOptions });
					// Don't redraw windows the first time the slider is initialized
					if (sliderFirst == true) {
						sliderFirst = false;
						return;
					}
					// Change corner radius of all active classes and their windows
					MUI.each(function(instance) {
                        if(instance.className!='MUI.Window') return;
						instance.options.cornerRadius = pos;
						instance.drawWindow();
					}.bind(this));
				}.bind(this)
			}).set(windowOptions.cornerRadius);
		}
	},
	addShadowSlider: function(){
		if ($('shadowSliderarea')){
			var windowOptions = MUI.Windows.windowOptions;
			var sliderFirst = true;
			var mochaSlide = new Slider($('shadowSliderarea'), $('shadowSliderknob'), {
				range: [1, 10],
				offset: 0,
				onChange: function(pos){
					$('shadowUpdatevalue').set('html', pos);
					// Change default shadow width of the original class
					windowOptions.shadowBlur = pos;
					MUI.Window.implement({ options: windowOptions });
					// Don't redraw windows the first time the slider is initialized
					// !!! Probably need to make this separate from the corner radius slider
					if (sliderFirst == true) { 
						sliderFirst = false;
						return;
					}
					// Change shadow width of all active classes and their windows
					MUI.each(function(instance) {
                        if(instance.className!='MUI.Window') return;
						var oldShadowBlur = instance.options.shadowBlur;
						instance.options.shadowBlur = pos;
						instance.windowEl.setStyles({
							'top': instance.windowEl.getStyle('top').toInt() - (instance.options.shadowBlur - oldShadowBlur),
							'left': instance.windowEl.getStyle('left').toInt() - (instance.options.shadowBlur - oldShadowBlur)
						});
						instance.drawWindow();
					}.bind(this));
				}.bind(this),
				onComplete: function(){
					MUI.each(function(instance) {
                        if(instance.className!='MUI.Window') return;
						if(instance.options.resizable){
							instance.adjustHandles();
						}
					});
				}
			}).set(windowOptions.shadowBlur);
		}
	}
});
