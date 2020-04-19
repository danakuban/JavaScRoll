const Player = require('./roleFramework/player.js');
let ClientSyncRole = require('./clientSyncRole.js');

const client = new Player();
client.plays(ClientSyncRole); //TODO: Constraint: has method update?
client.connect();
client.update = function() {
    createCloseButtons();
    addCloseListener();
    addCheckedListener();
    addDragAndDropListener();
};

addAddButtonListener();

/**
 * functionality of _todo list
 */
function createCloseButtons() {
    let nodes = document.getElementsByTagName("LI");
    for (let node of nodes) {
        if (node == null || node.tagName !== 'LI' || node.childNodes == null || (node.childNodes.length > 0 && node.childNodes[0].classList != null && node.childNodes[0].classList.contains("close"))) {
            continue;
        }
        const span = document.createElement("SPAN");
        const txt = document.createTextNode("\u00D7");
        span.className = "close";
        span.appendChild(txt);
        node.appendChild(span);
    }
}

function addCloseListener() {
    let closes = document.getElementsByClassName("close");
    for (let close of closes) {
        close.onclick = function () {
            let parent = this.parentElement;
            parent.remove();
        }
    }
}

function addCheckedListener() {
    // Add a "checked" symbol when clicking on a list item
    let list = document.querySelector('ul');
    if (list == null) return;
    list.addEventListener('click', function (ev) {
        if (ev.target.tagName === 'LI') {
            ev.target.classList.toggle('checked');
        }
    }, false);
}

function addAddButtonListener() {
    let addButton = document.getElementById("add");
    addButton.addEventListener('click', function (ev) {
        const li = document.createElement("li");
        const inputValue = document.getElementById("myInput").value;
        const t = document.createTextNode(inputValue);
        li.appendChild(t);
        if (inputValue === '') {
            alert("You must write something!");
        } else {
            document.getElementById("root").appendChild(li);
        }
        document.getElementById("myInput").value = "";
    });
}

// drag and drop
var srcId = null;
function handleDragStart(e) {
    // store source index
    srcId = e.target.id;
    e.dataTransfer.effectAllowed = 'move';
}

function handleDrop(e) {
    // this/e.target is current target element.
    e.preventDefault();
    if (e.stopPropagation) {
        e.stopPropagation(); // Stops some browsers from redirecting.
    }

    if (e.target.id !== srcId) {
        client.moveListItemById(srcId, e.target.id);
        console.log("moved something");
    }
}

function addDragAndDropListener() {
    let list = document.querySelector('ul');
    let entries = list.querySelectorAll('li');
    entries.forEach(elem => {
        elem.setAttribute("draggable", "true");
        elem.addEventListener('dragstart', handleDragStart, false);
        elem.addEventListener('dragover', function (event) {
            event.preventDefault(); // Necessary. Allows us to drop.
            event.dataTransfer.dropEffect = 'move';
        });
        elem.addEventListener('drop', handleDrop, false);
    });
}