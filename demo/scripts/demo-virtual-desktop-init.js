/* 

	In this file we setup our Windows, Columns and Panels,
	and then inititialize MUI.
	
	At the bottom of Core.js you can setup lazy loading for your
	own plugins.

*/

/*
  
INITIALIZE WINDOWS

	1. Define windows
	
		var myWindow = function(){ 
			new MUI.Window({
				id: 'mywindow',
				title: 'My Window',
				contentURL: 'pages/lipsum.html',
				width: 340,
				height: 150
			});
		}

	2. Build windows on onDomReady
	
		myWindow();
	
	3. Add link events to build future windows
	
		if ($('myWindowLink')){
			$('myWindowLink').addEvent('click', function(e) {
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
		it in the onContentLoaded function of the new window. 
 
-------------------------------------------------------------------- */

initializeWindows = function(){

	// Examples
	MUI.ajaxpageWindow = function(){ 
		new MUI.Window({
			id: 'ajaxpage',
			loadMethod: 'xhr',
			contentURL: 'pages/lipsum.html',
			width: 340,
			height: 150
		});
	}	
	if ($('ajaxpageLinkCheck')){ 
		$('ajaxpageLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MUI.ajaxpageWindow();
		});
	}	
	
	MUI.jsonWindows = function(){
		var url = 'data/json-windows-data.js';
		var request = new Request.JSON({
			url: url,
			method: 'get',
			onComplete: function(properties) {
				MUI.newWindowsFromJSON(properties.windows);
			}
		}).send();
	}
	if ($('jsonLink')){
		$('jsonLink').addEvent('click', function(e) {
			new Event(e).stop();
			MUI.jsonWindows();
		});
	}

	MUI.youtubeWindow = function(){
		new MUI.Window({
			id: 'youtube',
			title: 'YouTube in Iframe',
			loadMethod: 'iframe',
			contentURL: 'pages/youtube.html',
			width: 340,
			height: 280,
			resizeLimit:  {'x': [330, 2500], 'y': [250, 2000]},
			toolbar: true,
			toolbarURL: 'pages/youtube-tabs.html',
			toolbarOnload: function(){
				MUI.initializeTabs('youtubeTabs');	

				$('youtube1Link').addEvent('click', function(e){
					MUI.updateContent({
						'element':  $('youtube'),
						'url':      'pages/youtube.html'
					});
				});
	
				$('youtube2Link').addEvent('click', function(e){
					MUI.updateContent({
						'element':  $('youtube'),
						'url':      'pages/youtube2.html'
					});
				});
	
				$('youtube3Link').addEvent('click', function(e){
					MUI.updateContent({
						'element':  $('youtube'),	
						'url':      'pages/youtube3.html'
					});
				});	
			}			
		});
	}	
	if ($('youtubeLinkCheck')) {
		$('youtubeLinkCheck').addEvent('click', function(e){
		new Event(e).stop();
			MUI.youtubeWindow();
		});
	}	

	MUI.clockWindow = function(){	
		new MUI.Window({
			id: 'clock',
			title: 'Canvas Clock',
			addClass: 'transparent',
			loadMethod: 'xhr',
			contentURL: 'plugins/coolclock/index.html',
			shape: 'gauge',
			headerHeight: 30,
			width: 160,
			height: 160,
			x: 570,
			y: 152,
			padding: { top: 0, right: 0, bottom: 0, left: 0 },
			require: {			
				js: [MUI.path.plugins + 'coolclock/scripts/coolclock.js'],
				onload: function(){
					if (CoolClock) new CoolClock();
				}	
			}			
		});	
	}
	if ($('clockLinkCheck')){
		$('clockLinkCheck').addEvent('click', function(e){
			new Event(e).stop();
			MUI.clockWindow();
		});
	}
	
	MUI.parametricsWindow = function(){	
		new MUI.Window({
			id: 'parametrics',
			title: 'Window Parametrics',
			loadMethod: 'xhr',
			contentURL: 'plugins/parametrics/index.html',
			width: 305,
			height: 110,
			x: 230,
			y: 180,
			padding: { top: 12, right: 12, bottom: 10, left: 12 },
			resizable: false,
			maximizable: false,
			require: {
				css: [MUI.path.plugins + 'parametrics/css/style.css'],
				js: [MUI.path.plugins + 'parametrics/scripts/parametrics.js'],
				onload: function(){	
					if (MUI.addRadiusSlider) MUI.addRadiusSlider();
					if (MUI.addShadowSlider) MUI.addShadowSlider();
				}		
			}			
		});
	}
	if ($('parametricsLinkCheck')){
		$('parametricsLinkCheck').addEvent('click', function(e){
			new Event(e).stop();
			MUI.parametricsWindow();
		});
	}		

	// Examples > Tests
	MUI.eventsWindow = function(){	
		new MUI.Window({
			id: 'windowevents',
			title: 'Window Events',
			loadMethod: 'xhr',
			contentURL: 'pages/events.html',
			width: 340,
			height: 250,			
			onContentLoaded: function(windowEl){
				MUI.notification('Window content was loaded.');
			},
			onCloseComplete: function(){
				MUI.notification('The window is closed.');
			},
			onMinimize: function(windowEl){
				MUI.notification('Window was minimized.');
			},
			onMaximize: function(windowEl){
				MUI.notification('Window was maximized.');
			},
			onRestore: function(windowEl){
				MUI.notification('Window was restored.');
			},
			onResize: function(windowEl){
				MUI.notification('Window was resized.');
			},
			onFocus: function(windowEl){
				MUI.notification('Window was focused.');
			},
			onBlur: function(windowEl){
				MUI.notification('Window lost focus.');
			}
		});
	}	
	if ($('windoweventsLinkCheck')){
		$('windoweventsLinkCheck').addEvent('click', function(e){
			new Event(e).stop();
			MUI.eventsWindow();
		});
	}

	MUI.containertestWindow = function(){ 
		new MUI.Window({
			id: 'containertest',
			title: 'Container Test',
			loadMethod: 'xhr',
			contentURL: 'pages/lipsum.html',
			container: 'pageWrapper',
			width: 340,
			height: 150,
			x: 100,
			y: 100
		});
	}
	if ($('containertestLinkCheck')){ 
		$('containertestLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MUI.containertestWindow();
		});
	}

	MUI.iframetestsWindow = function(){
		new MUI.Window({
			id: 'iframetests',
			title: 'Iframe Tests',
			loadMethod: 'iframe',
			contentURL: 'pages/iframetests.html'
		});
	}
	if ($('iframetestsLinkCheck')) {
		$('iframetestsLinkCheck').addEvent('click', function(e){
		new Event(e).stop();
			MUI.iframetestsWindow();
		});
	}

	MUI.accordiantestWindow = function(){
		var id = 'accordiantest';
		new MUI.Window({
			id: id,
			title: 'Accordian',
			loadMethod: 'xhr',
			contentURL: 'pages/accordian-demo.html',
			width: 300,
			height: 200,
			scrollbars: false,
			resizable: false,
			maximizable: false,
			padding: { top: 0, right: 0, bottom: 0, left: 0 },
			require: {
				css: [MUI.path.plugins + 'accordian/css/style.css'],
				onload: function(){
					this.windowEl = $(id);				
					new Accordion('#' + id + ' h3.accordianToggler', "#" + id + ' div.accordianElement',{
						opacity: false,
						alwaysHide: true,
						onActive: function(toggler, element){
							toggler.addClass('open');
						},
						onBackground: function(toggler, element){
							toggler.removeClass('open');
						},							
						onStart: function(toggler, element){
							this.windowEl.accordianResize = function(){
								MUI.dynamicResize($(id));
							}
							this.windowEl.accordianTimer = this.windowEl.accordianResize.periodical(10);
						}.bind(this),
						onComplete: function(){
							this.windowEl.accordianTimer = $clear(this.windowEl.accordianTimer);
							MUI.dynamicResize($(id)) // once more for good measure
						}.bind(this)
					}, $(id));
				}	
			}
		});
	}	
	if ($('accordiantestLinkCheck')){ 
		$('accordiantestLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MUI.accordiantestWindow();
		});
	}
	
	MUI.noCanvasWindow = function(){
		new MUI.Window({
			id: 'nocanvas',
			title: 'No Canvas',
			loadMethod: 'xhr',
			contentURL: 'pages/lipsum.html',
			addClass: 'no-canvas',
			width: 305,
			height: 175,
			shadowBlur: 0,
			resizeLimit: {'x': [275, 2500], 'y': [125, 2000]},
			useCanvas: false
		});
	}
	if ($('noCanvasLinkCheck')){
		$('noCanvasLinkCheck').addEvent('click', function(e){
			new Event(e).stop();
			MUI.noCanvasWindow();
		});
	}

	// View
	if ($('sidebarLinkCheck')){
		$('sidebarLinkCheck').addEvent('click', function(e){
			new Event(e).stop();
			MUI.Desktop.sidebarToggle();
		});
	}

	if ($('cascadeLink')){
		$('cascadeLink').addEvent('click', function(e){
			new Event(e).stop();
			MUI.arrangeCascade();
		});
	}

	if ($('tileLink')){
		$('tileLink').addEvent('click', function(e){
			new Event(e).stop();
			MUI.arrangeTile();
		});
	}

	if ($('closeLink')){
		$('closeLink').addEvent('click', function(e){
			new Event(e).stop();
			MUI.closeAll();
		});
	}

	if ($('minimizeLink')){
		$('minimizeLink').addEvent('click', function(e){
			new Event(e).stop();
			MUI.minimizeAll();
		});
	}

	// Tools
	MUI.builderWindow = function(){	
		new MUI.Window({
			id: 'builder',
			title: 'Window Builder',
			icon: 'images/icons/page.gif',
			loadMethod: 'xhr',
			contentURL: 'plugins/windowform/',
			width: 370,
			height: 410,
			maximizable: false,
			resizable: false,
			scrollbars: false,
			onBeforeBuild: function(){
				if ($('builderStyle')) return;
				new Asset.css('plugins/windowform/css/style.css', {id: 'builderStyle'});
			},			
			onContentLoaded: function(){
				new Asset.javascript('plugins/windowform/scripts/Window-from-form.js', {
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
	}
	if ($('builderLinkCheck')){
		$('builderLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MUI.builderWindow();
		});
	}	

	// Todo: Add menu check mark functionality for workspaces.

	// Workspaces

	if ($('saveWorkspaceLink')){
		$('saveWorkspaceLink').addEvent('click', function(e){
			new Event(e).stop();
			MUI.saveWorkspace();
		});
	}
	
	if ($('loadWorkspaceLink')){
		$('loadWorkspaceLink').addEvent('click', function(e){
			new Event(e).stop();
			MUI.loadWorkspace();
		});
	}
	
	if ($('toggleEffectsLinkCheck')){
		$('toggleEffectsLinkCheck').addEvent('click', function(e){
			new Event(e).stop();
			MUI.toggleEffects($('toggleEffectsLinkCheck'));			
		});
		if (MUI.options.useEffects == true) {
			MUI.toggleEffectsLink = new Element('div', {
				'class': 'check',
				'id': 'toggleEffects_check'
			}).inject($('toggleEffectsLinkCheck'));
		}
	}	

	// Help	
	MUI.featuresWindow = function(){
		new MUI.Window({
			id: 'features',
			title: 'Features',
			loadMethod: 'xhr',
			contentURL: 'pages/features-layout.html',
			width: 305,
			height: 175,
			resizeLimit: {'x': [275, 2500], 'y': [125, 2000]},
			toolbar: true,
			toolbarURL: 'pages/features-tabs.html',
			toolbarOnload: function(){
				MUI.initializeTabs('featuresTabs');

				$('featuresLayoutLink').addEvent('click', function(e){
					MUI.updateContent({
						'element':  $('features'),
						'url':       'pages/features-layout.html'
					});
				});

				$('featuresWindowsLink').addEvent('click', function(e){
					MUI.updateContent({
						'element':  $('features'),
						'url':       'pages/features-windows.html'
					});
				});

				$('featuresGeneralLink').addEvent('click', function(e){
					MUI.updateContent({
						'element':  $('features'),
						'url':       'pages/features-general.html'
					});
				});
			}			
		});
	}
	if ($('featuresLinkCheck')){
		$('featuresLinkCheck').addEvent('click', function(e){
			new Event(e).stop();
			MUI.featuresWindow();
		});
	}

	MUI.aboutWindow = function(){
		new MUI.Modal({
			id: 'about',
			addClass: 'about',
			title: 'MochaUI',
			loadMethod: 'xhr',
			contentURL: 'pages/about.html',
			type: 'modal2',
			width: 350,
			height: 195,
			padding: { top: 43, right: 12, bottom: 10, left: 12 },
			scrollbars:  false
		});
	}
	if ($('aboutLink')){
		$('aboutLink').addEvent('click', function(e){	
			new Event(e).stop();
			MUI.aboutWindow();
		});
	}

	// Deactivate menu header links
	$$('a.returnFalse').each(function(el){
		el.addEvent('click', function(e){
			new Event(e).stop();
		});
	});

	// Build windows onLoad
	MUI.parametricsWindow();
	MUI.clockWindow();
	
	MUI.myChain.callChain();
	
}

// Initialize MochaUI when the DOM is ready
window.addEvent('load', function(){

	MUI.myChain = new Chain();
	MUI.myChain.chain(
		function(){MUI.Desktop.initialize();},
		function(){MUI.Dock.initialize();},
		function(){initializeWindows();}		
	).callChain();
	
	// This is just for the demo. Running it onload gives pngFix time to replace the pngs in IE6.
	$$('.desktopIcon').addEvent('click', function(){
		MUI.notification('Do Something');
	});	

});

window.addEvent('unload', function(){
	// This runs when a user leaves your page.	
});