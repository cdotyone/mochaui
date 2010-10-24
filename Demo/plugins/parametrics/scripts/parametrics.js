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

MUI.append({
	addRadiusSlider: function(){
		if ($('radiusSliderarea')) {
			var sliderFirst = true;
			var mochaSlide = new Slider($('radiusSliderarea'), $('radiusSliderknob'), {
				steps: 14,
				offset: 0,
				onChange: function(pos){
					// Don't redraw windows the first time the slider is initialized
					if (sliderFirst) {
						sliderFirst = false;
						return;
					}

					$('radiusUpdatevalue').set('html', pos);
					// Change default corner radius of the original class
					MUI.Windows.options.cornerRadius = pos;
					MUI.Window.implement({ options: MUI.Windows.options });

					// Change corner radius of all active classes and their windows
					Object.each(MUI.Windows.instances,function(instance) {
						instance.options.cornerRadius = pos;
						instance.drawWindow();
					}.bind(this));
				}.bind(this)
			}).set(MUI.Windows.options.cornerRadius);
		}
	},
	addShadowSlider: function(){
		if ($('shadowSliderarea')){
			var sliderFirst = true;
			var mochaSlide = new Slider($('shadowSliderarea'), $('shadowSliderknob'), {
				range: [1, 10],
				offset: 0,
				onChange: function(pos){
					// Don't redraw windows the first time the slider is initialized
					// !!! Probably need to make this separate from the corner radius slider
					if (sliderFirst) {
						sliderFirst = false;
						return;
					}

					$('shadowUpdatevalue').set('html', pos);
					// Change default shadow width of the original class
					MUI.Windows.options.shadowBlur = pos;
					MUI.Window.implement({ options: MUI.Windows.options });

					// Change shadow width of all active classes and their windows
					Object.each(MUI.Windows.instances,function(instance) {
						var oldshadowBlur = instance.options.shadowBlur;
						instance.options.shadowBlur = pos;
						instance.windowEl.setStyles({
							'top': instance.windowEl.getStyle('top').toInt() - (instance.options.shadowBlur - oldshadowBlur),
							'left': instance.windowEl.getStyle('left').toInt() - (instance.options.shadowBlur - oldshadowBlur)
						});
						instance.drawWindow();
					}.bind(this));
				}.bind(this),
				onComplete: function(){
					Object.each(MUI.Windows.instances,function(instance) {
						if (instance.options.resizable){
							instance.adjustHandles();
						}
					});
				}
			}).set(MUI.Windows.options.shadowBlur);
		}
	}
});
