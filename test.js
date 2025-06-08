"ui";

// ------------------------- 配置区域 -------------------------
var CONFIG = {
    APP_NAME: "小红书",
    PACKAGE_NAME: "com.xingin.xhs",
    MIN_RUN_TIME: 15 * 60 * 1000,
    MAX_RUN_TIME: 25 * 60 * 1000,
    LIKE_PROBABILITY: 0.8,
    MAX_LIKES: 10,
    SWIPE_DELAY: [2000, 6000],
    HOME_ELEMENT_ID: "du6",
    LIKE_ELEMENT_ID: "com.xingin.xhs:id/g7x",
    BACK_ELEMENT_ID: "com.xingin.xhs:id/a2i",
    MAX_PULL_DOWN: 30,
    MAX_NOTES_TO_SELECT: 3,
    DAILY_RUN_TIMES: 4,
    RUN_INTERVAL: [30 * 60 * 1000, 60 * 60 * 1000],
    POPUP_CLOSE_TEXTS: ["我知道了", "暂不", "取消", "以后再说", "关闭"],
    POPUP_CLOSE_IDS: ["close", "cancel", "iv_close"]
};

// ------------------------- 日志工具 -------------------------
var LOG = {
    INFO: function(msg) {
        var timestamp = getCurrentTime();
        console.log("[INFO][" + timestamp + "] " + msg);
        updateLog("[INFO] " + msg);
    },
    WARN: function(msg) {
        var timestamp = getCurrentTime();
        console.warn("[WARN][" + timestamp + "] " + msg);
        updateLog("[WARN] " + msg);
    },
    ERROR: function(msg) {
        var timestamp = getCurrentTime();
        console.error("[ERROR][" + timestamp + "] " + msg);
        updateLog("[ERROR] " + msg);
    }
};

function getCurrentTime() {
    var now = new Date();
    return now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
}

// ------------------------- 全局状态 -------------------------
var state = {
    likeCount: 0,
    pullDownCount: 0,
    selectedNotes: [],
    currentNoteIndex: 0,
    isRunning: true,
    countdownDuration: random(CONFIG.MIN_RUN_TIME, CONFIG.MAX_RUN_TIME),
    currentRun: 0,
    waiting: false,
    waitTime: "0分0秒"
};


// ------------------------- 高级滑动模拟 -------------------------
var SwipeSimulator = {
    // 模拟人类滑动行为（带曲线和速度变化）
    humanSwipe: function(startX, startY, endX, endY, duration) {
        LOG.INFO("开始模拟人类滑动");
        
        // 1. 添加随机起始偏移（模拟手指按下时的轻微移动）
        var pressOffsetX = random(-15, 15);
        var pressOffsetY = random(-10, 10);
        press(startX + pressOffsetX, startY + pressOffsetY, 50 + random(0, 100));
        
        // 2. 生成曲线路径点（贝塞尔曲线控制点）
        var controlPoint1 = {
            x: startX + (endX - startX) * 0.3 + random(-50, 50),
            y: startY + (endY - startY) * 0.3 + random(-30, 30)
        };
        
        var controlPoint2 = {
            x: startX + (endX - startX) * 0.7 + random(-50, 50),
            y: startY + (endY - startY) * 0.7 + random(-30, 30)
        };
        
        // 3. 生成路径点（带随机扰动）
        var points = [];
        var steps = 20 + random(0, 10);
        
        for (var i = 0; i <= steps; i++) {
            var t = i / steps;
            // 三次贝塞尔曲线公式
            var x = Math.pow(1 - t, 3) * startX +
                     3 * Math.pow(1 - t, 2) * t * controlPoint1.x +
                     3 * (1 - t) * Math.pow(t, 2) * controlPoint2.x +
                     Math.pow(t, 3) * endX;
                     
            var y = Math.pow(1 - t, 3) * startY +
                     3 * Math.pow(1 - t, 2) * t * controlPoint1.y +
                     3 * (1 - t) * Math.pow(t, 2) * controlPoint2.y +
                     Math.pow(t, 3) * endY;
                     
            // 添加随机扰动
            points.push({
                x: x + random(-3, 3),
                y: y + random(-2, 2),
                t: t
            });
        }
        
        // 4. 变速滑动（开始慢-中间快-结束慢）
        var startTime = Date.now();
        var endTime = startTime + duration;
        
        var lastPoint = {x: startX, y: startY};
        for (var j = 1; j < points.length; j++) {
            
            var point = points[j];
            var progress = point.t;
            
            // 变速因子：慢-快-慢曲线
            var speedFactor = Math.sin(progress * Math.PI);
            
            // 计算当前点应到达的时间
            var targetTime = startTime + duration * progress;
            var delay = Math.max(1, targetTime - Date.now());
            
            // 移动手指
            if (j > 1) {
                var moveDuration = delay * speedFactor * random(0.8, 1.2);
                swipe(
                    lastPoint.x, lastPoint.y,
                    point.x, point.y,
                    moveDuration
                );
            }
            
            lastPoint = point;
            
            // 随机微小停顿
            if (random(1, 5) === 1) {
                sleep(random(1, 30));
            }
        }
        
        // 5. 结束时的随机停留
        sleep(random(30, 150));
        LOG.INFO("人类滑动模拟完成");
    },
    
    // 智能滑动首页（随机方向+随机长度）
    smartSwipeHome: function() {
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
        
        // 随机滑动时间（400-1200ms）
        var duration = random(400, 1200);
        
        LOG.INFO("首页" + (swipeUp ? "上滑" : "下滑") + ": (" + startX + "," + startY + ") -> (" + endX + "," + endY + ")");
        this.humanSwipe(startX, startY, endX, endY, duration);
    },
    
    // 智能滑动图片（带随机方向）
    smartSwipeImage: function() {
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
        var duration = random(300, 800);
        
        LOG.INFO("图片" + (swipeRight ? "右滑" : "左滑") + ": (" + startX + "," + startY + ") -> (" + endX + "," + endY + ")");
        this.humanSwipe(startX, startY, endX, endY, duration);
    },
    
    // 智能滑动评论区（随机方向+随机幅度）
    smartSwipeComments: function() {
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


// ------------------------- UI界面 -------------------------
ui.layout(
    <vertical padding="16">
        <button id="openAccessibilityBtn" text="开启无障碍" layout_width="match_parent" />
        <button id="startScriptBtn" text="启动脚本" layout_width="match_parent" />
        <button id="stopScriptBtn" text="停止脚本" layout_width="match_parent" />
        <horizontal>
            <text text="运行状态:" margin="0 8 0 0" />
            <text id="statusText" text="未运行" />
        </horizontal>
        <horizontal>
            <text text="当前次数:" margin="0 8 0 0" />
            <text id="runCountText" text="0/4" />
        </horizontal>
        <horizontal>
            <text text="点赞次数:" margin="0 8 0 0" />
            <text id="likeCountText" text="0" />
        </horizontal>
        <horizontal>
            <text text="下滑次数:" margin="0 8 0 0" />
            <text id="pullDownCountText" text="0" />
        </horizontal>
        <horizontal>
            <text text="日志输出:" margin="0 8 0 0" />
            <text id="logText" text="" layout_weight="1" maxLines="5" ellipsize="end" />
            </horizontal>
        </vertical>
);

// 更新日志显示
function updateLog(msg) {
    ui.run(function() {
        var current = ui.logText.getText();
        var lines = current.split("\n");
        if (lines.length > 5) {
            lines.shift();
        }
        lines.push(msg);
        ui.logText.setText(lines.join("\n"));
    });
}

ui.startScriptBtn.on("click", function() {
    LOG.INFO("脚本启动，计划运行" + CONFIG.DAILY_RUN_TIMES + "次");
    device.keepScreenOn(24 * 60 * 60 * 1000);
    LOG.INFO("已设置屏幕常亮");
});

ui.stopScriptBtn.on("click", function() {
    LOG.INFO("用户点击了停止脚本按钮");
    stopScript();
    toast("脚本已停止");
});
// ------------------------- 核心功能 -------------------------
// 全局定时器引用
var countdownInterval = null;
var heartBeatInterval = null;

function stopScript() {
    LOG.INFO("正在停止脚本");
    
    // 清理定时器
    if (countdownInterval) clearInterval(countdownInterval);
    if (heartBeatInterval) clearInterval(heartBeatInterval);
    
    
    device.cancelKeepingAwake();
    LOG.INFO("已取消屏幕常亮");
    LOG.INFO("脚本已完全停止");
}
// 启动小红书应用
function launchApp() {
    LOG.INFO("正在查找小红书应用图标");
    var appIcon = text(CONFIG.APP_NAME).findOne(5000);
    if (!appIcon) {
        LOG.ERROR("找不到小红书应用图标");
        throw new Error("找不到小红书应用图标");
    }
    
    LOG.INFO("点击小红书应用图标");
    appIcon.click();
    sleepRandomDelay(4, 8);
        
    LOG.INFO("查找首页元素");
    var homeElement = id(CONFIG.HOME_ELEMENT_ID).findOne(5000);
    if (!homeElement) {
        LOG.ERROR("找不到首页元素");
        throw new Error("找不到首页元素");
    }
    
    LOG.INFO("点击首页元素");
    homeElement.click();
    sleepRandomDelay(3, 6);
}

// ------------------------- 开始执行流程 -------------------------
//根据配置参数设置可以执行几次流程
function runMultiple(){
    if(state.currentRun>=CONFIG.DAILY_RUN_TIMES){
        return
    }
    state.currentRun=state.currentRun+1
    LOG.INFO("开始第" + state.currentRun+"次运行")   
}

//单次流程
function runSingle(){
    try {
        LOG.INFO("开始单次运行流程");
        
        LOG.INFO("返回桌面");
        home();
        sleepRandomDelay(1,3);
        
        LOG.INFO("启动小红书应用");
        launchApp();
        
        LOG.INFO("关闭小红书应用");
        killApp();
    } catch (e) {
        LOG.ERROR("单次运行异常: " + e.message);
        throw e;
    }

}


// ------------------------- 工具函数 -------------------------

function getScreenSize() {
    var size = {
        width: device.width,
        height: device.height
    };
    LOG.INFO("获取屏幕尺寸: " + size.width + "x" + size.height);
    return size;
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleepRandomDelay(minSec, maxSec) {
    var delay = random(minSec * 1000, maxSec * 1000);
    LOG.INFO("随机延迟: " + delay + "毫秒");
    sleep(delay);
}