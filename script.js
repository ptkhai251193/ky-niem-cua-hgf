const SUPABASE_URL = 'https://pgyelwrwfzbwjpdzatfa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8rsGFehOQOiOaXb59y6umQ_m9JAp60H';
const mySupabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ĐẶT MẬT KHẨU CỦA KHẢI TẠI ĐÂY
const ADMIN_PASSWORD = "khai2026"; 

// 1. TẢI ALBUM
async function loadMemories() {
    try {
        const { data, error } = await mySupabase.from('memories').select('*').order('id', { ascending: false });
        if (error) return;
        const memoryList = document.getElementById("memoryList");
        memoryList.innerHTML = '';
        const albums = {};
        data.forEach(item => { if (!albums[item.content]) albums[item.content] = []; albums[item.content].push(item); });
        
        for (const title in albums) {
            const items = albums[title];
            const itemsJson = JSON.stringify(items).replace(/'/g, "&apos;");
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <img src="${items[0].image_url}" onclick='openAlbum(${itemsJson})'>
                <div class="card-info">
                    <h3>${title}</h3>
                    <p style="font-size:13px; color:#555;">📅 ${items[0].date} - 👤 ${items[0].author}</p>
                    <p style="font-size:13px; font-weight:bold;">📦 ${items.length} ảnh</p>
                    <button class="btn-append" onclick="appendImages('${title}', '${items[0].date}', '${items[0].author}')">📷 Thêm Ảnh</button>
                    <button class="btn-delete" onclick="deleteWithAuth('${title}')">🗑️ Xóa Album</button>
                </div>`;
            memoryList.appendChild(card);
        }
    } catch (e) { console.error(e); }
}

// 2. THÊM ẢNH VÀO ALBUM CŨ
async function appendImages(title, date, author) {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = 'image/*';
    input.onchange = async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;
        alert(`Đang bổ sung ${files.length} ảnh vào album "${title}"...`);
        for (let file of files) {
            const fileName = `${Date.now()}_app_${Math.random()}.png`;
            const { error: upErr } = await mySupabase.storage.from('images').upload(fileName, file);
            if (!upErr) {
                const { data: urlData } = mySupabase.storage.from('images').getPublicUrl(fileName);
                await mySupabase.from('memories').insert([{ date, content: title, author, image_url: urlData.publicUrl }]);
            }
        }
        alert("Đã cập nhật xong!");
        loadMemories();
    };
    input.click();
}

// 3. XÓA ALBUM (BẢO MẬT)
async function deleteWithAuth(title) {
    const pass = prompt("⚠️ Nhập mật khẩu quản trị để xóa:");
    if (pass === ADMIN_PASSWORD) {
        if(confirm(`Xóa vĩnh viễn album "${title}"?`)) {
            await mySupabase.from('memories').delete().eq('content', title);
            loadMemories();
        }
    } else if (pass !== null) { alert("❌ Sai mật khẩu!"); }
}

// 4. TẠO MỚI & XEM ẢNH
document.getElementById("memoryForm").onsubmit = async function(e) {
    e.preventDefault();
    const files = document.getElementById("imageInput").files;
    const date = document.getElementById("date").value;
    const content = document.getElementById("content").value;
    const author = document.getElementById("author").value;
    alert("Đang tải album mới lên hệ thống...");
    for (let file of files) {
        const fileName = `${Date.now()}_${Math.random()}.png`;
        const { error: upErr } = await mySupabase.storage.from('images').upload(fileName, file);
        if (!upErr) {
            const { data: urlData } = mySupabase.storage.from('images').getPublicUrl(fileName);
            await mySupabase.from('memories').insert([{ date, content, author, image_url: urlData.publicUrl }]);
        }
    }
    document.getElementById("myModal").style.display = "none";
    this.reset();
    loadMemories();
};

function openAlbum(items) {
    document.getElementById("albumOverlay").style.display = "block";
    document.getElementById("albumTitle").innerText = items[0].content;
    const grid = document.getElementById("albumGrid"); grid.innerHTML = '';
    items.forEach(item => { const img = document.createElement("img"); img.src = item.image_url; grid.appendChild(img); });
}

document.getElementById("btnOpen").onclick = () => document.getElementById("myModal").style.display = "block";
document.querySelector(".close").onclick = () => document.getElementById("myModal").style.display = "none";
function closeAlbum() { document.getElementById("albumOverlay").style.display = "none"; }
window.onclick = (e) => { if (e.target.className == 'modal') e.target.style.display = "none"; };

loadMemories();