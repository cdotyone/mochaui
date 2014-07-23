/*

 In this file we setup our Windows, Columns and Panels,
 and then initialize MochaUI.

 At the bottom of Core.js you can see how to setup lazy loading for your
 own plugins.

 */

var Demo = (Demo || {});

Demo.initializeDesktop = function(){

	// change default setting - keep window within inside the main area.
	MUI.Windows.options.container = 'pageWrapper';

	MUI.register('Demo', Demo);
	MUI.register('MUI.Windows', MUI.Windows);

	MUI.create({
		'control':'MUI.Desktop',
		'id':'desktop',
		'fromHTML':true,
		'onDrawEnd':function() {
			// This is just for the demo. Running it onload gives pngFix time to replace the pngs in IE6.
			$$('.desktopIcon').addEvent('click', function(){
				MUI.notification('Do Something');
			});
		}
	});
};

Demo.initialize = function(){

	new MUI.Require({js:['scripts/demo-shared.js'],
        'noCache': true,
		'onload':function(){
			// Initialize MochaUI options
			MUI.initialize({path:{demo:''}});
			MUI.load(['MUI.Window','MUI.Desktop','Parametrics','famfamfam','CoolClock','WindowForm'], function(load_options) {
				if (window.console && window.console.log)
					window.console.log('MUI.load event: ', load_options, ', arguments (', arguments.length, '): ', arguments);
				Demo.initializeDesktop();
			});

/*
			// force checkbox on menu to be in correct state
			MUI.options.standardEffects = !MUI.options.standardEffects;
			MUI.toggleStandardEffects($('toggleStdEffectsLinkCheck'));

			// force checkbox on menu to be in correct state
			MUI.options.advancedEffects = !MUI.options.advancedEffects;
			MUI.toggleAdvancedEffects($('toggleAdvEffectsLinkCheck'));
*/
		}
	});
};

// Initialize MochaUI when the DOM is ready
window.addEvent('load', Demo.initialize); //using load instead of domready for IE8

window.addEvent('unload', function(){
	// This runs when a user leaves your page.
});
