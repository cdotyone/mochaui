/*

Script: Corner-slider.js
	Initializes the corner radius slider.

License:
	MIT-style license.
	
Requires:
	Core.js, Window.js		

*/

MochaUI.extend({
	addSlider: function(){
		if ($('sliderarea')) {
			var sliderFirst = true;
			mochaSlide = new Slider($('sliderarea'), $('sliderknob'), {
				steps: 20,
				offset: 5,
				onChange: function(pos){
					$('updatevalue').set('html', pos);
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
					
					MochaUI.indexLevel++; 
				}.bind(this)
			}).set(windowOptions.cornerRadius);
		}
	}
});
