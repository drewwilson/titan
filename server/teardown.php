<?php
function remove($dirname = '.')
{
	if (is_dir($dirname)) {
		echo "$dirname is a directory.<br />";
		if ($handle = @opendir($dirname)) {
			while (($file = readdir($handle)) !== false) {
				if ($file != "." && $file != "..") {
					echo "$file<br />";
					$fullpath = $dirname . '/' . $file;
					if (is_dir($fullpath)) {
						remove($fullpath);
						@rmdir($fullpath);
					} else {
						@unlink($fullpath);
					}
				}
			}
			closedir($handle);
		}
	}
}

remove("data");

?>