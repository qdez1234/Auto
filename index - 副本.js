"ui";

ui.layout(
    <vertical padding="16">
        <button id="openAccessibilityBtn" text="开启无障碍" layout_width="match_parent"/>
        <button id="startScriptBtn" text="启动脚本" layout_width="match_parent"/>
    </vertical>
);

// 事件监听代码保持不变
ui.openAccessibilityBtn.on("click", () => {
    app.startActivity({
        action: "android.settings.ACCESSIBILITY_SETTINGS"
    });
    toast("请开启无障碍服务！");
});

ui.startScriptBtn.on("click", () => {
    if (!auto.service) {
        toast("请先开启无障碍服务！");
        return;
    }
    toast("脚本已启动！");
    console.log("脚本运行中...");
    setTimeout(() => {
        start()
    }, 600);
    // 在这里编写你的脚本逻辑
});
let startCount = 0   //点赞数量
let pullDownCount = 0  //往下滑的次数
let filteredFrameLayouts = []      // 关键字过滤之后笔记
let selectedFrameLayouts = [];    //  关键字笔记只保留一部笔记
let currentIndex = 0             //点击笔记索引
/**
 * 脚本开启
 */
function start() {
    // 启动应用
    launchApp("小红书");

    // 延时
    sleepRandomDelay(2, 3);

    // 点击元素
    id("du6").findOne().click();

    sleepRandomDelay(3, 5);

    singleFlow()
}
/**
 * 单次滑动
 */
function singleFlow() {
    if (random(20, 40) < pullDownCount) {
        pullDownCount = 0
        start()
        return
    }

    if (flagBook()) {

        clickBook()

        sleepRandomDelay(1, 3);

        //随机滚动图片1-3次
        swiperReviewFour()

        sleepRandomDelay(1, 3);

        donwReviewFour()

        clickLike()

        sleepRandomDelay(1, 2);

        clickBack()

        sleepRandomDelay(1, 2);

        randomSwipe(2, 4)

        singleFlow()

    } else {
        randomSwipe(2, 4)
        singleFlow()
    }
}

/**
 * 首页随机刷新数据
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

        pullDownCount++
        console.log(pullDownCount, '下滑次数')
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

/**
 * 判断当前列表是否有关键字笔记
 */
function flagBook() {
    // 关键字数组
    let keywords = ["洗纹身", "纹身", "纹身去除"];

    // 等待直到找到所有 className 为 android.widget.FrameLayout 的视图集合
    let frameLayouts = className("android.widget.FrameLayout").untilFind();


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

        return true

    } else {
        console.log('没有找到 FrameLayout 视图');
        return false
    }
}

/**
 * 评论区滑动图片
 */
function swiperReviewFour() {
    let num = random(1, 3)
    for (let i = 0; i < num; i++) {
        swipeFrameLayout();
        sleep(random(300, 600))
    }
}

/**
 * 评论区向下滑动
 */
function donwReviewFour() {
    let num = random(2, 5)
    for (let i = 0; i < num; i++) {
        swipeUpFromBottom();
        sleepRandomDelay(1, 2);
    }
}


/**
 * 点击笔记
 */
function clickBook() {
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
            // currentIndex++;

            filteredFrameLayouts = []
            selectedFrameLayouts = []
            currentIndex = 0

            // 如果索引超过数组长度，则不再点击
            if (currentIndex >= selectedFrameLayouts.length) {

            }
        }
    }
}

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
 * 在屏幕下方 4/5 区域内随机选择一个起点，垂直向上滑动
 */
function swipeUpFromBottom() {
    // 获取屏幕尺寸
    let screenWidth = device.width;
    let screenHeight = device.height;

    // 计算下方 4/5 区域的边界
    let bottomAreaTop = screenHeight / 5; // 下方 4/5 区域的上边界

    // 随机选择起点 X 坐标（屏幕宽度范围内）
    let startX = random(screenWidth / 5, (screenWidth / 5) * 4);

    // 随机选择起点 Y 坐标（下方 4/5 区域内）
    let startY = random(bottomAreaTop * 3, bottomAreaTop * 4);

    let endY = random(bottomAreaTop * 1, bottomAreaTop * 3);

    // 随机生成滑动时间（110ms 到 130ms 之间）
    let swipeDuration = random(300, 800);

    // 滑动操作（垂直向上滑动，X 轴相同）
    swipe(startX, startY, startX, endY, swipeDuration);
    toast("滑动完成，持续时间：" + swipeDuration + "ms");
}


// 封装点击指定元素的函数
function clickLike() {
    let frameLayouts = className("android.widget.ImageView").untilFind();

    let frameLayout = undefined;
    // 查找符合条件的 ImageView 元素
    if (frameLayouts.length > 0) {
        for (let i = 0; i < frameLayouts.length; i++) {
            let ifram = frameLayouts[i];
            let id = ifram.id(); // 获取当前元素的 ID
            if (id && id == 'com.xingin.xhs:id/g7x') {
                frameLayout = ifram;
                break;  // 找到第一个符合条件的元素后跳出循环
            }
        }
    }

    if (frameLayout) {
        // 获取元素的坐标
        var bounds = frameLayout.bounds();
        var x = bounds.left + (bounds.right - bounds.left) / 2; // 获取元素的水平中心
        var y = bounds.top + (bounds.bottom - bounds.top) / 2; // 获取元素的垂直中心
        if (random(1, 10) >= 7 && startCount <= 50) {         //随机1-10 大于7才能点赞
            startCount++
            click(x, y);
        }
        // 点击元素的中心坐标
    } else {
        console.log("未找到指定元素");
    }
}
/**
 * 点击返回
 */
function clickBack() {
    let frameLayouts = className("android.widget.Button").untilFind();

    let frameLayout = undefined;
    // 查找符合条件的 ImageView 元素
    if (frameLayouts.length > 0) {
        for (let i = 0; i < frameLayouts.length; i++) {
            let ifram = frameLayouts[i];
            console.log(ifram, '用户数据')
            let id = ifram.id(); // 获取当前元素的 ID
            if (id && id == 'com.xingin.xhs:id/a2i') {
                frameLayout = ifram;
                break;  // 找到第一个符合条件的元素后跳出循环
            }
        }
    }

    if (frameLayout) {
        // 获取元素的坐标
        var bounds = frameLayout.bounds();
        var x = bounds.left + (bounds.right - bounds.left) / 2; // 获取元素的水平中心
        var y = bounds.top + (bounds.bottom - bounds.top) / 2; // 获取元素的垂直中心

        // 点击元素的中心坐标
        click(x, y);
    } else {
        console.log("未找到指定元素");
    }
}