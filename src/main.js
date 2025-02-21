import VideoConverter from 'h264-converter';

const videoElement = document.getElementById('videoPlayer');
const converter = new VideoConverter(videoElement, 30, 1); // 30fps

// 查找 NALU 分隔符
function findNALUStartIndex(data, startIndex) {
    for (let i = startIndex; i < data.length - 4; i++) {
        if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0 && data[i + 3] === 1) {
            return i;
        }
    }
    return -1;
}

// 分割 H.264 数据为 NALUs
function splitIntoNALUs(uint8Array) {
    const nalus = [];
    let currentIndex = 0;

    while (true) {
        const startIndex = findNALUStartIndex(uint8Array, currentIndex);
        if (startIndex === -1) break;

        // 查找下一个 NALU 的开始
        const nextStartIndex = findNALUStartIndex(uint8Array, startIndex + 4);

        if (nextStartIndex === -1) {
            // 这是最后一个 NALU
            const nalu = uint8Array.slice(startIndex);
            if (nalu.length > 4) {
                nalus.push(nalu);
            }
            break;
        } else {
            // 提取当前 NALU
            const nalu = uint8Array.slice(startIndex, nextStartIndex);
            if (nalu.length > 4) {
                nalus.push(nalu);
            }
            currentIndex = nextStartIndex;
        }
    }

    return nalus;
}

// 获取 NALU 类型
function getNALUType(nalu) {
    if (nalu.length < 5) return -1;
    return nalu[4] & 0x1F;
}

// 处理文件选择
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const buffer = e.target.result;
        const uint8Array = new Uint8Array(buffer);
        const nalus = splitIntoNALUs(uint8Array);
        
        console.log('Split into', nalus.length, 'NALUs');

        try {
            // 逐个添加 NALU，并添加延时
            let naluIndex = 0;
            
            function processNextNALU() {
                if (naluIndex >= nalus.length) {
                    console.log('All NALUs processed');
                    converter.play();
                    return;
                }

                const nalu = nalus[naluIndex];
                const naluType = getNALUType(nalu);
                
                console.log(`Processing NALU ${naluIndex + 1}/${nalus.length}, size: ${nalu.length}, type: ${naluType}`);
                
                try {
                    converter.appendRawData(new Uint8Array(nalu));
                } catch (error) {
                    console.error(`Error processing NALU ${naluIndex}:`, error);
                }

                naluIndex++;
                // 使用 setTimeout 添加小延迟，避免一次性处理太多数据
                setTimeout(processNextNALU, 10);
            }

            processNextNALU();
        } catch (error) {
            console.error('Error processing video data:', error);
        }
    };

    reader.readAsArrayBuffer(file);
});
