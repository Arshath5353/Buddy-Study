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
        // SHOW HISTORY WHEN LOGGED IN
        renderRoomHistory();
    } else {
        currentUser = null;
        document.getElementById("login-screen").classList.remove("hidden");
        document.getElementById("dashboard-screen").classList.add("hidden");
        document.getElementById("room-screen").classList.add("hidden");
    }
});

// ==========================================
// 5. HISTORY HELPER FUNCTIONS (LOCAL STORAGE)
// ==========================================
function saveRoomToHistory(roomCode) {
    let history = JSON.parse(localStorage.getItem('studyRoomHistory')) || [];
    // Avoid duplicates
    if (!history.includes(roomCode)) {
        history.unshift(roomCode); // Add to top
        if (history.length > 5) history.pop(); // Keep only last 5
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
            li.innerHTML = `
                <span>🚪 ${code}</span>
                <button class="btn-forget" title="Forget Room">🗑️</button>
            `;

            // Click Name -> Check & Join
            li.querySelector("span").onclick = () => checkAndJoin(code);

            // Click Trash -> Remove
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
    }).then(() => {
        enterRoom(roomCode);
    });
});

document.getElementById("btn-join-room").addEventListener("click", () => {
    const roomCode = document.getElementById("input-room-code").value.toUpperCase().trim();
    if (!roomCode) return alert("Please enter a code!");
    checkAndJoin(roomCode);
});

document.getElementById("btn-leave").addEventListener("click", () => {
    location.reload(); 
});

// ==========================================
// 7. CHAT & TASKS
// ==========================================
function enterRoom(roomCode) {
    currentRoom = roomCode;
    
    // Save to History
    saveRoomToHistory(roomCode);

    document.getElementById("dashboard-screen").classList.add("hidden");
    document.getElementById("room-screen").classList.remove("hidden");
    document.getElementById("room-title").innerText = `Room: ${roomCode}`;

    const chatRef = ref(db, `rooms/${roomCode}/messages`);

    // --- AUTO DELETE OLD MESSAGES (8 Hrs) ---
    get(chatRef).then((snapshot) => {
        if (snapshot.exists()) {
            const messages = snapshot.val();
            const now = Date.now();
            const TIME_LIMIT = 8 * 60 * 60 * 1000; 

            Object.keys(messages).forEach((msgId) => {
                const msg = messages[msgId];
                if (msg.timestamp && (now - msg.timestamp > TIME_LIMIT)) {
                    remove(ref(db, `rooms/${roomCode}/messages/${msgId}`));
                }
            });
        }
    });

    // --- CHAT FEATURE ---
    
    // 1. Send Message
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

    // 2. Display Messages
    const chatBox = document.getElementById("chat-box");
    onValue(chatRef, (snapshot) => {
        chatBox.innerHTML = "";
        const data = snapshot.val();
        
        if (data) {
            Object.entries(data).forEach(([key, msg]) => {
                const isMyMsg = msg.user === currentUser.displayName;
                
                const deleteBtn = isMyMsg 
                    ? `<span class="delete-msg" data-key="${key}" style="color:red; cursor:pointer; margin-left:10px; font-weight:bold;">(x)</span>` 
                    : '';

                chatBox.innerHTML += `
                    <div class="message ${isMyMsg ? 'my-msg' : 'other-msg'}">
                        <strong>${msg.user.split(" ")[0]}:</strong> ${msg.text} ${deleteBtn}
                    </div>`;
            });
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });

    // 3. Chat Click (Delete)
    chatBox.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-msg")) {
            const msgId = e.target.getAttribute("data-key");
            if(confirm("Delete this message?")) {
                remove(ref(db, `rooms/${roomCode}/messages/${msgId}`));
            }
        }
    });

    // --- TASK FEATURE ---
    const taskRef = ref(db, `rooms/${roomCode}/tasks`);

    // 1. Add Task
    document.getElementById("btn-add-task").onclick = () => {
        const input = document.getElementById("input-task");
        if (input.value.trim() === "") return;

        push(taskRef, {
            text: input.value,
            completed: false 
        });
        input.value = "";
    };

    // 2. Display Tasks
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

    // 3. Task Click (Toggle/Delete)
    taskList.addEventListener("click", (e) => {
        const key = e.target.getAttribute("data-key");
        if (!key) return;

        if (e.target.classList.contains("toggle-task")) {
            update(ref(db, `rooms/${roomCode}/tasks/${key}`), {
                completed: e.target.checked
            });
        }

        if (e.target.classList.contains("delete-task")) {
            remove(ref(db, `rooms/${roomCode}/tasks/${key}`));
        }
    });
}