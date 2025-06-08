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

// ------------------------- 全局状态管理 -------------------------
var state = {
    likeCount: 0,
    pullDownCount: 0,
    selectedNotes: [],
    currentNoteIndex: 0,
    isRunning: false,
    countdownDuration: 0,
    currentRun: 0,
    waiting: false,
    waitTime: "0分0秒"
};

// 状态更新函数
function updateState(newState) {
    Object.assign(state, newState);
    updateUI();
}

// 重置状态
function resetState() {
    LOG.INFO("正在重置脚本状态");
    updateState({
        likeCount: 0,
        pullDownCount: 0,
        selectedNotes: [],
        currentNoteIndex: 0,
        isRunning: true,
        countdownDuration: random(CONFIG.MIN_RUN_TIME, CONFIG.MAX_RUN_TIME),
        currentRun: 0,
        waiting: false,
        waitTime: "0分0秒"
    });
    LOG.INFO("脚本状态已重置");
}

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

// 更新UI状态
function updateUI() {
    ui.run(function() {
        ui.statusText.setText(
            state.isRunning ? (state.waiting ? "等待中 " + state.waitTime : "运行中") : "已停止"
        );
        ui.runCountText.setText(state.currentRun + "/" + CONFIG.DAILY_RUN_TIMES);
        ui.likeCountText.setText(state.likeCount.toString());
        ui.pullDownCountText.setText(state.pullDownCount.toString());
    });
}

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

// 事件监听
ui.openAccessibilityBtn.on("click", function() {
    LOG.INFO("用户点击了开启无障碍按钮");
    app.startActivity({
        action: "android.settings.ACCESSIBILITY_SETTINGS"
    });
    toast("请开启无障碍服务！");
});

ui.startScriptBtn.on("click", function() {
    LOG.INFO("用户点击了启动脚本按钮");
    
    resetState();
    updateUI();
    
    LOG.INFO("脚本启动，计划运行" + CONFIG.DAILY_RUN_TIMES + "次");
    toast("脚本已启动！将自动运行" + CONFIG.DAILY_RUN_TIMES + "次");
    
    device.keepScreenOn(24 * 60 * 60 * 1000);
    LOG.INFO("已设置屏幕常亮");
    
    threads.start(function() {
        try {
            runMultipleTimes();
        } catch (e) {
            LOG.ERROR("脚本运行异常: " + e.message);
            toast("脚本异常: " + e.message);
            stopScript();
        }
    });
});

ui.stopScriptBtn.on("click", function() {
    LOG.INFO("用户点击了停止脚本按钮");
    stopScript();
    toast("脚本已停止");
});
 
// 全局定时器引用
var countdownInterval = null;
var heartBeatInterval = null;

// ------------------------- 核心功能 -------------------------

function stopScript() {
    LOG.INFO("正在停止脚本");
    
    // 清理定时器
    if (countdownInterval) clearInterval(countdownInterval);
    if (heartBeatInterval) clearInterval(heartBeatInterval);
    
    updateState({
        isRunning: false
    });
    
    device.cancelKeepingAwake();
    LOG.INFO("已取消屏幕常亮");
    LOG.INFO("脚本已完全停止");
}

function runMultipleTimes() {
    LOG.INFO("开始执行多次运行流程");
    
    while (state.currentRun < CONFIG.DAILY_RUN_TIMES && state.isRunning) {
        updateState({
            currentRun: state.currentRun + 1
        });
        
        LOG.INFO("开始第 " + state.currentRun + " 次运行");
        toast("开始第 " + state.currentRun + " 次运行");
        
        singleRun();
        
        if (state.currentRun < CONFIG.DAILY_RUN_TIMES && state.isRunning) {
            var interval = random(CONFIG.RUN_INTERVAL[0], CONFIG.RUN_INTERVAL[1]);
            var minutes = Math.round(interval/60000);
            LOG.INFO("本次运行结束，等待 " + minutes + " 分钟后继续下一次运行");
            toast("下次运行将在 " + minutes + " 分钟后开始");
            
            showIntervalCountdown(interval);
            
            sleep(interval);
        }
    }
    
    LOG.INFO("已完成所有 " + CONFIG.DAILY_RUN_TIMES + " 次运行");
    toast("已完成今日所有运行次数");
    stopScript();
}

function showIntervalCountdown(totalTime) {
    LOG.INFO("开始显示间隔倒计时");
    var remaining = totalTime;
    
    updateState({
        waiting: true,
        waitTime: formatTime(remaining)
    });
    
    countdownInterval = setInterval(function() {
        remaining -= 1000;
        if (remaining <= 0 || !state.isRunning) {
            clearInterval(countdownInterval);
            updateState({ waiting: false });
            LOG.INFO("等待时间结束");
            return;
        }
        updateState({
            waitTime: formatTime(remaining)
        });
    }, 1000);
}

// 时间格式化辅助函数
function formatTime(ms) {
    var minutes = Math.floor(ms / 60000);
    var seconds = Math.floor((ms % 60000) / 1000);
    return minutes + "分" + seconds + "秒";
}


function singleRun() {
    try {
        LOG.INFO("开始单次运行流程");
        
        LOG.INFO("返回桌面");
        home();
        sleep(1000);
        
        LOG.INFO("启动小红书应用");
        launchApp();
        
        LOG.INFO("设置本次运行倒计时");
        startCountdown();
        
        LOG.INFO("进入主操作循环");
        while (state.isRunning) {
            singleFlow();
        }
        
        LOG.INFO("关闭小红书应用");
        killApp();
    } catch (e) {
        LOG.ERROR("单次运行异常: " + e.message);
        throw e;
    }
}

function launchApp() {
    LOG.INFO("正在查找小红书应用图标");
    var appIcon = text(CONFIG.APP_NAME).findOne(5000);
    if (!appIcon) {
        LOG.ERROR("找不到小红书应用图标");
        throw new Error("找不到小红书应用图标");
    }
    
    LOG.INFO("点击小红书应用图标");
    appIcon.click();
    sleepRandomDelay(4, 7);
        
    LOG.INFO("查找首页元素");
    var homeElement = id(CONFIG.HOME_ELEMENT_ID).findOne(5000);
    if (!homeElement) {
        LOG.ERROR("找不到首页元素");
        throw new Error("找不到首页元素");
    }
    
    LOG.INFO("点击首页元素");
    homeElement.click();
    sleepRandomDelay(2, 6);
}

function singleFlow() {
    if (!state.isRunning) return;
    
    LOG.INFO("开始单次操作流程");
    
    // 检查是否需要刷新页面
    if (random(6, 10) < state.pullDownCount) {
        LOG.INFO("达到最大下滑次数，刷新页面");
        updateState({
            pullDownCount: 0
        });
        launchApp();
        return;
    }
    
    // 如果所有笔记都已处理完，先滑动再查找新笔记
    if (state.currentNoteIndex >= state.selectedNotes.length) {
        LOG.INFO("所有选中笔记已处理完，先滑动首页");
        randomSwipe(2, 5);
        updateState({
            selectedNotes: [],
            currentNoteIndex: 0
        });
    }
    
    // 如果没有选中笔记，则查找新笔记
    if (state.selectedNotes.length === 0) {
        LOG.INFO("查找新一批随机笔记");
        findRandomNotes();
    }
    
    // 处理当前选中的笔记
    if (state.selectedNotes.length > 0 && state.currentNoteIndex < state.selectedNotes.length) {
        LOG.INFO("处理当前选中的笔记");
        processNote();
    } else {
        LOG.INFO("没有找到合适笔记，随机滑动");
        randomSwipe(2, 5);
    }
}

function isValidNote(note) {
    var desc = note.desc() || "";
    return desc.startsWith("笔记") && 
           desc.indexOf("广告") === -1 && 
           desc.indexOf("视频") === -1;
}

function findRandomNotes() {
    updateState({
        selectedNotes: [],
        currentNoteIndex: 0
    });
    
    LOG.INFO("开始随机查找笔记");
    var allNotes = className("android.widget.FrameLayout").untilFind();
    if (allNotes.empty()) {
        LOG.WARN("未找到任何笔记");
        return false;
    }
    
    var validNotes = [];
    for (var i = 0; i < allNotes.size(); i++) {
        var note = allNotes.get(i);
        if (isValidNote(note)) {
            validNotes.push(note);
        }
    }
    
    if (validNotes.length === 0) {
        LOG.WARN("没有有效的笔记");
        return false;
    }
    
    var selectCount = Math.min(random(1, CONFIG.MAX_NOTES_TO_SELECT), validNotes.length);
    LOG.INFO("从" + validNotes.length + "个有效笔记中随机选择" + selectCount + "个");
    
    var selectedNotes = [];
    for (var j = 0; j < selectCount; j++) {
        var randomIndex = random(0, validNotes.length - 1);
        selectedNotes.push(validNotes[randomIndex]);
        validNotes.splice(randomIndex, 1);
    }
    
    updateState({
        selectedNotes: selectedNotes
    });
    
    LOG.INFO("已选择" + selectedNotes.length + "个笔记");
    return true;
}

function processNote() {
    if (!state.isRunning) return false;
    if (state.currentNoteIndex >= state.selectedNotes.length) return false;
    
    var currentNote = state.selectedNotes[state.currentNoteIndex];
    if (!currentNote || !isValidNote(currentNote)) {
        LOG.WARN("当前笔记无效，跳过处理");
        updateState({
            currentNoteIndex: state.currentNoteIndex + 1
        });
        return false;
    }
    
    LOG.INFO("--------------------- 开始处理笔记 " + (state.currentNoteIndex + 1) + "/" + state.selectedNotes.length + " ---------------------");
    LOG.INFO("笔记描述: " + currentNote.desc());
    
    if (!clickNote(currentNote)) {
        return false;
    }
    
    // 等待笔记加载
    if (!waitForNoteDetail()) {
        LOG.WARN("笔记详情加载失败，返回首页");
        goBack();
        return false;
    }
    
    LOG.INFO("随机滑动图片");
    swipeImages();
    sleepRandomDelay(2, 5);
    
    LOG.INFO("滑动评论区");
    swipeComments();
    
    LOG.INFO("尝试点赞");
    likeNote();
    sleepRandomDelay(2, 5);
    
    LOG.INFO("返回上一页");
    goBack();
    sleepRandomDelay(2, 5);
    
    LOG.INFO("--------------------- 笔记处理结束 ---------------------");
    
    return true;
}

function ensureNoteVisible(note) {
    if (!note) return false;
    
    // 获取设备状态栏高度
    var statusBarHeight = device.getStatusBarHeight();
    var screen = getScreenSize();
    
    // 检查笔记是否在可见区域
    var bounds = note.bounds();
    var isVisible = bounds.top >= statusBarHeight && 
                   bounds.bottom <= screen.height && 
                   bounds.left >= 0 && 
                   bounds.right <= screen.width;
    
    if (isVisible) return true;
    
    // 如果不可见，尝试滚动到视图
    LOG.INFO("笔记不在可见区域，尝试滚动");
    if (bounds.top < statusBarHeight) {
        // 向上滚动
        SwipeSimulator.smartSwipeHome();
    } else {
        // 向下滚动
        var screen = getScreenSize();
        SwipeSimulator.humanSwipe(
            screen.width / 2, screen.height * 0.3,
            screen.width / 2, screen.height * 0.7,
            800
        );
    }
    
    sleep(1000);
    return note.visibleToUser();
}

function clickNote(note) {
    if (state.currentNoteIndex >= state.selectedNotes.length) {
        LOG.WARN("当前笔记索引超出范围");
        return false;
    }
    
    // 确保笔记可见
    if (!ensureNoteVisible(note)) {
        LOG.WARN("笔记不可见，跳过处理");
        updateState({
            currentNoteIndex: state.currentNoteIndex + 1
        });
        return false;
    }
    
    LOG.INFO("点击笔记: " + note.desc());
    var clicked = note.click();
    
    // 只在成功点击后才增加索引
    if (clicked) {
        updateState({
            currentNoteIndex: state.currentNoteIndex + 1
        });
        return true;
    }
    
    LOG.WARN("点击笔记失败");
    return false;
}

function waitForNoteDetail(timeout) {
    timeout = timeout || 8000;
    LOG.INFO("等待笔记详情加载");
    var start = Date.now();
    
    while (Date.now() - start < timeout && state.isRunning) {
        
        if (id(CONFIG.LIKE_ELEMENT_ID).exists() && 
            !text("加载中").exists() && 
            !descContains("加载中").exists()) {
            return true;
        }
        sleep(500);
    }
    return false;
}

function swipeImages() {
    var swipeCount = random(1, 3);
    LOG.INFO("计划滑动图片" + swipeCount + "次");
    
    for (var i = 0; i < swipeCount && state.isRunning; i++) {
        LOG.INFO("第" + (i+1) + "次滑动图片");
        SwipeSimulator.smartSwipeImage();
        sleepRandomDelay(2, 5);
    }
}

function swipeComments() {
    var swipeCount = random(2, 6);
    LOG.INFO("计划滑动评论区" + swipeCount + "次");
    
    for (var i = 0; i < swipeCount && state.isRunning; i++) {
        LOG.INFO("第" + (i+1) + "次滑动评论区");
        SwipeSimulator.smartSwipeComments();
        sleepRandomDelay(2, 5);
    }
}

function likeNote() {
    if (state.likeCount >= CONFIG.MAX_LIKES) {
        LOG.INFO("已达到最大点赞次数(" + CONFIG.MAX_LIKES + ")，跳过点赞");
        return;
    }
    
    LOG.INFO("查找点赞按钮");
    var likeButtons = id(CONFIG.LIKE_ELEMENT_ID).untilFind();
    if (likeButtons.empty()) {
        LOG.WARN("未找到点赞按钮");
        return;
    }
    
    if (Math.random() > CONFIG.LIKE_PROBABILITY) {
        LOG.INFO("根据概率跳过点赞");
        return;
    }
    
    var button = likeButtons.get(0);
    LOG.INFO("点击点赞按钮: " + button);
    button.click();
    
    updateState({
        likeCount: state.likeCount + 1
    });
    
    LOG.INFO("点赞成功，当前点赞次数: " + (state.likeCount + 1));
}

function goBack() {
    LOG.INFO("查找返回按钮");
    var backButtons = id(CONFIG.BACK_ELEMENT_ID).untilFind();
    if (backButtons.empty()) {
        LOG.WARN("未找到返回按钮，使用模拟返回");
        back();
        return;
    }
    
    var button = backButtons.get(0);
    LOG.INFO("点击返回按钮: " + button);
    button.click();
}

function randomSwipe(minCount, maxCount) {
    var swipeCount = random(minCount, maxCount);
    LOG.INFO("计划在首页随机滑动" + swipeCount + "次");
    
    for (var i = 0; i < swipeCount && state.isRunning; i++) {
        SwipeSimulator.smartSwipeHome();
        
        var delay = random(CONFIG.SWIPE_DELAY[0], CONFIG.SWIPE_DELAY[1]);
        LOG.INFO("滑动后延迟" + delay + "毫秒");
        sleep(delay);
        
        updateState({
            pullDownCount: state.pullDownCount + 1
        });
        LOG.INFO("下滑次数: " + (state.pullDownCount + 1));
    }
}

function startCountdown() {
    var duration = random(CONFIG.MIN_RUN_TIME, CONFIG.MAX_RUN_TIME);
    var minutes = Math.round(duration / 60000);
    
    updateState({
        countdownDuration: duration
    });
    
    LOG.INFO("设置本次运行倒计时: " + minutes + "分钟");
    
    setTimeout(function() {
        LOG.INFO("本次运行倒计时结束");
        updateState({
            isRunning: false
        });
    }, duration);
}

function killApp() {
    LOG.INFO("正在关闭小红书应用");
    kill(CONFIG.PACKAGE_NAME);
    LOG.INFO("小红书应用已关闭");
}

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
            if (!state.isRunning) break;
            
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