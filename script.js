const SUPABASE_URL = 'https://pgyelwrwfzbwjpdzatfa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8rsGFehOQOiOaXb59y6umQ_m9JAp60H';
const mySupabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_PASSWORD = "khai2026"; 

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
                    <p>📅 Ngày: ${items[0].date} - 👤 ${items[0].author}</p>
                    <button class="btn-append" onclick="appendImages('${title}', '${items[0].date}', '${items[0].author}')">📷 Thêm Ảnh</button>
                    <button class="btn-delete" onclick="deleteWithAuth('${title}')">🗑️ Xóa Album</button>
                </div>`;
            memoryList.appendChild(card);
        }
    } catch (e) { console.error(e); }
}

async function appendImages(title, date, author) {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = 'image/*';
    input.onchange = async (e) => {
        const files = e.target.files;
        alert(`Đang thêm ${files.length} ảnh...`);
        for (let file of files) {
            const fileName = `${Date.now()}_${Math.random()}.png`;
            const { error: upErr } = await mySupabase.storage.from('images').upload(fileName, file);
            if (!upErr) {
                const { data: urlData } = mySupabase.storage.from('images').getPublicUrl(fileName);
                await mySupabase.from('memories').insert([{ date, content: title, author, image_url: urlData.publicUrl }]);
            }
        }
        loadMemories();
    };
    input.click();
}

async function deleteWithAuth(title) {
    if (prompt("Nhập mật khẩu:") === ADMIN_PASSWORD) {
        if(confirm("Xóa album?")) { await mySupabase.from('memories').delete().eq('content', title); loadMemories(); }
    } else { alert("Sai mật khẩu!"); }
}

// Các hàm đóng mở Modal
document.getElementById("btnOpen").onclick = () => document.getElementById("myModal").style.display = "block";
document.querySelector(".close").onclick = () => document.getElementById("myModal").style.display = "none";
function openAlbum(items) {
    document.getElementById("albumOverlay").style.display = "block";
    const grid = document.getElementById("albumGrid"); grid.innerHTML = '';
    items.forEach(item => { const img = document.createElement("img"); img.src = item.image_url; grid.appendChild(img); });
}
function closeAlbum() { document.getElementById("albumOverlay").style.display = "none"; }

loadMemories();