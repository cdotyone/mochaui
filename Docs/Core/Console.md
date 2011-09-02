Class: MUI.Console {#MUI-Console}
=============================

Provides methods for controlling debug/console output for a MochaUI application.

Wraps browser (or firebug) console functions, while also letting you inject
console output into DOM elements, or send them to a function.

Lets you control debug/console output globally with options added to MUI.options, and
on a per MUI.console function call basis.

### Options added to MUI.options:

#### MUI.options.consoleOutput
		- This global option affects what calls to the MUI.console logging functions are shown and which are not. 
		With this option, you can make it so debug or console output is shown or not shown globally (this can be over-ridden). 

		- This option also lets you make it so console output is only shown for specific control instances or for only controls 
		of a particular type, or only when  certain key words appear in the message text of the console output.

		- MUI.options.consoleOuput can take the following types of values:
			- Boolean:	true means all calls to the MUI.console.log are executed, false means that, unless specifically over-ridden, no MUI.console log functions are displayed.						
			- Array: An array of strings.  
		
		- How the different strings in an array for MUI.options.consoleOutput affect logging behavior depends 
		  on the scope of individual calls to the MUI.console logging functions. This is controlled (primarily) 
		  by the * MUI.console.bind * function.

#### MUI.options.consoleTarget
		- This option sets the output target for all calls to MUI.console functions globablly.
		It's default value (null), sets the output target to be the browser's (or firebug's) console.
		It can take the id of an element (string) or that element directly or an element to enter log 
		updates into a specific DOM element. Finally, it can take a function for its value: this 
		function is passed an outParameter object for its argument (for an example, look at the 'outputParameters' 
		variable in the MUI.console._getOutputParams function).

		- The global output target can be overriden for individual MUI.console function calls by 
		using the * MUI.console.setNextTarget * function


### Main methods for logging to the console (or other output target)

#### MUI.console.log / MUI.console.warn / MUI.console.err / etc...

	- These are the basic logging functions in MUI.console/
	- They wrap the browser/firebug's console functions (if the console is set as the output target)

#### MUI.console.sLog

	- A special-case version of MUI.console.log that will update the console (or other output target) regardless of what is set for the Global console options.

### Methods that affect the behavior of the logging methods

#### MUI.console.setNextTarget

	- Changes the output target of the next MUI.console logging function to be called to 
	the passed in argument. The most straightforward way to use the function is in a function 
	chain (MUI.console.setNextTarget returns the MUI.Console object), 
	for example: MUI.console.setNextTarget('mochaConsole').log("List Item Clicked"). See below for more examples.			
	

#### MUI.console.bind
	
	- Changes the scope of the next MUI.console logging function that is called the passed 
	in argument, binding it to the object passed to the function.	- What affect this has on 
	the behavior of the logging depends on the object that is bound to the next logging function, 
	and the value set for the MUI.options.consoleOutput.
	- How this all works is kind of hard to explain in the abstract, but in practice it's fairly intuitive, 
	  so I'm going to move right into some examples of typical usage.
	- Most (all?) of these examples assume you're working with my branch (grab the zip at https://github.com/moofoo/mochaui)

### Examples

### -1-

#### Values set for Globals

	- MUI.options.consoleOutput = false
	- MUI.options.consoleTarget = null

#### Code

	MUI.console.log("Output to log the first");
	MUI.console.sLog("Output to log the second");

#### Outcome

	Because MUI.options.consoleOutput = false, the first function call (MUI.console.log) 
	has no effect. The second function call, to MUI.console.sLog, writes "Output to log the second"
	to the console, because MUI.console.sLog will always output to the console,
	regardless of Global options or anything else.

### -2-

#### Values set for Globals

	- MUI.options.consoleOutput = true
	- MUI.options.consoleTarget = null

#### Code

	MUI.console.log("This is the Mootools Browser object:", Browser);

#### Outcome

	The call to MUI.console.log outputs the text and the browser object 
	to the console in exactly the same way as if you had used window.console.log.	

### -3-

#### Values set for Globals

	- MUI.options.consoleOutput = true
	- MUI.options.consoleTarget = null

#### Code

		MUI.console.setNextTarget('mochaConsole').log("List Item Clicked");	
		MUI.console.log("Logged to firebug");

#### Outcome

		The first function call creates a new div containing the text "List Item Clicked" and injects
		into the content of the mochaConsole panel. The second function writes "Logged to firebug" 
		to the console as per usual.

### -4-

#### Values set for Globals

	- MUI.options.consoleOutput = true
	- MUI.options.consoleTarget = 'mochaConsole'

#### Code

		MUI.console.log("List Item Clicked");
		MUI.console.setNextTarget(null).log('Logged to firebug');	

#### Outcome

		The exact same as the previous example, except in this case the global console target 
		was set to the 'mochaConsole' panel, and null was passed to the MUI.console.setNextTarget 
		function to set the output target of "log('Logged to firebug')" to the console/firebug console.

### -5-

#### Values set for Globals

	- MUI.options.consoleOutput = ['MUI.Accordion', 'MUI.Grid']
	- MUI.options.consoleTarget = null

#### Changes made to demo code for this example:

	- A boolean option named 'consoleOutput' with a default value of null was added to three 
	  control Classes: Window, Accordion and Grid
		
	- This code was added to the Window Class initialization function:

			MUI.console.bind(this).log("Initializing new Window with options: ", this.options);

	- This code was added to the Accordion Class initialization function:

			MUI.console.bind(this).log("Initializing new Accordion with options: ", this.options);
	
	- This code, which is different than the others, was added to the Grid Class initialization function:

			MUI.console.bind(this).sLog("Initializing new Grid with options: ", this.options);

	- The key-value pair "consoleOutput:true" was added to the options for the Window 
	  control in the 'splitWindow' function (demo-shared.js)

	- The key-value pair "consoleOutput:false" was added to the options for the Grid 
	  control in the 'gridBuilder' function (also in demo-shared.js)

#### Code

	No code this time, just clicking a few of the links from the 'Examples' tree in order:

	1. Click 'Ajax/XHR Demo' under 'Windows'
	2. Click 'Accordion' under 'Controls' under 'Panel' or 'Window'
	3. Click 'Split Window' under 'Windows'
	4. Click 'Grid' under 'Controls' under 'Panel' or 'Window'

#### Outcome

	After #1: Nothing is written to the console log. The value for MUI.options.consoleOutput 
	is an array containing 'MUI.Accordion' and 'MUI.Grid' - no mention 	of MUI.Window. 
	There are two ways we could make it so we get debug output to the console when we click 'Ajax/XHR Demo':
		1. Add "consoleOutput:true" to the options for the Window control in the 'ajaxpageWindow' function, or
		2. Add 'MUI.Window' to the MUI.options.consoleOutput array.

	After #2: The following is logged to the console: "Initializing new Accordion with options: ", 
	followed by the options object. We get this output because MUI.Accordion is set in the global option.

	After #3: The following is logged to the console: "Initializing new Window with options: ", 
	followed by the options object. We get this output because 	we set the 'consoleOutput' option to 
	true in the options for the Split Window Control.

	After #4: "Initializing new Grid with options: ", followed by the options object. This might be confusing, 
	since 'consoleOutput' was set to false in the Grid control's options. However, in the Grid's initialization function 
	the MUI.console.sLog method was used rather than MUI.console.log, and sLog always writes the console, regardless of
	any other settings.