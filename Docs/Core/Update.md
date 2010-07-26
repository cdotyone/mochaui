/*

MUI.Content.update allows controls, windows, and panels to intercept the standard update process.
By adding the following functions to the classes that define them, they can be intercepted.

In each case the expected return result is a boolean value.  A return result True tells
MUI.Content.update to perform the standard functionality that it would normally.  A value of
False tells MUI.Content.update that the standard functionality can be bypassed.

Each of the functions will be passed the options hash for the initial call to MUI.Content.update.

instance.updateStart - this is called when MUI.Content.update first starts, it is designed to allow the
	instance the ability to set things like titles and scrollbars.  The return result is ignored
	at this point.

instance.updateClear - this is called when MUI.Content.update needs to clear the contents of
	the container element.  The return result true/false will determine if the container element is
	cleared by MUI.Content.update.

instance.updateSetContent - this is called after a response has been received and the content of the
	container element needs to be updated.  The return result true/false will determine if the
	container element is updated by MUI.Content.update.

instance.updateEnd - this is called after the container element has been updated and the control,
	window, or panel needs to be informed that the update was successful.  The return result
	true/false will determine if control, window, or panel will be informed of the update.

*/

	/*

	 Function: MUI.Content.update
	 Replace the content of a window or panel.

	 Arguments:
	 updateOptions - (object)

	 updateOptions:
	 element - The parent window, panel, or element.
	 method - ('get', or 'post') The way data is transmitted.
	 data - (hash) Data to be transmitted
	 content - (string or element) An html loadMethod option.
	 loadMethod - ('html', 'xhr', or 'iframe')
	 url - Used if loadMethod is set to 'xhr' or 'iframe'.
	 section - used to name the section being update, such as 'content,'toolbar','header','footer'
	 onLoaded - (function)

	 */