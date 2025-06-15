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
let d = new Date("2019-08-15T00:00:00Z");
let dbl = dateToOADate(d);
console.log("Double:", dbl);
console.log("Hex LE:", toLittleEndianHex(dbl));


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


async function patchAndDownloadExe(url, offset, sourceHex, targetHex, filename = "patched.exe") {
    const response = await fetch(url);
    if (!response.ok) throw new Error("下载失败: " + response.statusText);
    const buffer = await response.arrayBuffer();

    // 转换 hex 字符串到字节数组
    const hexToBytes = hex =>
        hex.trim().split(/\s+/).map(h => parseInt(h, 16));

    const sourceBytes = hexToBytes(sourceHex);
    const targetBytes = hexToBytes(targetHex);

    // 修改内容
    const patchedBuffer = replaceBytes(buffer, offset, sourceBytes, targetBytes);

    // 触发浏览器下载
    const blob = new Blob([patchedBuffer], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

