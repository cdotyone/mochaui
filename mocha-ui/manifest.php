<?php
// This script will grab all the selected file types from the same directory this file is in and all
// it's sub-directories and echo the list formatted as a JSON manifest for Google Gears.


$urls = explode("\n",`find .|sort`);
$fileurls = array(); 
$version = 'my_version_string';
?>
	{
	"betaManifestVersion": 1,
	"version": "<?php echo $version; ?>",
	"entries": [
		{ "url": "."}, 
		<?php          

			foreach($urls as $url) {              	
				if (eregi("html$|css$|js$|gif$|png$|jpg$", $url) && !is_dir($url)) {					
					array_push($fileurls, substr($url, 2));  
				}
			}	
			$last = end($fileurls);
			foreach($fileurls as $fileurl) {				
			?>			  
			{ "url": "<?php echo $fileurl; ?>"}<?php 
				if($fileurl != $last) {
					 echo ',';
			}
              
				 echo "\n";                
			}
			?>
		]
	}
