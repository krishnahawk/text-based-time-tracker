<?php

// First include and run blox_to_json.php
include 'blox_to_json.php';

// Then include and run json_to_csv.php
include 'json_to_csv.php';

// Then download the CSV file
header('Content-Type: application/csv');
header('Content-Disposition: attachment; filename="time_log.csv";');
readfile('time_log.csv');

?>
