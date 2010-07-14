Class: MUI.Dock {#MUI-Dock}
=============================

Adds a window docking panel to a MochaUI desktop.  Enables window minimize.

### Notes:

This class should not be directly created unless you really understand the inner workings of MochaUI.
See [MUI.Desktop][].options createDock and dockOptions.

Only one MUI.Dock is allowed per desktop.  MUI.dock will have the currently active MUI.Dock.

### Syntax:

	new MUI.Dock(options);

### Arguments:

options - (*object*) - Options listed below.

#### Options:

* id				- (*string*: defaults to 'dock')
* container:		- (*element*: defaults to 'desktop') the container to add the dock to.  The MUI.Desktop passes the correct element to the dock.
* drawOnInit:		- (*boolean*: defaults to true) set this to false to keep the dock from automatically adding itself to the DOM.
* useControls:		- (*boolean*: defaults to true) toggles autohide and dock placement controls.
* position:			- (*string*: defaults to 'bottom) position of the dock starts in, 'top' or 'bottom'.
* visible:			- (*boolean*: defaults to true) is the dock visible.
* autoHide: 		- (*boolean*: defaults to false) true when dock autohide is set to on, false if set to off.
* menuCheck:		- (*element*: defaults to 'dockLinkCheck') the name of the element in the menu that needs to be checked if dock is shown.

### Events:

* drawBegin 		- (*function*) callback is executed just before the dock is drawn is added to the DOM.
* drawEnd 			- (*function*) callback is executed just after the dock is drawn is added to the DOM.
* move 				- (*function*) callback is executed after the dock has moved.
* tabCreated 		- (*function*) callback is executed after a tab has been created.
* tabSet 			- (*function*) callback is executed after the active tab has changed.
* hide 				- (*function*) callback is executed after the dock has been hidden.
* show 				- (*function*) callback is executed after the dock has been shown.

### Returns:

* (*object*) A new *MUI.Dock* instance.

## Events

### drawBegin

* (*function*) callback is executed just before the dock is drawn is added to the DOM.

#### Signature:

		onDrawBegin( dock )

#### Arguments:

1. dock - (*object*) the instance of the dock that fired the event.

### drawEnd

* (*function*) callback is executed just after the dock is drawn is added to the DOM.

#### Signature:

		onDrawEnd( dock )

#### Arguments:

1. dock - (*object*) the instance of the dock that fired the event.


### move

* (*function*) callback is executed after the dock has moved.

#### Signature:

		onMove( dock, position )

#### Arguments:

1. dock - (*object*) the instance of the dock that fired the event.
2. position - (*string*) will be 'top' or 'bottom', same as instance.options.position.

### tabCreated

* (*function*) callback is executed after a tab has been created.

#### Signature:

		onTabCreated( dock, instance )

#### Arguments:

1. dock - (*object*) the instance of the dock that fired the event.
2. instance - (*object*) the instance of the window that was added to the dock.

### tabSet

* (*function*) callback is executed after the active tab has changed.

#### Signature:

		onTabSet( dock, instance )

#### Arguments:

1. dock - (*object*) The instance of the dock that fired the event.
2. instance - (*object*) the instance of the window that was activated.

### hide

* (*function*) callback is executed after the dock has been hidden.

#### Signature:

		onHide( dock )

#### Arguments:

1. dock - (*object*) The instance of the dock that fired the event.

### show

* (*function*) callback is executed after the dock has been shown.

#### Signature:

		onShow( dock )

#### Arguments:

1. dock - (*object*) The instance of the dock that fired the event.




MUI.Dock Method: draw {#MUI-Dock:draw}
----------------------------------------------------

Draws the dock and adds it to the DOM.  And also adds it to the MochaUI list of instances.

### Syntax:

	MUI.dock.draw();

### Returns:

* (*object*) This *MUI.Dock* instance.

### Examples:

	new MUI.Dock({drawOnInit:false});
	MUI.dock.draw();



MUI.Dock Method: setDockColors {#MUI-Dock:setDockColors}
----------------------------------------------------

Refreshes the docks color palette.

### Syntax:

	MUI.dock.setDockColors();

### Returns:

* (*object*) This *MUI.Dock* instance.

### Examples:

	new MUI.Dock({drawOnInit:false});
	MUI.dock.setDockColors();



MUI.Dock Method: getHeight {#MUI-Dock:getHeight}
----------------------------------------------------

Gets the height of the dock

### Syntax:

	MUI.dock.setDockColors();

### Returns:

* (*integer*) the height of the dock.

### Examples:

	new MUI.Dock({drawOnInit:false});
	var height = MUI.dock.getHeight();



MUI.Dock Method: moveDock {#MUI-Dock:moveDock}
----------------------------------------------------

Changes the dock position.

### Syntax:

	MUI.dock.moveDock([position]);

### Arguments:

1. position - (*string*)  the position to move the dock to, 'top' or 'bottom'.  If no position is given it toggles between top and bottom. 

### Returns:

* (*object*) This *MUI.Dock* instance.

### Examples:

	new MUI.Dock({drawOnInit:false});
	MUI.dock.moveDock();



MUI.Dock Method: createDockTab {#MUI-Dock:createDockTab}
----------------------------------------------------

Adds a tab to the dock.

### Syntax:

	MUI.dock.createDockTab(instance);

### Arguments:

1. instance - (*object*) the instance of the window to add to the dock.

### Returns:

* (*object*) This *MUI.Dock* instance.

### Examples:

	new MUI.Dock({drawOnInit:false});
	MUI.dock.createDockTab(myWindow1);



MUI.Dock Method: makeActiveTab {#MUI-Dock:makeActiveTab}
----------------------------------------------------

Forces a window to be the active tab in the dock.

### Syntax:

	MUI.dock.makeActiveTab(instance);

### Arguments:

1. instance - (*object*) the instance of the window to make active.  If it is not provided, the next highest window is choosen.

### Returns:

* (*object*) This *MUI.Dock* instance.

### Examples:

	new MUI.Dock({drawOnInit:false});
	MUI.dock.makeActiveTab();



MUI.Dock Method: hide {#MUI-Dock:hide}
----------------------------------------------------

This will hide the dock from view.

### Syntax:

	MUI.dock.hide();

### Returns:

* (*object*) This *MUI.Dock* instance.

### Examples:

	new MUI.Dock();
	MUI.dock.hide();



MUI.Dock Method: show {#MUI-Dock:show}
----------------------------------------------------

This will show a hidden dock.

### Syntax:

	MUI.dock.show();

### Returns:

* (*object*) This *MUI.Dock* instance.

### Examples:

	new MUI.Dock();
	MUI.dock.hide();
	MUI.dock.show();



MUI.Dock Method: toggle {#MUI-Dock:toggle}
----------------------------------------------------

Expands a collapsed dock, and collapses an expanded dock.

### Syntax:

	MUI.dock.toggle();

### Returns:

* (*object*) This *MUI.Dock* instance.

### Examples:

	new MUI.Dock();
	MUI.dock.toggle();


	/*
	 Function: minimizeAll
	 Minimize all windows that are minimizable.
	 */

[MUI.Desktop]: /core/Desktop