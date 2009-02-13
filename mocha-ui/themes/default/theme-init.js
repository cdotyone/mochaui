/*
  
Theme: Default 
  
*/

/*  
Stylesheets  
---------------------------------------------------------------- */

MochaUI.options.stylesheets = [];

/*  
Window Options  
---------------------------------------------------------------- */

var newWindowOptions = {
	// headerStartColor: [0, 200, 0]
};

/*  
Change Themes 
---------------------------------------------------------------- */

// Reset original options
$extend(MochaUI.Windows.windowOptions, MochaUI.Windows.windowOptionsOriginal);
$extend(MochaUI.Windows.windowOptions, newWindowOptions);

MochaUI.themeChange();