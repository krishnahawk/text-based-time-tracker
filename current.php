<?php

// Set timezone to california
date_default_timezone_set('America/Los_Angeles');

function camelCaseToWords($input) {
    // If the string is all uppercase, do nothing
    if (strtoupper($input) === $input) {
        return $input;
    }
    // Split camel case string and join words with space
    $result = preg_split('/(?<=\\w)(?=[A-Z])/', $input);
    $result = join(' ', $result);
    // If a lower-case letter is followed by a number, add a space
    $result = preg_replace('/([a-z])(\d)/', '$1 $2', $result);
    return $result;
}

function removeClientsFromDescription($input) {
    // Remove client from description
    $result = preg_replace('/@\w+/', '', $input);
    // Remove extra spaces
    $result = preg_replace('/\s+/', ' ', $result);
    // Trim whitespace
    $result = trim($result);
    return $result;
}


$directoryPath = 'blox';

// Read file with today's date
$today_iso_date = date('Y-m-d');
$date = $today_iso_date;
$today_file = $directoryPath . '/' . $today_iso_date . '.blox';
if (file_exists($today_file)) {
    $lines = file($today_file);

    // First line should have a time formatted as either 8am or 8:00am and is always to be used as the start time
    $start_time = trim($lines[0]);
    $start_time = str_replace(':', '', $start_time);
    $start_time = str_replace('am', '', $start_time);
    $start_time = str_replace('pm', '', $start_time);
    $start_time = str_replace(' ', '', $start_time);
    $start_time = str_pad($start_time, 4, '0', STR_PAD_LEFT);
    $start_time = substr($start_time, 0, 2) . ':' . substr($start_time, 2, 2);

    $entries = [];

    foreach ($lines as $line) {
        if (preg_match('/^(\d+)([mh]?) - (.+)$/', trim($line), $matches)) {
            // Calculate the minutes and convert to decimal hours
            $duration = (int)$matches[1];
            if ($matches[2] === 'h') {
                $duration *= 60; // Convert hours to minutes
            }
            $hours = round($duration / 60, 2);

            // For each line, use the start time from the first line and increment by the duration
            $start = $start_time;
            $end = date('H:i', strtotime($start_time . ' + ' . $duration . ' minutes'));

            // Remove brackets from description
            $description = str_replace(['[', ']'], '', $matches[3]);

            // Extract client and project, and convert camel case to words
            $client = $project = null;
            if (preg_match('/@(\w+)/', $description, $clientMatches)) {
                $client = camelCaseToWords($clientMatches[1]);
            }
            if (preg_match('/#(\w+)/', $description, $projectMatches)) {
                $project = camelCaseToWords($projectMatches[1]);

                // Replace matched project hashtag with project name
                $description = str_replace('#' . $projectMatches[1], $project, $description);

            }

            // Remove client from description
            $description = removeClientsFromDescription($description);

            // Prepare the entry
            $entry = [
                'date' => $date,
                'start' => $start,
                'end' => $end,
                'hours' => $hours,
                'client' => $client,
                'project' => $project,
                'description' => $description,
            ];

            $start_time = $end;

            $entries[] = $entry;

        }
    }

    // Go through each entry and determine which ones end after the current time
    $current_time = date('H:i');
    $current_entries = [];
    foreach ($entries as $entry) {
        if ($entry['end'] > $current_time) {
            $current_entries[] = $entry;
        }
    }

    // Return the current entries as JSON
    echo json_encode($current_entries, JSON_PRETTY_PRINT);
}