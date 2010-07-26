Class: MUI.Panel {#MUI-Panel}
=============================

Creates a column. Columns should be created from left to right.

### Syntax:
	var myPanel = new MUI.Panel(options);

### Arguments:

	options - (*object*) - Options listed below.

#### Options:

* id 				- (*string*) the ID of the panel. If not defined, it will be set to 'panel' + MUI.IDCount.
* column			- (*string*) the name of the column to inject the panel into. This must be set when creating the panel.
* require			- (*object*) assets additional css, images and js resource, provides onload callback
* loadMethod		- (*string*) valid values are 'html', 'xhr', or 'iframe'.  Defaults to 'html' If there is no contentURL. Defaults to 'xhr' if there is a contentURL. You only really need to set this if using the 'iframe' method. May create a 'panel' loadMethod in the future.
* contentURL		- (*string*) used if loadMethod is set to 'xhr' or 'iframe'.
* method			- (*string*: defaults to 'get') valid values are 'get' or 'post' The method used to get the data.
* data				- (*hash*) Data to send with the URL. Defaults to null.
* evalScripts		- (*boolean*: defaults to true) an xhr loadMethod option.
* evalResponse		- (*boolean*: defaults to false) an xhr loadMethod option.
* content			- (*string* or *element*) an html loadMethod option.
* sections 			- (*object*) - array of hashes - list of additional sections to insert content into.
** position 		- (*string*: defaults to 'top') identifies where to insert the content. 'header' - in the window title header. 'title' - in the panel header bar to the left, with the title text can not be used if another section is using header. 'headertool' - in the panel header bar to the right can not be used if another section is using header. 'top' - below the window title right above the content, good for tabs. 'bottom' - below the content, above the window's footer. 'footer' - in the footer of the window.
** wrap				- (*boolean*: defaults to false) used to wrap content div, good for things like tabs, ignored when position = 'header' or 'footer'.
** empty			- (*boolean*: defaults to false) true to empty the section before inserted, ignored when position = 'top' or 'bottom'.
** height			- (*integer*) the height of the content div being added.
** id				- (*string*) the name of the content div being added.
** css				- (*string*) root css name for content div being added.
** method			- (*string*: defaults to 'get') ('get', or 'post') the way data is transmitted.
** data				- (*hash*) data to be transmitted.
** content			- (*string* or *element*) an 'html' or 'json' loadMethod option.
** loadMethod		- (*string*: defaults to 'xhr') valid values are 'json', 'html', 'xhr', or 'iframe'.
** url				- (*string*) this option should be used if loadMethod is set to 'xhr', 'json' or 'iframe'.
** section			- (*string*) this is used to name the section being update, such as 'content,'toolbar','header','footer', so that event handlers can tell what section is being updated.
** onLoaded			- (*function*) this callback is called when this section content is loaded.
* header			- (*boolean*) set to false to keep the panel from being created.
* title				- (*string*) title of the panel.
* height			- (*integer*) height of content area.
* addClass			- (*string*) add a class to the panel.
* scrollbars		- (*boolean*: defaults to true) set to false to keep scrollbars from showing.  Content will be clipped.
* padding			- (*object*) can be a single integer value, which will cause the panel to have a uniform padding on all sides.
* closable 			- (*boolean*: defaults to true) set to false to keep the panel from being able to closed be the user.

### Events:

* drawBegin 		- (*function*) callback is executed just before the panel is drawn is added to the DOM.
* drawEnd 			- (*function*) callback is executed just after the panel is drawn is added to the DOM.
* loaded 			- (*function*) callback is executed when content is successfully loaded via XHR or Iframe.
* resize 			- (*function*) callback is executed when the panel is resized.
* collapse			- (*function*) callback is executed when the panel is collapsed.
* expand			- (*function*) callback is executed when the panel is expanded.

### Returns:

* (*object*) A new *MUI.Panel* instance.

## Events

### drawBegin

* (*function*) callback is executed just before the panel is drawn is added to the DOM.

#### Signature:

		onDrawBegin( panel )

#### Arguments:

1. panel - (*object*) The instance of the panel that fired the event.

### drawEnd

* (*function*) callback is executed just after the panel is drawn is added to the DOM.

#### Signature:

		onDrawEnd( panel )

#### Arguments:

1. panel - (*object*) The instance of the panel that fired the event.

### loaded

* (*function*) callback is executed when content is successfully loaded via XHR or Iframe.

#### Signature:

		onLoaded( panel )

#### Arguments:

1. panel - (*object*) The instance of the panel that fired the event.

### resize

* (*function*) callback is executed when the panel is resized.

#### Signature:

		onResize( panel )

#### Arguments:

1. panel - (*object*) The instance of the panel that fired the event.

### collapse

* (*function*) callback is executed when the panel is collapsed.

#### Signature:

		onCollapse( panel )

#### Arguments:

1. panel - (*object*) The instance of the panel that fired the event.

### expand

* (*function*) callback is executed when the panel is expanded.

#### Signature:

		onExpand( panel )

#### Arguments:

1. window - (*object*) The instance of the panel that fired the event.



MUI.Panel Method: draw {#MUI-Panel:draw}
----------------------------------------------------

Draws the panel and adds it to the DOM.  And also adds it to the MochaUI list of instances.

### Syntax:

	myPanel.draw();

### Returns:

* (*object*) This *MUI.Panel* instance.

### Examples:

	var myPanel = new MUI.Window({'id':'mainpanel',drawOnInit:false});
	myPanel.draw();



MUI.Panel Method: close {#MUI-Panel:close}
----------------------------------------------------

Closes the panel and removes it from the DOM and removes it from the MochaUI list of instances.

### Syntax:

	myPanel.close();

### Returns:

* (*object*) This *MUI.Panel* instance.

### Examples:

	var myPanel = new MUI.Window({'id':'mainpanel'});
	myPanel.close();



MUI.Panel Method: collapse {#MUI-Panel:collapse}
----------------------------------------------------

Collapses the panel and hides the content leaving only the panel's header.

### Syntax:

	myPanel.collapse();

### Returns:

* (*object*) This *MUI.Panel* instance.

### Examples:

	var myPanel = new MUI.Window({'id':'mainpanel'});
	myPanel.collapse();



MUI.Panel Method: expand {#MUI-Panel:expand}
----------------------------------------------------

Expands a panel that was previously collapsed.

### Syntax:

	myPanel.expand();

### Returns:

* (*object*) This *MUI.Panel* instance.

### Examples:

	var myPanel = new MUI.Window({'id':'mainpanel'});
	myPanel.collapse();
	myPanel.expand();



MUI.Panel Method: toggle {#MUI-Panel:toggle}
----------------------------------------------------

Expands a collapsed panel, and collapses an expanded panel.

### Syntax:

	myPanel.toggle();

### Returns:

* (*object*) This *MUI.Panel* instance.

### Examples:

	var myPanel = new MUI.Window({'id':'mainpanel'});
	myPanel.toggle();


