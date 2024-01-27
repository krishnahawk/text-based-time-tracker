// TODO: When user mouses over bottom status bar, slide up status like time remaining, total time planned for the day, etc.
// TODO: Add text editor that allows you to edit the file directly from the browser, either by clicking a mouseover nav item or by pressing "e" on the keyboard
// Set time to 12:00am
const now = new Date();
now.setHours(0, 0, 0, 0);

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
    const habits = [];
    let totalTimePlanned = 0;
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

        // Check if the line starts with a percentage symbol
        if (line.startsWith('%')) {
            // Extract habit text and check for asterisk
            const habitText = line.substring(1).trim();
            const isDone = habitText.startsWith('*');
            const habit = isDone ? habitText.substring(1).trim() : habitText;

            // Add the habit to the habits array
            habits.push({ text: habit, isDone });
            continue; // Skip further processing for this line
        }

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


        const [duration, rawDescription] = lines[i].split(' - ');
        let description = rawDescription;

        // Check if description starts with an asterisk and update accordingly
        if (description.trim().startsWith('*')) {
            description = description.trim().substring(1).trim(); // Remove the asterisk and any extra space
            description = `<span class="strikeout">${description}</span>`; // Wrap in strikeout span
        }

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
        const isAfterEndTime = now.getTime() >= updatedTime.getTime();
        const isBeforeEndTime = now.getTime() <= updatedTime.getTime();
        const isBeforeEndTimeMinusOneMinute = now.getTime() <= (updatedTime.getTime() - 60000);
        if (isAfterEndTime) {
            timeblockDiv.classList.add('past');
        } else if (isAfterStartTime && isBeforeEndTimeMinusOneMinute) {
            timeblockDiv.classList.add('current');
            // Add start time to the data-start-time attribute
            timeblockDiv.setAttribute('data-start-time', baseTime.getTime());
            // Add end time to the data-end-time attribute
            timeblockDiv.setAttribute('data-end-time', updatedTimeMillis);
        }

        // Calculate total duration of the block in milliseconds
        const totalDurationMillis = updatedTimeMillis - baseTime.getTime();

        // Add the total duration to the total time planned
        totalTimePlanned += totalDurationMillis;

        // Determine whether this is the final block of the day
        const isFinalBlock = i === lines.length - 1;

        // If this is the final block, update the end_of_workday variable
        if (isFinalBlock) {
            endOfWorkday = updatedTime;
        }

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

    // If not on a mobile device
    if (!navigator.userAgent.match(/(iPad)|(iPhone)|(iPod)|(android)|(webOS)/i)) {
        // Get the height of the timeline div
        const timelineHeight = timelineDiv.offsetHeight;
        // scale font sizee based on height of timeline
        const fontSize = 19 * (timelineHeight / 800);
        timelineDiv.style.fontSize = `${fontSize}px`;
    }

    displayHabits(habits);
    displayTotalTimePlanned(totalTimePlanned);
    displayEndOfWorkdayTime(endOfWorkday);
    countdownToEndOfWorkday(endOfWorkday);
}

function countdownToEndOfWorkday(endOfWorkday) {
    const now = new Date();
    const timeRemainingMillis = endOfWorkday.getTime() - now.getTime();
    const timeRemainingSeconds = Math.floor(timeRemainingMillis / 1000);
    const timeRemainingMinutes = Math.floor(timeRemainingSeconds / 60);
    const timeRemainingSecondsMinusMinutes = timeRemainingSeconds - (timeRemainingMinutes * 60);
    const timeRemainingHours = Math.floor(timeRemainingMinutes / 60);
    const timeRemainingMinutesMinusHours = timeRemainingMinutes - (timeRemainingHours * 60);
    const timeRemainingDays = Math.floor(timeRemainingHours / 24);
    const timeRemainingHoursMinusDays = timeRemainingHours - (timeRemainingDays * 24);
    const timeRemainingDiv = document.getElementById('workday_remaining');
    const workdayRemainingDisplayString = '';
    if (timeRemainingDays > 0) {
        timeRemainingDiv.innerHTML = `${timeRemainingDays}d ${timeRemainingHoursMinusDays}h ${timeRemainingMinutesMinusHours}m`;
    }
    if (timeRemainingDays === 0 && timeRemainingHours > 0) {
        timeRemainingDiv.innerHTML = `${timeRemainingHours}h ${timeRemainingMinutesMinusHours}m`;
    }
    if (timeRemainingDays === 0 && timeRemainingHours === 0) {
        timeRemainingDiv.innerHTML = `${timeRemainingMinutes}m`;
    }
    if (timeRemainingDays === 0 && timeRemainingHours === 0 && timeRemainingMinutes === 0) {
        timeRemainingDiv.innerHTML = `${timeRemainingSeconds}s`;
    }
    if (timeRemainingMillis < 0) {
        timeRemainingDiv.innerHTML = '0h 0m';
    }
}

function displayTotalTimePlanned(totalTimePlanned) {
    const totalTimePlannedDiv = document.getElementById('total_time_planned');
    const totalTimePlannedHours = Math.floor(totalTimePlanned / 1000 / 60 / 60);
    const totalTimePlannedMinutes = Math.floor(totalTimePlanned / 1000 / 60) - (totalTimePlannedHours * 60);
    totalTimePlannedDiv.innerHTML = `${totalTimePlannedHours}h ${totalTimePlannedMinutes}m`;
}

function displayEndOfWorkdayTime(endOfWorkday) {
    const endOfWorkdayDiv = document.getElementById('end_of_workday_time');
    endOfWorkdayDiv.innerHTML = formatTime(endOfWorkday);
}

function displayHabits(habits) {
    const habitsDiv = document.getElementById('habits');
    habitsDiv.innerHTML = ''; // Clear previous habits

    habits.forEach(habit => {
        const habitDiv = document.createElement('div');
        habitDiv.className = 'habit';
        if (habit.isDone) {
            habitDiv.classList.add('done');
        }
        habitDiv.innerText = habit.text;
        habitsDiv.appendChild(habitDiv);
    });
}

function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    let ampm = hours >= 12 ? ' pm' : ' am';
    // // If on a device with max-width of 600px, just show a and p
    // if (window.matchMedia('(max-width: 1000px)').matches) {
    //     ampm = hours >= 12 ? 'p' : 'a';
    // }
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const strTime = hours + ':' + (minutes < 10 ? '0' : '') + minutes + ampm;
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

function loadScrollToCurrentSetting() {
    // Check to see if there is a browser storage value for scroll_to_current
    const scroll_to_current = localStorage.getItem('scroll_to_current');
    // If there is no value, set it to true
    if (!scroll_to_current) {
        localStorage.setItem('scroll_to_current', 'true');
    }
}

function toggleScrollToCurrentSetting(mode = null) {
    // Check to see if there is a browser storage value for scroll_to_current
    const scroll_to_current = localStorage.getItem('scroll_to_current');
    // If mode is null, toggle the value
    if (mode === null) {
        localStorage.setItem('scroll_to_current', scroll_to_current === 'true' ? 'false' : 'true');
    } else {
        localStorage.setItem('scroll_to_current', mode);
    }
}

// Add keyboard listener for 's' key
document.addEventListener('keydown', function (event) {
    if (event.key === 's') {
        toggleScrollToCurrentSetting();
    }
});

// TODO: Remove this old version if new version works
// function scrollToCurrent() {
//     const scroll_to_current = localStorage.getItem('scroll_to_current');
//     if (scroll_to_current === 'false') {
//         return;
//     }
//     const currentBlock = document.querySelector('.current');
//     if (currentBlock) {
//         currentBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
//     }
// }

function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function () {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function () {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    }
}

const throttledScrollToCurrent = throttle(scrollToCurrent, 1000);
setInterval(throttledScrollToCurrent, 100);

function scrollToCurrent() {
    const currentBlock = document.querySelector('.current');
    if (currentBlock) {
        const bounding = currentBlock.getBoundingClientRect();
        if (bounding.top < 0 || bounding.bottom > window.innerHeight) {
            currentBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// Call scrollToCurrent() every second
// TODO: Remove if throttling function works
// requestAnimationFrame(scrollToCurrent, 1000);

// Call updateCurrentTimeRemaining() every second
requestAnimationFrame(updateCurrentTimeRemaining, 1000);

function fetchAndUpdate() {
    fetchFile();
    requestAnimationFrame(fetchAndUpdate, 2000);
}

fetchAndUpdate(); // initial call
loadScrollToCurrentSetting(); // initial call

/* Force full page refresh if new date */
// Global variable to store the initial date
let initialDate = new Date().toISOString().split('T')[0];

function checkDateAndRefresh() {
    const currentDate = new Date().toISOString().split('T')[0];
    if (currentDate !== initialDate) {
        // Force full page refresh
        location.reload(true);
    }
}

// Set an interval to check the date every minute (60000 milliseconds)
requestAnimationFrame(checkDateAndRefresh, 60000);
