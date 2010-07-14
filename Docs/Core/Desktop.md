Class: MUI.Desktop {#MUI-Desktop}
=============================

Setups up the page for a desktop with columns and panels.  Enables maximize, arrangeTile, and arrangeCascade.

### Notes:

If you change the IDs of the MochaUI Desktop using the options containers, then your in your HTML needs to be modified to match.

### Syntax:

	MUI.Desktop.initialize(options);

### Arguments:

options - (*object*) - Options listed below.

#### Options:

* desktop				- (*string*: defaults to 'desktop') the name of the main desktop div element.
* desktopHeader:		- (*string*: defaults to 'desktopHeader) the name of the desktop header div element.
* desktopFooter:		- (*string*: defaults to 'desktopFooter') the name of the desktop footer div element.
* desktopNavBar:		- (*string*: defaults to 'desktopNavbar') the name of the desktop menu div element.
* pageWrapper:			- (*string*: defaults to 'pageWrapper') the name of the page wrapper div element.
* page:					- (*string*: defaults to 'page') the name of the main page div element.
* desktopFooterWrapper:	- (*string*: defaults to 'desktopFooterWrapper')  the name of the desktop footer wrapper div element.

### Returns:

* nothing



MUI.Desktop Method: saveWorkspace {#MUI-Desktop:saveWorkspace}
----------------------------------------------------

Save the current workspace.

### Notes:

This version saves the ID of each open window to a cookie, and reloads those windows using the functions in mocha-init.js. This requires that each window have a function in mocha-init.js used to open them. Functions must be named the windowID + "Window". So if your window is called mywindow, it needs a function called mywindowWindow in mocha-init.js.

### Syntax:

	MUI.Desktop.saveWorkspace();

### Returns:

* nothing

### Examples:

	MUI.Desktop.saveWorkspace();



MUI.Desktop Method: loadWorkspace {#MUI-Desktop:loadWorkspace}
----------------------------------------------------

Load the saved workspace.

### Syntax:

	MUI.Desktop.loadWorkspace();

### Returns:

* nothing

### Examples:

	MUI.Desktop.loadWorkspace();


