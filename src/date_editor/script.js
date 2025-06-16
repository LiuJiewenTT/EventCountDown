function dateToOADate(d) {
    const base = new Date(Date.UTC(1899, 11, 30)); // 1899-12-30
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = (d - base) / msPerDay;
    return days;
}

function toLittleEndianHex(val) {
    const buffer = new ArrayBuffer(8);
    new DataView(buffer).setFloat64(0, val, true); // true = little endian
    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
}

// 示例
// let d = new Date("2019-08-15T00:00:00Z");
// let dbl = dateToOADate(d);
// console.log("Double:", dbl);
// console.log("Hex LE:", toLittleEndianHex(dbl));


function replaceBytes(buffer, offset, sourceBytes, targetBytes) {
    const view = new Uint8Array(buffer);

    // 检查长度一致
    if (sourceBytes.length !== targetBytes.length) {
        throw new Error("源和目标字节长度不一致");
    }

    // 检查原位置内容是否与 sourceBytes 匹配
    for (let i = 0; i < sourceBytes.length; i++) {
        if (view[offset + i] !== sourceBytes[i]) {
            throw new Error(`源数据不匹配，偏移 ${offset + i} 处是 ${view[offset + i].toString(16)}，应为 ${sourceBytes[i].toString(16)}`);
        }
    }

    // 替换字节
    for (let i = 0; i < targetBytes.length; i++) {
        view[offset + i] = targetBytes[i];
    }

    // 再次确认
    for (let i = 0; i < targetBytes.length; i++) {
        if (view[offset + i] !== targetBytes[i]) {
            throw new Error(`写入失败，偏移 ${offset + i} 处应为 ${targetBytes[i].toString(16)}`);
        }
    }

    return buffer;
}


function patchExe(buffer, offset, sourceHex, targetHex) {

    // 转换 hex 字符串到字节数组
    const hexToBytes = hex =>
        hex.trim().split(/\s+/).map(h => parseInt(h, 16));

    const sourceBytes = hexToBytes(sourceHex);
    const targetBytes = hexToBytes(targetHex);

    // 修改内容
    const patchedBuffer = replaceBytes(buffer, offset, sourceBytes, targetBytes);

    return patchedBuffer;
}


async function processFormData() {

    const token = ""; // 可选：GitHub Personal Access Token（建议用于私有仓库或避免速率限制）

    const headers = token ? {
        "Authorization": `token ${token}`
    } : {};
    
    // asset id: 264133901
    // let url = "https://api.github.com/repos/LiuJiewenTT/EventCountDown/releases/assets/264133901"
    let url = "https://github.com/LiuJiewenTT/EventCountDown/releases/download/v1.0.0/gaokao1.exe"
    // blocked by CORS policy

    let startDate_target_hex = toLittleEndianHex(dateToOADate(new Date("2019-08-15T00:00:00Z")));
    let endDate_target_hex = toLittleEndianHex(dateToOADate(new Date("2020-06-07T00:00:00Z")));
    let startDate_hexOffset = null;
    let endDate_hexOffset = null;

    let startDate_str = document.getElementById("date-start").value;
    let endDate_str = document.getElementById("date-end").value;
    let current_time = new Date();
    let filename = `gaokao-${current_time.getFullYear()}-${(current_time.getMonth() + 1).toString().padStart(2, '0')}-${current_time.getDate().toString().padStart(2, '0')}-${current_time.getHours().toString().padStart(2, '0')}-${current_time.getMinutes().toString().padStart(2, '0')}-${current_time.getSeconds().toString().padStart(2, '0')}.exe`;

    let startDate = new Date(startDate_str);
    let endDate = new Date(endDate_str);
    let startDate_dbl = dateToOADate(startDate);
    let endDate_dbl = dateToOADate(endDate);
    let startDate_hex = toLittleEndianHex(startDate_dbl);
    let endDate_hex = toLittleEndianHex(endDate_dbl);
    console.log(`start date: ${startDate}, ${startDate_dbl}, ${startDate_hex}`);
    console.log(`end date: ${endDate}, ${endDate_dbl}, ${endDate_hex}`);

    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error("下载失败: " + response.statusText);
    let buffer = await response.arrayBuffer();

    buffer = patchExe(buffer, startDate_hexOffset, startDate_hex, startDate_target_hex);
    buffer = patchExe(buffer, endDate_hexOffset, endDate_hex, endDate_target_hex);

    // 触发浏览器下载
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

async function getAssetsDownloadCount() {
    const owner = "LiuJiewenTT";
    const repo = "EventCountDown";
    const tag = "v1.0.0";
    const token = ""; // 可选：GitHub Personal Access Token（建议用于私有仓库或避免速率限制）

    const headers = token ? {
        "Authorization": `token ${token}`
    } : {};

    let data = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`, { headers })
        .then(response => response.json())
        .catch(error => {
            console.error("获取数据失败：", error);
        });
    if (data.assets && data.assets.length > 0) {
        const total = data.assets.reduce((sum, asset) => sum + asset.download_count, 0);
        console.log(`Download count: ${total}`);
        return total;
    } else {
        return null;
    }
}

async function showAssetsDownloadCount() {
    let counter = document.getElementById("getloli-counter");

    let downloadCount = await getAssetsDownloadCount();

    counter.setAttribute("src", `https://count.getloli.com/@LJWTT-EventCountDown-date_editor?name=LJWTT-EventCountDown-date_editor&theme=random&padding=7&offset=0&align=center&scale=1&pixelated=1&darkmode=auto&num=${downloadCount}`);
}
