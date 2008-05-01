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

MochaUI.extend({
	addRadiusSlider: function(){
		if ($('radiusSliderarea')) {
			var windowOptions = MochaUI.Windows.windowOptions;
			var sliderFirst = true;
			var mochaSlide = new Slider($('radiusSliderarea'), $('radiusSliderknob'), {
				steps: 14,
				offset: 0,
				onChange: function(pos){
					$('radiusUpdatevalue').set('html', pos);
					// Change default corner radius of the original class
					windowOptions.cornerRadius = pos;
					MochaUI.Window.implement({ options: windowOptions });
					// Don't redraw windows the first time the slider is initialized
					if (sliderFirst == true) {
						sliderFirst = false;
						return;
					}
					// Change corner radius of all active classes and their windows
					MochaUI.Windows.instances.each(function(instance) {
						instance.options.cornerRadius = pos;					
						instance.drawWindow($(instance.options.id));
					}.bind(this));					
					MochaUI.Windows.indexLevel++; 
				}.bind(this)
			}).set(windowOptions.cornerRadius);
		}
	},
	addShadowSlider: function(){
		if ($('shadowSliderarea')) {
			var windowOptions = MochaUI.Windows.windowOptions;			
			var sliderFirst = true;
			var mochaSlide = new Slider($('shadowSliderarea'), $('shadowSliderknob'), {
				range: [1, 10],											 
				offset: 0,
				onStart: function(){
					// Set variable to adjust position in relation to shadow width
					MochaUI.Windows.instances.each(function(instance) {
						instance.adjusted = false;
					}.bind(this));			
				}.bind(this),
				onChange: function(pos){
					$('shadowUpdatevalue').set('html', pos);					
					// Change default shadow width of the original class
					windowOptions.shadowBlur = pos;					
					MochaUI.Window.implement({ options: windowOptions });					
					// Don't redraw windows the first time the slider is initialized
					// !!! Probably need to make this separate from the corner radius slider
					if (sliderFirst == true) { 
						sliderFirst = false;
						return;
					}					
					// Change shadow width of all active classes and their windows
					MochaUI.Windows.instances.each(function(instance) {															
						instance.oldshadowBlur = instance.options.shadowBlur;									
						instance.options.shadowBlur = pos;					
						instance.windowEl.setStyles({
							'top': instance.windowEl.getStyle('top').toInt() - (instance.options.shadowBlur - instance.oldshadowBlur) ,
							'left': instance.windowEl.getStyle('left').toInt() - (instance.options.shadowBlur - instance.oldshadowBlur)
						});
						instance.drawWindow($(instance.options.id));
					}.bind(this));					
					MochaUI.Windows.indexLevel++; 
				}.bind(this),
				onComplete: function(){
					MochaUI.Windows.instances.each(function(instance) {
						if (instance.options.resizable){										
							instance.adjustHandles();
						}
					}.bind(this));			
				}.bind(this)				
			}).set(windowOptions.shadowBlur);
		}
	}	
});
