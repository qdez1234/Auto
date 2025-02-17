/**
 * 随机滑动函数
 * @param {number} minCount - 滑动次数的最小值
 * @param {number} maxCount - 滑动次数的最大值
 */
function randomSwipe(minCount, maxCount) {
    // 随机生成滑动次数，范围在[minCount, maxCount]之间
    var swipeCount = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;

    for (var i = 0; i < swipeCount; i++) {
        // 随机生成滑动的起始和结束位置
        var startX = Math.floor(Math.random() * 500) + 200;  // 随机生成x坐标，范围在200到700之间
        var startY = Math.floor(Math.random() * 500) + 2000;  // 随机生成y坐标，范围在2000到2500之间（屏幕底部附近）
        var endX = startX;  // x坐标不变
        var endY = Math.floor(Math.random() * 1000) + 500;  // 随机生成滑动的结束y坐标，范围在500到1500之间（从底部滑到顶部）

        // 随机生成滑动时间，范围在300ms到600ms之间
        var duration = Math.floor(Math.random() * 300) + 300;  // 生成300到600之间的随机数，单位为毫秒

        // 模拟滑动
        swipe(startX, startY, endX, endY, duration);

        // 每次滑动后，延时800到1500毫秒
        var swipeDelay = Math.floor(Math.random() * 700) + 800;  // 延时800到1500毫秒
        sleep(swipeDelay);
    }
}

/**
 * 生成随机延迟时间并休眠
 * @param {*} min 
 * @param {*} max 
 */
function sleepRandomDelay(min, max) {
    // 生成随机数，范围是[min, max]，并返回延迟时间（单位为毫秒）
    let time = Math.floor(Math.random() * (max - min + 1) + min) * 1000;
    sleep(time);
}