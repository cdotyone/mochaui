Class: MUI.Modal {#MUI-Modal}
=============================

Create modal dialog windows.

### Extends

* [MUI.Window][]

### Syntax:

 var myDialog = new MUI.Modal({
			id: 'about',
			title: 'About My Dialog Box',
			contentURL: 'about.html',
			width: 400,
			height: 250
		});

### Arguments:

options - (*object*) - Same as [MUI.Window][], except type described below.

#### Options:

* type 			- (*string*: defaults to 'modal') Can bt 'modal' or 'modal2'.  'modal' is a window that has a header and footer, and 'modal2' is just a rectangular modal with no header or footer.

### Returns:

* (*object*) A new *MUI.Modal* instance.

[MUI.Window]: /core/Window