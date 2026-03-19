const SUPABASE_URL = 'https://pgyelwrwfzbwjpdzatfa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8rsGFehOQOiOaXb59y6umQ_m9JAp60H'; // Mã Anon Public của Khải
const mySupabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_PASSWORD = "khai2026"; 

// 1. TẢI DỮ LIỆU ALBUM
async function loadMemories() {
    try {
        const { data, error } = await mySupabase.from('memories').select('*').order('id', { ascending: false });
        if (error) { console.error(error); return; }
        
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
                    <p style="font-size:13px;">📅 ${items[0].date} - 👤 ${items[0].author}</p>
                    <p style="font-weight:bold;">📦 ${items.length} ảnh</p>
                    <button class="btn-append" onclick="appendImages('${title}', '${items[0].date}', '${items[0].author}')">📷 Thêm Ảnh</button>
                    <button class="btn-delete" onclick="deleteWithAuth('${title}')">🗑️ Xóa</button>
                </div>`;
            memoryList.appendChild(card);
        }
    } catch (e) { console.error(e); }
}

// 2. THÊM ẢNH VÀO ALBUM ĐÃ CÓ (Fix lỗi kén mạng)
async function appendImages(title, date, author) {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = 'image/*';
    input.onchange = async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;
        alert(`Đang tải ${files.length} ảnh lên...`);

        for (let file of files) {
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}.png`;
            // Cố gắng tải ảnh lên kho 'images'
            const { error: upErr } = await mySupabase.storage.from('images').upload(fileName, file);
            
            if (upErr) {
                alert("Lỗi tải ảnh lên kho: " + upErr.message);
                return; // Nếu lỗi kho thì dừng ngay
            }

            const { data: urlData } = mySupabase.storage.from('images').getPublicUrl(fileName);
            // Lưu thông tin vào bảng memories
            const { error: dbErr } = await mySupabase.from('memories').insert([{ date, content: title, author, image_url: urlData.publicUrl }]);
            
            if (dbErr) {
                alert("Lỗi lưu dữ liệu: " + dbErr.message);
                return;
            }
        }
        alert("Đã cập nhật xong album!");
        loadMemories();
    };
    input.click();
}

// 3. TẠO ALBUM MỚI
document.getElementById("memoryForm").onsubmit = async function(e) {
    e.preventDefault();
    const saveBtn = document.getElementById("saveBtn");
    saveBtn.innerText = "Đang tải..."; saveBtn.disabled = true;

    const files = document.getElementById("imageInput").files;
    const date = document.getElementById("date").value;
    const content = document.getElementById("content").value;
    const author = document.getElementById("author").value;

    for (let file of files) {
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
        const { error: upErr } = await mySupabase.storage.from('images').upload(fileName, file);
        
        if (upErr) {
            alert("Lỗi không thể tải ảnh: " + upErr.message);
            saveBtn.innerText = "Lưu Album"; saveBtn.disabled = false;
            return;
        }

        const { data: urlData } = mySupabase.storage.from('images').getPublicUrl(fileName);
        await mySupabase.from('memories').insert([{ date, content, author, image_url: urlData.publicUrl }]);
    }

    alert("Tạo album thành công!");
    document.getElementById("myModal").style.display = "none";
    this.reset();
    saveBtn.innerText = "Lưu Album"; saveBtn.disabled = false;
    loadMemories();
};

// 4. CÁC HÀM TIỆN ÍCH
async function deleteWithAuth(title) {
    if (prompt("Nhập mật khẩu xóa:") === ADMIN_PASSWORD) {
        if(confirm("Bạn chắc chắn muốn xóa album này?")) {
            await mySupabase.from('memories').delete().eq('content', title);
            loadMemories();
        }
    } else { alert("Sai mật khẩu!"); }
}

function openAlbum(items) {
    document.getElementById("albumOverlay").style.display = "block";
    document.getElementById("albumTitle").innerText = items[0].content;
    const grid = document.getElementById("albumGrid"); grid.innerHTML = '';
    items.forEach(item => { const img = document.createElement("img"); img.src = item.image_url; grid.appendChild(img); });
}

function closeAlbum() { document.getElementById("albumOverlay").style.display = "none"; }
document.getElementById("btnOpen").onclick = () => document.getElementById("myModal").style.display = "block";
document.querySelector(".close").onclick = () => document.getElementById("myModal").style.display = "none";
window.onclick = (e) => { if (e.target.className == 'modal') e.target.style.display = "none"; };

loadMemories();