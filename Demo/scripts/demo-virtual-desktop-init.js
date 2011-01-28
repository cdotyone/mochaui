/* 

 In this file we setup our Windows, Columns and Panels,
 and then inititialize MUI.

 At the bottom of Core.js you can see how to setup lazy loading for your
 own plugins.

 */

/*

 INITIALIZE WINDOWS

 1. Define windows

 var myWindow = function(){
 new MUI.Window({
 id: 'mywindow',
 title: 'My Window',
 content: {url:pages/lipsum.html'},
 width: 340,
 height: 150
 });
 }

 2. Build windows on onDomReady

 myWindow();

 3. Add link events to build future windows

 if ($('myWindowLink')){
 $('myWindowLink').addEvent('click', function(e){
 new Event(e).stop();
 jsonWindows();
 });
 }

 Note: If your link is in the top menu, it opens only a single window, and you would
 like a check mark next to it when it's window is open, format the link name as follows:

 window.id + LinkCheck, e.g., mywindowLinkCheck

 Otherwise it is suggested you just use mywindowLink

 Associated HTML for link event above:

 <a id="myWindowLink" href="pages/lipsum.html">My Window</a>


 Notes:
 If you need to add link events to links within windows you are creating, do
 it in the onLoaded function of the new window.

 -------------------------------------------------------------------- */

initializeWindows = function(){

	// change default setting - keep window within inside the main area.
	MUI.Windows.options.container = 'pageWrapper';

	// Examples
	MUI.ajaxpageWindow = function(){
		new MUI.Window({
			id: 'ajaxpage',
			content: {
				url: 'pages/lipsum.html',
				loadMethod: 'xhr'
			},
			width: 340,
			height: 150
		});
	};
	if ($('ajaxpageLinkCheck')){
		$('ajaxpageLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.ajaxpageWindow();
		});
	}

	MUI.jsonWindows = function(){
		var url = 'data/json-windows-data.js';
		var request = new Request.JSON({
			url: url,
			method: 'get',
			onComplete: function(properties){
				MUI.Windows.newFromJSON(properties.windows);
			}
		}).send();
	};
	if ($('jsonLink')){
		$('jsonLink').addEvent('click', function(e){
			e.stop();
			MUI.jsonWindows();
		});
	}

	MUI.youtubeWindow = function(){
		new MUI.Window({
			id: 'youtube',
			title: 'YouTube in Iframe',
			width: 340,
			height: 280,
			resizeLimit: {'x': [330, 2500], 'y': [250, 2000]},
			content: [
				{
					url: 'pages/youtube.html',
					loadMethod: 'iframe'
				},
				{
					'position': 'top',
					section: 'toolbar',
					loadMethod:'json',
					content: [
						{'text': 'Zero 7', 'url': 'pages/youtube.html', 'title': 'Zero 7'},
						{'text': 'Fleet Foxes', 'url': 'pages/youtube2.html', 'title': 'Fleet Foxes'},
						{'text': 'Boards of Canada', 'url': 'pages/youtube3.html', 'title': 'Boards of Canada'}
					],
					onLoaded: function(element,uOptions,json){
						MUI.create({
							control:'MUI.Tabs',
							id: 'youtube_toolbar',
							container: 'youtube',
							position: 'top',
							tabs: json,
							partner: 'youtube',
							section: 'toolbar'
						});
					}
				}
			]
		});
	};
	if ($('youtubeLinkCheck')){
		$('youtubeLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.youtubeWindow();
		});
	}

	MUI.clockWindow = function(){
		new MUI.Window({
			id: 'clock',
			title: 'Canvas Clock',
			cssClass: 'transparent',
			content: {
				url: '{plugins}coolclock/demo.html',
				loadMethod: 'xhr',
				require: {
					js: ['{plugins}coolclock/scripts/coolclock.js'],
					onload: function(){
						if (CoolClock) new CoolClock();
					}
				}
			},
			shape: 'gauge',
			headerHeight: 30,
			width: 160,
			height: 160,
			x: 570,
			y: 152,
			padding: {top: 0, right: 0, bottom: 0, left: 0}
		});
	};
	if ($('clockLinkCheck')){
		$('clockLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.clockWindow();
		});
	}

	MUI.parametricsWindow = function(){
		new MUI.Window({
			id: 'parametrics',
			title: 'Window Parametrics',
			content: {
				url: '{plugins}parametrics/demo.html',
				loadMethod: 'xhr',
				require: {
					js: ['{plugins}parametrics/scripts/parametrics.js'],
					onload: function(){
						if (MUI.addRadiusSlider) MUI.addRadiusSlider();
						if (MUI.addShadowSlider) MUI.addShadowSlider();
						if (MUI.addOffsetXSlider) MUI.addOffsetXSlider();
						if (MUI.addOffsetYSlider) MUI.addOffsetYSlider();
					}
				}
			},
			width: 305,
			height: 210,
			x: 230,
			y: 180,
			padding: {top: 12, right: 12, bottom: 10, left: 12},
			resizable: false,
			maximizable: false,
			onDragStart: function(instance){
				if (!Browser.ie) instance.el.windowEl.setStyle('opacity', 0.5);
				// VML doesn't render opacity nicely on the shadow
			},
			onDragComplete: function(instance){
				if (!Browser.ie) instance.el.windowEl.setStyle('opacity', 1);
			}
		});
	};
	if ($('parametricsLinkCheck')){
		$('parametricsLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.parametricsWindow();
		});
	}

	// Examples > Tests
	MUI.eventsWindow = function(){
		new MUI.Window({
			id: 'windowevents',
			title: 'Window Events',
			loadMethod: 'xhr',
			content: {url: 'pages/events.html'},
			width: 340,
			height: 250,
			onLoaded: function(){
				MUI.notification('Window content was loaded.');
			},
			onCloseComplete: function(){
				MUI.notification('The window is closed.');
			},
			onMinimize: function(){
				MUI.notification('Window was minimized.');
			},
			onMaximize: function(){
				MUI.notification('Window was maximized.');
			},
			onRestore: function(){
				MUI.notification('Window was restored.');
			},
			onResize: function(){
				MUI.notification('Window was resized.');
			},
			onFocus: function(){
				MUI.notification('Window was focused.');
			},
			onBlur: function(){
				MUI.notification('Window lost focus.');
			}
		});
	};
	if ($('windoweventsLinkCheck')){
		$('windoweventsLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.eventsWindow();
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

	MUI.iframeTestsWindow = function(){
		new MUI.Window({
			id: 'iframetests',
			title: 'Iframe Tests',
			content: {
				url: 'pages/iframetests.html',
				loadMethod: 'iframe'
			}
		});
	};
	if ($('iframetestLinkCheck')){
		$('iframetestLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.iframeTestsWindow();
		});
	}

	MUI.accordionTestWindow = function(){
		var id = 'accordiontest';
		new MUI.Window({
			id: id,
			title: 'Accordion',
			content: {
				url: 'data/accordion-demo.json',
				loadMethod: 'json',
				onLoaded: function(el,cOptions,json){
					MUI.create({
						control: 'MUI.Accordion',
						container: id,
						idField: 'value',
						panels: json
					});
				}
			},
			width: 300,
			height: 200,
			scrollbars: false,
			resizable: false,
			maximizable: false
		});
	};
	if ($('accordiontestLinkCheck')){
		$('accordiontestLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.accordionTestWindow();
		});
	}

	MUI.noCanvasWindow = function(){
		new MUI.Window({
			id: 'nocanvas',
			title: 'No Canvas',
			loadMethod: 'xhr',
			content: {url: 'pages/lipsum.html'},
			cssClass: 'no-canvas',
			width: 305,
			height: 175,
			shadowBlur: 0,
			resizeLimit: {'x': [275, 2500], 'y': [125, 2000]},
			useCanvas: false
		});
	};
	if ($('noCanvasLinkCheck')){
		$('noCanvasLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.noCanvasWindow();
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
	MUI.builderWindow = function(){
		new MUI.Window({
			id: 'builder',
			title: 'Window Builder',
			icon: 'images/icons/page.gif',
			loadMethod: 'xhr',
			content: {url: '{plugins}windowform/'},
			width: 370,
			height: 410,
			maximizable: false,
			resizable: false,
			scrollbars: false,
			onDrawBegin: function(){
/*
				if ($('builderStyle')) return;
				new Asset.css(MUI.replacePaths('{theme}/css/accordion.css'), {id: 'builderStyle'});
*/
			},
			onLoaded: function(){
				new Asset.javascript(MUI.replacePaths('{plugins}windowform/scripts/window-from-form.js'), {
					id: 'builderScript',
					onload: function(){
						$('newWindowSubmit').addEvent('click', function(e){
							new Event(e).stop();
							new MUI.WindowForm();
						});
					}
				});
			}
		});
	};
	if ($('builderLinkCheck')){
		$('builderLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.builderWindow();
		});
	}

	// Todo: Add menu check mark functionality for workspaces.

	// Workspaces

	if ($('saveWorkspaceLink')){
		$('saveWorkspaceLink').addEvent('click', function(e){
			e.stop();
			MUI.Desktop.saveWorkspace();
		});
	}

	if ($('loadWorkspaceLink')){
		$('loadWorkspaceLink').addEvent('click', function(e){
			e.stop();
			MUI.Desktop.loadWorkspace();
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
	MUI.featuresWindow = function(){
		new MUI.Window({
			id: 'features',
			title: 'Features',
			width: 275,
			height: 250,
			resizeLimit: {'x': [275, 2500], 'y': [125, 2000]},
			content: [
				{url: 'pages/features-layout.html'},
				{
					position: 'top',
					loadMethod:'json',
					id: 'features_toolbar',
					css: 'mochaToolbar',
					content: [
						{'text': 'Layout', 'url': 'pages/features-layout.html', 'loadMethod': 'iframe', 'title': 'Features - Layout', 'class': 'first'},
						{'text': 'Windows', 'url': 'pages/features-windows.html', 'loadMethod': 'iframe', 'title': 'Features - Windows'},
						{'text': 'General', 'url': 'pages/features-general.html', 'loadMethod': 'iframe', 'title': 'Features - General', 'class': 'last'}
					],
					onLoaded: function(element, uOptions, json){
						MUI.create({
							control: 'MUI.Tabs',
							id: 'features_toolbar',
							container: 'features',
							position: 'top',
							tabs: json,
							partner: 'features'
						});
					}
				}
			]
		});
	};
	if ($('featuresLinkCheck')){
		$('featuresLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.featuresWindow();
		});
	}

	MUI.aboutWindow = function(){
		new MUI.Modal({
			id: 'about',
			cssClass: 'about',
			title: 'MochaUI',
			loadMethod: 'xhr',
			content: {url: 'pages/about.html'},
			type: 'modal2',
			width: 350,
			height: 195,
			padding: {top: 43, right: 12, bottom: 10, left: 12},
			scrollbars: false
		});
	};
	if ($('aboutLink')){
		$('aboutLink').addEvent('click', function(e){
			e.stop();
			MUI.aboutWindow();
		});
	}

	// Misc
	MUI.authorsWindow = function(){
		new MUI.Modal({
			id: 'authorsWindow',
			title: 'AUTHORS.txt',
			content: {url: 'scripts/AUTHORS.txt'},
			width: 400,
			height: 250,
			scrollbars: true
		});
	};
	if ($('authorsLink')){
		$('authorsLink').addEvent('click', function(e){
			new Event(e).stop();
			MUI.authorsWindow();
		});
	}

	MUI.licenseWindow = function(){
		new MUI.Modal({
			id: 'License',
			title: 'MIT-LICENSE.txt',
			content: {url:'scripts/MIT-LICENSE.txt'},
			width: 580,
			height: 350,
			scrollbars: true
		});
	};
	if ($('licenseLink')){
		$('licenseLink').addEvent('click', function(e){
			new Event(e).stop();
			MUI.licenseWindow();
		});
	}

	// Deactivate menu header links
	$$('a.returnFalse').addEvent('click', function(e){
		e.stop();
	});

	// Build windows onLoad
	MUI.parametricsWindow();
	MUI.clockWindow();
	MUI.myChain.callChain();
};

// Initialize MochaUI options
MUI.initialize();

// Initialize MochaUI when the DOM is ready
window.addEvent('load', function(){

	MUI.myChain = new Chain();
	MUI.myChain.chain(
			function(){
				MUI.Desktop.initialize();
			},
			function(){
				initializeWindows();
			},
			function(){
				// force checkbox on menu to be in correct state
				MUI.options.standardEffects = !MUI.options.standardEffects;
				MUI.toggleStandardEffects($('toggleStdEffectsLinkCheck'));

				// force checkbox on menu to be in correct state
				MUI.options.advancedEffects = !MUI.options.advancedEffects;
				MUI.toggleAdvancedEffects($('toggleAdvEffectsLinkCheck'));
			}
			).callChain();

	// This is just for the demo. Running it onload gives pngFix time to replace the pngs in IE6.
	$$('.desktopIcon').addEvent('click', function(){
		MUI.notification('Do Something');
	});

});

window.addEvent('unload', function(){
	// This runs when a user leaves your page.
});