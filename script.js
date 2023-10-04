
// const now = new Date("Wed Oct 04 2023 20:20:00 GMT-1000");
const filePath = 'timeblock.txt'; // Replace with your local file path
function fetchFile() {
    fetch(filePath)
        .then(response => response.text())
        .then(data => {
            parseAndDisplay(data);
        });
}

function parseAndDisplay(data) {
    const lines = data.split('\n');
    // If line is empty, remove it
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '') {
            lines.splice(i, 1);
        }
    }

    const startTime = new Date();
    startTime.setHours(0, 0, 0, 0); // Set to start of the day (midnight)

    const [_, hour, minutesRaw, ampm] = lines[0].match(/(\d+)(?::(\d+))?(am|pm)/i);
const minutes = minutesRaw || "0";
;
    if (ampm.toLowerCase() === 'pm' && hour !== "12") {
        startTime.setHours(parseInt(hour) + 12);
    } else {
        startTime.setHours(parseInt(hour));
    }
    startTime.setMinutes(parseInt(minutes));
    startTime.setSeconds(0); // Reset seconds
    startTime.setMilliseconds(0); // Reset millisecondss

    const timelineDiv = document.getElementById('timeline');
    timelineDiv.innerHTML = ''; // Clear previous entries
    let baseTime = new Date(startTime.getTime());

    for (let i = 1; i < lines.length; i++) {
        const [duration, description] = lines[i].split(' - ');

        const value = parseInt(duration);

        let updatedTimeMillis = baseTime.getTime();
        console.log('Initial millis:', updatedTimeMillis);

        if (duration.includes('h')) {
            console.log('Adding hours to endTime');
            updatedTimeMillis += value * 60 * 60 * 1000; // Add hours in milliseconds
        } else if (duration.includes('m')) {
            console.log('Adding minutes to endTime');
            updatedTimeMillis += value * 60 * 1000; // Add minutes in milliseconds
        }

        let updatedTime = new Date(updatedTimeMillis);
        console.log('Updated millis:', updatedTimeMillis);

        const timeblockDiv = document.createElement('div');
        timeblockDiv.className = 'timeblock';
        // timeblockDiv.innerHTML = `${formatTime(baseTime)} - ${formatTime(updatedTime)}: ${description}`;
        timeblockDiv.innerHTML = `<div class="start_time">${formatTime(baseTime)}</div><div class="description">${description}</div>`;
        const now = new Date();
        now.setSeconds(0);
        now.setMilliseconds(0);

        const isAfterStartTime = now.getTime() >= baseTime.getTime();
        const isBeforeEndTime = now.getTime() <= updatedTime.getTime();

        console.log("Is after start time:", isAfterStartTime);
        console.log("Is before end time:", isBeforeEndTime);

        if (isAfterStartTime && isBeforeEndTime) {
            timeblockDiv.classList.add('current');
        }

        // Calculate total duration of the block in milliseconds
const totalDurationMillis = updatedTimeMillis - baseTime.getTime();

// Calculate 15% of that duration
const last15PercentMillis = totalDurationMillis * 0.15;

// Check if the current time is within the last 15% of the block
if (now.getTime() >= (updatedTimeMillis - last15PercentMillis) && now.getTime() <= updatedTimeMillis) {
    timeblockDiv.classList.add('ending');
}

        timelineDiv.appendChild(timeblockDiv);

        console.log('Start Time:', formatTime(baseTime));
        console.log('End Time:', formatTime(updatedTime)); // Log the End Time before updating baseTime
        console.log('Current Time:', formatTime(now));
        console.log('Parsed Duration:', value);

        baseTime = updatedTime; // Update the base time for the next iteration
        baseTime.setMinutes(baseTime.getMinutes() + 1); // Add 1 minute to the base time

    }
}


function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const strTime = hours + ':' + (minutes < 10 ? '0' : '') + minutes + ' ' + ampm;
    return strTime;
}

// Initial load
fetchFile();

// Update every 2 seconds
setInterval(fetchFile, 2000);
