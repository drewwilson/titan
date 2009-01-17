<?php

require('compat.php');
error_reporting(E_ALL);
ini_set('display_errors', '1');

if ( ! file_exists("data")) {
	mkdir("data");
}
$params = array_merge($_GET, $_POST);

if (array_key_exists("_method", $params)) {
	$method = $params['_method'];
} else {
	$method = $_SERVER['REQUEST_METHOD'];
}

switch($method) {
	case "GET":
		foreach($params as $key => $value) {
			if ( ! file_exists("data/$key.json")) {
				copy("fixtures/$key.json", "data/$key.json");
				chmod("data/$key.json", 0666);
			}
			header("Content-type: application/json");
			readfile("data/$key.json");
		}
		break;
	case "POST":
		foreach($params as $key => $value) {
			$data = file_get_contents("data/$key.json");
			$data = json_decode($data);
			$data[] = (object)$value;

			$f = fopen("data/$key.json", "w");
			fwrite($f, json_encode($data));
			fclose($f);
		}
		break;
	case "PUT":
		foreach($params as $key => $value) {
			$data = file_get_contents("data/$key.json");
			$data = json_decode($data);
			$newdata = array();
			foreach(array_keys($data) as $idx) {
				if ($data[$idx]->id == $value['id']) {
					$newdata[] = (object)array_merge((array)$data[$idx], $value);
				} else {
					$newdata[] = $data[$idx];
				}
			}
			$f = fopen("data/$key.json", "w");
			fwrite($f, json_encode($newdata));
			fclose($f);
		}
		break;
	case "DELETE":
		foreach($params as $key => $value) {
			$data = file_get_contents("data/$key.json");
			$data = json_decode($data);
			$newdata = array();
			foreach(array_keys($data) as $idx) {
				if ($data[$idx]->id != $value['id']) {
					$newdata[] = $data[$idx];
				}
			}
			$f = fopen("data/$key.json", "w");
			fwrite($f, json_encode($newdata));
			fclose($f);
		}
		break;
}


?>