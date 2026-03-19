const SUPABASE_URL = 'https://pgyelwrwfzbwjpdzatfa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8rsGFehOQOiOaXb59y6umQ_m9JAp60H'; 
const mySupabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_PASSWORD = "khai2026"; 

// 1. TẢI DỮ LIỆU
async function loadMemories() {
    try {
        const { data, error } = await mySupabase.from('memories').select('*').order('id', { ascending: false });
        if (error) throw error;
        
        const memoryList = document.getElementById("memoryList");
        if(!memoryList) return;
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
                    <p style="font-size:12px;">📅 ${items[0].date} - 👤 ${items[0].author}</p>
                    <button class="btn-append" onclick="appendImages('${title.replace(/'/g, "\\'")}', '${items[0].date}', '${items[0].author}')">📷 Thêm Ảnh</button>
                    <button class="btn-delete" onclick="deleteWithAuth('${title.replace(/'/g, "\\')}')">🗑️ Xóa</button>
                </div>`;
            memoryList.appendChild(card);
        }
    } catch (e) { console.error("Lỗi tải trang:", e.message); }
}

// 2. THÊM ẢNH (Bảo mật & Fix lỗi đơ)
async function appendImages(title, date, author) {
    try {
        const input = document.createElement('input');
        input.type = 'file'; input.multiple = true; input.accept = 'image/*';
        input.onchange = async (e) => {
            const files = e.target.files;
            if (!files.length) return;
            alert(`Đang tải lên ${files.length} ảnh...`);

            for (let file of files) {
                const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}.png`;
                const { error: upErr } = await mySupabase.storage.from('images').upload(fileName, file);
                if (upErr) { alert("Lỗi kho ảnh: " + upErr.message); return; }

                const { data: urlData } = mySupabase.storage.from('images').getPublicUrl(fileName);
                await mySupabase.from('memories').insert([{ date, content: title, author, image_url: urlData.publicUrl }]);
            }
            alert("Đã cập nhật album thành công!");
            loadMemories();
        };
        input.click();
    } catch (err) { alert("Lỗi: " + err.message); }
}

// 3. TẠO ALBUM MỚI
const memoryForm = document.getElementById("memoryForm");
if(memoryForm) {
    memoryForm.onsubmit = async function(e) {
        e.preventDefault();
        const saveBtn = document.getElementById("saveBtn");
        saveBtn.innerText = "Đang xử lý..."; saveBtn.disabled = true;

        try {
            const files = document.getElementById("imageInput").files;
            const date = document.getElementById("date").value;
            const content = document.getElementById("content").value;
            const author = document.getElementById("author").value;

            for (let file of files) {
                const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}.png`;
                const { error: upErr } = await mySupabase.storage.from('images').upload(fileName, file);
                if (upErr) throw upErr;

                const { data: urlData } = mySupabase.storage.from('images').getPublicUrl(fileName);
                await mySupabase.from('memories').insert([{ date, content, author, image_url: urlData.publicUrl }]);
            }
            alert("Tạo album thành công!");
            document.getElementById("myModal").style.display = "none";
            this.reset();
        } catch (err) {
            alert("Lỗi hệ thống: " + err.message);
        } finally {
            saveBtn.innerText = "Lưu Album"; saveBtn.disabled = false;
            loadMemories();
        }
    };
}

// 4. ĐÓNG MỞ MODAL
const btnOpen = document.getElementById("btnOpen");
const myModal = document.getElementById("myModal");
if(btnOpen && myModal) {
    btnOpen.onclick = () => myModal.style.display = "block";
    document.querySelector(".close").onclick = () => myModal.style.display = "none";
}

function openAlbum(items) {
    document.getElementById("albumOverlay").style.display = "block";
    document.getElementById("albumTitle").innerText = items[0].content;
    const grid = document.getElementById("albumGrid"); grid.innerHTML = '';
    items.forEach(item => { const img = document.createElement("img"); img.src = item.image_url; grid.appendChild(img); });
}

function closeAlbum() { document.getElementById("albumOverlay").style.display = "none"; }
async function deleteWithAuth(title) {
    if (prompt("Mật khẩu xóa:") === ADMIN_PASSWORD) {
        await mySupabase.from('