<?php

/*

Script: Combine-javascript.php
	Dynamically concatenate source javascript files during development. 

Example:
	(start code)
	<script type="text/javascript" src="scripts/source/combine-javascript.php"></script>
	(end)

*/

// Array of files to merge
$aFiles = array(
	'dev/mocha/scripts/source/Core/Core.js',
	'dev/mocha/scripts/source/Window/Window.js',
	'dev/mocha/scripts/source/Window/Modal.js',		
	'dev/mocha/scripts/source/Window/Windows-from-html.js',		
	'dev/mocha/scripts/source/Window/Windows-from-json.js',
	'dev/mocha/scripts/source/Window/Window-from-form.js',
	'dev/mocha/scripts/source/Window/Arrange-cascade.js',		
	'dev/mocha/scripts/source/Desktop/Desktop.js',	
	'dev/mocha/scripts/source/Desktop/Dock.js',
	'dev/mocha/scripts/source/Desktop/Workspaces.js',									
	'dev/mocha/scripts/source/Plugin/Corner-slider.js'
);

// Get the path to your web directory
$sDocRoot = $_SERVER['DOCUMENT_ROOT'];

// Merge code
$sCode = '';
foreach ($aFiles as $sFile) {
	$sCode .= file_get_contents("$sDocRoot/$sFile");
}

$file = "mocha.js";	 

// Send HTTP headers
header("Cache-Control: must-revalidate");
header("Content-Type: text/javascript");
header('Content-Length: '.strlen($sCode));
header("Content-Disposition: inline; filename=$file");	
   
// Output merged code
echo $sCode;

?>