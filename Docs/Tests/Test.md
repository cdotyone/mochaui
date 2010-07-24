Development: Unit Testing {#Unit-Testing}
=============================
The JSON format used for unit testing.

### NOTES: Each module that requires testing will provide a single .json file with the same name as the JavaScript filename, but will have the extension .json.

### Example
The Source file for MUI.Panel is /Source/Core/Panel.js so it's unit test file name should be /Tests/Core/Panel.json

### File Syntax - Basic Syntax

{
	tests: [
		{
			title: "Your Test Title",
			description: "A brief description of this test.",
		}
	],
	otherScripts: ["SomeOtherFileToLoad"]
}

The tests array is an array of objects that contain test configurations. This allows you to have more than one automated test and pose more than one question to the user for a given module.  The tests array should have hashes of all of the tests.  Interactive tests and Automated tests are both configure from the same file.  Each type of test has a slightly different set of options, but each are required to have title and description. 

In addition to the tests, the test author can define additional scripts that should be loaded. This will include any missing dependencies for that script as well. This is useful if you're testing something that, say, doesn't require Selector.js, but you want to use Selectors for your test. This property is an array of script names assigned to the property otherScripts.



Development: Interactive Test {#Interactive-Test}
=============================
An interactive test is designed for a user to run tests that cannot be automated, and require the user to do something to test it.

### Syntax

{
	tests: [
		...,

		{
			title: "Your Test Title",
			description: "A brief description of this test.",
			verify: "Verification question to ask the user - did the test work?",
			before: function(){
				//code to execute when the user starts the test
			},
			body: "//User editable JavaScript run after *before* and before *post*",
			post: function(){
				//code to execute immediately after the *before* test above;
				//if this returns a "false" value, the test will fail immediately
				//before the user does anything else
			},
			error: null
		},

		...
	],
	otherScripts: ["SomeOtherFileToLoad"]
}

Each interactive test has the following properties:

* title - (*string*) the title of the test; this is displayed to the user before they run the test.
* description - (*string*) a brief (one sentence is best) description of the test; this is also displayed before the test is run.
* verify - (*string*) a question that the user must answer after they run the test. The question must be a yes/no question and answering it yes signals that the test succeeded. This is only displayed after the user starts the test.
* before - (*function*; optional) this code is run immediately when the test is started. If it throw an error, the test will fail immediately.
* body - (*string*; optional) this code is evaluated when the user runs the test after the before method if it is defined. This is user-editable so this string is displayed to them for them to change if they like. If this code throws an error the test will fail immediately.
* post - (*function*; optional) this code is run immediately after the body code is evaluated (if it's defined). If this code throws an error or returns a 'false' value the test will fail immediately.
* error - (*string*) this is can be set by any of the functions to better clarify what went wrong.  Each function is bound to the test, so this.error='some really descriptive error message' would set the custom error message.  This is not required, but may improve the testing experience.


Development: Automated Test {#Automated-Test}
=============================
Automated tests are designed to be run automatically by a testing framework.  Each test is executed and it is expected return a true or false to indicate the success or failure of the test.

{
	tests: [
		...,

		{
			title: "Your Test Title",
			description: "A brief description of this test.",
			test: function() {
				this.error='some really descriptive error message';
				returns false;   // return true if successful
			}
		},

		...
	]
}

* title - (*string*) the title of the test; this is displayed to the user before they run the test.
* description - (*string*) a brief (one sentence is best) description of the test; this is also displayed before the test is run.
* test - (*function*) a function to execute that performs a test.  Must return true or false to indicate success or failure of the test.
* error - (*string*) this is can be set by any of the functions to better clarify what went wrong.  Each function is bound to the test, so this.error='some really descriptive error message' would set the custom error message.  This is not required, but may improve the testing experience.


