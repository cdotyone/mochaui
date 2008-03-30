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
	var ajaxpageWindow = function(){ 
		new MochaUI.Window({
			id: 'ajaxpage',
			title: 'Content Loaded with an XMLHttpRequest',
			loadMethod: 'xhr',
			contentURL: 'pages/lipsum.html',
			width: 340,
			height: 150
		});
	}	
	if ($('ajaxpageLinkCheck')){ // Associated HTML: <a id="xhrpageLink" href="pages/lipsum.html">XHR Page</a>
		$('ajaxpageLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			ajaxpageWindow();
		});
	}	
	
	var jsonWindows = function(){
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
			jsonWindows();			
		});
	}	

	var mootoolsWindow = function(){
		new MochaUI.Window({
			id: 'mootools',
			title: 'Mootools Forums in an Iframe',
			loadMethod: 'iframe',
			contentURL: 'http://forum.mootools.net/',
			width: 650,
			height: 400,
			scrollbars: false,
			padding: { top: 0, right: 0, bottom: 0, left: 0 }
		});
	}	
	if ($('mootoolsLinkCheck')){
		$('mootoolsLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			mootoolsWindow();
		});
	}	

	var youtubeWindow = function(){
		new MochaUI.Window({
			id: 'youTube',
			title: 'YouTube in Iframe',
			loadMethod: 'iframe',
			contentURL: 'pages/youtube.html',
			width: 340,
			height: 285,
			scrollbars: false,
			padding: { top: 0, right: 0, bottom: 0, left: 0 },
			bgColor: '#000'
		});
	}	
	if ($('youTubeLinkCheck')) {
		$('youTubeLinkCheck').addEvent('click', function(e){
		new Event(e).stop();
			youtubeWindow();
		});
	}	
	
	var dataGridWindow = function(){
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
				width: 615,
				height: 200,
				padding: { top: 0, right: 0, bottom: 0, left: 0 },				
				x: 20,
				y: 375					
			});		
		}		
	}	
	if ($('dataGridLinkCheck')){ 
		$('dataGridLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			dataGridWindow();
		});
	}	

	
	var eventsWindow = function(){	
		new MochaUI.Window({
			id: 'windowevents',
			title: 'Window Events',
			loadMethod: 'xhr',
			contentURL: 'pages/events.html',
			onContentLoaded: function(){
				alert('The window\'s content was loaded.');
			},			
			onClose: function(){
				alert('The window is closing.');
			},
			onMinimize: function(){
				alert('The window was minimized.');
			},
			onMaximize: function(){
				alert('The window was maximized.');
			},
			onResize: function(){
				alert('The window was resized.');
			},
			width: 340,
			height: 250
		});
	}	
	if ($('windoweventsLinkCheck')){
		$('windoweventsLinkCheck').addEvent('click', function(e){
			new Event(e).stop();
			eventsWindow();
		});
	}	
	
	var cornerRadiusWindow = function(){	
		new MochaUI.Window({
			id: 'cornerRadius',
			title: 'Corner Radius Slider',
			addClass: 'darkWindow',		
			loadMethod: 'xhr',
			contentURL: 'pages/corner_radius.html',
			onContentLoaded: function(){
				MochaUI.addSlider.delay(100); // Delay is for IE6					
			},
			width: 300,
			height: 105,
			x: 650,
			y: 305,
			resizable: false,
			maximizable: false,
			bodyBgColor: '#141414',           
			headerStartColor: [92, 92, 92],  
			headerStopColor: [71, 71, 71],  
			footerBgColor: [71, 71, 71] 			
		});
	}
	if ($('cornerRadiusLinkCheck')){
		$('cornerRadiusLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			cornerRadiusWindow();
		});
	}	
	
	var clockWindow = function(){	
		new MochaUI.Window({
			id: 'clock',
			title: 'Canvas Clock',
			addClass: 'darkWindow',
			loadMethod: 'xhr',
			contentURL: 'plugins/coolclock/index.html?t=' + new Date().getTime(),
			onContentLoaded: function(){				
				if ( !MochaUI.clockScript == true ){
					new Request({
						url: 'plugins/coolclock/scripts/coolclock.js',
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
			width: 300,
			height: 160,
			x: 650,
			y: 75,
			scrollbars: false,
			padding: { top: 0, right: 0, bottom: 0, left: 0 },				
			bodyBgColor: '#141414',           
			headerStartColor: [92, 92, 92],  
			headerStopColor: [71, 71, 71],  
			footerBgColor: [71, 71, 71], 
			resizable: false,
			maximizable: false				
		});	
	}
	if ($('clockLinkCheck')){
		$('clockLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			clockWindow();
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
	
	// Tools
	var builderWindow = function(){	
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
			builderWindow();
		});
	}	
	
	// Todo: Add menu check mark functionality for workspaces.
	
	// Workspaces	
	if ($('workspace01LinkCheck')){
		$('workspace01LinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.Workspaces.setWorkspace({index: 0, background: '#8caac7' })
		});
	}
	
	if ($('workspace02LinkCheck')){
		$('workspace02LinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.Workspaces.setWorkspace({index: 1, background: '#595959' })
		});
	}
	
	if ($('workspace03LinkCheck')){
		$('workspace03LinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MochaUI.Workspaces.setWorkspace({index: 2, background: '#BFCFDE' })
		});
	}	
	
	// Help
	var overviewWindow = function(){	
		var accordianPage = new MochaUI.Window({
			id: 'overview',
			title: 'Overview',
			loadMethod: 'xhr',
			contentURL: 'pages/overview.html',
			width: 300,
			height: 200,
			x: 20,
			y: 75,
			scrollbars: false,
			resizable: false,
			maximizable: false,				
			padding: { top: 0, right: 0, bottom: 0, left: 0 },			
			onContentLoaded: function(el){
				var myFunction = function(){
					var accordion = new Accordion('h3.accordianToggler', 'div.accordianElement', {
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
							accordianPage.accordianResize = function(){
								accordianPage.dynamicResize($('accordianpage'));
							}
							accordianPage.accordianTimer = accordianPage.accordianResize.periodical(10);								
						}.bind(this),												
						onComplete: function(){	
							accordianPage.accordianTimer = $clear(accordianPage.accordianTimer);
							accordianPage.dynamicResize($('accordianpage')) // once more for good measure
						}.bind(this)									   
					}, $('overview'));
				}.bind(this)
				myFunction.delay(100); // Delay is a fix for IE
			}				
		});
	}	
	if ($('overviewLinkCheck')){ 
		$('overviewLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			overviewWindow();
		});
	}	
	
	var featuresWindow = function(){		
		new MochaUI.Window({
			id: 'features',
			title: 'Features',
			loadMethod: 'xhr',
			contentURL: 'pages/features.html',
			width: 300,
			height: 230,
			x: 335,
			y: 75				
		});	
	}
	if ($('featuresLinkCheck')){
		$('featuresLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			featuresWindow();
		});
	}	
	
	var faqWindow = function(){
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
			faqWindow();
		});
	}	
	
	var docsWindow = function(){
			new MochaUI.Window({
				id: 'docs',
				title: 'Documentation',
				loadMethod: 'xhr',
				contentURL: 'pages/docs.html',
				width: 750,
				height: 350
			});
	}
	if ($('docsLinkCheck')){
		$('docsLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			docsWindow();
		});
	}	
	
	var resourcesWindow = function(){
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
			resourcesWindow();
		});
	}	

	var helpWindow = function(){
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
			helpWindow();
		});
	}	
	
	var contributeWindow = function(){
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
			contributeWindow();
		});
	}	

	var aboutWindow = function(){
		new MochaUI.Window({
			id: 'about',
			title: 'Mocha UI Version 0.8',
			loadMethod: 'xhr',
			contentURL: 'pages/about.html',
			modal: true,
			resizable: false,
			draggable: false,
			width: 300,
			height: 150
		});
	}
	if ($('aboutLinkCheck')){
		$('aboutLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			aboutWindow();
		});
	}
	
	// Deactivate menu header links
	$$('a.returnFalse').each(function(el){
		el.addEvent('click', function(e){
			new Event(e).stop();
		});
	});
	
	// Build windows onDomReady
	overviewWindow(); 
	dataGridWindow(); 
	cornerRadiusWindow();
	clockWindow();
	featuresWindow();
	
}

// Initialize MochaUI when the DOM is ready
window.addEvent('domready', function(){
	initializeWindows();	
});