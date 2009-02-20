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
	unset($params['_method']);
} else {
	$method = $_SERVER['REQUEST_METHOD'];
}
$segs = split("/", $_SERVER['PATH_INFO']);
$key = $segs[1];
$params = $_GET;
if (array_key_exists(2, $segs)) {
	$params['id'] = $segs[2];
}

function cmp($one, $two)
{
	if ($one->position == $two->position) {
		return 0;
	} else if ($one->position < $two->position) {
		return -1;
	} else {
		return 1;
	}
}

switch($method) {
	case "GET":
		$segs = split("/", $_SERVER['PATH_INFO']);
		$key = $segs[1];
		$params = $_GET;
		$doCount = false;
		if (array_key_exists(2, $segs)) {
			if ($segs[2] == "count") {
				$doCount = true;
			} else {
				$params['id'] = $segs[2];
			}
		}
		if ( ! file_exists("data/$key.json")) {
			copy("fixtures/$key.json", "data/$key.json");
			chmod("data/$key.json", 0666);
		}
		$data = file_get_contents("data/$key.json");
		$data = json_decode($data);
		$newdata = array();
		$keepit = true;
		if (array_key_exists("order", $params)) {
			usort($data, "cmp");
			unset($params["order"]);
		}
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
			if ($doCount) {
				echo count($newdata);
			} else {
				echo json_encode($newdata);
			}
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
		parse_str(file_get_contents('php://input'), $_PUT);
		foreach ($_PUT as $prop=>$val) {
			$params[$prop] = $val;
		}
		$data = file_get_contents("data/$key.json");
		$data = json_decode($data);
		$newdata = array();
		if (array_key_exists("position", $params)) {
			$new_pos = $params['position'];
			$old_pos = -1;
			foreach(array_keys($data) as $idx) {
				if ($data[$idx]->id == $params['id']) {
					$old_pos = $data[$idx]->position;
				} 
			}
			foreach(array_keys($data) as $idx) {
				$pos = $data[$idx]->position;
				if ($old_pos > $new_pos) {
					if($pos >= $new_pos && $pos < $old_pos) {
						$data[$idx]->position += 1;
					}
				} else {
					if($pos > $old_pos && $pos <= $new_pos) {
						$data[$idx]->position -= 1;
					}
				}
			}
		}
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