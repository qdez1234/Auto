/**
 * 在屏幕下方 4/5 区域内随机选择一个起点，垂直向上滑动
 */
function swipeUpFromBottom() {
    // 获取屏幕尺寸
    let screenWidth = device.width;
    let screenHeight = device.height;

    // 计算下方 4/5 区域的边界
    let bottomAreaTop = screenHeight / 5; // 下方 4/5 区域的上边界

    // 随机选择起点 X 坐标（屏幕宽度范围内）
    let startX = random(screenWidth/5, (screenWidth/5) * 4);

    // 随机选择起点 Y 坐标（下方 4/5 区域内）
    let startY = random(bottomAreaTop*3, bottomAreaTop*4);

    let endY = random(bottomAreaTop*1, bottomAreaTop*3);

    // 随机生成滑动时间（110ms 到 130ms 之间）
    let swipeDuration = random(300, 800);

    // 滑动操作（垂直向上滑动，X 轴相同）
    swipe(startX, startY, startX, endY, swipeDuration);
    toast("滑动完成，持续时间：" + swipeDuration + "ms");
}

/**
 * 生成指定范围内的随机数
 * @param {number} min 最小值
 * @param {number} max 最大值
 * @returns {number} 随机数
 */
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 调用滑动方法
swipeUpFromBottom();