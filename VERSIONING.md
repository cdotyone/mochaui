VERSIONING JS & CSS SCRIPTS

  Browser caching have two sides:

  On one side it's incredibly helpful for optimizing bandwidth, but

  on the dark side, it's a really pain in the butt for developers.
  
  I tried everything:
  
        mochaui-1.0.0.5679.js
        mochaui.js?v=1.0.0.5679
        mochaui.js?t=145098231
  
  They all worked, but not perfect.
  
  Problem is how to inform the browser on newer JS or CSS scripts,
  so it grab the newer script instead of the cached copy.
  
  With a little .htaccess tweeking and some PHP & JS code, MochaUI
  can keep track of modified JS & CSS scripts and feed them to the
  browser when needed, with doing nothing more than saving the newer
  JS or CSS version.
  
  A LITTLE WARNING.
  
  Foreknowledge of Apache's httpd.conf configuration
  is required. The module mod_rewrite needs to be active:
  
        LoadModule rewrite_module     modules/mod_rewrite.so
  
  and the directive AllowOverride needs to be set to All in the
  proper directory:
  
        AllowOverride All
        Require all granted
      </Directory>
  
  
  Let's start by adding or creating the following instructions to .htaccess:
  
        #Rules for Versioned Static Files
        Options +FollowSymLinks -Multiviews -Indexes
        RewriteEngine on
        RewriteRule ^(.*)\.[\d]+\.(css|js)$ $1.$2 [L]

  Those instructions inform the Apache server that every JS & CSS filename
  will have one format and needs to be change to another format:
  
        ui/scripts/mochaui.1410414879.js        =>    ui/scripts/mochaui.js
        ui/scripts/desktop-init.1410414508.js   =>    ui/scripts/desktop-init.js
        ui/Source/Themes/default/css/desktop.1409895042.css => ui/Source/Themes/default/css/desktop.css
  
  You need to place the .htaccess file in the root directory of your website, and/or in any other directory
  that calls JS & CSS scripts.
  
  The numbers inside are generated but the PHP script in autoversion.php.
  
  In the directory Source/Core there's a modified version of require.js, names require_with_versioning.js
  in order to test your server modifications first.
  
  To add versioning inside your current PHP code, you need to do the following:
  
      // Include the versioning function
      require_once("autoversion.php");
  
      // Add as many extra scripts as needed, like this:
      echo "<script type='text/javascript' src='".autoVer("ui/scripts/mochaui.js")."'></script>";
      echo "<link rel='stylesheet' type='text/css' href='".autoVer("ui/css/main.css")."' />";

  
  This is only PHP sample code and it's here for information only. You need to code you're own
  instructions in order to make autoversion.php work.
  
  
  I hope this is helpful to you as it is to me.
  
  RoberNET
  
