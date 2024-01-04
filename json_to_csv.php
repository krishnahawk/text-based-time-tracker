<?php

// The JSON file path
$jsonFilePath = 'time_log2.json';
// The CSV file path
$csvFilePath = 'time_log2.csv';

// Read the JSON file
$jsonData = file_get_contents($jsonFilePath);
// Decode the JSON data into an associative array
$arrayData = json_decode($jsonData, true);

if (!empty($arrayData['entries'])) {
    // Open the CSV file for writing
    $csvFile = fopen($csvFilePath, 'w');
    if ($csvFile === false) {
        die("Unable to open the CSV file for writing.");
    }

    // Add CSV headers
    fputcsv($csvFile, array('Description', 'Hours', 'Date', 'Client', 'Project'));

    // Loop through the entries and add to the CSV
    foreach ($arrayData['entries'] as $entry) {
        fputcsv($csvFile, array(
            $entry['description'],
            $entry['hours'],
            $entry['date'],
            isset($entry['client']) ? $entry['client'] : '',
            isset($entry['project']) ? $entry['project'] : '',
        ));
    }

    // Close the CSV file
    fclose($csvFile);
} else {
    echo "No entries found in the JSON data.";
}

?>
