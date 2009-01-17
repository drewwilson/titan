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
		foreach($params as $key => $conditions) {
			if ( ! file_exists("data/$key.json")) {
				copy("fixtures/$key.json", "data/$key.json");
				chmod("data/$key.json", 0666);
			}
			$data = file_get_contents("data/$key.json");
			$data = json_decode($data);
			$newdata = array();
			$keepit = true;
			foreach(array_keys($data) as $idx) {
				if ( ! empty($conditions) && is_array($conditions)) {
					foreach($conditions as $name => $value) {
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
			
			header("Content-type: application/json");
			if (count($newdata) > 0) {
				echo json_encode($newdata);
			} else {
				echo "[]";
			}

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