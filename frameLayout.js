function clickTitle(){
// 关键字数组
let keywords = ["洗纹身", "纹身", "纹身去除"];

// 等待直到找到所有 className 为 android.widget.FrameLayout 的视图集合
let frameLayouts = className("android.widget.FrameLayout").untilFind();

let filteredFrameLayouts = []; // 用于存储符合条件的 FrameLayout

if (frameLayouts.length > 0) {
    console.log('找到 FrameLayout 视图集合');
    
    // 遍历每个 FrameLayout 视图
    for (let i = 0; i < frameLayouts.length; i++) {
        let frameLayout = frameLayouts[i];
        let desc = frameLayout.desc(); // 获取当前 FrameLayout 的描述
        
        if (desc && desc.trim() !== "") {
            // 判断 desc 是否以 "笔记" 开头
            if (desc.startsWith("笔记")) {
                console.log('FrameLayout 描述以 "笔记" 开头:', desc);

                // 检查 desc 是否包含关键字
                for (let j = 0; j < keywords.length; j++) {
                    if (desc.includes(keywords[j])) {
                        console.log('描述包含关键词: ' + keywords[j]);
                        filteredFrameLayouts.push(frameLayout);
                        break; // 找到一个关键词后就可以跳出循环，不再继续检查其他关键词
                    }
                }
            } else {
                console.log('FrameLayout 描述以 "视频" 或其他开头，已过滤');
            }
        } else {
            console.log('FrameLayout 描述为空，已过滤');
        }
    }

    // 判断 filteredFrameLayouts 的数量并随机选取
    let selectedFrameLayouts = [];

    if (filteredFrameLayouts.length > 3) {
        // 如果有超过3个元素，随机选择中间两个
        let middleIndex = Math.floor(filteredFrameLayouts.length / 2);
        selectedFrameLayouts.push(filteredFrameLayouts[middleIndex - 1]);
        selectedFrameLayouts.push(filteredFrameLayouts[middleIndex]);
    } else if (filteredFrameLayouts.length === 1 || filteredFrameLayouts.length === 2) {
        // 如果只有1个或2个元素，随机选择一个
        let randomIndex = Math.floor(Math.random() * filteredFrameLayouts.length);
        selectedFrameLayouts.push(filteredFrameLayouts[randomIndex]);
    }

    // 输出选择的 FrameLayout 数组
    console.log('最终选择的 FrameLayout:', selectedFrameLayouts);

    // 初始化索引
    let currentIndex = 0;

    // 判断是否有选中的 FrameLayout
    if (selectedFrameLayouts.length > 0) {
        // 获取第一个选中的 FrameLayout 元素
        let firstElement = selectedFrameLayouts[currentIndex];

        // 获取该元素的边界（坐标）
        let bounds = firstElement.bounds();  // { left, top, right, bottom }

        // 计算左边区域的 3/4
        let width = bounds.right - bounds.left;
        let height = bounds.bottom - bounds.top;

        let x = bounds.left + Math.random() * (width * 0.75);  // 左边中心的 3/4 区域随机位置
        let y = bounds.top + height / 2; // 选择左边的中心位置的垂直位置

        // 先检查索引是否超出数组长度
        if (currentIndex < selectedFrameLayouts.length) {
            // 执行点击操作
            console.log('随机点击位置:', 'x:', x, 'y:', y);
            click(x, y); // 在计算出的坐标位置进行点击

            // 更新索引，确保不超过数组长度
            currentIndex++;

            // 如果索引超过数组长度，则不再点击
            if (currentIndex >= selectedFrameLayouts.length) {
                console.log('索引超出数组长度，不再点击');
            }
        }
    }
} else {
    console.log('没有找到 FrameLayout 视图');
}
}
