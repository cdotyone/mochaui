Class: MUI.Column {#MUI-Column}
=============================

Creates a column. Columns should be created from left to right.

### Syntax:

 var myColumn = new MUI.Column({'id':'mycolumn',[...]});

### Arguments:

options - (*object*) - Options listed below.

#### Options:

* id 			- (*string*) The ID of the column. This must be set when creating the column.
* container 	- (*element*: defaults to MUI.Desktop.pageWrapper) The ID or the element the column is to be added to.
* drawOnInit	- (*boolean*: defaults to true) If set true the column will be added to the DOM by calling the draw function.
* placement 	- (*string*) Can be 'right', 'main', or 'left'. There must be at least one column with the 'main' option.
* width 		- (*integer*) 'main' column is fluid and should not be given a width.
* resizeLimit 	- (*string*) resizelimit of a 'right' or 'left' column.
* sortable		- (*boolean*: defaults to true) Whether the panels can be reordered via drag and drop.
* isCollapsed 	- (*boolean*: defaults to false) Whether the column is collapsed

### Events:

* drawBegin 	- (*function*) callback is executed just before the column is drawn is added to the DOM.
* drawEnd 		- (*function*) callback is executed just after the column is drawn is added to the DOM.
* resize 		- (*function*) callback is executed when the column is resized.
* collapse		- (*function*) callback is executed when the is being collapsed.
* expand		- (*function*) callback is executed when the column is expanded after being collapsed.

### Returns:

* (*object*) A new *MUI.Column* instance.

## Events

### drawBegin

* (*function*) Function to execute just before the column is drawn is added to the DOM.

#### Signature:

		onDrawBegin( column )

#### Arguments:

1. column - (*object*) The instance of the column that fired the event.

### drawEnd

* (*function*) Function to execute just after the column is drawn is added to the DOM.

#### Signature:

		onDrawBegin( column )

#### Arguments:

1. column - (*object*) The instance of the column that fired the event.

### resize

* (*function*) Function to execute the column is resized.

#### Signature:

		onResize( column )

#### Arguments:

1. column - (*object*) The instance of the column that fired the event.

### collapse

* (*function*) Function to execute when the column is collapsed.

#### Signature:

		onCollapse( column )

#### Arguments:

1. column - (*object*) The instance of the column that fired the event.

### expand

* (*function*) Function to execute when the column is expanded after is collapsed.

#### Signature:

		onExpand( column )

#### Arguments:

1. column - (*object*) The instance of the column that fired the event.

### Examples:

	var myColumn = 	new MUI.Column({
		container: 'pageWrapper',
		id: 'myColumn1',
		placement: 'left',
		width: 170,
		resizeLimit: [100, 300]
	})

### Demos:

- *MUI.Column* - <http://mochaui.org/demo>



MUI.Column Method: draw {#MUI-Column:draw}
----------------------------------------------------

Draws the column and adds it to the DOM.  And also adds it to the MochaUI list of instances.

### Syntax:

	myColumn.draw();

### Returns:

* (*object*) This *MUI.Column* instance.

### Examples:

	var myColumn = new MUI.Column({'id':'mycolumn1',drawOnInit:false});
	myColumn.draw();



MUI.Column Method: getPanels {#MUI-Column:getPanels}
----------------------------------------------------

Gets a list of *MUI.Panel* panels that are attached to this column.

### Syntax:

	var panels = myColumn.getPanels();

### Returns:

* (*array*) An array of *MUI.Panel* panels attached to this column.

### Examples:

	var myColumn = new MUI.Column({'id':'mycolumn1'});
	myColumn.getPanels().each(function(panel) {
		panel.setStyle('color':'red');
	});



MUI.Column Method: collapse {#MUI-Column:collapse}
----------------------------------------------------

Collapses the panel and hides its contents, leaving only it resize handles visible.

### Syntax:

	myColumn.collapse();

### Returns:

* (*object*) This *MUI.Column* instance.

### Examples:

	var myColumn = new MUI.Column({'id':'mycolumn1'});
	myColumn.collapse();



MUI.Column Method: expand {#MUI-Column:expand}
----------------------------------------------------

Expands the panel and shows its contents.  This restores a column after it has been collapsed.

### Syntax:

	myColumn.expand();

### Returns:

* (*object*) This *MUI.Column* instance.

### Examples:

	var myColumn = new MUI.Column({'id':'mycolumn1'});
	myColumn.expand();



MUI.Column Method: toggle {#MUI-Column:toggle}
----------------------------------------------------

Toggles the collapsed mode of the column.  If the column is visible it is collapse.  If it is collapsed it will show the content so of the column.

### Syntax:

	myColumn.toggle();

### Returns:

* (*object*) This *MUI.Column* instance.

### Examples:

	var myColumn = new MUI.Column({'id':'mycolumn1'});
	myColumn.toggle();



MUI.Column Method: close {#MUI-Column:close}
----------------------------------------------------

Closes the column and removes it from the DOM and removes it from the MochaUI list of instances.

### Syntax:

	myColumn.close();

### Returns:

* (*object*) This *MUI.Column* instance.

### Examples:

	var myColumn = new MUI.Column({'id':'mycolumn1'});
	myColumn.close();
	myColumn = null;


