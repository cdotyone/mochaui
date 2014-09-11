<?php
//
// Script: autoversion.php
//
// Description: It takes a string sent by a form and returns a new string
//
// Inputs: file=ui/scripts/mochaui.js
// Returns: ui/scripts/mochaui.1410233302.js
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

if (isset($_REQUEST["file"])) echo autoVersion($_REQUEST["file"]);
?>
