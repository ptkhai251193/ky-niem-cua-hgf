const SUPABASE_URL = 'https://pgyelwrwfzbwjpdzatfa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8rsGFehOQOiOaXb59y6umQ_m9JAp60H';
const mySupabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// THAY ĐỔI MẬT KHẨU TẠI ĐÂY
const ADMIN_PASSWORD = "khai2026"; 

const modal = document.getElementById("myModal");
const btnOpen = document.getElementById("btnOpen");
const spanClose = document.getElementsByClassName("close")[0];
const form = document.getElementById("memoryForm");
const memoryList = document.getElementById("memoryList");

// 1. TẢI ALBUM
async function loadMemories() {
    try {
        const { data, error } = await mySupabase.from('memories').select('*').order('id', { ascending: false });
        if (error) return;

        memoryList.innerHTML = '';
        const albums = {};
        data.forEach(item => {
            if (!albums[item.content]) albums[item.content] = [];
            albums[item.content].push(item);
        });

        for (const title in albums) {
            const items = albums[title];
            const itemsJson = JSON.stringify(items).replace(/'/g, "&apos;");
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <img src="${items[0].image_url}" onclick='openAlbum(${itemsJson})'>
                <div class="card-info">
                    <h3>${title}</h3>
                    <p>📅 Ngày: ${items[0].date}</p>
                    <p>👤 Đăng bởi: ${items[0].author}</p>
                    <p>📦 Số lượng: ${items.length} ảnh</p>
                    <button class="btn-append" onclick="appendImages('${title}', '${items[0].date}', '${items[0].author}')">📷 Thêm Ảnh</button>
                    <button class="btn-delete" onclick="deleteWithAuth('${title}')">🗑️ Xóa Album</button>
                </div>`;
            memoryList.appendChild(card);
        }
    } catch (e) { console.error(e); }
}

// 2. THÊM ẢNH VÀO ALBUM ĐÃ CÓ
async function appendImages(albumTitle, albumDate, albumAuthor) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';

    input.onchange = async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;
        alert(`Đang tải ${files.length} ảnh lên album "${albumTitle}"...`);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = `${Date.now()}_app_${i}.png`;
            const { error: upErr } = await mySupabase.storage.from('images').upload(fileName, file);
            if (!upErr) {
                const { data: urlData } = mySupabase.storage.from('images').getPublicUrl(fileName);
                await mySupabase.from('memories').insert([{
                    date: albumDate, content: albumTitle, author: albumAuthor, image_url: urlData.publicUrl
                }]);
            }
        }
        alert("Thêm ảnh thành công!");
        loadMemories();
    };
    input.click();
}

// 3. XÓA ALBUM CÓ MẬT KHẨU
async function deleteWithAuth(title) {
    const pass = prompt("Nhập mật khẩu để xóa:");
    if (pass === ADMIN_PASSWORD) {
        if(confirm(`Xóa album "${title}"?`)) {
            await mySupabase.from('memories').delete().eq('content', title);
            loadMemories();
        }
    } else if (pass !== null) { alert("Sai mật khẩu!"); }
}

// 4. TẠO ALBUM MỚI
form.onsubmit = async function(e) {
    e.preventDefault();
    const files = document.getElementById("imageInput").files;
    const date = document.getElementById("date").value;
    const content = document.getElementById("content").value;
    const author = document.getElementById("author").value;

    alert("Đang tải album mới lên...");
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${Date.now()}_new_${i}.png`;
        const { error: upErr } = await mySupabase.storage.from('images').upload(fileName, file);
        if (!upErr) {
            const { data: urlData } = mySupabase.storage.from('images').getPublicUrl(fileName);
            await mySupabase.from('memories').insert([{ date, content, author, image_url: urlData.publicUrl }]);
        }
    }
    alert("Tạo album thành công!");
    modal.style.display = "none";
    form.reset();
    loadMemories();
};

function openAlbum(items) {
    document.getElementById("albumOverlay").style.display = "block";
    document.getElementById("albumTitle").innerText = items[0].content;
    const grid = document.getElementById("albumGrid");
    grid.innerHTML = ''; 
    items.forEach(item => {
        const img = document.createElement("img");
        img.src = item.image_url;
        grid.appendChild(img);
    });
}

function closeAlbum() { document.getElementById("albumOverlay").style.display = "none"; }
btnOpen.onclick = () => modal.style.display = "block";
spanClose.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

loadMemories();