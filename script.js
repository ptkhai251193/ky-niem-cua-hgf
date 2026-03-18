const SUPABASE_URL = 'https://pgyelwrwfzbwjpdzatfa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8rsGFehOQOiOaXb59y6umQ_m9JAp60H';
const mySupabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const modal = document.getElementById("myModal");
const btnOpen = document.getElementById("btnOpen");
const spanClose = document.getElementsByClassName("close")[0];
const form = document.getElementById("memoryForm");
const memoryList = document.getElementById("memoryList");

// 1. TẢI VÀ HIỂN THỊ DỮ LIỆU
async function loadMemories() {
    try {
        const { data, error } = await mySupabase.from('memories').select('*').order('id', { ascending: false });
        if (error) { console.error(error.message); return; }

        memoryList.innerHTML = '';
        if (!data || data.length === 0) {
            memoryList.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#7f8c8d; font-size:18px; margin-top:50px;">Chưa có kỷ niệm nào được lưu. Hãy thêm album đầu tiên!</p>';
            return;
        }

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
                <img src="${items[0].image_url}" class="card-img" onclick='openAlbum(${itemsJson})'>
                <div class="card-info">
                    <h3>${title}</h3>
                    <p>📅 Ngày: ${items[0].date}</p>
                    <p>👤 Đăng bởi: ${items[0].author}</p>
                    <p>📦 Số lượng: ${items.length} ảnh</p>
                    <button class="btn-delete" onclick="deleteAlbum('${title}')">🗑️ Xóa Album</button>
                </div>`;
            memoryList.appendChild(card);
        }
    } catch (e) { console.error(e); }
}

// 2. LƯU ALBUM MỚI
form.onsubmit = async function(e) {
    e.preventDefault();
    const files = document.getElementById("imageInput").files;
    const date = document.getElementById("date").value;
    const content = document.getElementById("content").value;
    const author = document.getElementById("author").value;

    alert("Hệ thống đang tải ảnh lên, vui lòng không tắt trình duyệt!");

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${Date.now()}_${i}.png`;
        
        // Tải lên Bucket 'images'
        const { error: uploadError } = await mySupabase.storage
            .from('images')
            .upload(fileName, file);

        if (uploadError) {
            alert("Lỗi tải ảnh: " + uploadError.message);
            return;
        }

        // Lấy link ảnh và lưu vào bảng memories
        const { data: urlData } = mySupabase.storage.from('images').getPublicUrl(fileName);
        await mySupabase.from('memories').insert([{
            date, content, author, image_url: urlData.publicUrl
        }]);
    }
    
    alert("Đã lưu album kỷ niệm thành công!");
    modal.style.display = "none";
    form.reset();
    loadMemories();
};

// 3. XEM CHI TIẾT ALBUM
function openAlbum(items) {
    const overlay = document.getElementById("albumOverlay");
    const grid = document.getElementById("albumGrid");
    document.getElementById("albumTitle").innerText = items[0].content;
    
    overlay.style.display = "block";
    grid.innerHTML = ''; 
    items.forEach(item => {
        const img = document.createElement("img");
        img.src = item.image_url;
        img.style.width = "100%";
        img.style.borderRadius = "15px";
        img.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
        grid.appendChild(img);
    });
}

function closeAlbum() { document.getElementById("albumOverlay").style.display = "none"; }

// 4. XÓA ALBUM
async function deleteAlbum(title) {
    if(confirm(`Xóa vĩnh viễn album "${title}"?`)) {
        await mySupabase.from('memories').delete().eq('content', title);
        loadMemories();
    }
}

// Điều khiển Modal
btnOpen.onclick = () => modal.style.display = "block";
spanClose.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

loadMemories();