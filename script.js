
const now = new Date("Wed Oct 04 2023 20:20:00 GMT-1000");
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
    const startTime = new Date();
    const [hour, ampm] = lines[0].match(/(\d+)(am|pm)/i);
    startTime.setHours(ampm.toLowerCase() === 'am' ? parseInt(hour) : parseInt(hour) + 12);
    startTime.setMinutes(0);
    startTime.setSeconds(0); // Reset seconds
    startTime.setMilliseconds(0); // Reset milliseconds

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
        timeblockDiv.innerHTML = `${formatTime(baseTime)} - ${formatTime(updatedTime)}: ${description}`;

        const now = new Date();
        now.setSeconds(0);
        now.setMilliseconds(0);

        if (now.getTime() >= baseTime.getTime() && now.getTime() <= updatedTime.getTime()) {
            timeblockDiv.classList.add('current');
            console.log("Current class added:", timeblockDiv.classList);
        }

        timelineDiv.appendChild(timeblockDiv);

        console.log('Start Time:', formatTime(baseTime));
        console.log('End Time:', formatTime(updatedTime)); // Log the End Time before updating baseTime
        console.log('Current Time:', formatTime(now));
        console.log('Parsed Duration:', value);

        baseTime = updatedTime; // Update the base time for the next iteration
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

// Update every minute
setInterval(fetchFile, 60000);
