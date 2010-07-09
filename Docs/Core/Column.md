 Class: Column
 Create a column. Columns should be created from left to right.

 Syntax:
 (start code)
 MUI.Column();
 (end)

 Arguments:
 options

 Options:
 id 			- (string) The ID of the column. This must be set when creating the column.
 container 		- (element) Defaults to MUI.Desktop.pageWrapper.
 placement 		- (string) Can be 'right', 'main', or 'left'. There must be at least one column with the 'main' option.
 width 			- (integer) 'main' column is fluid and should not be given a width.
 resizeLimit 	- (string) resizelimit of a 'right' or 'left' column.
 sortable 		- (boolean) Whether the panels can be reordered via drag and drop.
 isCollapsed 	- (boolean) Whether the column is collapsed
 onResize		- (function) Fired when the column is resized.
 onCollapse		- (function) Fired when the column is collapsed.
 onExpand		- (function) Fired when the column is expanded.
