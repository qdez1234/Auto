
// ------------------------- 配置区域 -------------------------
var CONFIG = {
    APP_NAME: "小红书",
    PACKAGE_NAME: "com.xingin.xhs",
    MIN_RUN_TIME: 15 * 60 * 1000,
    MAX_RUN_TIME: 25 * 60 * 1000,
    LIKE_PROBABILITY: 0.8,
    MAX_LIKES: 10,
    SWIPE_DELAY: [2000, 6000],
    HOME_ELEMENT_ID: "dxb",
    LIKE_ELEMENT_ID: "com.xingin.xhs:id/gca",
    BACK_ELEMENT_ID: "com.xingin.xhs:id/a2i",
    MAX_PULL_DOWN: 30,
    MAX_NOTES_TO_SELECT: 3,
    DAILY_RUN_TIMES: 4,
    RUN_INTERVAL: [30 * 60 * 1000, 60 * 60 * 1000],
    POPUP_CLOSE_TEXTS: ["我知道了", "暂不", "取消", "以后再说", "关闭"],
    POPUP_CLOSE_IDS: ["close", "cancel", "iv_close"]
};
var state = {
    likeCount: 0,
    pullDownCount: 0,
    selectedNotes: [],
    currentNoteIndex: 0,
    isRunning: true,
    countdownDuration: random(CONFIG.MIN_RUN_TIME, CONFIG.MAX_RUN_TIME),
    waiting: false,
    waitTime: "0分0秒"
};
// ------------------------- 日志工具 -------------------------
var LOG = {
    INFO: function (msg) {
        var timestamp = getCurrentTime();
        console.log("[INFO][" + timestamp + "] " + msg);
    },
    WARN: function (msg) {
        var timestamp = getCurrentTime();
        console.warn("[WARN][" + timestamp + "] " + msg);
    },
    ERROR: function (msg) {
        var timestamp = getCurrentTime();
        console.error("[ERROR][" + timestamp + "] " + msg);
    }
};
// 获取屏幕尺寸
function getScreenSize() {
    var size = {
        width: device.width,
        height: device.height
    };
    LOG.INFO("获取屏幕尺寸: " + size.width + "x" + size.height);
    return size;
}

// ------------------------- 高级滑动模拟 -------------------------
var SwipeSimulator = {
    // 模拟人类滑动行为（带曲线和速度变化）
    humanSwipe: function (startX, startY, endX, endY, duration) {
        LOG.INFO("开始模拟人类滑动duration:" + duration);
        swipe(startX, startY, endX, endY, duration);
        // 5. 结束时的随机停留
        sleep(random(30, 150));
        LOG.INFO("人类滑动模拟完成");
    },

    // 智能滑动首页（随机方向+随机长度）
    smartSwipeHome: function () {
        var screen = getScreenSize();

        // 随机选择滑动方向（70%概率向上，30%概率向下）
        var swipeUp = Math.random() > 0.3;

        // 起点区域（中下部或中上部）
        var startX = random(screen.width * 0.3, screen.width * 0.7);
        var startY = swipeUp ?
            random(screen.height * 0.6, screen.height * 0.8) :
            random(screen.height * 0.2, screen.height * 0.4);

        // 终点区域（随机长度）
        var endY = swipeUp ?
            random(screen.height * 0.1, screen.height * 0.3) :
            random(screen.height * 0.7, screen.height * 0.9);

        // 随机水平偏移（模拟手指自然移动）
        var endX = startX + random(-screen.width * 0.1, screen.width * 0.1);

        // 随机滑动时间（400-800ms）
        var duration = random(400, 800);

        LOG.INFO("首页" + (swipeUp ? "上滑" : "下滑") + ": (" + startX + "," + startY + ") -> (" + endX + "," + endY + ")");
        this.humanSwipe(startX, startY, endX, endY, duration);
    },

    // 智能滑动图片（带随机方向）
    smartSwipeImage: function () {
        LOG.INFO("智能滑动图片");
        var screen = getScreenSize();

        // 随机选择方向（左右滑动）
        var swipeRight = Math.random() > 0.5;

        // 在图片区域随机选择位置
        var startY = random(screen.height * 0.3, screen.height * 0.7);
        var startX = swipeRight ?
            random(screen.width * 0.1, screen.width * 0.3) :
            random(screen.width * 0.7, screen.width * 0.9);

        // 终点位置（带随机偏移）
        var endX = swipeRight ?
            random(screen.width * 0.7, screen.width * 0.9) :
            random(screen.width * 0.1, screen.width * 0.3);
        var endY = startY + random(-screen.height * 0.05, screen.height * 0.05);

        // 随机滑动时间（300-800ms）
        var duration = random(200, 500);

        LOG.INFO("图片" + (swipeRight ? "右滑" : "左滑") + ": (" + startX + "," + startY + ") -> (" + endX + "," + endY + ")");
        this.humanSwipe(startX, startY, endX, endY, duration);
    },

    // 智能滑动评论区（随机方向+随机幅度）
    smartSwipeComments: function () {
        LOG.INFO("智能滑动评论区");
        var screen = getScreenSize();

        // 随机选择方向（70%概率向上，30%概率向下）
        var swipeUp = Math.random() > 0.3;

        // 起点在评论区中部
        var startX = random(screen.width * 0.4, screen.width * 0.6);
        var startY = random(screen.height * 0.5, screen.height * 0.7);

        // 随机滑动距离（屏幕高度的20%-60%）
        var swipeDistance = random(screen.height * 0.2, screen.height * 0.6) * (swipeUp ? -1 : 1);
        var endY = startY + swipeDistance;

        // 随机水平偏移（模拟手指自然移动）
        var endX = startX + random(-screen.width * 0.05, screen.width * 0.05);

        // 随机滑动时间（500-1500ms）
        var duration = random(500, 1500);

        LOG.INFO("评论区" + (swipeUp ? "上滑" : "下滑") + ": (" + startX + "," + startY + ") -> (" + endX + "," + endY + ")");
        this.humanSwipe(startX, startY, endX, endY, duration);
    }
};

// 随机并且延时
function sleepRandomDelay(minSec, maxSec) {
    var delay = random(minSec * 1000, maxSec * 1000);
    LOG.INFO("随机延迟: " + delay + "毫秒");
    sleep(delay);
}
// 获取当前时间
function getCurrentTime() {
    var now = new Date();
    return now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
}
let likeButtons = id(CONFIG.LIKE_ELEMENT_ID).findOne();
let bounds = likeButtons.bounds();

// 计算中心
let centerX = bounds.centerX();
let centerY = bounds.centerY();
click(centerX, centerY)
