<?php

// Turn on error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

// Replace with your file path
$filePath = '/var/www/html/timeblox/blox/2023-11-22.blox';

$unixCurrentTime = time();

echo $unixCurrentTime;

// Read the file contents
$fileContents = file_get_contents($filePath);
$lines = explode("\n", $fileContents);

$day_start_time = $lines[0];
$day_start_timestamp = strtotime($day_start_time);

echo $day_start_timestamp;

$starting_timestamp = $day_start_timestamp;

// Remove the first line
array_shift($lines);

$currentBlockDescription = "";
foreach ($lines as $line) {
    // Ignore empty lines and lines not starting with a number
    if (empty(trim($line)) || !preg_match('/^\d/', $line)) {
        continue;
    }

    // Split the line into duration and description, format is always 10m - Description
    $lineParts = explode(' - ', $line, 2);

    // Get the duration
    $duration = $lineParts[0];

    // Get the description
    $description = $lineParts[1];

    // If the duration contains an 'm' then it's minutes
    if (strpos($duration, 'm') !== false) {
        // Remove the 'm' from the duration
        $duration = str_replace('m', '', $duration);

        // Convert minutes to seconds
        // $duration = $duration * 60 * 60;

        // Duration in milliseconds
        $unix_duration = $duration * 60 * 1000;

        echo 'minutes duration: ' . $duration . '<br>';

    } else {
        // Remove the 'h' from the duration
        $duration = str_replace('h', '', $duration);

        // Convert hours to seconds
        // $duration = $duration * 60 * 60;

        // Duration in milliseconds
        $unix_duration = $duration * 60 * 60 * 1000;

        echo 'hours duration: ' . $duration . '<br>';
    }

    echo ' '. $description . '<br>';

    // Add the duration to the start
    $starting_timestamp = $starting_timestamp + $unix_duration;

    echo 'starting timestamp: ' . $starting_timestamp . '<br>';

    // If the current timestamp is greater than the current time, then we've found the current block
    if ($starting_timestamp > $unixCurrentTime) {

        echo 'current timestamp: ' . $starting_timestamp . '<br>';
        echo 'current time: ' . $unixCurrentTime . '<br>';
        // Set the current block description
        $currentBlockDescription = $description;

        // Break out of the loop
        break;
    }

}

// Output the current block description
echo $currentBlockDescription;
?>
