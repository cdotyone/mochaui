 Class: Window
 Creates a single MochaUI window.

 Syntax:
 (start code)
 new MUI.Window(options);
 (end)

 Arguments:
 options

 Options:
 id - The ID of the window. If not defined, it will be set to 'win' + windowIDCount.
 title - The title of the window.
 icon - Place an icon in the window's titlebar. This is either set to false or to the url of the icon. It is set up for icons that are 16 x 16px.
 type - ('window', 'modal', 'modal2', or 'notification') Defaults to 'window'. Modals should be created with new MUI.Modal(options).
 loadMethod - ('html', 'xhr', or 'iframe') Defaults to 'html' if there is no contentURL. Defaults to 'xhr' if there is a contentURL. You only really need to set this if using the 'iframe' method.
 contentURL - Used if loadMethod is set to 'xhr' or 'iframe'.
 closeAfter - Either false or time in milliseconds. Closes the window after a certain period of time in milliseconds. This is particularly useful for notifications.
 evalScripts - (boolean) An xhr loadMethod option. Defaults to true.
 evalResponse - (boolean) An xhr loadMethod option. Defaults to false.
 content - (string or element) An html loadMethod option.
 sections - (array of hashes) - list of additional sections to insert content into
	[{
	position - identifies where to insert the content
		'header' - in the window title header
		'top' - below the window title right above the content, good for tabs - DEFAULT
		'bottom' - below the content, above the window's footer
		'footer' - in the footer of the window
	wrap - used to wrap content div, good for things like tabs
	ignored when position = 'header' or 'footer'
	empty - true to empty the section before inserted, defaults to false
	ignored when position = 'top' or 'bottom'
	height - the height of the content div being added
	id - the name of the content div being added
	css - root css name for content div being added

	method - ('get', or 'post') The way data is transmitted. Defaults to get
	data - (hash) Data to be transmitted
	content - (string or element) An html loadMethod option.
	loadMethod - ('html', 'xhr', or 'iframe') defaults to xhr
	url - Used if loadMethod is set to 'xhr' or 'iframe'.
	section - used to name the section being update, such as 'content,'toolbar','header','footer'
	onContentLoaded - (function)
	}]
 container - (element ID) Element the window is injected in. The container defaults to 'desktop'. If no desktop then to document.body. Use 'pageWrapper' if you don't want the windows to overlap the toolbars.
 restrict - (boolean) Restrict window to container when dragging.
 shape - ('box' or 'gauge') Shape of window. Defaults to 'box'.
 collapsible - (boolean) Defaults to true.
 minimizable - (boolean) Requires MUI.Desktop and MUI.Dock. Defaults to true if dependenices are met.
 maximizable - (boolean) Requires MUI.Desktop. Defaults to true if dependenices are met.
 maximizeTo - (element ID) Element to maximize windows to. Defaults to client area.
 closable - (boolean) Defaults to true.
 storeOnClose - (boolean) Hides a window and it's dock tab rather than destroying them on close. If you try to create the window again it will unhide the window and dock tab.
 modalOverlayClose - (boolean) Whether or not you can close a modal by clicking on the modal overlay. Defaults to true.
 draggable - (boolean) Defaults to false for modals; otherwise true.
 draggableGrid - (false or number) Distance in pixels for snap-to-grid dragging. Defaults to false.
 draggableLimit - (false or number) An object with x and y properties used to limit the movement of the Window. Defaults to false.
 draggableSnap - (boolean) The distance to drag before the Window starts to respond to the drag. Defaults to false.
 resizable - (boolean) Defaults to false for modals, notifications and gauges; otherwise true.
 resizeLimit - (object) Minimum and maximum width and height of window when resized.
 addClass - (string) Add a class to the window for more control over styling.
 width - (number) Width of content area.
 height - (number) Height of content area.
 headerHeight - (number) Height of window titlebar.
 footerHeight - (number) Height of window footer.
 cornerRadius - (number)
 radiusOnMaximize - (boolean) show radius corners and shadows when maximized. Defaults to false;
 x - (number) If x and y are left undefined the window is centered on the page.
 y - (number)
 scrollbars - (boolean)
 padding - (object)
 shadowBlur - (number) Width of shadows.
 shadowOffset - Should be positive and not be greater than the ShadowBlur.
 controlsOffset - Change this if you want to reposition the window controls.
 useCanvas - (boolean) Set this to false if you don't want a canvas body. Defaults to true.
 useCanvasControls - (boolean) Set this to false if you wish to use images for the buttons.
 useCSS3 - (boolean) Tries to use CSS3 for shadow, gradient and radius. Defaults to true. Fallback to canvas if useCanvas is set to true.
 useSpinner - (boolean) Toggles whether or not the ajax spinners are displayed in window footers. Defaults to true.
 onBeforeBuild - (function) Fired just before the window is built.
 onContentLoaded - (function) Fired when content is successfully loaded via XHR or Iframe.
 onFocus - (function) Fired when the window is focused.
 onBlur - (function) Fired when window loses focus.
 onResize - (function) Fired when the window is resized.
 onMinimize - (function) Fired when the window is minimized.
 onMaximize - (function) Fired when the window is maximized.
 onRestore - (function) Fired when a window is restored from minimized or maximized.
 onClose - (function) Fired just before the window is closed.
 onCloseComplete - (function) Fired after the window is closed.
 onDragStart - (function) Fired when the user starts to drag (on mousedown). Receives the dragged window as an argument.
 onDragComplete - (function) Fired when the user completes the drag. Receives the dragged window as arguments.

 Returns:
 Window object.

 Example:
 Define a window. It is suggested you name the function the same as your window ID + "Window".
 (start code)
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
 (end)

 Example:
 Create window onDomReady.
 (start code)
 window.addEvent('domready', function(){
 mywindow();
 });
 (end)

 Example:
 Add link events to build future windows. It is suggested you give your anchor the same ID as your window + "WindowLink" or + "WindowLinkCheck". Use the latter if it is a link in the menu toolbar.

 If you wish to add links in windows that open other windows remember to add events to those links when the windows are created.

 (start code)
 // Javascript:
 if ($('mywindowLink')){
 $('mywindowLink').addEvent('click', function(e){
 new Event(e).stop();
 mywindow();
 });
 }

 // HTML:
 <a id="mywindowLink" href="pages/lipsum.html">My Window</a>
 (end)


 Loading Content with an XMLHttpRequest(xhr):
 For content to load via xhr all the files must be online and in the same domain. If you need to load content from another domain or wish to have it work offline, load the content in an iframe instead of using the xhr option.

 Iframes:
 If you use the iframe loadMethod your iframe will automatically be resized when the window it is in is resized. If you want this same functionality when using one of the other load options simply add class="mochaIframe" to those iframes and they will be resized for you as well.

