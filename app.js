// ==========================================
// 1. IMPORTS
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    set, 
    push, 
    onValue, 
    get,
    remove,
    update 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==========================================
// 2. CONFIGURATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAsKnSlvkFrl6os1h6Oo6PYQzSjA3QYeXU",
    authDomain: "study-room-f5c8a.firebaseapp.com",
    projectId: "study-room-f5c8a",
    storageBucket: "study-room-f5c8a.firebasestorage.app",
    messagingSenderId: "6069607923",
    appId: "1:6069607923:web:37e6f23575a864f83a4686",
    databaseURL: "https://study-room-f5c8a-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// ==========================================
// 3. INITIALIZE
// ==========================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app); 
const provider = new GoogleAuthProvider();

// Sound Effect
const notificationSound = new Audio("https://www.soundjay.com/buttons/sounds/button-30.mp3");

let currentUser = null;
let currentRoom = null;

// ==========================================
// 4. LOGIN LOGIC
// ==========================================
const btnLogin = document.getElementById("btn-login");

btnLogin.addEventListener("click", () => {
    signInWithPopup(auth, provider).catch((error) => alert(error.message));
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("dashboard-screen").classList.remove("hidden");
        renderRoomHistory();
    } else {
        currentUser = null;
        document.getElementById("login-screen").classList.remove("hidden");
        document.getElementById("dashboard-screen").classList.add("hidden");
        document.getElementById("room-screen").classList.add("hidden");
    }
});

// ==========================================
// 5. HISTORY HELPER FUNCTIONS
// ==========================================
function saveRoomToHistory(roomCode) {
    let history = JSON.parse(localStorage.getItem('studyRoomHistory')) || [];
    if (!history.includes(roomCode)) {
        history.unshift(roomCode);
        if (history.length > 5) history.pop();
        localStorage.setItem('studyRoomHistory', JSON.stringify(history));
    }
}

function renderRoomHistory() {
    const history = JSON.parse(localStorage.getItem('studyRoomHistory')) || [];
    const historySection = document.getElementById("history-section");
    const list = document.getElementById("room-history-list");

    list.innerHTML = ""; 

    if (history.length > 0) {
        historySection.classList.remove("hidden");
        history.forEach(code => {
            const li = document.createElement("li");
            li.innerHTML = `<span>🚪 ${code}</span><button class="btn-forget">🗑️</button>`;
            li.querySelector("span").onclick = () => checkAndJoin(code);
            li.querySelector(".btn-forget").onclick = (e) => {
                e.stopPropagation(); 
                removeRoomFromHistory(code);
            };
            list.appendChild(li);
        });
    } else {
        historySection.classList.add("hidden");
    }
}

function removeRoomFromHistory(roomCode) {
    let history = JSON.parse(localStorage.getItem('studyRoomHistory')) || [];
    history = history.filter(code => code !== roomCode);
    localStorage.setItem('studyRoomHistory', JSON.stringify(history));
    renderRoomHistory(); 
}

// ==========================================
// 6. CREATE & JOIN ROOMS
// ==========================================
function checkAndJoin(roomCode) {
    const roomRef = ref(db, 'rooms/' + roomCode);
    get(roomRef).then((snapshot) => {
        if (snapshot.exists()) {
            enterRoom(roomCode);
        } else {
            alert("Room no longer exists!");
            removeRoomFromHistory(roomCode);
        }
    });
}

document.getElementById("btn-create-room").addEventListener("click", () => {
    const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    set(ref(db, 'rooms/' + roomCode), {
        owner: currentUser.uid,
        createdAt: Date.now()
    }).then(() => enterRoom(roomCode));
});

document.getElementById("btn-join-room").addEventListener("click", () => {
    const roomCode = document.getElementById("input-room-code").value.toUpperCase().trim();
    if (roomCode) checkAndJoin(roomCode);
    else alert("Please enter a code!");
});

document.getElementById("btn-leave").addEventListener("click", () => location.reload());

// ==========================================
// 7. CHAT & TASKS (CORE LOGIC)
// ==========================================
function enterRoom(roomCode) {
    currentRoom = roomCode;
    saveRoomToHistory(roomCode);

    document.getElementById("dashboard-screen").classList.add("hidden");
    document.getElementById("room-screen").classList.remove("hidden");
    document.getElementById("room-title").innerText = `Room: ${roomCode}`;

    const chatRef = ref(db, `rooms/${roomCode}/messages`);

    // --- 1. SEND MESSAGE ---
    document.getElementById("btn-send-msg").onclick = () => {
        const input = document.getElementById("input-msg");
        if (input.value.trim() === "") return;

        push(chatRef, {
            user: currentUser.displayName,
            text: input.value,
            timestamp: Date.now() 
        });
        input.value = "";
    };

    // --- 2. RECEIVE MESSAGES ---
    const chatBox = document.getElementById("chat-box");
    onValue(chatRef, (snapshot) => {
        chatBox.innerHTML = "";
        const data = snapshot.val();
        
        if (data) {
            Object.entries(data).forEach(([key, msg]) => {
                const isMyMsg = msg.user === currentUser.displayName;
                
                // Format Time
                const timeVal = msg.timestamp ? new Date(msg.timestamp) : new Date();
                const timeString = timeVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // Play Sound logic (only if not me & recent)
                const isRecent = (Date.now() - msg.timestamp) < 2000;
                if (!isMyMsg && isRecent) {
                    notificationSound.play().catch(e => console.log("Sound blocked"));
                }

                // Delete Button
                const deleteBtn = isMyMsg 
                    ? `<span class="delete-msg" data-key="${key}" style="color:red; cursor:pointer; margin-left:10px; font-weight:bold;">(x)</span>` 
                    : '';

                chatBox.innerHTML += `
                    <div class="message ${isMyMsg ? 'my-msg' : 'other-msg'}">
                        <strong>${msg.user.split(" ")[0]}:</strong> ${msg.text} ${deleteBtn}
                        <span class="msg-time">${timeString}</span>
                    </div>`;
            });
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });

    // --- 3. DELETE MESSAGE ---
    chatBox.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-msg")) {
            const msgId = e.target.getAttribute("data-key");
            if(confirm("Delete this message?")) {
                remove(ref(db, `rooms/${roomCode}/messages/${msgId}`));
            }
        }
    });

    // --- TASKS FEATURE ---
    const taskRef = ref(db, `rooms/${roomCode}/tasks`);

    document.getElementById("btn-add-task").onclick = () => {
        const input = document.getElementById("input-task");
        if (input.value.trim() === "") return;
        push(taskRef, { text: input.value, completed: false });
        input.value = "";
    };

    const taskList = document.getElementById("todo-list");
    onValue(taskRef, (snapshot) => {
        taskList.innerHTML = "";
        const data = snapshot.val();
        if (data) {
            Object.entries(data).forEach(([key, task]) => {
                const textStyle = task.completed ? 'text-decoration: line-through; color: gray;' : '';
                const checkedState = task.completed ? 'checked' : '';

                taskList.innerHTML += `
                    <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; padding: 10px; border-bottom: 1px solid #eee;">
                        <div>
                            <input type="checkbox" class="toggle-task" data-key="${key}" ${checkedState}>
                            <span style="${textStyle}; margin-left: 10px;">${task.text}</span>
                        </div>
                        <button class="delete-task" data-key="${key}" style="color:red; background:none; border:none; cursor:pointer;">🗑️</button>
                    </li>`;
            });
        }
    });

    taskList.addEventListener("click", (e) => {
        const key = e.target.getAttribute("data-key");
        if (!key) return;
        if (e.target.classList.contains("toggle-task")) {
            update(ref(db, `rooms/${roomCode}/tasks/${key}`), { completed: e.target.checked });
        }
        if (e.target.classList.contains("delete-task")) {
            remove(ref(db, `rooms/${roomCode}/tasks/${key}`));
        }
    });
}