<?php
// Grab a full file listing from the current and sub directories

// pull a full file listing - requires the Unix 'find' and 'sort commands. 'find' will retrieve a
// list of all files from the current directory, 'sort' will sort the listing, and 'explode' will split
// all files into an array passed into $filelist.


      $urls = explode("\n",`find .|sort`);
      $version = 'mochaui-2';
      ?>
      {
        "betaManifestVersion": 1,
        "version": "<?php echo $version; ?>",
        "entries": [
		    { "url": "."}, 
        <?php
          $last = end($urls);
          foreach($urls as $url) {
          	  // If $url is a directory, skip it
              if (!is_dir($url)) {
              // substr removes extra ./ at the beginning of the urls.	
			  ?>			  
            { "url": "<?php echo substr($url, 2); ?>"}<?php 
                if($url != $last) {
                    echo ',';
			    }
              }
              echo "\n";                
          }
            ?>
          ]
      }
