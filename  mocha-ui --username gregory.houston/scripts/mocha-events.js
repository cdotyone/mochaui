/* -----------------------------------------------------------------

	ATTACH MOCHA LINK EVENTS
	Notes: Here is where you define your windows and the events that open them.
	If you are not using links to run Mocha methods you can remove this function.
	
	If you need to add link events to links within windows you are creating, do
	it in the onContentLoaded function of the new window.

   ----------------------------------------------------------------- */

function attachMochaLinkEvents(){
	
	
	// Examples
	if ($('ajaxpageLink')){ // Associated HTML: <a id="xhrpageLink" href="pages/lipsum.html">XHR Page</a>
		$('ajaxpageLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'ajaxpage',
				title: 'Content Loaded with an XMLHttpRequest',
				loadMethod: 'xhr',
				contentURL: 'pages/lipsum.html',
				width: 340,
				height: 150
			});
		});
	}

	if ($('jsonLink')){
		$('jsonLink').addEvent('click', function(e) {
			new Event(e).stop();
			var url = 'data/json-windows-data.js';
			var request = new Json.Remote(url, {
				onComplete: function(properties) {
					document.mochaDesktop.newWindowsFromJSON(properties.windows);
				}
			}).send();
		});
	}

	if ($('mootoolsLink')){
		$('mootoolsLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'mootools',
				title: 'Mootools Forums in an Iframe',
				loadMethod: 'iframe',
				contentURL: 'http://forum.mootools.net/',
				width: 650,
				height: 400,
				scrollbars: false,
				paddingVertical: 0,
				paddingHorizontal: 0
			});
		});
	}

	if ($('spirographLink')){
		$('spirographLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'spirograph',
				title: 'Canvas Spirograph in an Iframe',
				loadMethod: 'iframe',
				contentURL: 'pages/spirograph.html',
				width: 340,
				height: 340,
				scrollbars: false,
				paddingVertical: 0,
				paddingHorizontal: 0,
				bgColor: '#c30'
			});
		});
	}
	
	if ($('youTubeLink')) {
		$('youTubeLink').addEvent('click', function(e){
		new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'youTube',
				title: 'YouTube in Iframe',
				loadMethod: 'iframe',
				contentURL: 'pages/youtube.html',
				width: 425,
				height: 355,
				scrollbars: false,
				paddingVertical: 0,
				paddingHorizontal: 0,
				bgColor: '#000'
			});
		});
	}
	
	if ($('accordianLink')){ 
		$('accordianLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'accordianpage',
				title: 'Accordian Example',
				loadMethod: 'xhr',
				contentURL: 'pages/accordian.html',
				width: 300,
				height: 200,
				scrollbars: false,
				resizable: false,
				maximizable: false,				
				paddingVertical: 0,
				paddingHorizontal: 0,				
				onContentLoaded: function(el){
					var myFunction = function(){ var accordion = new Accordion('h3.toggler', 'div.element', {
						opacity: false,
						alwaysHide: true,
						onStart: function(toggler, element){
							document.mochaDesktop.myTimer = setInterval (
								 "document.mochaDesktop.dynamicResize($('accordianpage'))", 10
							);
						}.bind(this),												
						onComplete: function(){							
							clearInterval ( document.mochaDesktop.myTimer );
							document.mochaDesktop.dynamicResize($('accordianpage')) // once more for good measure
						}.bind(this)									   
					}, $('accordion')); }.bind(this)
					myFunction.delay(100);
				}				
			});
		});
	}	
	
	if ($('eventsLink')){
		$('eventsLink').addEvent('click', function(e){
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'events',
				title: 'Window Trigger Options',
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
		});
	}
	
	if ($('cornerRadiusLink')){
		$('cornerRadiusLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'cornerRadius',
				title: 'Corner Radius Slider',
				loadMethod: 'xhr',
				contentURL: 'pages/corner_radius.html',
				onContentLoaded: function(){
					addSlider();
				},
				width: 300,
				height: 105,
				x: 20,
				y: 60
			});
		});
	}

	// View
	if ($('cascadeLink')){
		$('cascadeLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.arrangeCascade();
		});
	}
	
	if ($('closeLink')){
		$('closeLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.closeAll();
		});
	}	
	
	// Tools
	if ($('builderLink')){
		$('builderLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'windowbuilder',
				title: 'Window Builder',
				loadMethod: 'xhr',
				contentURL: 'pages/builder.html',
				onContentLoaded: function(){
					$('mochaNewWindowSubmit').addEvent('click', function(e){
						new Event(e).stop();
						new MochaWindowForm();
					});
				},
				width: 370,
				height: 400,
				x: 20,
				y: 60
			});
		});
	}
	
	// Workspaces	
	if ($('workspace01Link')){
		$('workspace01Link').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaScreens.setScreen(0)
		});
	}
	
	if ($('workspace02Link')){
		$('workspace02Link').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaScreens.setScreen(1)
		});
	}
	
	if ($('workspace03Link')){
		$('workspace03Link').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaScreens.setScreen(2)
		});
	}	
	
	// Help
	if ($('faqLink')){
		$('faqLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'faq',
				title: 'FAQ',
				loadMethod: 'xhr',
				contentURL: 'pages/faq.html',
				width: 320,
				height: 320,
				x: 20,
				y: 60
			});
		});
	}
	
	if ($('docsLink')){
		$('docsLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'docs',
				title: 'Documentation',
				loadMethod: 'xhr',
				contentURL: 'pages/docs.html',
				width: 600,
				height: 350,
				x: 20,
				y: 60
			});
		});
	}
	
	if ($('overviewLink')){
		$('overviewLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'overview',
				title: 'Overview',
				loadMethod: 'xhr',
				contentURL: 'pages/overview.html',
				width: 300,
				height: 255,
				x: 20,
				y: 60
			});
		});
	}

	if ($('resourcesLink')){
		$('resourcesLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'resources',
				title: 'Resources',
				loadMethod: 'xhr',
				contentURL: 'pages/resources.html',
				width: 300,
				height: 275,
				x: 20,
				y: 60
			});
		});
	}
	
	if ($('helpLink')){
		$('helpLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'help',
				title: 'Support',
				loadMethod: 'xhr',
				contentURL: 'pages/support.html',
				width: 320,
				height: 320,
				x: 20,
				y: 60
			});
		});
	}
	
	if ($('contributeLink')){
		$('contributeLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'contribute',
				title: 'Contribute',
				loadMethod: 'xhr',
				contentURL: 'pages/contribute.html',
				width: 320,
				height: 320,
				x: 20,
				y: 60
			});
		});
	}	
	
	if ($('aboutLink')){
		$('aboutLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'about',
				title: 'Mocha UI Version 0.7',
				loadMethod: 'xhr',
				contentURL: 'pages/about.html',
				modal: true,
				width: 300,
				height: 150
			});
		});
	}

	// Deactivate menu header links
	$$('a.returnFalse').each(function(el){
		el.addEvent('click', function(e){
			new Event(e).stop();
		});
	});
	
}