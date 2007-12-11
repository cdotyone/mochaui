/* -----------------------------------------------------------------

	Script: 
		mocha.js v.0.7
	
	Copyright:
		Copyright (c) 2007 Greg Houston, <http://greghoustondesign.com/>
	
	License:
		MIT-style license

	Contributors:
		Scott F. Frederick
		Joel Lindau
	
   ----------------------------------------------------------------- */

var MochaDesktop = new Class({
	options: {
		draggable: true,
		resizable: true,
		minimizable: true, // this is automatically reset to false if there is no dock
		maximizable: true, // this is automatically reset to false if #mochaDesktop is not present
		closable: true,
		headerHeight: 25,
		footerHeight: 30,
		cornerRadius: 9,
		desktopTopOffset: 20, // use a negative number if neccessary to place first window where you want it
		desktopLeftOffset: 290,
		mochaTopOffset: 70, // initial vertical spacing of each window
		mochaLeftOffset: 70, // initial horizontal spacing of each window
		newWindowPosTop: 0, // In the current setup this just initializes the variable and does not effect the position
		newWindowPosLeft: 0, // In the current setup this just initializes the variable and does not effect the position
		minWidth: 250, // minimum width of windows when resized
		maxWidth: 2500, // maximum width of windows when resized
		minHeight: 100,	// minimum height of windows when resized	
		maxHeight: 2000 // maximum height of windows when resized	
	},
	initialize: function(options){		
		this.setOptions(options);		
		this.indexLevel = 1;
		this.mochaControlsWidth = 0;
		this.minimizebuttonX = 0;
		this.maximizebuttonX = 0;
		this.closebuttonX = 0;
		this.scrollWidthOffset = 6;
		this.windowIDCount = 0;
		new Element('canvas');		
		// Add properties to elements in the DOM
		Element.implement({oldTop: ''});
		Element.implement({oldLeft: ''});
		Element.implement({oldWidth: ''});
		Element.implement({oldHeight: ''});
		Element.implement({maximizeToggle: 'maximize'});
		Element.implement({modal: ''});
		Element.implement({iframe: ''});		
		Element.implement({contentURL: ''});		
		$$('div.mocha').setStyle('display', 'block');
		if ($('mochaDesktop')) {
			this.setDesktopSize();			
		}
		else {
			this.options.maximizable = false;		
		}
		if ($('mochaDock')) { 
			if (this.options.minimizable == true){
				$('mochaDock').setStyles({
					'position': 'absolute',
					'top': null,
					'bottom': 0,
					'left': 0			
				});
				this.initDock($('mochaDock'));	
				this.drawDock($('mochaDock'));
			}
			else {
				$('mochaDock').setStyle('display', 'none');	
			}
		}
		else {
			this.options.minimizable = false;
		}		
		this.insertAll($$('div.mocha'));
		this.drawAll();
		this.attachDraggable($$('div.mocha'));
		this.attachResizable($$('div.mocha'));
		this.attachFocus($$('div.mocha'));
		this.attachMinimize($$('div.mocha'));
		this.attachMaximize($$('div.mocha'));
		this.attachClose($$('div.mocha'));	
		this.arrangeCascade();
		
		// Modal initialization
		var mochaModal = new Element('div', {
			'id': 'mochaModalBackground'
		});		

		if ($('mochaDesktop')){
			mochaModal.injectInside($('mochaDesktop'));
		}
		else {
			mochaModal.injectInside(document.body);
		}
		this.setModalSize();

		mochaModal.setStyle('opacity', .4);
		this.modalOpenMorph = new Fx.Morph($('mochaModalBackground'), {
				'duration': 200
				});
		this.modalCloseMorph = new Fx.Morph($('mochaModalBackground'), {
			'duration': 200,
			onComplete: function(){
				$('mochaModalBackground').setStyle('display', 'none');
			}.bind(this)
		});		
		if (window.ie && $("mochaDesktopNavbar")){ // fix for dropdown menus in IE
			var sfEls = $("mochaDesktopNavbar").getElementsByTagName("LI");
			for (var i=0; i<sfEls.length; i++) {
				sfEls[i].onmouseover=function() {
					this.className += " sfhover";
				}
				sfEls[i].onmouseout = function() {
					this.className = this.className.replace(new RegExp(" sfhover\\b"), "");
				}
			}			
		};
		
		window.onresize = function(){			
			this.setDesktopSize();
			this.setModalSize();
			setTimeout( function(){
				this.drawAll();
			}.bind(this), 100);
		}.bind(this)
	},
	initDock: function (el){
		document.addEvent('mousemove',function (objDoc){
			if(objDoc.event.clientY>(document.body.clientHeight -10)) { 
				if($('mochaDock').getProperty('autoHide')) {
					$('mochaDock').setStyle('display','block');
				}
			}
		});		
					
		//Insert canvas
		var canvas = new Element('canvas', {
			'class': 'mochaCanvas',
			'id': 'canv1'
		}).injectInside(el);		
		
		canvas.setStyles({
		   position: 'absolute',
		   top: '4px',
		   left: '2px',
		   zIndex: 2
		   });
		   
		   canvas.width=15;
		   canvas.height=18;
			
		// Dynamically initialize canvas using excanvas. This is only required by IE
		if (window.ie) {
			G_vmlCanvasManager.initElement(canvas);
		}
		
		//Position top or bottom selector
		$('mochaDockPlacement').setProperty('title','Position Dock Top');
			
		//Auto Hide on/off 
		$('mochaDockAutoHide').setProperty('title','Turn Auto Hide On');
		
		//attach event
		$('mochaDockPlacement').addEvent('click', function(event){
			var objDock=event.target.parentNode;
										   
			var ctx = $E('.mochaCanvas',el).getContext('2d');
			
				//switch top pos
			if (objDock.getStyle('position') != 'absolute'){
				objDock.setStyles({
						'position': 'absolute',
						'bottom': 0,
						'border-top': '1px solid #bbb',					
						'border-bottom': '1px solid #fff'
					})
					$('mochaDesktopHeader').setStyle('height', 54);
				objDock.setProperty('DockPosition','Bottom');
				this.drawCircle(ctx, 5, 4, 3, 241, 102, 116, 1.0); 

				if ($('mochaDock').getProperty('autoHide') != 'true' || $('mochaDock').getProperty('autoHideDisabled') != 'true') {
					this.drawCircle(ctx, 5 , 14, 3, 241, 102, 116, 1.0); 
				}
				} else {
					objDock.setStyles({
					'position': 'relative',
					'bottom': null,
					'border-top': '1px solid #fff',					
					'border-bottom': '1px solid #bbb'
					})
					$('mochaDesktopHeader').setStyle('height', 74);					
				objDock.setProperty('DockPosition','Top');	
				this.drawCircle(ctx, 5, 4, 3, 0, 255, 0, 1.0);
				this.drawCircle(ctx, 5, 14, 3, 212, 208, 200, 1.0);
				}			

			//diasble/enable autohide and grey/orange/green out button
			if($('mochaDock').getProperty('autoHide') == 'true' || $('mochaDock').getProperty('autoHideDisabled')=='true')
			{
				if (objDock.getProperty('DockPosition') == 'Bottom') {
					$('mochaDock').setProperty('autoHideDisabled', 'false');
					$('mochaDock').setProperty('autoHide', 'true')
					this.drawCircle(ctx, 5, 14, 3, 0, 255, 0, 1.0);
				}
				else{
					$('mochaDock').setProperty('autoHideDisabled', 'true');
					$('mochaDock').setProperty('autoHide', 'false')
				}
				
			}			
							
			//update title tag
			$('mochaDockPlacement').setProperty('title',(objDock.getStyle('position') == 'relative')?'Position Dock Bottom':'Position Dock Top');
		}.bind(this));
		
		//attach event Auto Hide 
		$('mochaDockAutoHide').addEvent('click', function(event){
			var objDock=event.target.parentNode;
			var ctx = $E('.mochaCanvas',el).getContext('2d');			

			//disable auto hide when Dock bar on top
			if(objDock.getProperty('DockPosition')=='Top'){return false;}
		
			//update title tag
			if(objDock.getProperty('autoHide') == 'true'){
				$('mochaDockAutoHide').setProperty('title', 'Turn Auto Hide On');
				this.drawCircle(ctx, 5 , 14, 3, 241, 102, 116, 1.0);
				objDock.setProperty('autoHide','false');
				objDock.setStyle('display','block');
			}
			else{
				$('mochaDockAutoHide').setProperty('title','Turn Auto Hide Off');
				this.drawCircle(ctx, 5 , 14, 3, 0, 255, 0, 1.0); 
				objDock.setProperty('autoHide','true');
				objDock.setStyle('display','none');
			}
		}.bind(this));		

		$('mochaDock').addEvent('mouseleave', function(objDock)
		{	if(this.getProperty('autoHide') == 'true'){ //mozilla doesn't understand true evaluations, so made the property a string???
				if((objDock.event.clientY < (document.body.clientHeight - this.getStyle('height').toInt()))){
					this.setStyle('display', 'none');
				}
			}	
		});
		
	},
	drawDock: function (el){		
		
		var ctx = $E('.mochaCanvas',el).getContext('2d');		

		this.drawCircle(ctx, 5 , 4, 3, 241, 102, 116, 1.0); 
		this.drawCircle(ctx, 5 , 14, 3, 241, 102, 116, 1.0);
		
	},	
	newWindow: function(properties){
		windowProperties = $extend({
			id: null,
			title: 'New Window',
			contentType: 'html', 				// html, ajax, or iframe
			content: '', 						// used if contentType is set to 'html'
			contentURL: 'pages/lipsum.html',	// used if contentType is set to 'ajax' or 'iframe'	
			onContentLoaded: $empty,			// Event, fired when content is successfully loaded via ajax
			onClose: $empty,					// Event, fired when window is closed
			onMinimize: $empty,					// Event, fired when window is minimized
			onMaximize: $empty,					// Event, fired when window is maximized
			onFocus: $empty,					// Event, fired when window is focused
			onResize: $empty,					// Event, fired when window is resized
			modal: false,
			width: 300,
			height: 125, 
			scrollbars: true,
			x: null,
			y: null,
			paddingVertical: 10,
			paddingHorizontal: 12,
			bgColor: '#fff'
		}, properties || {});
		
		if ( $(windowProperties.id) ) { // Window already exist
			if ( $(windowProperties.id).getStyle('display') == 'none' ) {
				// instead of creating a duplicate window, restore minimized window
				$(windowProperties.id).setStyle('display','block');
				$$('button.mochaDockButton').each(function(el){
					if (el.getProperty('WinAssociated') == windowProperties.id){ 										
						el.dispose();
					}
				});
			} else {
				// Make sure new window gets focus
				setTimeout(function () { this.focusThis($(windowProperties.id)); }.bind(this),10);
			}
			return;
		}
		
		var mochaNewWindow = new Element('div', {
			'class': 'mocha',
			'id': 'win' + (++this.windowIDCount)
		});
		
		if ($('mochaDesktop')){
			mochaNewWindow.injectInside($('mochaDesktop'));
		}
		else {
			mochaNewWindow.injectInside(document.body);
		}		
		
		if (windowProperties.contentType == 'html') {
			mochaNewWindow.setHTML(windowProperties.content);	
		}
		
		if (windowProperties.id){
			mochaNewWindow.setProperty('id', windowProperties.id);
		}

		if (windowProperties.modal) {
			mochaNewWindow.modal = true;
		}
		
		if (windowProperties.contentURL && windowProperties.contentType != 'html') {
			mochaNewWindow.contentURL = windowProperties.contentURL;
			if (windowProperties.contentType == 'iframe'){
				mochaNewWindow.iframe = true;
			}
		}		
		
		mochaNewWindow.setStyles({
			'width': windowProperties.width,
			'height': windowProperties.height,
			'display': 'block'
		});
		
		new Element('h3', {
			'class': 'mochaTitle'
		}).setHTML(windowProperties.title).injectTop(mochaNewWindow);
		
		this.insertAll([mochaNewWindow], windowProperties.onContentLoaded);
		
		this.drawWindow(mochaNewWindow);

		var scrollbars = windowProperties.scrollbars ? 'auto' : 'hidden';
		$E('.mochaScroller', mochaNewWindow).setStyles({
			'overflow': scrollbars,
			'background': windowProperties.bgColor
		});				
		
		$E('.mochaScrollerpad', mochaNewWindow).setStyles({
			'padding-top': windowProperties.paddingVertical,
			'padding-bottom': windowProperties.paddingVertical,
			'padding-left': windowProperties.paddingHorizontal,
			'padding-right': windowProperties.paddingHorizontal			
		});		
		
		
		if (!mochaNewWindow.modal) {		
			this.attachDraggable([mochaNewWindow]);
			this.attachResizable([mochaNewWindow], windowProperties.onResize);
			this.attachFocus([mochaNewWindow], windowProperties.onFocus);
			this.attachMinimize([mochaNewWindow], windowProperties.onMinimize);
			this.attachMaximize([mochaNewWindow], windowProperties.onMaximize);
		}		
		
		this.attachClose([mochaNewWindow], windowProperties.onClose);

		if (windowProperties.x && windowProperties.y) {
			this.options.newWindowPosTop = windowProperties.y;
			this.options.newWindowPosLeft = windowProperties.x;
		}
		else {
			this.options.newWindowPosTop = (this.getWindowHeight() * .5) - (mochaNewWindow.offsetHeight * .5);
			this.options.newWindowPosLeft = (this.getWindowWidth() * .5) - (mochaNewWindow.offsetWidth * .5);
		}
		
		if (mochaNewWindow.modal) {
			$('mochaModalBackground').setStyle('display', 'block');
			this.modalOpenMorph.start({
				'opacity': .55
			});
			mochaNewWindow.setStyles({
				'top': this.options.newWindowPosTop,
				'left': this.options.newWindowPosLeft
			});
		} 
		else {
			var mochaMorph = new Fx.Morph(mochaNewWindow, {
				'duration': 300
			});
			mochaMorph.start({
				'top': this.options.newWindowPosTop,
				'left': this.options.newWindowPosLeft
			});
		}
		
		if (windowProperties.modal) {
			mochaNewWindow.setStyles({
				'zIndex': 11000
			});
		}
		else {
			setTimeout(function() { this.focusThis(mochaNewWindow); }.bind(this), 10);
		}
		//alert(mochaNewWindow.getStyle('zIndex'));
	},
	focusThis: function(el){
		this.indexLevel++;
		el.setStyle('zIndex', this.indexLevel);
	},
	getWindowWidth: function(){
		window.webkit ? windowWidth = window.innerWidth : windowWidth = window.getWidth();
		return windowWidth.toInt();
	},
	getWindowHeight: function(){
		window.webkit ? windowHeight = window.innerHeight : windowHeight = window.getHeight();
		return windowHeight.toInt();
	},	
	setDesktopSize: function(){
		if ($('mochaDesktop')) {
			$('mochaDesktop').setStyle('width', this.getWindowWidth() - 20); // To adjust for broswer scrollbar
			setTimeout( function(){
				$('mochaDesktop').setStyle('width', this.getWindowWidth());
			}.bind(this),100);					
			$('mochaDesktop').setStyle('height', this.getWindowHeight());
			if ($('mochaPageWrapper')){
				$('mochaPageWrapper').setStyle('height', this.getWindowHeight());
			}
		}
	},
	setModalSize: function(){
		$('mochaModalBackground').setStyle('height', this.getWindowHeight());		
	},	
	insertAll: function(elementArray, onContentLoaded){
		elementArray.each(function(el){
			var mochaTempContents = el.innerHTML;
			el.empty();

			if (window.ie6){
				el.innerHTML = '<iframe class="zIndexFix" scrolling="no" marginwidth="0" src="" marginheight="0"></iframe>';
			}
			
			var mochaOverlay = new Element('div', {
				'class': 'mochaOverlay',
				'display': 'none'
			}).injectInside(el);
			
			if (window.ie){
				mochaOverlay.setStyle('zIndex', 2)
			}

			//Insert mochaTitlebar
			var mochaTitlebar = new Element('div', {
				'class': 'mochaTitlebar'
			}).injectTop(mochaOverlay);
			
			if (this.options.draggable && !el.modal){
				mochaTitlebar.setStyle('cursor', 'move');
			}

			var mochaContent = new Element('div', {
				'class': 'mochaContent'
			}).injectInside(mochaOverlay);

			mochaContent.setStyles({
				width: el.getStyle('width'),
				height: el.getStyle('height')
			});

			var mochaScroller = new Element('div', {
				'class': 'mochaScroller'
			}).injectTop(mochaContent);

			var mochaScrollerpad = new Element('div', {
				'class': 'mochaScrollerpad'
			}).setHTML(mochaTempContents).injectInside(mochaScroller);
			
			if (el.iframe){
				var mochaIframe = new Element('iframe', {
					'class': 'mochaIframe',
					'src': el.contentURL,
					'marginwidth': 0,
					'marginheight': 0,
					'frameBorder': 0,
					'scrolling': 'auto'
				}).injectInside(mochaScrollerpad);
			}			
			
			var mochaTitlebarH3 = $E('h3.mochaTitle', mochaScrollerpad).clone().injectInside(mochaTitlebar);
			$E('.mochaTitle', mochaScrollerpad).dispose();

			if(el.contentURL && !el.iframe){
				var url = el.contentURL;
				var myAjax = new Ajax(url, {
					method: 'get',
					update: mochaScrollerpad,
					onRequest: function(){
						//
					},
					onFailure: function(){
						mochaScrollerpad.setHTML('<p>ERROR LOADING AJAX CONTENT</p><p>Make sure all of your content is uploaded to your server, and that you are attempting to load a document from the same domain as this page. Ajax loading will not work on your local machine.</p>');
					},
					onSuccess: function(){
						if ( onContentLoaded ) onContentLoaded();
					}
				}).request();
			}
			
			//Insert canvas
			var canvas = new Element('canvas', {
				'class': 'mochaCanvas'
			}).injectInside(el);
			canvas.width = 1;
			canvas.height = 1;

			// Dynamically initialize canvas using excanvas. This is only required by IE
			if (window.ie) {
				G_vmlCanvasManager.initElement(canvas);
			}

			//Insert resize handles
			if (this.options.resizable && !el.modal){
				var resizeHandle = new Element('div', {
					'class': 'resizeHandle'
				}).injectAfter(mochaOverlay);
			}

			if (window.ie && !el.modal){
				resizeHandle.setStyle('zIndex', 2)	
			}

			//Insert mochaTitlebar controls
			var mochaControls = new Element('div', {
				'class': 'mochaControls'
			}).injectAfter(mochaOverlay);

			if (window.ie){
				mochaControls.setStyle('zIndex', 2)	
			}

			//Insert close button
			if (this.options.closable || el.modal){
				new Element('div', {
					'class': 'mochaClose',
					'title': 'Close Window'
				}).injectInside(mochaControls);
			}				

			//Insert maximize button
			if (this.options.maximizable && !el.modal){
				new Element('div', {
					'class': 'maximizeToggle',
					'title': 'Maximize'
				}).injectInside(mochaControls);
			}

			//Insert minimize button
			if (this.options.minimizable){
				new Element('div', {
					'class': 'minimizeToggle',
					'title': 'Minimize'
				}).injectInside(mochaControls);
			}

		}.bind(this));
	},
	drawAll: function(){
		$$('div.mocha').each(function(el){
			if (el.getStyle('display') != 'none'){ 										
				this.drawWindow(el);
			}
		}.bind(this));	
	},
	drawWindow: function(el, shadows) {
		var mochaIframe = $E('.zIndexFix', el);
		var mochaOverlay = $E('.mochaOverlay', el);
		var mochaContent = $E('.mochaContent', el); 
		var mochaScroller = $E('.mochaScroller', el);
		var mochaTitlebar = $E('.mochaTitlebar', el);
		var mochaCanvas = $E('.mochaCanvas', el);
		var mochaControls = $E('.mochaControls', el);
		
		var ctx = mochaCanvas.getContext('2d');
		
		//assign a unique id to each window, 
		//that doesn't yet have an id
		if(el.id == ""){el.id = 'win' + (++this.windowIDCount);}
		
		this.setMochaControlsWidth(el);
		
		if (el.maximizeToggle == 'restore') {
			mochaContent.setStyle('height', (this.getWindowHeight() - this.options.headerHeight - this.options.footerHeight + 6));
			mochaContent.setStyle('width', this.getWindowWidth());
		}
		
		mochaScroller.setStyle('height', mochaContent.getStyle('height'));
		mochaScroller.setStyle('width', mochaContent.getStyle('width'));
		
		//resize iframe when window is resized
		if (el.iframe) {
			$E('.mochaIframe', el).setStyles({
				'height': mochaContent.getStyle('height')
			});
		}
	
		mochaHeight = mochaContent.scrollHeight;
		mochaWidth = mochaContent.scrollWidth + this.scrollWidthOffset;
		mochaHeight += this.options.headerHeight + this.options.footerHeight;
		
		//firefox returns null and IE returns empty string difference
		var sTitleBarTitle=mochaTitlebar.getProperty('title');
		
		//firefox
		if(sTitleBarTitle == null) {
			sTitleBarTitle = "";
		}
		
	 	mochaOverlay.setStyle('height', mochaHeight);
		el.setStyle('height', mochaHeight);

		//test for Safari
		if (window.webkit) {
			mochaCanvas.setProperties({
				'width': 4000,
				'height': 2000
			});
		} else {
			mochaCanvas.width = mochaWidth;
			mochaCanvas.height = mochaHeight;
		}
		
		// part of the fix for IE6 select z-index bug and FF on Mac scrollbar z-index bug
		if (window.ie6){
			mochaIframe.setStyle('width', mochaWidth);
			mochaIframe.setStyle('height', mochaHeight);
		}
		
		// set width		
		mochaOverlay.setStyle('width', mochaWidth); 
		el.setStyle('width', mochaWidth);
		mochaTitlebar.setStyle('width', mochaWidth - 6);
	
		// Draw shapes
		ctx.clearRect(0, 0, this.getWindowWidth(), this.getWindowHeight());
		if (shadows == null || shadows == false && !window.ie){
			this.roundedRect(ctx, 0, 0, mochaWidth, mochaHeight, this.options.cornerRadius, 0, 0, 0, 0.06); //shadow
			this.roundedRect(ctx, 1, 1, mochaWidth - 2, mochaHeight - 2, this.options.cornerRadius, 0, 0, 0, 0.08); //shadow
			this.roundedRect(ctx, 2, 2, mochaWidth - 4, mochaHeight - 4, this.options.cornerRadius, 0, 0, 0, 0.3); //shadow
		}		
		this.roundedRect(ctx,3,2,mochaWidth-6,mochaHeight-6,this.options.cornerRadius,246,246,246,1.0);	//mocha body
		this.topRoundedRect(ctx,3,2,mochaWidth-this.scrollWidthOffset,this.options.headerHeight,this.options.cornerRadius); //mocha header
		
		if (this.options.closable && this.options.maximizable){
			this.minimizebuttonX = mochaWidth - 53;
		} else if (this.options.closable || this.options.maximizable){
			this.minimizebuttonX = mochaWidth - 34;
		} else {
			this.minimizebuttonX = mochaWidth - 15;
		}
		
		if (this.options.closable){
			this.maximizebuttonX = mochaWidth - 34;
		}
		else {
			this.maximizebuttonX = mochaWidth - 15;
		}
		
		this.closebuttonX = mochaWidth - 15;

			if (this.options.closable || el.modal){
				this.closebutton(ctx, this.closebuttonX, 15, 229, 217, 217, 1.0);
			}
			if (this.options.maximizable && !el.modal){
				this.maximizebutton(ctx, this.maximizebuttonX, 15, 217, 229, 217, 1.0);
			}
			if (this.options.minimizable && !el.modal){
				this.minimizebutton(ctx, this.minimizebuttonX, 15, 231, 231, 209, 1.0); //Minimize
			}
			if (this.options.resizable && !el.modal){
			this.triangle(ctx, mochaWidth - 20, mochaHeight - 20, 12, 12, 209, 209, 209, 1.0); //resize handle
			}
			this.triangle(ctx, mochaWidth - 20, mochaHeight - 20, 10, 10, 0, 0, 0, 0); //invisible dummy object. The last element drawn is not rendered consistently while resizing in IE6 and IE7.
		
	},
	//mocha body
	roundedRect: function(ctx,x,y,width,height,radius,r,g,b,a){
		ctx.fillStyle = 'rgba(' + r +',' + g + ',' + b + ',' + a + ')';
		ctx.beginPath();
		ctx.moveTo(x,y+radius);
		ctx.lineTo(x,y+height-radius);
		ctx.quadraticCurveTo(x,y+height,x+radius,y+height);
		ctx.lineTo(x+width-radius,y+height);
		ctx.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
		ctx.lineTo(x+width,y+radius);
		ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
		ctx.lineTo(x+radius,y);
		ctx.quadraticCurveTo(x,y,x,y+radius);
		ctx.fill(); 
	},
	//mocha header with gradient background
	topRoundedRect: function(ctx,x,y,width,height,radius){

		// Create gradient
		if (window.opera != null ){
			var lingrad = ctx.createLinearGradient(0,0,0,this.options.headerHeight+2);
		}
		else {
			var lingrad = ctx.createLinearGradient(0,0,0,this.options.headerHeight);
		}
		lingrad.addColorStop(0, 'rgba(250,250,250,100)');
		lingrad.addColorStop(1, 'rgba(228,228,228,100)');
		ctx.fillStyle = lingrad;

		// draw header
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.lineTo(x,y+height);
		ctx.lineTo(x+width,y+height);
		ctx.lineTo(x+width,y+radius);
		ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
		ctx.lineTo(x+radius,y);
		ctx.quadraticCurveTo(x,y,x,y+radius);
		ctx.fill(); 
	},
	// resize handle
	triangle: function(ctx,x,y,width,height,r,g,b,a){
		ctx.beginPath();
		ctx.moveTo(x+width,y);
		ctx.lineTo(x,y+height);
		ctx.lineTo(x+width,y+height);
		ctx.closePath();
		ctx.fillStyle = 'rgba(' + r +',' + g + ',' + b + ',' + a + ')';
		ctx.fill();
	},
	drawCircle: function(ctx,x,y,diameter,r,g,b,a){
		//circle
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.arc(x,y,diameter,0,Math.PI*2,true);
		ctx.fillStyle = 'rgba(' + r +',' + g + ',' + b + ',' + a + ')';
		ctx.fill();
	},
	maximizebutton: function(ctx,x,y,r,g,b,a){ // this could reuse the drawCircle method above
		//circle
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.arc(x,y,7,0,Math.PI*2,true);
		ctx.fillStyle = 'rgba(' + r +',' + g + ',' + b + ',' + a + ')';
		ctx.fill();
		//X sign
		ctx.beginPath();
		ctx.moveTo(x,y-4);
		ctx.lineTo(x,y+4);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x-4,y);
		ctx.lineTo(x+4,y);
		ctx.stroke();
	},
	closebutton: function(ctx,x,y,r,g,b,a){ // this could reuse the drawCircle method above
		//circle
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.arc(x,y,7,0,Math.PI*2,true);
		ctx.fillStyle = 'rgba(' + r +',' + g + ',' + b + ',' + a + ')';
		ctx.fill();
		//plus sign
		ctx.beginPath();
		ctx.moveTo(x-3,y-3);
		ctx.lineTo(x+3,y+3);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x+3,y-3);
		ctx.lineTo(x-3,y+3);
		ctx.stroke();
	},
	minimizebutton: function(ctx,x,y,r,g,b,a){ // this could reuse the drawCircle method above
		//circle
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.arc(x,y,7,0,Math.PI*2,true);
		ctx.fillStyle = 'rgba(' + r +',' + g + ',' + b + ',' + a + ')';
		ctx.fill();
		//minus sign
		ctx.beginPath();
		ctx.moveTo(x-4,y);
		ctx.lineTo(x+4,y);
		ctx.stroke();
	},
	attachDraggable: function(elementArray){
		elementArray.each(function(el){
			if (this.options.draggable && !el.modal){
				var mochaHandle = $E('.mochaTitlebar', el)	
				new Drag.Move(el, {
					handle: mochaHandle,
					onStart: function(){  
						this.focusThis(el);
						if (el.iframe && !window.webkit) {
							$E('.mochaIframe', el).setStyles({
								'visibility': 'hidden'
							});
						}						
					}.bind(this),
					onComplete: function(){
						if (el.iframe && !window.webkit) {
							$E('.mochaIframe', el).setStyles({
								'visibility': 'visible'
							});
						}					
					}.bind(this)					
				});
			}
		}.bind(this));
	},
	attachResizable: function(elementArray, onResize){
		elementArray.each(function(el){		
			if (this.options.resizable && !el.modal){
				var mochaContent = $E('.mochaContent', el);
				var resizeHandle = $E('.resizeHandle', el);
				mochaContent.makeResizable({
					handle: resizeHandle,
					modifiers: {
						x: 'width',
						y: 'height'
					},
					limit: {
						x:[this.options.minWidth,this.options.maxWidth],
						y:[this.options.minHeight,this.options.maxHeight]
					},
					onStart: function(){
						if (el.iframe && !window.webkit) {
							$E('.mochaIframe', el).setStyles({
								'visibility': 'hidden'
							});
						}
					}.bind(this),
					onDrag: function(){
						this.drawWindow(el);
					}.bind(this),
					onComplete: function(){
						if (el.iframe && !window.webkit) {
							$E('.mochaIframe', el).setStyles({
								'visibility': 'visible'
							});
						}
					if (onResize){onResize();} // checks for onResize since windows generated at startup do not have this option						
					}.bind(this)					
				});
			}
		}.bind(this));
	},
	attachFocus: function(elementArray, onFocus){
		elementArray.each(function(element) {
			element.addEvent('click', function(event){
				// Only focus when needed, otherwize onFocus() will run on every click
				if ( element.getStyle('zIndex').toInt() < this.indexLevel ) {
				this.focusThis(element);
					if (onFocus){onFocus();} // checks for onFocus since windows generated at startup do not have this option
				}
			}.bind(this));
		}.bind(this));
	},
	attachMinimize: function(elementArray, onMinimize){	
		elementArray.each(function(element) {
			if (this.options.minimizable && !element.modal){
				$E('.minimizeToggle', element).addEvent('click', function(event){
					var mochaControls = event.target.parentNode;
					var el = mochaControls.parentNode;
					this.minimizeWindow(el);
					if (onMinimize){onMinimize();}	// checks for onMinimize since windows generated at startup do not have this option
				}.bind(this));
			}
		}.bind(this));
	},
	attachMaximize: function(elementArray, onMaximize) {	
		elementArray.each(function(element) {
			if (this.options.maximizable && !element.modal){
				$E('.maximizeToggle', element).addEvent('click', function(event){
					var mochaControls = event.target.parentNode;
					var el = mochaControls.parentNode;
					if (el.maximizeToggle == 'maximize') {
						$E('.maximizeToggle', element).setProperty('title', 'Restore'); //Set title
						this.maximizeWindow(el);
						if(onMaximize){onMaximize();} // checks for onMaximize since windows generated at startup do not have this option
					} else {
						$E('.maximizeToggle', element).setProperty('title', 'Maximize'); //Set title
						this.restoreWindow(el);
					}
				}.bind(this));
			}
		}.bind(this));
	},
	attachClose: function(elementArray, onClose){
		elementArray.each(function(element) {
			if (this.options.closable || element.modal){
				$E('.mochaClose', element).addEvent('click', function(event){
					var mochaControls = event.target.parentNode;
					var el = mochaControls.parentNode;
					this.drawWindow(el, false);

					if (element.modal) {
						this.modalCloseMorph.start({
							'opacity': 0
						});
					}

					var closeMorph = new Fx.Morph(el, {
						'duration': 250,
						onComplete: function(){
								el.dispose();
						}.bind(this)
					});

					closeMorph.start({
						'opacity': .4
					});
					if (onClose){onClose();} // checks for onClose since windows generated at startup do not have this option
				}.bind(this));
			}
		}.bind(this));
	},
	setMochaControlsWidth: function(el){
		this.mochaControlsWidth = 0;
		if (this.options.minimizable && !el.modal){
			this.mochaControlsWidth += 19;
			if (this.options.maximizable){
				$E('.maximizeToggle', el).setStyle('margin-left', 5);
			}
		}
		if (this.options.maximizable && !el.modal){
			this.mochaControlsWidth += 19;
			
		}		
		if (this.options.closable || el.modal){
			this.mochaControlsWidth += 19;
			if (this.options.maximizable || this.options.minimizable){
				$E('.mochaClose', el).setStyle('margin-left', 5);
			}
		}
		$E('.mochaControls', el).setStyle('width', this.mochaControlsWidth - 5);
	},
	maximizeWindow: function(el) {
		var mochaContent = $E('.mochaContent', el);	

		$(el).oldTop = $(el).getStyle('top');
		$(el).oldLeft = $(el).getStyle('left');
		mochaContent.oldWidth = mochaContent.getStyle('width');
		mochaContent.oldHeight = mochaContent.getStyle('height');

		var mochaMorph = new Fx.Morph(el, { 
			'duration': 200,
			'onComplete': function(el){
				mochaContent.setStyle('height', (this.getWindowWidth() - this.options.headerHeight - this.options.footerHeight + 6));
				mochaContent.setStyle('width', this.getWindowHeight());
				this.drawWindow(el);
			}.bind(this)
		});
		mochaMorph.start({
			'top': -3, // takes shadow width into account
			'left': -3 // takes shadow width into account
		});
		$(el).maximizeToggle = 'restore';
	},
	minimizeWindow: function(el) {
		var mochaContent = $E('.mochaContent', el);
		this.addToMinimizeDock(el)
	},
	addToMinimizeDock: function (el) {
		//get handle to window
		var mochaControls = $E('.mochaControls',el);
		var objWin  = mochaControls.parentNode
	
		//capture title bar text
		var sTitleBarHTML = $E('.mochaTitlebar',el).innerHTML;
		var sTitleBarText = $E('.mochaTitle',el).innerHTML; //must use mochaTitle and innerhtml because firefox doesn't support innerText on mochaTitlebar element
			
		//check for long title
		var sLongTitle = "...";
		if(sTitleBarText.length <= 13){sLongTitle = ""};
		
		//hide window
		objWin.setStyle('visibility','hidden');
		
		var btnEl = new Element('button', {
			'WinAssociated': objWin.id,
			'class': 'mochaDockButton',
			'title': sTitleBarText,
			'id': 'DockButton'+objWin.id
		}).setHTML((sTitleBarText.substring(0,13) + sLongTitle)).injectInside($('mochaDock'));
				
		btnEl.addEvent('click', function(event){		
			//click event will restore the window			
			var objWin = $(event.target.getProperty('WinAssociated'));
			objWin.setStyle('visibility','visible');

			this.focusThis(objWin);
			
			//remove this btn element 
			event.target.dispose();
		}.bind(this));
		
	},
	restoreWindow: function(el) {
		var mochaContent = $E('.mochaContent', el);
		mochaContent.setStyle('width', mochaContent.oldWidth);
		mochaContent.setStyle('height', mochaContent.oldHeight);
		$(el).maximizeToggle = 'maximize';
		this.drawWindow(el);
		var mochaMorph = new Fx.Morph(el, { 
			'duration': 150
		});
		mochaMorph.start({
			'top': $(el).oldTop,
			'left': $(el).oldLeft
		});
	},
	arrangeCascade: function(){
		var x = this.options.desktopLeftOffset
		var y = this.options.desktopTopOffset;		
		$$('div.mocha').each(function(el){
			if (el.getStyle('display') != 'none'){										
				this.focusThis(el);										
				x += this.options.mochaLeftOffset;
				y += this.options.mochaTopOffset;			
				var mochaMorph = new Fx.Morph(el, {
					'duration': 550
				});
				mochaMorph.start({
					'top': y,
					'left': x
				});
			}
		}.bind(this));
	}
});
MochaDesktop.implement(new Options);

/* -----------------------------------------------------------------

	MOCHA TOOLBARS
	This class can be removed if you are not using the Mocha UI toolbars.
	Not yet implemented

   ----------------------------------------------------------------- */
   
var MochaToolbars = new Class({
	options: {
		titlebar: true,
		menubar: true,
		dock: true		
	},
	initialize: function(options){		
		this.setOptions(options);
	}
});	
MochaToolbars.implement(new Options);

/* -----------------------------------------------------------------

	MOCHA SCREENS
	This class can be removed if you are not creating multiple screens/workspaces.

   ----------------------------------------------------------------- */

var MochaScreens = new Class({
	options: {
		defaultScreen: 0 // Default screen	
	},
	initialize: function(options){
		this.setOptions(options);
		this.setScreen(this.options.defaultScreen);			
	},
	setScreen: function(index) {
		if ( !$('mochaScreens') )
			return;
		$$('#mochaScreens div.screen').each(function(el,i) {
			el.setStyle('display', i == index ? 'block' : 'none');
		});
	}	
});		
MochaScreens.implement(new Options);

/* -----------------------------------------------------------------

	MOCHA WINDOW
	This class can be removed if you are not creating new windows dynamically.

   ----------------------------------------------------------------- */

var MochaWindow = new Class({
	options: {
		id: null,
		title: 'New Window',
		contentType: 'html', 			 // html, ajax, or iframe
		content: '', 					 // used if contentType is set to 'html'
		contentURL: 'pages/lipsum.html', // used if contentType is set to 'ajax' or 'iframe'	
		onContentLoaded: $empty,
		onMinimize: $empty,				 // Event, fired when window is minimized
		onMaximize: $empty,				 // Event, fired when window is maximized
		onFocus: $empty,				 // Event, fired when window is focused
		onResize: $empty,				 // Event, fired when window is resized
		onClose: $empty,
		modal: false,
		width: 300,
		height: 125,
		scrollbars: true, // true sets the overflow to auto and false sets it to hidden
		x: null, // if x or y is null or modal is false the new window is centered on the screen
		y: null,
		paddingVertical: 10,
		paddingHorizontal: 12,
		bgColor: '#fff'
	},
	initialize: function(options){		
		this.setOptions(options);
		
		if (!$(this.options.id)){
			document.myDesktop.newWindow(this.options);
		}		
	}
});		
MochaWindow.implement(new Options);

/* -----------------------------------------------------------------

	MOCHA WINDOW FROM FORM
	This class can be removed if you are not creating new windows dynamically from a form.

   ----------------------------------------------------------------- */

var MochaWindowForm = new Class({
	options: {
		id: null,
		title: 'New Window',
		contentType: 'html', // html, ajax, or iframe
		content: '', // used if contentType is set to 'html'
		contentURL: 'pages/lipsum.html', // used if contentType is set to 'ajax' or 'iframe'	
		onContentLoaded: $empty,
		onMinimize: $empty,					// Event, fired when window is minimized
		onMaximize: $empty,					// Event, fired when window is maximized
		onFocus: $empty,					// Event, fired when window is focused
		onResize: $empty,					// Event, fired when window is resized
		onClose: $empty,
		modal: false,
		width: 300,
		height: 125,
		scrollbars: true, // true sets the overflow to auto and false sets it to hidden
		x: null, // if x or y is null or modal is false the new window is centered in the browser window
		y: null,
		paddingVertical: 10,
		paddingHorizontal: 12,
		bgColor: '#fff'
	},
	initialize: function(options){
		this.setOptions(options);
		this.options.title = $('mochaNewWindowHeaderTitle').value;
		if ($('htmlContentType').checked){
			this.options.contentType = 'html';
		}
		if ($('ajaxContentType').checked){
			this.options.contentType = 'ajax';
		}
		if ($('iframeContentType').checked){
			this.options.contentType = 'iframe';
		}
		this.options.content = $('mochaNewWindowContent').value;
		if ($('mochaNewWindowContentURL').value){
			this.options.contentURL = $('mochaNewWindowContentURL').value;
		}		
		if ($('mochaNewWindowModal').checked) {
			this.options.modal = true;
		}
		this.options.onContentLoaded = null;
		this.options.width = $('mochaNewWindowWidth').value.toInt();
		this.options.height = $('mochaNewWindowHeight').value.toInt();	
		this.options.x = $('mochaNewWindowX').value.toInt();
		this.options.y = $('mochaNewWindowY').value.toInt();
		this.options.paddingVertical = $('mochaNewWindowPaddingVertical').value.toInt();
		this.options.paddingHorizontal = $('mochaNewWindowPaddingHorizontal').value.toInt();
		this.options.bgColor = '#fff';
		document.myDesktop.newWindow(this.options);		
	}
});
MochaWindowForm.implement(new Options);


/* -----------------------------------------------------------------

	ATTACH MOCHA LINK EVENTS
	Here is where you define your windows and the events that open them.
	If you are not using links to run Mocha methods you can remove this function.
	
	If you need to add link events to links within windows you are creating, do
	it in the onContentLoaded function of the new window.

   ----------------------------------------------------------------- */

function attachMochaLinkEvents(){
	
	if ($('ajaxpageLink')){ // Associated HTML: <a id="ajaxpageLink" href="pages/lipsum.html">Ajax Page</a>
		$('ajaxpageLink').addEvent('click', function(e){	
			new Event(e).stop();
			new MochaWindow({
				id: 'ajaxpage',
				title: 'Window Content Loaded with Ajax',
				contentType: 'ajax',
				contentURL: 'pages/lipsum.html',
				width: 340,
				height: 150
			});
		});
	}
	
	if ($('mootoolsLink')){
		$('mootoolsLink').addEvent('click', function(e){	
			new Event(e).stop();
			new MochaWindow({
				id: 'mootools',
				title: 'Mootools Forums in an Iframe',
				contentType: 'iframe',
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
			new MochaWindow({
				id: 'spirograph',
				title: 'Canvas Spirograph in an Iframe',
				contentType: 'iframe',
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
	
	if ($('cornerRadiusLink')){
		$('cornerRadiusLink').addEvent('click', function(e){	
			new Event(e).stop();
			new MochaWindow({
				id: 'cornerRadius',
				title: 'Corner Radius Slider',
				contentType: 'ajax',
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
	
	if ($('triggersLink')){
		$('triggersLink').addEvent('click', function(e){	
			new Event(e).stop();
			new MochaWindow({
				id: 'triggers',
				title: 'Window Trigger Options',
				contentType: 'ajax',
				contentURL: 'pages/triggers.html',
				onContentLoaded: function(){
					alert('The window\'s content was loaded.');
				},			
				onClose: function(){
					alert('The window was closed.');
				},
				onMinimize: function(){
					alert('The window was minimized.');
				},
				onMaximize: function(){
					alert('The window was maximized.');
				},
				onFocus: function(){
					alert('The window was focused.');
				},
				onResize: function(){
					alert('The window was resized.');
				},				
				width: 340,
				height: 250
			});
		});
	}	
	
	if ($('builderLink')){
		$('builderLink').addEvent('click', function(e){	
			new Event(e).stop();
			new MochaWindow({
				id: 'windowbuilder',
				title: 'Window Builder',
				contentType: 'ajax',
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
	
	if ($('faqLink')){
		$('faqLink').addEvent('click', function(e){	
			new Event(e).stop();
			new MochaWindow({
				id: 'faq',
				title: 'FAQ',
				contentType: 'ajax',
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
			new MochaWindow({
				id: 'docs',
				title: 'Documentation',
				contentType: 'ajax',
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
			new MochaWindow({
				id: 'overview',
				title: 'Overview',
				contentType: 'ajax',
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
			new MochaWindow({
				id: 'resources',
				title: 'Resources',
				contentType: 'ajax',
				contentURL: 'pages/resources.html',
				width: 300,
				height: 275,
				x: 20,
				y: 60					
			});
		});
	}
	
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
	
	if ($('helpLink')){
		$('helpLink').addEvent('click', function(e){	
			new Event(e).stop();
			new MochaWindow({
				id: 'help',
				title: 'Support',
				contentType: 'ajax',
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
			new MochaWindow({
				id: 'contribute',
				title: 'Contribute',
				contentType: 'ajax',
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
			new MochaWindow({
				id: 'about',
				title: 'Mocha UI Version 0.7',
				contentType: 'ajax',
				contentURL: 'pages/about.html',
				modal: true,
				width: 300,
				height: 150
			});
		});
	}
	
	if ($('cascadeLink')){
		$('cascadeLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.myDesktop.arrangeCascade();
		});
	}
	
	// Deactivate menu header links
	$$('a.returnFalse').each(function(el){
		el.addEvent('click', function(e){													
			new Event(e).stop();
		});			
	});	
	
}

/* -----------------------------------------------------------------

	Corner Radius Slider
	Remove this function and it's reference in onload if you are not
	using the example corner radius slider

   ----------------------------------------------------------------- */


function addSlider(){
	if ($('sliderarea')) {
		mochaSlide = new Slider($('sliderarea'), $('sliderknob'), {
			steps: 20,
			offset: 5,
			onChange: function(pos){
				$('updatevalue').setHTML(pos);
				document.myDesktop.options.cornerRadius = pos;
				document.myDesktop.drawAll();
				document.myDesktop.indexLevel++; 
			}
		}).set(document.myDesktop.options.cornerRadius);
	}
}

/* -----------------------------------------------------------------

	Initialize Everything onLoad

   ----------------------------------------------------------------- */

window.addEvent('load', function(){
		document.myToolbars = new MochaToolbars();
		document.mochaScreens = new MochaScreens();
		document.myDesktop = new MochaDesktop();
		attachMochaLinkEvents();
		addSlider(); // remove this if you remove the example corner radius slider
});
