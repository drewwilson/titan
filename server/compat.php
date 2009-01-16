<?php
if(function_exists('json_encode')) {
  return;
} else {
  /* Loading the helper automatically requires and instantiates the Services_JSON class */
  if ( ! class_exists('Services_JSON'))
  {
  	require_once('JSON.php');
  }

  /**
   * json_encode
   *
   * Encodes php to JSON code.  Parameter is the data to be encoded.
   *
   * @access	public
   * @param	string
   * @return	string
   */
  function json_encode($data = null)
  {
	$json = new Services_JSON();
  	if($data == null) return false;
  	return $json->encode($data);
  }

  // ------------------------------------------------------------------------

  /**
   * json_decode
   *
   * Decodes JSON code to php.  Parameter is the data to be decoded.
   *
   * @access	public
   * @param	string
   * @return	string
   */
  function json_decode($data = null)
  {
	$json = new Services_JSON();
  	if($data == null) return false;
  	return $json->decode($data);
  }

  // ------------------------------------------------------------------------

}
