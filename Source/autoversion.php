<?php
//
// Script: autoversion.php
//
// Description: It takes a string sent by a form and returns a new string
//
// Inputs: file=ui/scripts/mochaui.js
// Returns: ui/scripts/mochaui.1410233302.js
//
// Inputs: file[]=file1.js&file[]=file2.js&file[]=fileN.js
// Returns: ['file1.1309872290.js',file2.1987309234.js','fileN.1872098368.js']
//
// Note: The last is only useful in projects outside MochaUI that needs to load
//	several JS files at once, since MochaUI handles this one by one
//	in require_with_versioning.js.
//
// Example: autoversion.php?file=ui/scripts/mochaui.js
//
// Created by: Roberto Fernandez (RoberNET)
//
// License: MIT-style license in (/MIT-LICENSE.txt).
//

function autoVersion($url){
	$path = pathinfo($url);
	$version = '.'.filemtime($_SERVER['DOCUMENT_ROOT'].$url).'.';
	return $path['dirname'].'/'.str_replace('.', $version, $path['basename']);
}

if (isset($_REQUEST["file"])) {
	if (is_array($_REQUEST["file"])) {
		$strVersion = "[";
		foreach($_REQUEST["file"] as $key => $value) {
			if ($strVersion!="[") $strVersion .= ",";
			$strVersion.= "'".autoVersion($value)."'";
		}
		$strVersion .= "]";
		echo $strVersion;
	} else echo autoVersion($_REQUEST["file"]);
}
?>
