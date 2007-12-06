/* -----------------------------------------------------------------

	Script: 
		mocha.js v.0.7
	
	Author:
		Greg Houston, <http://greghoustondesign.com/>
	
	Contributors:
		Scott F. Frederick 
 
	License:
		MIT License
	
   ----------------------------------------------------------------- */

var MochaDesktop = new Class({
	options: {
		draggable: true,
		resizable: true,
		minimizable: true, // this is automatically reset to false if there is no dock
		maximizable: true,
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
		maxHeight: 2000, // maximum height of windows when resized
		windowIDCount: 0 // this should be in initialize since it is a ticker and not an option
	},
	initialize: function(options){		
		this.setOptions(options);
		this.indexLevel = 1;
		this.mochaControlsWidth = 0;
		this.minimizebuttonX = 0;
		this.maximizebuttonX = 0;
		this.closebuttonX = 0;
		this.scrollWidthOffset = 6;
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
		if ($('mochaDock')) { 
			$('mochaDock').setStyles({
				'position': 'absolute',
				'top': null,
				'bottom': 0,
				'left': 0			
			});
		}
		else {
			this.options.minimizable = false; // Minimize is set to false if there is no dock
		}
		$$('#mochaDesktop div.mocha').setStyle('display', 'block');
		this.setDesktopSize();
		this.insertAll($$('#mochaDesktop div.mocha'));
		this.drawAll();
		this.attachDraggable($$('#mochaDesktop div.mocha'));
		this.attachResizable($$('#mochaDesktop div.mocha'));
		this.attachFocus($$('#mochaDesktop div.mocha'));
		this.attachMinimize($$('#mochaDesktop div.mocha'));
		this.attachMaximize($$('#mochaDesktop div.mocha'));
		this.attachClose($$('#mochaDesktop div.mocha'));
		this.addSlider();
		if ($('mochaDock')) {		
			this.initDock($('mochaDock'));	
			this.drawDock($('mochaDock'));
		}
		this.arrangeCascade();

		var mochaModal = new Element('div', {
			'id': 'mochaModalBackground'
		}).injectInside($('mochaDesktop'));

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
		if (window.ie){ // fix for dropdown menus in IE
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
			setTimeout( function(){
				this.drawAll();
			}.bind(this), 100);
		}.bind(this)
	},
	initDock: function (el){
		document.addEvent('mousemove',function (objDoc){
			if(objDoc.event.clientY>(document.body.clientHeight -10))  //-10 because firefox doesn't record outside movement, but IE7 does
			{
				if($('mochaDock').getProperty('AutoHide'))
				{
					$('mochaDock').setStyle('display','block');
				}
			}
		});		
					
		//Insert canvas
		var canvas = new Element('canvas', {
			'class': 'mochaCanvas',
			'id': 'canv1'
		}).injectInside(el);		
		canvas.width = 15;
		canvas.height = 15;
		
		canvas.setStyle('zIndex', 100);
			
		// Dynamically initialize canvas using excanvas. This is only required by IE
		if (window.ie) {
			G_vmlCanvasManager.initElement(canvas);
		}
		
		//Position top or bottom selector
		$('mochaDockPlacement').setProperty('title','Position Dock Top');
			
		//Auto Hide on/off added SFF 12/03/2007
		$('MochaDockAutoHide').setProperty('title','Turn Auto Hide On');
		
			//attach event
		$('mochaDockPlacement').addEvent('click', function(event){
			var objDock=event.target.parentNode;
										   
			//added SFF 12/04/2007
			if($('mochaDock').getProperty('AutoHide') == 'true')
			{
				alert("Currently the Dock-Bar cannot be positioned on 'top' when 'Autohide' is on.")				
				return false;
			}
			
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
				this.drawCircle(ctx, 5 , 3, 3, 241, 102, 116, 1.0); 
				} else {
					objDock.setStyles({
					'position': 'relative',
					'bottom': null,
					'border-top': '1px solid #fff',					
					'border-bottom': '1px solid #bbb'
					})
					$('mochaDesktopHeader').setStyle('height', 74);					
				objDock.setProperty('DockPosition','Top');	
				this.drawCircle(ctx, 5, 3, 3, 0, 255, 0, 1.0);
				}
			
			//update title tag
			$('mochaDockPlacement').setProperty('title',(objDock.getStyle('position') == 'relative')?'Position Dock Bottom':'Position Dock Top');
		}.bind(this));
		
		//attach event Auto Hide Added SFF 12/03/2007
		$('MochaDockAutoHide').addEvent('click', function(event){
			var objDock=event.target.parentNode;
			var ctx = $E('.mochaCanvas',el).getContext('2d');
			
			if(objDock.getProperty('DockPosition')=='Top')
			{
				alert("Currently 'Autohide' is not available when the Dock-Bar is positioned on 'top'.")				
				return false;
		}
		
			//update title tag
			if(objDock.getProperty('AutoHide')=='true'){
				$('MochaDockAutoHide').setProperty('title','Turn Auto Hide On');
				this.drawCircle(ctx, 5 , 12, 3, 241, 102, 116, 1.0);
				objDock.setProperty('AutoHide','false');
				objDock.setStyle('display','block');
			}
			else{
				$('MochaDockAutoHide').setProperty('title','Turn Auto Hide Off');
				this.drawCircle(ctx, 5 , 12, 3, 0, 255, 0, 1.0); 
				objDock.setProperty('AutoHide','true');
				objDock.setStyle('display','none');
			}
		}.bind(this));
		
		//added SFF 12/04/2007
		$('mochaDock').addEvent('mouseout', function(objDock)
		{	if(this.getProperty('AutoHide') == 'true'){ //mozilla doesn't understand true evaluations, so made the property a string???
				if((objDock.event.clientY<(document.body.clientHeight - this.getStyle('height').toInt()))){
					this.setStyle('display', 'none');
				}
			}	
		});
		
	},
	drawDock: function (el){		
		
		var ctx = $E('.mochaCanvas',el).getContext('2d');		
		
		//changed SFF 12/03/2007
		this.drawCircle(ctx, 5 , 3, 3, 241, 102, 116, 1.0); 
		this.drawCircle(ctx, 5 , 12, 3, 241, 102, 116, 1.0);
		
	},	
	newWindow: function(id, title, contentType, content, contentURL, onContentLoaded, modal, width, height, scrollbars, x, y, paddingVertical, paddingHorizontal, bgColor){
		
		var mochaNewWindow = new Element('div', {
			'class': 'mocha',
			'id': 'win' + (++this.options.windowIDCount)
		}).injectInside($('mochaDesktop'));
		
		if (contentType == 'html') {
			mochaNewWindow.setHTML(content);	
		}
		
		if (id){
			mochaNewWindow.setProperty('id', id);
		}

		if (modal) {
			mochaNewWindow.modal = true;
		}
		
		if (contentURL && contentType != 'html') {
			mochaNewWindow.contentURL = contentURL;
			if (contentType == 'iframe'){
				mochaNewWindow.iframe = true;
			}
		}		
		
		mochaNewWindow.setStyles({
			'width': width,
			'height': height,
			'display': 'block'
		});
		
		new Element('h3', {
			'class': 'mochaTitle'
		}).setHTML(title).injectTop(mochaNewWindow);
		
		this.insertAll([mochaNewWindow], onContentLoaded);
		
		this.drawWindow(mochaNewWindow);

		if (scrollbars) {
			scrollbars = 'auto';
		} else {
			scrollbars = 'hidden';			
		}
		
		$E('.mochaScroller', mochaNewWindow).setStyles({
			'overflow': scrollbars,
			'background': bgColor
		});				
		
		$E('.mochaScrollerpad', mochaNewWindow).setStyles({
			'padding-top': paddingVertical,
			'padding-bottom': paddingVertical,
			'padding-left': paddingHorizontal,
			'padding-right': paddingHorizontal			
		});		
		
		
		if (!mochaNewWindow.modal) {		
			this.attachDraggable([mochaNewWindow]);
			this.attachResizable([mochaNewWindow]);
			this.attachFocus([mochaNewWindow]);
			this.attachMinimize([mochaNewWindow]);
			this.attachMaximize([mochaNewWindow]);
		}		
		
		this.attachClose([mochaNewWindow]);		
		if (mochaNewWindow.modal) {	
			mochaNewWindow.setStyles({
				'zIndex': 11000
			});
		} else {
			this.focusThis(mochaNewWindow);
		}
		
		if (x && y) {
			this.options.newWindowPosTop = y;
			this.options.newWindowPosLeft = x;
		} else if (window.webkit ) {
			this.options.newWindowPosTop = (window.innerHeight.toInt() * .5) - (mochaNewWindow.offsetHeight * .5);
			this.options.newWindowPosLeft = (window.innerWidth.toInt() * .5) - (mochaNewWindow.offsetWidth * .5);
		} else {
			this.options.newWindowPosTop = (window.getHeight().toInt() * .5) - (mochaNewWindow.offsetHeight * .5);
			this.options.newWindowPosLeft = (window.getWidth().toInt() * .5) - (mochaNewWindow.offsetWidth * .5);
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
		} else {
			var mochaMorph = new Fx.Morph(mochaNewWindow, {
				'duration': 300
			});
			mochaMorph.start({
				'top': this.options.newWindowPosTop,
				'left': this.options.newWindowPosLeft
			});
		}
	},
	focusThis: function(el){
			this.indexLevel++;
			el.setStyle('zIndex', this.indexLevel);
	},
	setDesktopSize: function(){
			if (window.webkit ) {
				$('mochaDesktop').setStyle('width', (window.innerWidth - 20) + 'px'); // To adjust for scrollbar
				setTimeout( function(){
					$('mochaDesktop').setStyle('width', window.innerWidth + 'px');
				}.bind(this),100);
				$('mochaDesktop').setStyle('height', window.innerHeight + 'px');
				$('mochaPageWrapper').setStyle('height', window.innerHeight + 'px');
				$('mochaPage').setStyle('height', window.innerHeight + 'px');
			}
			else {
				$('mochaDesktop').setStyle('width', (window.getWidth() - 20) + 'px'); // To adjust for scrollbar
				setTimeout( function(){
					$('mochaDesktop').setStyle('width', window.getWidth() + 'px');
				}.bind(this),100);					
				$('mochaDesktop').setStyle('height', window.getHeight() + 'px');
				$('mochaPageWrapper').setStyle('height', window.getHeight() + 'px');
				$('mochaPage').setStyle('height', window.getHeight() + 'px');
			}
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
			$E('.mochaTitle', mochaScrollerpad).remove();

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
		$$('#mochaDesktop div.mocha').each(function(el){
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
		if(el.id==""){el.id='win'+(++this.options.windowIDCount);}
		
		this.setMochaControlsWidth(el);
		
		if (el.maximizeToggle == 'restore') {
			mochaContent.setStyle('height', ($('mochaDesktop').offsetHeight - this.options.headerHeight - this.options.footerHeight + 6));
			mochaContent.setStyle('width', $('mochaDesktop').offsetWidth);
		}
		
		mochaScroller.setStyle('height', mochaContent.getStyle('height'));
		mochaScroller.setStyle('width', mochaContent.getStyle('width'));
		
		//resize iframe when window is resized
		if (el.iframe) {
			$E('.mochaIframe', el).setStyles({
			//	'width': mochaContent.getStyle('width'),
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
		ctx.clearRect(0,0,$('mochaDesktop').offsetWidth,$('mochaDesktop').offsetHeight);
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
	triangleDock: function(ctx,x,y,r,g,b,a){ // give more generic name or remove. no longer used for dock
		ctx.beginPath();
		ctx.moveTo(1,1);
		ctx.lineTo(14,1);
		ctx.lineTo(1,14);
		ctx.fillStyle = 'rgba(' + r +',' + g + ',' + b + ',' + a + ')';	
		ctx.fill();
	},
	//added SFF 12/03/2007
	drawCircle: function(ctx,x,y,diameter,r,g,b,a){
		//circle
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.arc(x,y,diameter,0,Math.PI*2,true);
		ctx.fillStyle = 'rgba(' + r +',' + g + ',' + b + ',' + a + ')';
		ctx.fill();
	},
	maximizebutton: function(ctx,x,y,r,g,b,a){
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
	closebutton: function(ctx,x,y,r,g,b,a){
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
	minimizebutton: function(ctx,x,y,r,g,b,a){
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
								'display': 'none'
							});
						}						
					}.bind(this),
					onComplete: function(){
						if (el.iframe && !window.webkit) {
							$E('.mochaIframe', el).setStyles({
								'display': 'block'
							});
						}					
					}.bind(this)					
				});
			}
		}.bind(this));
	},
	attachResizable: function(elementArray){
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
								'display': 'none'
							});
						}
					}.bind(this),
					onDrag: function(){
						this.drawWindow(el);
					}.bind(this),
					onComplete: function(){
						if (el.iframe && !window.webkit) {
							$E('.mochaIframe', el).setStyles({
								'display': 'block'
							});
						}					
					}.bind(this)					
				});
			}
		}.bind(this));
	},
	attachFocus: function(elementArray){
		elementArray.each(function(element) {
			element.addEvent('click', function(event){
				this.focusThis(element);
			}.bind(this));
		}.bind(this));
	},
	attachMinimize: function(elementArray){	
		elementArray.each(function(element) {
			if (this.options.minimizable && !element.modal){
				$E('.minimizeToggle', element).addEvent('click', function(event){
					var mochaControls = event.target.parentNode;
					var el = mochaControls.parentNode;
						this.minimizeWindow(el);
				}.bind(this));
			}
		}.bind(this));
	},
	attachMaximize: function(elementArray){	
		elementArray.each(function(element) {
			if (this.options.maximizable && !element.modal){
				$E('.maximizeToggle', element).addEvent('click', function(event){
					var mochaControls = event.target.parentNode;
					var el = mochaControls.parentNode;
					if (el.maximizeToggle == 'maximize') {
						$E('.maximizeToggle', element).setProperty('title', 'Restore'); //Set title
						this.maximizeWindow(el);
					} else {
						$E('.maximizeToggle', element).setProperty('title', 'Maximize'); //Set title
						this.restoreWindow(el);
					}
				}.bind(this));
			}
		}.bind(this));
	},
	attachClose: function(elementArray){
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
								el.remove();
						}.bind(this)
					});

					closeMorph.start({
						'opacity': .4
					});

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
				mochaContent.setStyle('height', ($('mochaDesktop').offsetHeight - this.options.headerHeight - this.options.footerHeight + 6));
				mochaContent.setStyle('width', $('mochaDesktop').offsetWidth);
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
		objWin.setStyle('display','none');
		
		var btnEl = new Element('button', {
			'WinAssociated': objWin.id,
			'class': 'mochaDockButton',
			'title': sTitleBarText,
			'id': 'DockButton'+objWin.id
		}).setHTML((sTitleBarText.substring(0,13) + sLongTitle)).injectInside($('mochaDock'));
				
		btnEl.addEvent('click', function(event){		
			//click event will restore the window
			
			var objWin = $(event.target.getProperty('WinAssociated'));
			objWin.setStyle('display','block');
			
			//make "top window" on redisplay
			objWin.fireEvent('click'); //calling click forces the zindex to increment.
			
			//remove this btn element 
			event.target.dispose();
		});
		
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
		$$('#mochaDesktop div.mocha').each(function(el){
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
	},
	addSlider: function(){
		if ($('sliderarea')) {
			this.mochaSlide = new Slider($('sliderarea'), $('sliderknob'), {
				steps: 20,
				offset: 5,
				onChange: function(pos){
					$('updatevalue').setHTML(pos);
					this.options.cornerRadius = pos;
					this.drawAll();
					this.indexLevel++; 
				}.bind(this) 	
			}).set(this.options.cornerRadius);
		}
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

	MOCHA WINDOW
	This class can be removed if you are not creating new windows dynamically.

   ----------------------------------------------------------------- */

var MochaWindow = new Class({
	options: {
		id: null,
		title: 'New Window',
		contentType: 'html', // html, ajax, or iframe
		content: '', // used if contentType is set to 'html'
		contentURL: 'pages/lipsum.html', // used if contentType is set to 'ajax' or 'iframe'	
		onContentLoaded: null,
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
			document.myDesktop.newWindow(this.options.id, this.options.title, this.options.contentType, this.options.content, this.options.contentURL, this.options.onContentLoaded, this.options.modal, this.options.width, this.options.height, this.options.scrollbars, this.options.x, this.options.y, this.options.paddingVertical, this.options.paddingHorizontal, this.options.bgColor)
		} else if ($(this.options.id).getStyle('display') == 'none'){ // instead of creating a duplicate window, restore minimized window
			$(this.options.id).setStyle('display','block');
			$$('#mochaDesktop button.mochaDockButton').each(function(el){
				if (el.getProperty('WinAssociated') == this.options.id){ 										
					el.dispose();
				}
			}.bind(this));	
		} else { // instead of creating a duplicate window, refocus window in question
			document.myDesktop.focusThis($(this.options.id));		
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
	},
	initialize: function(options){
		this.setOptions(options);
		var id = null;
		var title = $('mochaNewWindowHeaderTitle').value;
		if ($('htmlContentType').checked){
			contentType = 'html';
		}
		if ($('ajaxContentType').checked){
			contentType = 'ajax';
		}
		if ($('iframeContentType').checked){
			contentType = 'iframe';
		}
		var content = $('mochaNewWindowContent').value;
		if ($('mochaNewWindowContentURL').value){
			var contentURL = $('mochaNewWindowContentURL').value;
		}		
		if ($('mochaNewWindowModal').checked) {
			modal = true;
		} else {
			modal = null;
		}
		var onContentLoaded = null;
		var width = $('mochaNewWindowWidth').value.toInt();
		var height = $('mochaNewWindowHeight').value.toInt();
		var scrollbars = null;		
		var x = $('mochaNewWindowX').value.toInt();
		var y = $('mochaNewWindowY').value.toInt();
		var paddingVertical = $('mochaNewWindowPaddingVertical').value.toInt();
		var paddingHorizontal = $('mochaNewWindowPaddingHorizontal').value.toInt();
		var bgColor = '#fff';
		document.myDesktop.newWindow(id, title, contentType, content, contentURL, onContentLoaded, modal, width, height, scrollbars, x, y, paddingVertical, paddingHorizontal, bgColor);		
	}
});
MochaWindowForm.implement(new Options);


/* -----------------------------------------------------------------

	ATTACH MOCHA LINK EVENTS
	Here is where you define your windows and the events that open them.
	If you are not using links to run Mocha methods you can remove this function.

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
				height: 250
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
				bgColor: '#000'
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
	$$('#mochaDesktop a.returnFalse').each(function(el){
		el.addEvent('click', function(e){													
			new Event(e).stop();
		});			
	});	
	
}

/* -----------------------------------------------------------------

	Initialize Everything onLoad

   ----------------------------------------------------------------- */

window.addEvent('load', function(){
		document.myToolbars = new MochaToolbars();	
		document.myDesktop = new MochaDesktop();
		attachMochaLinkEvents();
});
