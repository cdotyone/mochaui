 Class: Panel
 Create a panel. Panels go one on top of another in columns. Create your columns first and then add your panels. Panels should be created from top to bottom, left to right.

 Syntax:
 (start code)
 MUI.Panel();
 (end)

 Arguments:
 options

 Options:
 id - The ID of the panel. This must be set when creating the panel.
 column - Where to inject the panel. This must be set when creating the panel.
 require - (object) assets additional css, images and js resource, provides onload callback
 loadMethod - ('html', 'xhr', or 'iframe') Defaults to 'html' if there is no contentURL. Defaults to 'xhr' if there is a contentURL. You only really need to set this if using the 'iframe' method. May create a 'panel' loadMethod in the future.
 contentURL - Used if loadMethod is set to 'xhr' or 'iframe'.
 method - ('get', or 'post') The method used to get the data. Defaults to 'get'.
 data - (hash) Data to send with the URL. Defaults to null.
 evalScripts - (boolean) An xhr loadMethod option. Defaults to true.
 evalResponse - (boolean) An xhr loadMethod option. Defaults to false.
 content - (string or element) An html loadMethod option.
 sections - (array of hashes) - list of additional sections to insert content into
		[{
			position - identifies where to insert the content
						'header' - replaces title and toolbox in header bar, good for tabs - DEFAULT
						'title' - in the panel header bar to the left, with the title text
										can not be used if another section is using header
						'headertool' - in the panel header bar to the right
										can not be used if another section is using header
						'top' - below the panel header bar and above the content
						'bottom' - below the content, above the panel's footer
						'footer' - in the footer of the panel
			 addClass - classname of css class to add to parent element
			 wrap - used to wrap content div, good for things like tabs
			 empty - true to empty the section before inserted, defaults to false
					 ignored when position = 'top' or 'bottom'
			 height - the height of the content div being added
			 id - the name of the content div being added
			 css - root css name for content div being added

			 method - ('get', or 'post') The way data is transmitted. Defaults to get
			 data - (hash) Data to be transmitted
			 content - (string or element) An html loadMethod option.
			 loadMethod - ('html', 'xhr', or 'iframe') defaults to xhr
			 url - Used if loadMethod is set to 'xhr' or 'iframe'.
			 [section] - used to name the section being update, such as 'content,'toolbar','header','footer'
			 onContentLoaded - (function)
		}]
 header - (boolean) Display the panel header or not
 title - (string)
 height - (number) Height of content area.
 addClass - (string) Add a class to the panel.
 scrollbars - (boolean)
 padding - (object)
 collapsible - (boolean)
 onBeforeBuild - (function) Fired before the panel is created.
 onContentLoaded - (function) Fired after the panel's content is loaded.
 onResize - (function) Fired when the panel is resized.
 onCollapse - (function) Fired when the panel is collapsed.
 onExpand - (function) Fired when the panel is expanded.
