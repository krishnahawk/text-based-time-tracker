<?php

// Turn on error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

// Replace with your file path
$filePath = '/var/www/html/timeblox/blox/2023-11-20.blox';
$currentDate = new DateTime();
$currentDate->setTime(0, 0, 0);

// Read the file contents
$fileContents = file_get_contents($filePath);
$lines = explode("\n", $fileContents);

$currentTime = new DateTime();

$currentBlockDescription = "";
foreach ($lines as $line) {
    // Ignore empty lines and lines not starting with a time
    if (empty(trim($line)) || !preg_match('/^\d/', $line)) {
        continue;
    }

    // Extract time and description
    preg_match('/(\d+)(?::(\d+))?(am|pm) - (.+)/i', $line, $matches);
    $hour = $matches[1];
    $minute = $matches[2] ?? '0';
    $ampm = $matches[3];
    $description = $matches[4];

    // Convert time to 24-hour format
    if (strtolower($ampm) == 'pm' && $hour != 12) {
        $hour += 12;
    }

    // Create DateTime object for block start time
    $blockStartTime = clone $currentDate;
    $blockStartTime->setTime($hour, $minute);

    // Check if current time is within this block
    if ($currentTime >= $blockStartTime) {
        $currentBlockDescription = $description;
    } else {
        // Since blocks are sequential, once a future block is reached, break the loop
        break;
    }
}

// Output the current block description
echo $currentBlockDescription;
?>
