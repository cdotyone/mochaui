/*

 In this file we setup our Windows, Columns and Panels,
 and then initialize MochaUI.

 At the bottom of Core.js you can see how to setup lazy loading for your
 own plugins.

 */

var Demo = (Demo || {});

Demo.initializeDesktop = function(){

	MUI.create({
		'control':'MUI.Desktop',
		'id':'desktop',
		'taskbar':true,
		'content':[

	// change default setting - keep window within inside the main area.
	MUI.Windows.options.container = 'pageWrapper';

	// Examples
	if ($('ajaxpageLinkCheck')){
		$('ajaxpageLinkCheck').addEvent('click', function(e){
			e.stop();
			Demo.ajaxpageWindow();
		});
	}

	if ($('jsonLink')){
		$('jsonLink').addEvent('click', function(e){
			e.stop();
			Demo.jsonWindows();
		});
	}

	if ($('youtubeLinkCheck')){
		$('youtubeLinkCheck').addEvent('click', function(e){
			e.stop();
			Demo.youtubeWindow();
		});
	}

	if ($('clockLinkCheck')){
		$('clockLinkCheck').addEvent('click', function(e){
			e.stop();
			Demo.clockWindow();
		});
	}

	if ($('parametricsLinkCheck')){
		$('parametricsLinkCheck').addEvent('click', function(e){
			e.stop();
			Demo.parametricsWindow();
		});
	}

	// Examples > Tests
	if ($('windoweventsLinkCheck')){
		$('windoweventsLinkCheck').addEvent('click', function(e){
			e.stop();
			Demo.eventsWindow();
		});
	}

	MUI.containerTestWindow = function(){
		new MUI.Window({
			id: 'containertest',
			title: 'Container Test',
			loadMethod: 'xhr',
			content: {url: 'pages/lipsum.html'},
			container: 'pageWrapper',
			width: 340,
			height: 150,
			x: 100,
			y: 100
		});
	};
	if ($('containertestLinkCheck')){
		$('containertestLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.containerTestWindow();
		});
	}

	if ($('iframetestLinkCheck')){
		$('iframetestLinkCheck').addEvent('click', function(e){
			e.stop();
			Demo.iframeTestsWindow();
		});
	}

	if ($('accordiontestLinkCheck')){
		$('accordiontestLinkCheck').addEvent('click', function(e){
			e.stop();
			Demo.accordionBuilder();
		});
	}

	if ($('noCanvasLinkCheck')){
		$('noCanvasLinkCheck').addEvent('click', function(e){
			e.stop();
			Demo.noCanvasWindow();
		});
	}

	// View
	if ($('sidebarLinkCheck')){
		$('sidebarLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.Desktop.sidebarToggle();
		});
	}

	if ($('cascadeLink')){
		$('cascadeLink').addEvent('click', function(e){
			e.stop();
			MUI.Windows.arrangeCascade();
		});
	}

	if ($('tileLink')){
		$('tileLink').addEvent('click', function(e){
			e.stop();
			MUI.Windows.arrangeTile();
		});
	}

	if ($('closeLink')){
		$('closeLink').addEvent('click', function(e){
			e.stop();
			MUI.Windows.closeAll();
		});
	}

	if ($('minimizeLink')){
		$('minimizeLink').addEvent('click', function(e){
			e.stop();
			MUI.Windows.minimizeAll();
		});
	}

	// Tools
	if ($('builderLinkCheck')){
		$('builderLinkCheck').addEvent('click', function(e){
			e.stop();
			Demo.builderWindow();
		});
	}

	// Todo: Add menu check mark functionality for workspaces.

	// Workspaces

	if ($('saveWorkspaceLink')){
		$('saveWorkspaceLink').addEvent('click', function(e){
			e.stop();
			Demo.saveWorkspace();
		});
	}

	if ($('loadWorkspaceLink')){
		$('loadWorkspaceLink').addEvent('click', function(e){
			e.stop();
			Demo.loadWorkspace();
		});
	}

	if ($('toggleStdEffectsLinkCheck')){
		$('toggleStdEffectsLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.toggleStandardEffects($('toggleStdEffectsLinkCheck'));
		});
	}

	if ($('toggleAdvEffectsLinkCheck')){
		$('toggleAdvEffectsLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.toggleAdvancedEffects($('toggleAdvEffectsLinkCheck'));
		});
	}

	// Help
	if ($('featuresLinkCheck')){
		$('featuresLinkCheck').addEvent('click', function(e){
			e.stop();
			Demo.featuresWindow();
		});
	}

	if ($('aboutLink')){
		$('aboutLink').addEvent('click', function(e){
			e.stop();
			Demo.aboutWindow();
		});
	}

	// Misc
	if ($('authorsLink')){
		$('authorsLink').addEvent('click', function(e){
			new Event(e).stop();
			Demo.authorsWindow();
		});
	}

	if ($('licenseLink')){
		$('licenseLink').addEvent('click', function(e){
			new Event(e).stop();
			Demo.licenseWindow();
		});
	}

	// Deactivate menu header links
	$$('a.returnFalse').addEvent('click', function(e){
		e.stop();
	});

	if (0)
	{
		// Build windows onLoad
		Demo.parametricsWindow();
		Demo.clockWindow();
		MUI.myChain.callChain();
	}
};

Demo.initialize = function(){

	new MUI.Require({js:['scripts/demo-shared.js'],
		'onload':function(){
			// Initialize MochaUI options
			MUI.initialize({path:{demo:''}});
			MUI.load(['Parametrics','famfamfam','CoolClock','WindowForm'], function(load_options) {
				if (window.console && window.console.log)
					window.console.log('MUI.load event: ', load_options, ', arguments (', arguments.length, '): ', arguments);
			});
			MUI.register('Demo', Demo);
			MUI.register('MUI.Windows', MUI.Windows);
			Demo.initializeDesktop();

			// force checkbox on menu to be in correct state
			MUI.options.standardEffects = !MUI.options.standardEffects;
			MUI.toggleStandardEffects($('toggleStdEffectsLinkCheck'));

			// force checkbox on menu to be in correct state
			MUI.options.advancedEffects = !MUI.options.advancedEffects;
			MUI.toggleAdvancedEffects($('toggleAdvEffectsLinkCheck'));

			// This is just for the demo. Running it onload gives pngFix time to replace the pngs in IE6.
			$$('.desktopIcon').addEvent('click', function(){
				MUI.notification('Do Something');
		}
	});

};

// Initialize MochaUI when the DOM is ready
window.addEvent('load', Demo.initialize); //using load instead of domready for IE8

window.addEvent('unload', function(){
	// This runs when a user leaves your page.
});
