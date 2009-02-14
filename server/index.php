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
$segs = split("/", $_SERVER['PATH_INFO']);
$key = $segs[1];
$params = $_GET;
if (array_key_exists(2, $segs)) {
	$params['id'] = $segs[2];
}

switch($method) {
	case "GET":
		$segs = split("/", $_SERVER['PATH_INFO']);
		$key = $segs[1];
		$params = $_GET;
		if (array_key_exists(2, $segs)) {
			$params['id'] = $segs[2];
		}
		if ( ! file_exists("data/$key.json")) {
			copy("fixtures/$key.json", "data/$key.json");
			chmod("data/$key.json", 0666);
		}
		$data = file_get_contents("data/$key.json");
		$data = json_decode($data);
		$newdata = array();
		$keepit = true;
		foreach(array_keys($data) as $idx) {
			if ( ! empty($params) && is_array($params)) {
				foreach($params as $name => $value) {
					if ($data[$idx]->{$name} != $value) {
						$keepit = false;
					}
				}
			}
			if ($keepit) {
				$newdata[] = $data[$idx];
			}
			$keepit = true;
		}
		if (in_array("application/json", explode(",", $_SERVER['HTTP_ACCEPT']))) {
			header('Content-type: application/json');
		}

		if (count($newdata) > 0) {
			echo json_encode($newdata);
		} else {
			echo "[]";
		}
		break;
	case "POST":
		$data = file_get_contents("data/$key.json");
		$data = json_decode($data);
		$data[] = (object)$params;
        
		$f = fopen("data/$key.json", "w");
		fwrite($f, json_encode($data));
		fclose($f);
		break;
	case "PUT":
		$data = file_get_contents("data/$key.json");
		$data = json_decode($data);
		$newdata = array();
		foreach(array_keys($data) as $idx) {
			if ($data[$idx]->id == $params['id']) {
				$newdata[] = (object)array_merge((array)$data[$idx], $params);
			} else {
				$newdata[] = $data[$idx];
			}
		}
		$f = fopen("data/$key.json", "w");
		fwrite($f, json_encode($newdata));
		fclose($f);
		break;
	case "DELETE":
		$data = file_get_contents("data/$key.json");
		$data = json_decode($data);
		$newdata = array();
		foreach(array_keys($data) as $idx) {
			if ($data[$idx]->id != $params['id']) {
				$newdata[] = $data[$idx];
			}
		}
		$f = fopen("data/$key.json", "w");
		fwrite($f, json_encode($newdata));
		fclose($f);
		
		break;
}


?>