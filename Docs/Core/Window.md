Class: MUI.Window {#MUI-Window}
=============================

Creates a single MochaUI window.

### Notes:

 - For content to load via xhr all the files must be online and in the same domain. If you need to load content from another domain or wish to have it work offline, load the content in an iframe instead of using the xhr option.
 - If you use the iframe loadMethod your iframe will automatically be resized when the window it is in is resized. If you want this same functionality when using one of the other load options simply add class="mochaIframe" to those iframes and they will be resized for you as well.

### Syntax:

	var myWindow = new MUI.Window(options);

### Arguments:

options - (*object*) - Options listed below.

#### Options:

* id 				- (*string*) the ID of the window. If not defined, it will be set to 'win' + MUI.IDCount.
* title 			- (*string*) the title of the window.
* icon 				- (*string*) place an icon in the window's titlebar. This is either set to false or to the url of the icon. It is set up for icons that are 16 x 16px.
* type 				- (*string*: defaults to 'window') valid values are 'window', 'modal', 'modal2', or 'notification', Modals should be created with new MUI.Modal(options).
* loadMethod 		- ('html', 'xhr', or 'iframe') defaults to 'html' if there is no contentURL. Defaults to 'xhr' if there is a contentURL. You only really need to set this if using the 'iframe' method.
* contentURL 		- (*string*) used if loadMethod is set to 'xhr' or 'iframe'.
* closeAfter 		- (*integer*) time in milliseconds. Closes the window after a certain period of time in milliseconds. This is particularly useful for notifications.
* evalScripts 		- (*boolean*) an xhr loadMethod option. Defaults to true.
* evalResponse 		- (*boolean*) an xhr loadMethod option. Defaults to false.
* content 			- (*string* or *element*) an html loadMethod option.
* sections 			- (*object*) - array of hashes - list of additional sections to insert content into
** position 		- (*string*) identifies where to insert the content
*** 'header' = in the window title header
*** 'top' = below the window title right above the content, good for tabs - DEFAULT
*** 'bottom' = below the content, above the window's footer
*** 'footer' = in the footer of the window
** wrap				- (*boolean*: defaults to false) used to wrap content div, good for things like tabs, ignored when position = 'header' or 'footer'
** empty			- (*boolean*: defaults to false) true to empty the section before inserted, ignored when position = 'top' or 'bottom'
** height			- (*integer*) the height of the content div being added
** id				- (*string*) the name of the content div being added
** css				- (*string*) root css name for content div being added
** method			- (*string*) ('get', or 'post') the way data is transmitted. Defaults to get
** data				- (*hash*) data to be transmitted
** content			- (*string* or *element*) an 'html' or 'json' loadMethod option.
** loadMethod		- (*string*: defaults to 'xhr') valid values are 'json', 'html', 'xhr', or 'iframe'.
** url				- (*string*) this option should be used if loadMethod is set to 'xhr', 'json' or 'iframe'.
** section			- (*string*) this is used to name the section being update, such as 'content,'toolbar','header','footer', so that event handlers can tell what section is being updated.
** onLoaded			- (*function*) this callback is called when this section content is loaded.
* shape 			- (*string*: defaults to 'box') 'box' or 'gauge' Shape of window.
* collapsible 		- (*boolean*: defaults to true) Set this to false to keep the window from being collapsed.
* minimizable 		- (*boolean*: defaults to true) Set this to false to keep the window from being minimized. Requires MUI.Desktop and MUI.Dock.
* maximizable 		- (*boolean*: defaults to true) Set this to false to keep the window from being maximized. Requires MUI.Desktop.
* container 		- (*element*: defaults to 'desktop') Element the window is injected into. If no desktop then to document.body. Use 'pageWrapper' if you don't want the windows to overlap the toolbars.
* closable 			- (*boolean*: defaults to true) Set to false to keep the window from being able to closed be the user.
* storeOnClose 		- (*boolean*) hides a window and it's dock tab rather than destroying them on close. If you try to create the window again it will unhide the window and dock tab.
* modalOverlayClose - (*boolean*: defaults to true) Whether or not you can close a modal by clicking on the modal overlay.
* draggable 		- (*boolean*: defaults to true) Set to false to keep the user from dragging. the window. Defaults to false for modals
* draggableGrid 	- (*integer*) distance in pixels for snap-to-grid dragging.
* draggableLimit 	- (*integer*) an object with x and y properties used to limit the movement of the Window.
* draggableSnap 	- (*boolean*: defaults to false) The distance to drag before the Window starts to respond to the drag.
* resizable 		- (*boolean*: defaults to true) Set to false to keep the window from being resized. Defaults to false for modals, notifications and gauges.
* resizeLimit 		- (*object*) minimum and maximum width and height of window when resized.
* addClass 			- (*string*) add a class to the window for more control over styling.
* x 				- (*integer*) the x position of the window. If x and y are left undefined the window is centered on the page.
* y 				- (*integer*) the y position of the window. If x and y are left undefined the window is centered on the page.
* width 			- (*integer*) width of content area.
* height 			- (*integer*) height of content area.
* headerHeight 		- (*integer*) height of window titlebar.
* footerHeight 		- (*integer*) height of window footer.
* cornerRadius 		- (*integer*) the radius of the window's corners.
* radiusOnMaximize 	- (*boolean*: defaults to false) show radius corners and shadows when maximized.
* scrollbars 		- (*boolean*: defaults to true) set to false to keep scrollbars from showing.  Content will be clipped.
* padding 			- (*object* or *integer*) can be a single integer value, which will cause the window to have a uniform padding on all sides.
* shadowBlur 		- (*integer*) width of shadows.
* shadowOffset 		- (*integer*) should be positive and not be greater than the ShadowBlur.
* controlsOffset 	- (*integer*) change this if you want to reposition the window controls.
* useCanvas 		- (*boolean*: defaults to true) Set this to false if you don't want a canvas body.
* useCanvasControls - (*boolean*) set this to false if you wish to use images for the buttons.
* useCSS3 			- (*boolean*: defaults to true) Tries to use CSS3 for shadow, gradient and radius. Fallback to canvas if useCanvas is set to true.
* useSpinner 		- (*boolean*: defaults to true) Toggles whether or not the ajax spinners are displayed in window footers.

### Events:

* drawBegin 		- (*function*) callback is executed just before the window is drawn is added to the DOM.
* drawEnd 			- (*function*) callback is executed just after the window is drawn is added to the DOM.
* loaded 			- (*function*) callback is executed when content is successfully loaded via XHR or Iframe.
* focus 			- (*function*) callback is executed when the window is focused.
* blur 				- (*function*) callback is executed when window loses focus.
* resize 			- (*function*) callback is executed when the window is resized.
* minimize 			- (*function*) callback is executed when the window is minimized.
* maximize 			- (*function*) callback is executed when the window is maximized.
* restore 			- (*function*) callback is executed when a window is restored from minimized or maximized.
* close 			- (*function*) callback is executed just before the window is closed.
* closeComplete 	- (*function*) callback is executed after the window is closed.
* dragStart 		- (*function*) callback is executed when the user starts to drag (on mousedown). Receives the dragged window as an argument.
* dragComplete 		- (*function*) callback is executed when the user completes the drag. Receives the dragged window as arguments.

### Returns:

* (*object*) A new *MUI.Window* instance.

## Events

### drawBegin

* (*function*) callback is executed just before the column is drawn is added to the DOM.

#### Signature:

		onDrawBegin( window )

#### Arguments:

1. window - (*object*) The instance of the window that fired the event.

### drawEnd

* (*function*) callback is executed just after the column is drawn is added to the DOM.

#### Signature:

		onDrawEnd( window )

#### Arguments:

1. window - (*object*) The instance of the window that fired the event.

### loaded

* (*function*) callback is executed when content is successfully loaded via XHR or Iframe.

#### Signature:

		onLoaded( window )

#### Arguments:

1. window - (*object*) The instance of the window that fired the event.

### focus

* (*function*) callback is executed when the window is focused.

#### Signature:

		onFocus( window )

#### Arguments:

1. window - (*object*) The instance of the window that fired the event.

### blur

* (*function*) callback is executed when window loses focus.

#### Signature:

		onBlur( window )

#### Arguments:

1. window - (*object*) The instance of the window that fired the event.

### resize

* (*function*) callback is executed when the window is resized.

#### Signature:

		onResize( window )

#### Arguments:

1. window - (*object*) The instance of the window that fired the event.

### minimize

* (*function*) callback is executed when the window is minimized.

#### Signature:

		onMinimize( window )

#### Arguments:

1. window - (*object*) The instance of the window that fired the event.

### maximize

* (*function*) callback is executed when the window is maximized.

#### Signature:

		onMaximize( window )

#### Arguments:

1. window - (*object*) The instance of the window that fired the event.

### restore

* (*function*) callback is executed when a window is restored from minimized or maximized.

#### Signature:

		onRestore( window )

#### Arguments:

1. window - (*object*) The instance of the window that fired the event.

### close

* (*function*) callback is executed just before the window is closed.

#### Signature:

		onClose( window )

#### Arguments:

1. window - (*object*) The instance of the window that fired the event.

### closeComplete

* (*function*) callback is executed after the window is closed.

#### Signature:

		onCloseComplete( window )

#### Arguments:

1. window - (*object*) The instance of the window that fired the event.

### dragStart

* (*function*) callback is executed when the user starts to drag (on mousedown). Receives the dragged window as an argument.

#### Signature:

		onDragStart( window )

#### Arguments:

1. window - (*object*) The instance of the window that fired the event.

### dragComplete

* (*function*) callback is executed when the user completes the drag. Receives the dragged window as arguments.

#### Signature:

		onDragComplete( window )

#### Arguments:

1. window - (*object*) The instance of the window that fired the event.


### Example:

Define a window. It is suggested you name the function the same as your window ID + "Window".

var mywindowWindow = function(){
 new MUI.Window({
 id: 'mywindow',
 title: 'My Window',
 loadMethod: 'xhr',
 contentURL: 'pages/lipsum.html',
 width: 340,
 height: 150
 });
}

### Example:

Create window onDomReady.

window.addEvent('domready', function(){
 mywindow();
});

### Example:

Add link events to build future windows. It is suggested you give your anchor the same ID as your window + "WindowLink" or + "WindowLinkCheck". Use the latter if it is a link in the menu toolbar.

If you wish to add links in windows that open other windows remember to add events to those links when the windows are created.

// Javascript:
if ($('mywindowLink')){
 $('mywindowLink').addEvent('click', function(e){
 new Event(e).stop();
 mywindow();
 });
}

// HTML:
<a id="mywindowLink" href="pages/lipsum.html">My Window</a>



MUI.Window Method: draw {#MUI-Window:draw}
----------------------------------------------------

Draws the window and adds it to the DOM.  And also adds it to the MochaUI list of instances.

### Syntax:

	myWindow.draw();

### Returns:

* (*object*) This *MUI.Window* instance.

### Examples:

	var myWindow = new MUI.Window({'id':'mywin1',drawOnInit:false});
	myWindow.draw();



MUI.Window Method: redraw {#MUI-Window:redraw}
----------------------------------------------------

Refreshes the windows elements.

### Syntax:

	myWindow.redraw();

### Returns:

* (*object*) This *MUI.Window* instance.

### Examples:

	var myWindow = new MUI.Window({'id':'mywin1'});
	myWindow.redraw();



MUI.Window Method: minimize {#MUI-Window:minimize}
----------------------------------------------------

Minimizes the window to the MUI.Dock.  This function does not exist unless the MUI.Dock is loaded.

### Syntax:

	myWindow.minimize();

### Returns:

* (*object*) This *MUI.Window* instance.

### Examples:

	var myWindow = new MUI.Window({'id':'mywin1'});
	myWindow.minimize();



MUI.Window Method: maximize {#MUI-Window:maximize}
----------------------------------------------------

Maximizes the window to the MUI.Desktop.  This function does not exist unless the MUI.Desktop is loaded.

### Syntax:

	myWindow.restore();

### Returns:

* (*object*) This *MUI.Window* instance.

### Examples:

	var myWindow = new MUI.Window({'id':'mywin1'});
	myWindow.restore();



MUI.Window Method: restore {#MUI-Window:restore}
----------------------------------------------------

Restores the window after it has been minimized or maximized.

### Syntax:

	myWindow.restore();

### Returns:

* (*object*) This *MUI.Window* instance.

### Examples:

	var myWindow = new MUI.Window({'id':'mywin1'});
	myWindow.Maximize();
	myWindow.restore();



MUI.Window Method: center {#MUI-Window:center}
----------------------------------------------------

This method centers the window in the client area.

### Syntax:

	myWindow.center();

### Returns:

* (*object*) This *MUI.Window* instance.

### Examples:

	var myWindow = new MUI.Window({'id':'mywin1'});
	myWindow.center();



MUI.Window Method: resize {#MUI-Window:resize}
----------------------------------------------------

This method is can be used to resize and center a window.

### Syntax:

	myWindow.redraw(options);

### Arguments

options - (*hash*) A hash object with the new size and position of the window.

### Options

* width - (*integer*) the new width of the window if a valid value is given.
* height - (*integer*) the new height of the window if a valid value is given.
* top - (*integer*) the new left border position of the window
* left - (*integer*) the new top border position of the window
* centered - (*boolean*: defaults to true) set this option to true to have the window recentered with the new dimensions.

### Returns:

* (*object*) This *MUI.Window* instance.

### Examples:

	var myWindow = new MUI.Window({'id':'mywin1',width:100,height:200});
	myWindow.redraw({width:200,height:400);



MUI.Window Method: hide {#MUI-Window:hide}
----------------------------------------------------

This will hide the window from view.  If the MUI.Dock is available the window tab will still be visible.

### Syntax:

	myWindow.hide();

### Returns:

* (*object*) This *MUI.Window* instance.

### Examples:

	var myWindow = new MUI.Window({'id':'mywin1'});
	myWindow.hide();



MUI.Window Method: show {#MUI-Window:show}
----------------------------------------------------

This will show a hidden window.

### Syntax:

	myWindow.show();

### Returns:

* (*object*) This *MUI.Window* instance.

### Examples:

	var myWindow = new MUI.Window({'id':'mywin1'});
	myWindow.hide();
	myWindow.show();



MUI.Window Method: focus {#MUI-Window:focus}
----------------------------------------------------

This brings a window that may have been in the background to the front of the other windows.

### Syntax:

	myWindow.focus();

### Returns:

* (*object*) This *MUI.Window* instance.

### Examples:

	var myWindow = new MUI.Window({'id':'mywin1'});
	myWindow.focus();



MUI.Window Method: showSpinner {#MUI-Window:showSpinner}
----------------------------------------------------

This shows the spinner image in the footer window to let the user know that the application is busy doing something.

### Syntax:

	myWindow.showSpinner();

### Returns:

* (*object*) This *MUI.Window* instance.

### Examples:

	var myWindow = new MUI.Window({'id':'mywin1'});
	myWindow.showSpinner();



MUI.Window Method: hideSpinner {#MUI-Window:hideSpinner}
----------------------------------------------------

This hides the spinner previously shown by the showSpinner method. The spinner can also be turned on automatically by MochaUI

### Syntax:

	myWindow.hideSpinner();

### Returns:

* (*object*) This *MUI.Window* instance.

### Examples:

	var myWindow = new MUI.Window({'id':'mywin1'});
	myWindow.showSpinner();
	myWindow.hideSpinner();



MUI.Window Method: close {#MUI-Window:close}
----------------------------------------------------

Closes the window and removes it from the DOM and removes it from the MochaUI list of instances.

### Syntax:

	myWindow.close();

### Returns:

* (*object*) This *MUI.Window* instance.

### Examples:

	var myWindow = new MUI.Window({'id':'mywin1'});
	myWindow.close();



MUI.Window Method: collapseToggle {#MUI-Window:collapseToggle}
----------------------------------------------------

This collapses the window until just the header is visible.  If the window is already collapsed it will expand the window. 

### Syntax:

	myWindow.collapseToggle();

### Returns:

* (*object*) This *MUI.Window* instance.

### Examples:

	var myWindow = new MUI.Window({'id':'mywin1'});
	myWindow.collapseToggle();
