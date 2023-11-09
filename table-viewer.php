<?php

    // Turn on error reporting
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);

    // // Read JSON file
    // $json = file_get_contents('../time_log.json');

    // Read from JSON output
    $json_output_file = 'blox_to_json.php';

    // Include the file
    include $json_output_file;

    // Decode JSON file
    $data = json_decode($json, true);

    if (isset($_GET['sortby'])) {
        $sortby = $_GET['sortby'];
    } else {
        $sortby = 'date';
    }

    if (isset($_GET['orderby'])) {
        $orderby = $_GET['orderby'];
    } else {
        $orderby = 'asc';
    }

    if (isset($_GET['filterby'])) {
        $filterby = $_GET['filterby'];
    } else {
        $filterby = 'all';
    }

    if (isset($_GET['filtervalue'])) {
        $filtervalue = $_GET['filtervalue'];
    } else {
        $filtervalue = '';
    }

    // Sort the array
    usort($data['entries'], function ($a, $b) use ($sortby, $orderby) {
        if ($orderby === 'asc') {
            return $a[$sortby] <=> $b[$sortby];
        } else {
            return $b[$sortby] <=> $a[$sortby];
        }
    });

    // Filter the array
    $filteredData = [];

    foreach ($data['entries'] as $entry) {
        if ($filterby === 'all') {
            $filteredData[] = $entry;
        } else {
            if ($entry[$filterby] === $filtervalue) {
                $filteredData[] = $entry;
            }
        }
    }
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Timeblox Table Viewer</title>
    <!-- get pico css from cdn -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
    <!-- get bootstrap grid only from cdn -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap-grid.min.css">
    <style>
        :root {
            --primary: #5e35b1;
            --font-size: 16px;
            --font-weight: 200;
        }
        a {
            color: unset;
        }
        a:hover {
            color: var(--primary);
            text-decoration:none;
            cursor:pointer;
        }
        th {
            font-weight: 600;
            font-size: var(--font-size);
            text-align: left;
        }
        .fixed-footer-bar {
            position:fixed;
            bottom:0;
            left:0;
            right:0;
            height: 1.3rem;
            width: 100%;
            background:black;
            padding:0;
            border-top: 1px solid #585858;
        }
        .fixed-footer-bar a {
            width:100%;
            height:1.3rem;
            font-size:0.8rem;
            background: rgba(255,255,255,0.1);
            margin:0;
            display:flex;
            align-items:center;
            justify-content:center;
        }
        .fixed-footer-bar a:hover {
            color:unset;
            background: rgba(255,255,255,0.2);
        }
        .text-align-center {
            text-align:center;
        }
    </style>
</head>

<body>

<table role="grid">

<?php

    echo '<tr>';
    foreach ($filteredData as $entry) {
        foreach ($entry as $key => $value) {
            $key_upper = ucwords($key);
            // Make the table headers clickable
            // If the table is already sorted by this column, reverse the order
            if ($key === $sortby) {
                if ($orderby === 'asc') {
                    echo '<th><a href="?sortby=' . $key . '&orderby=desc">' . $key_upper . '</a></th>';
                } else {
                    echo '<th><a href="?sortby=' . $key . '&orderby=asc">' . $key_upper . '</a></th>';
                }
                continue;
            }
            echo '<th><a href="?sortby=' . $key . '&orderby=asc">' . $key_upper . '</a></th>';
        }
        break;
    }
    echo '</tr>';

    // Output the table rows based on values
    foreach ($filteredData as $entry) {
        echo '<tr>';
        foreach ($entry as $key => $value) {
            // Make the values clickable
            if ($key === 'date' || $key === 'client' || $key === 'project') {
                echo '<td><a href="?filterby='. $key .'&filtervalue=' . $value . '">' . $value . '</a></td>';
                continue;
            }
            echo '<td>' . $value . '</td>';
        }
        echo '</tr>';
    }

?>

</table>

<div class="fixed-footer-bar">
    <div class="container">
        <div class="row align-items-center">
            <div class="col text-align-center">
                <a href="table-viewer.php">Clear Filters</a>
            </div>
            <div class="col text-align-center">
                <a href="blox_to_csv.php">Download CSV</a>
            </div>
        </div>
    </div>
</div>

<!-- include jquery from cdn -->
<script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>

<script>
    $(document).ready(function() {
        // If control+x is pressed, clear the filter
        $(document).keydown(function(e) {
            if (e.ctrlKey && e.keyCode == 88) {
                window.location.href = 'table-viewer.php';
            }
        });
    });
</script>

</body>

</html>
