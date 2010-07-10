	/*

	 Function: saveWorkspace
	 Save the current workspace.

	 Syntax:
	 (start code)
	 MUI.saveWorkspace();
	 (end)

	 Notes:
	 This version saves the ID of each open window to a cookie, and reloads those windows using the functions in mocha-init.js. This requires that each window have a function in mocha-init.js used to open them. Functions must be named the windowID + "Window". So if your window is called mywindow, it needs a function called mywindowWindow in mocha-init.js.

	 */

	 /*
	 Function: loadWorkspace
	 Load the saved workspace.

	 Syntax:
	 (start code)
	 MUI.loadWorkspace();
	 (end)
	 */