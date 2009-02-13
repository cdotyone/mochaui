/*
  
Theme: Test 
  
*/

/*  
Stylesheets  
---------------------------------------------------------------- */

MochaUI.options.stylesheets = ['content.css'];

/*  
Window Options  
---------------------------------------------------------------- */

var newWindowOptions = {
	headerStartColor: [250, 200, 200],
	headerStopColor: [250, 250, 250],
	bodyBgColor: [245, 245, 245]		
};

/*  
Change Themes 
---------------------------------------------------------------- */

// Reset original options
$extend(MochaUI.Windows.windowOptions, MochaUI.Windows.windowOptionsOriginal);
$extend(MochaUI.Windows.windowOptions, newWindowOptions);

MochaUI.themeChange();