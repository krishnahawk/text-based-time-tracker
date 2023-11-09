// TODO: When user mouses over bottom status bar, slide up status like time remaining, total time planned for the day, etc.
// TODO: Add text editor that allows you to edit the file directly from the browser, either by clicking a mouseover nav item or by pressing "e" on the keyboard
// Set time to 12:00am
const now = new Date();
now.setHours(0, 0, 0, 0);


// const now = new Date("Wed Oct 04 2023 20:20:00 GMT-1000");
// const filePath = 'timeblock.txt'; // Replace with your local file path
// today's date in iso format
const today = now.toISOString().split('T')[0];
const filePath = 'blox/' + today + '.blox'; // Replace with your local file path
const exampleFilePath = 'blox/YYYY-MM-DD.blox';
function fetchFile() {
    const filePathWithCacheBuster = filePath + `?cacheBuster=${new Date().getTime()}`;
    fetch(filePathWithCacheBuster)
        .then(response => response.text())
        .then(data => {
            parseAndDisplay(data);
        }
        ).catch(error => {
            console.log('Error fetching file:', error);
            // If the file doesn't exist, display an example file
            fetch(exampleFilePath)
                .then(response => response.text())
                .then(data => {
                    parseAndDisplay(data);
                }
                );
        }
        );
}

function parseAndDisplay(data) {
    const lines = data.split('\n');
    // If line is empty, remove it
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '') {
            lines.splice(i, 1);
        }
    }

    // If line doesn't start with a number, return the text as is and don't parse it
    for (let i = 0; i < lines.length; i++) {
        if (!lines[i].trim().match(/^\d/)) {
            lines[i] = lines[i].trim();
        }
    }

    const startTime = new Date();
    startTime.setHours(0, 0, 0, 0); // Set to start of the day (midnight)

    // TODO: If just a number is entered without m or h, it should assume it is minutes
    // TODO: If a mix of h and m is entered (like 1h26m) it should calculate the total duration
    // TODO: The very next time entry from the current one should tell you how long you have until the next time entry
    // FIXME: There should only be one timeblock highlighted at a time, right now there are overlapping minutes when one is ending and the other is starting
    const [_, hour, minutesRaw, ampm] = lines[0].match(/(\d+)(?::(\d+))?(am|pm)/i);
    const minutes = minutesRaw || "0";
    ;
    if (ampm.toLowerCase() === 'pm' && hour !== "12") {
        startTime.setHours(parseInt(hour) + 12);

    } else if (ampm.toLowerCase() === 'am' && hour === "12") {
        startTime.setHours(0);

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

        const line = lines[i].trim();

        // Check if the line is a new start time
        const newTimeMatch = line.match(/(\d+)(?::(\d+))?(am|pm)/i);
        if (newTimeMatch) {
            // Parse the new start time and update baseTime
            const [_, hour, minutesRaw, ampm] = newTimeMatch;
            const minutes = minutesRaw || "0";
            let newBaseTime = new Date(baseTime.getTime());
            newBaseTime.setHours(parseInt(hour) + (ampm.toLowerCase() === 'pm' && hour !== "12" ? 12 : 0));
            newBaseTime.setMinutes(parseInt(minutes));
            newBaseTime.setSeconds(0); // Reset seconds
            newBaseTime.setMilliseconds(0); // Reset milliseconds
            if (ampm.toLowerCase() === 'am' && hour === "12") {
                newBaseTime.setHours(0);
            }
            baseTime = newBaseTime;
            continue; // Skip to next iteration as this line is just a time
        }
        // If the line doesn't start with a number, create a memo div with text
        if (!lines[i].trim().match(/^\d/)) {
            const memoDiv = document.createElement('div');
            memoDiv.className = 'memo';
            memoDiv.innerHTML = lines[i].trim();
            timelineDiv.appendChild(memoDiv);
            continue;
        }

        const [duration, description] = lines[i].split(' - ');

        const value = parseInt(duration);

        let updatedTimeMillis = baseTime.getTime();

        if (duration.includes('h')) {
            updatedTimeMillis += value * 60 * 60 * 1000; // Add hours in milliseconds
        } else if (duration.includes('m')) {
            updatedTimeMillis += value * 60 * 1000; // Add minutes in milliseconds
        }

        let updatedTime = new Date(updatedTimeMillis);

        // In the description, wrap any words starting with a @ in a span with class "client", and wrap any words starting with a # in a span with class "project"
        const descriptionWithClasses = description.replace(/(@\w+)/g, '<span class="client">$1</span>').replace(/(#\w+)/g, '<span class="project">$1</span>');

        const timeblockDiv = document.createElement('div');
        timeblockDiv.className = 'timeblock';
        // timeblockDiv.innerHTML = `${formatTime(baseTime)} - ${formatTime(updatedTime)}: ${description}`;
        timeblockDiv.innerHTML = `<div class="start_time">${formatTime(baseTime)}</div><div class="description">${descriptionWithClasses}</div>`;
        const now = new Date();
        now.setSeconds(0);
        now.setMilliseconds(0);

        const isAfterStartTime = now.getTime() >= baseTime.getTime();
        const isBeforeEndTime = now.getTime() <= updatedTime.getTime();
        const isBeforeEndTimeMinusOneMinute = now.getTime() <= (updatedTime.getTime() - 60000);
        if (isAfterStartTime && isBeforeEndTimeMinusOneMinute) {
            timeblockDiv.classList.add('current');
            // Add start time to the data-start-time attribute
            timeblockDiv.setAttribute('data-start-time', baseTime.getTime());
            // Add end time to the data-end-time attribute
            timeblockDiv.setAttribute('data-end-time', updatedTimeMillis);
        }

        // Calculate total duration of the block in milliseconds
        const totalDurationMillis = updatedTimeMillis - baseTime.getTime();

        // Calculate percentage of the block that has passed
        const percentagePassed = (now.getTime() - baseTime.getTime()) / totalDurationMillis;

        // // Update the width of the #progress_bar div
        // const progressBarDiv = document.getElementById('progress_bar');

        // progressBarDiv.style.width = `${percentagePassed * 100}%`;
        // if (percentagePassed < 0.15) {
        //     progressBarDiv.classList.add('progress_bar_inactive');
        // } else {
        //     progressBarDiv.classList.remove('progress_bar_inactive');
        // }

        // Calculate 15% of that duration
        const last15PercentMillis = totalDurationMillis * 0.25;

        // If the description contains "[" and "]", add a class to the timeblock
        if (description.includes('[') && description.includes(']')) {
            timeblockDiv.classList.add('offline');
            // Remove the brackets from the description and re-add it
            timeblockDiv.innerHTML = `<div class="start_time">${formatTime(baseTime)}</div><div class="description">${description.replace('[', '').replace(']', '')}</div>`;
        }

        timelineDiv.appendChild(timeblockDiv);

        baseTime = updatedTime; // Update the base time for the next iteration
        // baseTime.setMinutes(baseTime.getMinutes() - 1); // Add 1 minute to the base time

    }

    // Get the height of the timeline div
    const timelineHeight = timelineDiv.offsetHeight;
    // scale font sizee based on height of timeline
    const fontSize = 19 * (timelineHeight / 800);
    timelineDiv.style.fontSize = `${fontSize}px`;

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

function updateCurrentTimeRemaining() {
    // Get the current timeblock
    const currentBlock = document.querySelector('.current');
    // Get the end time of the current timeblock
    const endTime = currentBlock.getAttribute('data-end-time');
    const startTime = currentBlock.getAttribute('data-start-time');
    // Get the total duration of the current timeblock in milliseconds
    const totalDurationMillis = endTime - startTime;
    // Get the current unix time
    const now = new Date();
    // Calculate the time remaining in milliseconds
    const timeRemainingMillis = endTime - now.getTime();
    // Convert milliseconds to seconds
    const timeRemainingSeconds = Math.floor(timeRemainingMillis / 1000);
    // Convert seconds to minutes
    const timeRemainingMinutes = Math.floor(timeRemainingSeconds / 60);
    // Subtract the minutes from the seconds
    const timeRemainingSecondsMinusMinutes = timeRemainingSeconds - (timeRemainingMinutes * 60);
    // Don't allow negative time remaining to be displayed
    if (timeRemainingSecondsMinusMinutes < 0) {
        timeRemainingSecondsMinusMinutes = 0;
    }
    if (timeRemainingMinutes < 0) {
        timeRemainingMinutes = 0;
    }
    if (timeRemainingSeconds < 0) {
        timeRemainingSeconds = 0;
    }
    if (timeRemainingMillis < 0) {
        timeRemainingMillis = 0;
    }
    // Calculate the percentage of the timeblock that has passed
    const percentagePassed = (now.getTime() - startTime) / totalDurationMillis;
    // Update the width of the #progress_bar div
    const progressBarDiv = document.getElementById('progress_bar');
    progressBarDiv.style.width = `${percentagePassed * 100}%`;

    // Update the time remaining div
    const timeRemainingDiv = document.getElementById('time_remaining');
    timeRemainingDiv.innerHTML = `${timeRemainingMinutes}m ${timeRemainingSecondsMinusMinutes}s`;
    // If the percentage passed is greater than 85%, add a class to the time remaining div
    if (percentagePassed > 0.50) {
        timeRemainingDiv.classList.add('last_half');
    } else {
        timeRemainingDiv.classList.remove('last_half');
    }
    // If the time remaining is less than 1 minute, add a class to the time remaining div
    if (timeRemainingMinutes < 1) {
        timeRemainingDiv.classList.add('less_than_one_minute');
        // Add .ending class to the current timeblock
        currentBlock.classList.add('ending');
    } else {
        timeRemainingDiv.classList.remove('less_than_one_minute');
        // Remove .ending class from the current timeblock
        currentBlock.classList.remove('ending');
    }
}

function scrollToCurrent() {
    const currentBlock = document.querySelector('.current');
    if (currentBlock) {
        currentBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
// Call scrollToCurrent() every second
setInterval(scrollToCurrent, 1000);

// Call updateCurrentTimeRemaining() every second
setInterval(updateCurrentTimeRemaining, 1000);

function fetchAndUpdate() {
    fetchFile();
    setTimeout(fetchAndUpdate, 2000);
}

fetchAndUpdate(); // initial call
