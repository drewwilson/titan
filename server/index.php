<?php

if ( ! file_exists("data")) {
	mkdir("data");
}

foreach($_GET as $key => $value) {
	if ( ! file_exists("data/$key.json")) {
		copy("fixtures/$key.json", "data/$key.json");
	}
	header("Content-type: application/json");
	readfile("fixtures/$key.json");
}

?>