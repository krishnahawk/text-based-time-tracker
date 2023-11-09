<?php

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


$directoryPath = 'blox'; // Replace with your actual "blox" folder path
$outputPath = 'time_log.json'; // Replace with your actual output folder path

$entries = [];

// Read files from directory
$files = new DirectoryIterator($directoryPath);
foreach ($files as $file) {
    if ($file->isDot() || $file->getExtension() !== 'blox' || $file->getFilename() === 'YYYY-MM-DD.blox' || $file->getFilename() === 'tomorrow.blox') {
        continue;
    }

    $date = substr($file->getFilename(), 0, 10); // Extract the date from the filename
    $lines = file($file->getPathname());

    foreach ($lines as $line) {
        if (preg_match('/^(\d+)([mh]?) - (.+)$/', trim($line), $matches)) {
            // Calculate the minutes and convert to decimal hours
            $duration = (int)$matches[1];
            if ($matches[2] === 'h') {
                $duration *= 60; // Convert hours to minutes
            }
            $hours = round($duration / 60, 2);

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
                'hours' => $hours,
                'client' => $client,
                'project' => $project,
                'description' => $description,
            ];

            $entries[] = $entry;
        }
    }
}

if (isset($_GET['output']) && ($_GET['output'] == 'file')) {
    // Write the JSON output
    file_put_contents($outputPath, json_encode(['entries' => $entries], JSON_PRETTY_PRINT));
}

if (isset($_GET['output']) && ($_GET['output'] == 'json')) {
    // Write the JSON output
    echo json_encode(['entries' => $entries], JSON_PRETTY_PRINT);
}

if (!isset($_GET['output'])) {
    // Just add the output to a variable to be included in other files
    $json = json_encode(['entries' => $entries], JSON_PRETTY_PRINT);
}
