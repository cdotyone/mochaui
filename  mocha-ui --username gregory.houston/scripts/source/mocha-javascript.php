<?php

/*

Script: Combine-javascript.php
	Dynamically concatenate source javascript files during development. 

Example:
	<script type="text/javascript" src="scripts/source/combine-javascript.php"></script>

*/

// Array of files to merge
$aFiles = array(
	'dev/mocha/scripts/source/core.js',
	'dev/mocha/scripts/source/window.js',
	'dev/mocha/scripts/source/modal.js',		
	'dev/mocha/scripts/source/windows-from-html.js',		
	'dev/mocha/scripts/source/windows-from-json.js',
	'dev/mocha/scripts/source/window-from-form.js',
	'dev/mocha/scripts/source/arrange-cascade.js',		
	'dev/mocha/scripts/source/desktop.js',	
	'dev/mocha/scripts/source/dock.js',
	'dev/mocha/scripts/source/workspaces.js',									
	'dev/mocha/scripts/source/corner-slider.js'
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