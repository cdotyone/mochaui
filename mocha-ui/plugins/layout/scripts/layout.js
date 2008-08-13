/*

Script: Layout.js
	Create web application layouts.
	
Copyright:
	Copyright (c) 2007-2008 Greg Houston, <http://greghoustondesign.com/>.	

License:
	MIT-style license.	

Requires:
	Core.js, Desktop.js, Window.js 
	
*/


	// Remaining Height
	function rHeight(){	
		$$('div.rHeight').each(function(el){
			var currentHeight = el.offsetHeight.toInt();
			currentHeight -= el.getStyle('border-top').toInt();		
			currentHeight -= el.getStyle('border-bottom').toInt();						
		
			var parent = el.getParent();		
			this.height = 0;
		
			// Get the total height of all the parent element's children
			parent.getChildren().each(function(el){
				this.height += el.offsetHeight.toInt();												
			}.bind(this));
		
			// Add the remaining height to the current element
			var remainingHeight = parent.offsetHeight.toInt() - this.height;			
			el.setStyle('height', currentHeight + remainingHeight);

		});
	}
	
	// Remaining Width
	function rWidth(){	
		$$('div.rWidth').each(function(el){
			var currentWidth = el.offsetWidth.toInt();
			currentWidth -= el.getStyle('border-left').toInt();		
			currentWidth -= el.getStyle('border-right').toInt();						
		
			var parent = el.getParent();		
			this.width = 0;
			
			// Get the total width of all the parent element's children
			parent.getChildren().each(function(el){
				// el.setStyle('left', this.width);
				this.width += el.offsetWidth.toInt();														
			}.bind(this));
		
			// Add the remaining width to the current element
			var remainingWidth = parent.offsetWidth.toInt() - this.width;		
			el.setStyle('width', currentWidth + remainingWidth);			
			
		});
	}
	
function addResizeRight(element, minWidth, maxWidth){
	if (!$(element)) return;
	var handle = $(element).getNext('div.columnHandle')
	handle.setStyle('cursor', 'e-resize');
	$(element).makeResizable({
		handle: handle,
		modifiers: {x: 'width', y: false},
		limit: { x: [minWidth, maxWidth] },					
		onDrag: function(){

			rWidth();
		}.bind(this),
		onComplete: function(){

			rWidth();
		}.bind(this)		
	});
	
}

function addResizeLeft(element, minWidth, maxWidth){
	if (!$(element)) return;
	var handle = $(element).getPrevious('div.columnHandle');
	element = $(element);
	handle.setStyle('cursor', 'e-resize');
	element.makeResizable({
		handle: handle,
		modifiers: {x: 'width' , y: false},
		//	limit: {
		//		x: [
		//			function(){
		//				return element.getCoordinates().right.toInt() - element.offsetWidth.toInt() + minWidth;
		//			}.bind(this),
		//			function(){
		//				//return element.getCoordinates().left.toInt() - element.offsetWidth.toInt() + maxWidth;
		//			}.bind(this)
		//		]
		//	},	
		onBeforeStart: function(){
			this.originalWidth = element.offsetWidth.toInt();
		}.bind(this),							
		onDrag: function(){
			var newWidth = this.originalWidth + (this.originalWidth - element.offsetWidth.toInt());
			if (newWidth < minWidth) {
				newWidth = minWidth;
			}
			else if (newWidth > maxWidth) {
				newWidth = maxWidth;
			}			
			$(element).setStyles({
				'width': newWidth
			});
			rWidth();
		}.bind(this),
		onComplete: function(){
			//var newWidth = element.offsetWidth.toInt();
			rWidth();
		}.bind(this)		
	});
}

function initLayout(){	
	rHeight();
	rWidth();
	$$('.pad').setStyle('display','block'); // IE6 Fix
		
	window.addEvent('resize', function(){
		$$('.pad').setStyle('display','none'); // IE6 Fix
		rHeight();
		rWidth();		
		$$('.pad').setStyle('display','block'); // IE6 Fix			
	});
}