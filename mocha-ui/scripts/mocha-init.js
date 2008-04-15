/* -----------------------------------------------------------------

	In this file:
	
	1. Define windows
	
		var myWindow = function(){ 
			new MochaUI.Window({
				id: 'mywindow',
				title: 'My Window',
				loadMethod: 'xhr',
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


   ----------------------------------------------------------------- */

initializeWindows = function(){

	// Examples
	MochaUI.ajaxpageWindow = function(){ 
		new MochaUI.Window({
			id: 'ajaxpage',
			title: 'Content Loaded with an XMLHttpRequest',
			loadMethod: 'xhr',
			contentURL: 'pages/lipsum.html',
			width: 340,
			height: 150
		});
	}	
	if ($('ajaxpageLinkCheck')){ 
		$('ajaxpageLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.ajaxpageWindow();
		});
	}	
	
	MochaUI.jsonWindows = function(){
		var url = 'data/json-windows-data.js';
		var request = new Request.JSON({
			url: url,
			method: 'get',
			onRequest: function(){
				// add code to show loading icon
			}.bind(this),										  
			onComplete: function(properties) {
				MochaUI.newWindowsFromJSON(properties.windows);
				// add code to hide loading icon
			}
		}).send();		
	}	
	if ($('jsonLink')){
		$('jsonLink').addEvent('click', function(e) {
			new Event(e).stop();
			MochaUI.jsonWindows();			
		});
	}	

	MochaUI.youtubeWindow = function(){
		new MochaUI.Window({
			id: 'youtube',
			title: 'YouTube in Iframe',
			loadMethod: 'iframe',
			contentURL: 'pages/youtube.html',
			width: 340,
			height: 285,
			scrollbars: false,
			padding: { top: 0, right: 0, bottom: 0, left: 0 }
		});
	}	
	if ($('youtubeLinkCheck')) {
		$('youtubeLinkCheck').addEvent('click', function(e){
		new Event(e).stop();
			MochaUI.youtubeWindow();
		});
	}	
	
	MochaUI.dataGridWindow = function(){
		// It's a good idea to load your css before the window
		if ( !$('tablesoortcss') ) {
			new Asset.css('plugins/tablesoort/css/tablesoort.css', {id: 'tablesoortcss'});
		}		
		if ( $('tablesoortcss') ) {
			new MochaUI.Window({
				id: 'dataGrid',
				title: 'Example Data Grid',
				loadMethod: 'xhr',
				contentURL: 'plugins/tablesoort/index.html?t=' + new Date().getTime(),
				onContentLoaded: function(){				
					if ( !MochaUI.tablesoortScript == true ){
						new Request({
							url: 'plugins/tablesoort/scripts/tablesoort.js',
							method: 'get',
							onSuccess: function() {
								$$('table.sortTable').each(function(sort){
									new tableSoort(sort.id);
								});
								MochaUI.tablesoortScript = true;							
							}.bind(this)							
						}).send();					
					}
					else {							
						$$('table.sortTable').each(function(sort){
							new tableSoort(sort.id);
						});
					}					
				},
				resizable: false,
				width: 615,
				height: 205,
				padding: { top: 0, right: 0, bottom: 0, left: 0 },				
				x: 20,
				y: 380,
				bodyBgColor: '#fff',
				scrollbars: false
			});		
		}		
	}	
	if ($('dataGridLinkCheck')){ 
		$('dataGridLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.dataGridWindow();
		});
	}	

	
	MochaUI.eventsWindow = function(){	
		new MochaUI.Window({
			id: 'windowevents',
			title: 'Window Events',
			loadMethod: 'xhr',
			contentURL: 'pages/events.html',
			onBeforeBuild: function(){
				alert('This window is about to be built.');
			},			
			onContentLoaded: function(windowEl){
				alert(windowEl.id + '\'s content was loaded.');
			},			
			onClose: function(){
				alert('The window is closing.');
			},
			onCloseComplete: function(){
				alert('The window is closed.');
			},			
			onMinimize: function(windowEl){
				alert(windowEl.id + ' was minimized.');
			},
			onMaximize: function(windowEl){
				alert(windowEl.id + ' was maximized.');
			},
			onRestore: function(windowEl){
				alert(windowEl.id + ' was restored.');
			},			
			onResize: function(windowEl){
				alert(windowEl.id + ' was resized.');
			},
			onFocus: function(windowEl){
				alert(windowEl.id + ' was focused.');
			},
			onBlur: function(windowEl){
				alert(windowEl.id + ' lost focus.');
			},			
			width: 340,
			height: 250
		});
	}	
	if ($('windoweventsLinkCheck')){
		$('windoweventsLinkCheck').addEvent('click', function(e){
			new Event(e).stop();
			MochaUI.eventsWindow();
		});
	}	
	
	MochaUI.cornerRadiusWindow = function(){	
		new MochaUI.Window({
			id: 'cornerRadius',
			title: 'Window Parametrics',
			addClass: 'darkWindow',		
			loadMethod: 'xhr',
			contentURL: 'pages/corner_radius.html',
			onContentLoaded: function(){
				MochaUI.addRadiusSlider.delay(100); // Delay is for IE6
				MochaUI.addShadowSlider.delay(100); // Delay is for IE6					
			},
			width: 300,
			height: 105,
			x: 330,
			y: 385,
			padding: { top: 12, right: 12, bottom: 10, left: 12 },			
			resizable: false,
			maximizable: false,
			bodyBgColor: '#fff'			
		});
	}
	if ($('cornerRadiusLinkCheck')){
		$('cornerRadiusLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.cornerRadiusWindow();
		});
	}	
	
	MochaUI.clockWindow = function(){	
		new MochaUI.Window({
			id: 'clock',
			title: 'Canvas Clock',
			addClass: 'transparent',			
			loadMethod: 'xhr',
			contentURL: 'plugins/coolclock/index.html?t=' + new Date().getTime(),
			onContentLoaded: function(){				
				if ( !MochaUI.clockScript == true ){
					new Request({
						url: 'plugins/coolclock/scripts/coolclock.js?t=' + new Date().getTime(),
						method: 'get',
						onSuccess: function() {							
							if (Browser.Engine.trident) {	
								myClockInit = function(){
									CoolClock.findAndCreateClocks();
								};
								window.addEvent('domready', function(){
									myClockInit.delay(100); // Delay is for IE
								});
								MochaUI.clockScript = true;
							}
							else {
								CoolClock.findAndCreateClocks();
							}						
						}.bind(this)							
					}).send();					
				}
				else {							
					if (Browser.Engine.trident) {	
						myClockInit = function(){
							CoolClock.findAndCreateClocks();
						};
						window.addEvent('domready', function(){
							myClockInit.delay(100); // Delay is for IE
						});
						MochaUI.clockScript = true;
					}
					else {
						CoolClock.findAndCreateClocks();
					}
				}				
			},
			shape: 'gauge',
			footerHeight: 25,			
			width: 160,
			height: 160,
			x: 650,
			y: 75,
			padding: { top: 0, right: 0, bottom: 0, left: 0 }							
		});	
	}
	if ($('clockLinkCheck')){
		$('clockLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.clockWindow();
		});
	}

	// View
	if ($('sidebarLinkCheck')){
		$('sidebarLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.Desktop.sidebarToggle();
		});
	}
	
	if ($('cascadeLink')){
		$('cascadeLink').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.arrangeCascade();
		});
	}
	
	if ($('closeLink')){
		$('closeLink').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.closeAll();
		});
	}
	
	if ($('centerLink')){
		$('centerLink').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.centerWindow();
		});
	}	
	
	// Tools
	MochaUI.builderWindow = function(){	
		new MochaUI.Window({
			id: 'builder',
			title: 'Window Builder',
			loadMethod: 'xhr',
			contentURL: 'pages/builder.html',
			onContentLoaded: function(){
				$('mochaNewWindowSubmit').addEvent('click', function(e){
					new Event(e).stop();
					new MochaUI.WindowForm();
				});
			},
			width: 370,
			height: 400,
			x: 20,
			y: 70
		});
	}
	if ($('builderLinkCheck')){
		$('builderLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.builderWindow();
		});
	}	
	
	// Todo: Add menu check mark functionality for workspaces.
	
	// Workspaces
	
	if ($('saveWorkspaceLink')){
		$('saveWorkspaceLink').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.saveWorkspace();
		});
	}
	
	if ($('loadWorkspaceLink')){
		$('loadWorkspaceLink').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.loadWorkspace();
		});
	}	
	
	// Help
	MochaUI.overviewWindow = function(){	
		new MochaUI.Window({
			id: 'overview',
			title: 'Overview',
			loadMethod: 'xhr',
			contentURL: 'pages/overview.html',
			width: 300,
			height: 200,
			x: 330,
			y: 75,
			scrollbars: false,
			resizable: false,
			maximizable: false,				
			padding: { top: 0, right: 0, bottom: 0, left: 0 },			
			onContentLoaded: function(windowEl){
				this.windowEl = windowEl;
				var accordianDelay = function(){					
					new Accordion('h3.accordianToggler', 'div.accordianElement', {
					//	start: 'all-closed',															   
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
								MochaUI.dynamicResize($('overview'));
							}
							this.windowEl.accordianTimer = this.windowEl.accordianResize.periodical(10);								
						}.bind(this),												
						onComplete: function(){	
							this.windowEl.accordianTimer = $clear(this.windowEl.accordianTimer);
							MochaUI.dynamicResize($('overview')) // once more for good measure
						}.bind(this)									   
					}, $('overview'));
				}.bind(this)
				accordianDelay.delay(100, this); // Delay is a fix for IE
			}				
		});
	}	
	if ($('overviewLinkCheck')){ 
		$('overviewLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.overviewWindow();
		});
	}	
	
	MochaUI.featuresWindow = function(){		
		new MochaUI.Window({
			id: 'features',
			title: 'Features',
			loadMethod: 'xhr',
			contentURL: 'pages/features.html',
			width: 300,
			height: 210,
			x: 650,
			y: 280
		});	
	}
	if ($('featuresLinkCheck')){
		$('featuresLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.featuresWindow();
		});
	}	
	
	MochaUI.faqWindow = function(){
			new MochaUI.Window({
				id: 'faq',
				title: 'FAQ',
				loadMethod: 'xhr',
				contentURL: 'pages/faq.html',
				width: 750,
				height: 350
			});
	}
	if ($('faqLinkCheck')){
		$('faqLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.faqWindow();
		});
	}	
	
	MochaUI.docsWindow = function(){
			new MochaUI.Window({
				id: 'docs',
				title: 'Documentation',
				loadMethod: 'xhr',
				contentURL: 'pages/docs.html',
				width: 750,
				height: 350,
				padding: [10,10,10,10,10]
			});
	}
	if ($('docsLinkCheck')){
		$('docsLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.docsWindow();
		});
	}	
	
	MochaUI.resourcesWindow = function(){
			new MochaUI.Window({
				id: 'resources',
				title: 'Resources',
				loadMethod: 'xhr',
				contentURL: 'pages/resources.html',
				width: 300,
				height: 275,
				x: 20,
				y: 70
			});
	}
	if ($('resourcesLinkCheck')){
		$('resourcesLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.resourcesWindow();
		});
	}	

	MochaUI.helpWindow = function(){
			new MochaUI.Window({
				id: 'help',
				title: 'Support',
				loadMethod: 'xhr',
				contentURL: 'pages/support.html',
				width: 320,
				height: 320,
				x: 20,
				y: 70
			});
	}
	if ($('helpLinkCheck')){
		$('helpLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.helpWindow();
		});
	}	
	
	MochaUI.contributeWindow = function(){
		new MochaUI.Window({
			id: 'contribute',
			title: 'Contribute',
			loadMethod: 'xhr',
			contentURL: 'pages/contribute.html',
			width: 320,
			height: 320,
			x: 20,
			y: 70
		});
	}
	if ($('contributeLinkCheck')){
		$('contributeLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.contributeWindow();
		});
	}	

	MochaUI.aboutWindow = function(){
		new MochaUI.Window({
			id: 'about',
			title: 'Mocha UI Version 0.8',
			loadMethod: 'xhr',
			contentURL: 'pages/about.html',
			modal: true,
			width: 300,
			height: 150
		});
	}
	if ($('aboutLinkCheck')){
		$('aboutLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.aboutWindow();
		});
	}
	
	// Deactivate menu header links
	$$('a.returnFalse').each(function(el){
		el.addEvent('click', function(e){
			new Event(e).stop();
		});
	});
	
	// Build windows onDomReady
	MochaUI.overviewWindow(); 
	//MochaUI.dataGridWindow(); 
	MochaUI.cornerRadiusWindow();
	MochaUI.clockWindow();
	MochaUI.featuresWindow();
	
}

// Initialize MochaUI when the DOM is ready
window.addEvent('domready', function(){
									 
	MochaUI.Desktop = new MochaUI.Desktop();									 
	MochaUI.Dock = new MochaUI.Dock();									 
	MochaUI.Workspaces = new MochaUI.Workspaces();	
	MochaUI.Modal = new MochaUI.Modal();

	initializeWindows();
	
	// Toggle window visibility with Ctrl-Alt-Q
	document.addEvent('keydown', function(event){							 
		if (event.key == 'q' && event.control && event.alt) {
			MochaUI.toggleWindowVisibility();
		}
	});
	
	
});


// This runs when a person leaves your page.
window.addEvent('unload', function(){
	if (MochaUI) MochaUI.garbageCleanUp();
});