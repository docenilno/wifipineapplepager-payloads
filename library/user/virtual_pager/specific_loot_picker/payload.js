(() => {
    function initLootUI() {
        if (window._lootUIInit) return;
        window._lootUIInit = true;

        if (!document.getElementById("lootModal")) {
            const style = document.createElement("style");
            style.textContent = `
                .loot-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; }
                .loot-modal { background: #1e1e1e; color: #fff; border-radius: 10px; width: 420px; padding: 20px; box-shadow: 0 10px 40px rgba(0,0,0,.6); font-family: sans-serif; animation: pop .15s ease-out; }
                @keyframes pop { from { transform: scale(.9); opacity: 0 } to { transform: scale(1); opacity: 1 } }
                .loot-modal h2 { margin: 0 0 12px; font-size: 18px; }
                .loot-links a { display: block; padding: 10px; border-radius: 6px; margin-bottom: 8px; background: #2b2b2b; color: #4fc3f7; text-decoration: none; cursor: pointer; }
                .loot-links a:hover { background: #3a3a3a; }
                .loot-close { margin-top: 14px; width: 100%; padding: 8px; border-radius: 6px; border: none; background: #ff5252; color: #fff; cursor: pointer; }
            `;
            document.head.appendChild(style);

            const overlay = document.createElement("div");
            overlay.className = "loot-overlay";
            overlay.id = "lootModal";
            overlay.style.display = "none";
            overlay.innerHTML = `
                <div class="loot-modal">
                    <h2>Download Specific Loot</h2>
                    <div class="loot-links">
                        <p style="color:#aaa;">Fetching loot list...</p>
                    </div>
                    <button class="loot-close">Close</button>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.querySelector(".loot-close").onclick = () => overlay.style.display = "none";
            overlay.onclick = e => e.target === overlay && (overlay.style.display = "none");
        }

        const overlay = document.getElementById("lootModal");
        const linksContainer = overlay.querySelector(".loot-links");

        const ul = document.querySelector("#sidebarnav ul");
        if (!ul) return;

        const li = document.createElement("li");
        li.innerHTML = `
            <a href="#" id="lootSidebarBtn">
                <i class="material-icons">download</i>
                <div class="sidebarsub">
                    Download Specific Loot
                    <div class="sidebarmini">
                        Download a specific loot folder from /root/loot
                    </div>
                </div>
            </a>
        `;
        ul.appendChild(li);

        const sidebarBtn = document.getElementById("lootSidebarBtn");
        sidebarBtn.addEventListener("click", e => {
            e.preventDefault();
            overlay.style.display = "flex";
        });

        const url = window.location.origin + "/api/terminal/openWs";
        const ws = new WebSocket(url);

        let buffer = "";
        let phase = "waitingForPrompt";
        const sentCommand = "ls /root/loot/ | tr '\\n' ','; echo";

        const promptRegex = /^[\w.-]+@[\w.-]+[:\w\/~]*[$#] ?/m;

        function cleanText(str) {
            return str
                .replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, "")
                .replace(/\x1b\].*?(\x07|$)/g, "")
                .replace(/[^\x20-\x7E,\n]/g, "");
        }

        ws.addEventListener("message", async (event) => {
            let chunk = "";
            if (event.data instanceof Blob) chunk = await event.data.text();
            else if (event.data instanceof ArrayBuffer) chunk = new TextDecoder().decode(event.data);
            else chunk = String(event.data);

            buffer += chunk;
            const cleanBuffer = cleanText(buffer);

            if (phase === "waitingForPrompt" && promptRegex.test(cleanBuffer)) {
                ws.send(sentCommand + "\n");
                buffer = "";
                phase = "waitingForOutput";
                return;
            }

            if (phase === "waitingForOutput" && promptRegex.test(cleanBuffer)) {
                let output = cleanBuffer
                    .split(/\r?\n/)
                    .filter(line => !promptRegex.test(line))
                    .join("\n")
                    .trim();

                if (output.startsWith(sentCommand)) output = output.slice(sentCommand.length).trim();

                const list = output.split(",").map(s => s.trim()).filter(Boolean);

                linksContainer.innerHTML = "";
                if (!list.length) {
                    linksContainer.innerHTML = "<p style='color:#aaa;'>No loot found</p>";
                } else {
                    list.forEach(dir => {
                        const a = document.createElement("a");
                        a.textContent = dir;
                        a.href = "#";
                        a.addEventListener("click", e => {
                            e.preventDefault();
                            const zipUrl = `/api/files/zip/root/loot/${dir}`;
                            const tmp = document.createElement("a");
                            tmp.href = zipUrl;
                            tmp.download = `${dir}.zip`;
                            document.body.appendChild(tmp);
                            tmp.click();
                            document.body.removeChild(tmp);
                        });
                        linksContainer.appendChild(a);
                    });
                }

                phase = "done";
            }
        });

        window._terminalWs = ws;
    }

    function waitForBody() {
        if (document.body) {
            const observer = new MutationObserver(() => {
                const sidebar = document.getElementById("sidebarnav");
                if (sidebar && window.getComputedStyle(sidebar).display !== "none") {
                    initLootUI();
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });

            const sidebar = document.getElementById("sidebarnav");
            if (sidebar && window.getComputedStyle(sidebar).display !== "none") {
                initLootUI();
                observer.disconnect();
            }
        } else {
            requestAnimationFrame(waitForBody);
        }
    }

    waitForBody();
})();
