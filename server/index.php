<?php

require('compat.php');
error_reporting(E_ALL);
ini_set('display_errors', '1');

function getRequest()
{
	if (in_array("application/json", explode(",", $_SERVER['HTTP_ACCEPT']))) {
		header('Content-type: application/json');
	}
	$request = new stdClass();
	$request->params = array_merge($_GET, $_POST);
	if (array_key_exists("_method", $request->params)) {
		$request->method = $params['_method'];
		unset($request->params['_method']);
	} else {
		$request->method = $_SERVER['REQUEST_METHOD'];
	}
	if ($request->method == "PUT") {
		parse_str(file_get_contents('php://input'), $_PUT);
		foreach ($_PUT as $prop => $val) {
			$request->params[$prop] = $val;
		}
	}
	$segs = split("/", $_SERVER['PATH_INFO']);
	$request->key = $segs[1];
	$request->count = false;
	if (array_key_exists(2, $segs)) {
		if ($segs[2] == "count") {
			$request->count = true;
		} else {
			$params['id'] = $segs[2];
		}
	}
	if ( ! file_exists("data")) {
		mkdir("data");
	}
	if ( ! file_exists("data/{$request->key}.json")) {
		copy("fixtures/{$request->key}.json", "data/{$request->key}.json");
		chmod("data/{$request->key}.json", 0666);
	}
	$request->data = file_get_contents("data/{$request->key}.json");
	$request->data = json_decode($request->data);
	return $request;
}

function cmp($one, $two)
{
	$one = $one->position;
	$two = $two->position;
	return $one == $two ? 0 : $one < $two ? -1 : 1;
}

$request = getRequest();

switch($request->method) {
	case "GET":
		$newdata = array();
		$keepit = true;
		$limit = 100000;
		$offset = 0;
		if (array_key_exists("order", $request->params)) {
			usort($request->data, "cmp");
			unset($request->params["order"]);
		}
		if (array_key_exists("limit", $request->params)) {
			$limit = $request->params["limit"];
			unset($request->params["limit"]);
		}
		if (array_key_exists("offset", $request->params)) {
			$offset = $request->params["offset"];
			unset($request->params["offset"]);
		}
		foreach(array_keys($request->data) as $idx) {
			if ($offset == 0 && $limit > 0) {
				$limit = $limit - 1;
				if ( ! empty($request->params) && is_array($request->params)) {
					foreach($request->params as $name => $value) {
						if ($request->data[$idx]->{$name} != $value) {
							$keepit = false;
						}
					}
				}
			} else {
				$offset = $offset - 1;
				$keepit = false;
			}
			if ($keepit) {
				$newdata[] = $request->data[$idx];
			}
			$keepit = true;
		}
		if (count($newdata) > 0) {
			if ($request->count) {
				echo count($newdata);
			} else {
				echo json_encode($newdata);
			}
		} else {
			echo "[]";
		}
		break;
	case "POST":
		echo " ";
		$f = fopen("data/{$request->key}.json", "w");
		$request->data[] = $request->data;
		fwrite($f, json_encode($request->data));
		fclose($f);
		break;
	case "PUT":
		$newdata = array();
		if (array_key_exists("position", $request->params)) {
			$new_pos = $request->params['position'];
			$old_pos = -1;
			foreach(array_keys($request->data) as $idx) {
				if ($request->data[$idx]->id == $request->params['id']) {
					$old_pos = $request->data[$idx]->position;
				} 
			}
			foreach(array_keys($request->data) as $idx) {
				$pos = $request->data[$idx]->position;
				if ($old_pos > $new_pos) {
					if($pos >= $new_pos && $pos < $old_pos) {
						$request->data[$idx]->position += 1;
					}
				} else {
					if($pos > $old_pos && $pos <= $new_pos) {
						$request->data[$idx]->position -= 1;
					}
				}
			}
		}
		foreach(array_keys($request->data) as $idx) {
			if ($request->data[$idx]->id == $request->params['id']) {
				$newdata[] = (object)array_merge((array)$request->data[$idx], $request->params);
			} else {
				$newdata[] = $request->data[$idx];
			}
		}
		$f = fopen("data/{$request->key}.json", "w");
		fwrite($f, json_encode($newdata));
		fclose($f);
		break;
	case "DELETE":
		$newdata = array();
		foreach(array_keys($request->data) as $idx) {
			if ($request->data[$idx]->id != $request->params['id']) {
				$newdata[] = $request->data[$idx];
			}
		}
		$f = fopen("data/{$request->key}.json", "w");
		fwrite($f, json_encode($newdata));
		fclose($f);
		break;
}


?>