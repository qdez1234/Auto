/**
 * 在符合条件的 FrameLayout 元素上执行一次滑动操作
 */
 function swipeFrameLayout() {
    let frameLayouts = className("android.widget.FrameLayout").untilFind();
    let frameLayout = undefined;

    // 查找符合条件的 FrameLayout 元素
    if (frameLayouts.length > 0) {
        for (let i = 0; i < frameLayouts.length; i++) {
            let ifram = frameLayouts[i];
            let desc = ifram.desc(); // 获取当前 FrameLayout 的描述
            if (desc && desc.includes('右划即可查看更多内容')) {
                frameLayout = ifram;
                break;  // 找到第一个符合条件的元素后可以跳出循环
            }
        }
    }

    if (frameLayout) {
        // 获取元素的边界信息
        let bounds = frameLayout.bounds();
        let left = bounds.left;
        let top = bounds.top;
        let right = bounds.right;
        let bottom = bounds.bottom;

        // 计算右边 1/5 区域的边界
        let excludeRight = right - (right - left) / 5; // 排除最右边 1/5 区域
        let midX = (left + right) / 2; // 中间 X 坐标

        // 随机选择 Y 坐标（起点和终点 Y 坐标相同）
        let startY = random(top, bottom); // 起点和终点的 Y 坐标

        // 随机选择中间到右边 1/5 区域的起点 X 坐标
        let startX = random(midX, excludeRight); // 从中间到右边 1/5 区域随机选择
        let endX = random(left, midX); // 从左边到中间随机选择

        // 随机生成滑动时间（110ms 到 130ms 之间）
        let swipeDuration = random(110, 130);

        // 滑动操作（水平滑动，Y 坐标相同）
        swipe(startX, startY, endX, startY, swipeDuration); // 从右往左滑动，持续随机时间
        toast("滑动完成，持续时间：" + swipeDuration + "ms");
    } else {
        toast("未找到符合条件的 FrameLayout 元素");
    }
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