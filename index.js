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
    RUN_INTERVAL: [30 * 60 * 1000, 60 * 60 * 1000]
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
    if (!auto.service) {
        LOG.WARN("无障碍服务未开启");
        toast("请先开启无障碍服务！");
        return;
    }
    
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

// ------------------------- 核心功能 -------------------------

function resetState() {
    LOG.INFO("正在重置脚本状态");
    state = {
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
    LOG.INFO("脚本状态已重置");
}

function stopScript() {
    LOG.INFO("正在停止脚本");
    state.isRunning = false;
    updateUI();
    device.cancelKeepingAwake();
    LOG.INFO("已取消屏幕常亮");
    LOG.INFO("脚本已完全停止");
}

function runMultipleTimes() {
    LOG.INFO("开始执行多次运行流程");
    
    while (state.currentRun < CONFIG.DAILY_RUN_TIMES && state.isRunning) {
        state.currentRun++;
        state.waiting = false;
        updateUI();
        
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
    state.waiting = true;
    var remaining = totalTime;
    
    var updateWaitTime = function() {
        var minutes = Math.floor(remaining / 60000);
        var seconds = Math.floor((remaining % 60000) / 1000);
        state.waitTime = minutes + "分" + seconds + "秒";
        updateUI();
        updateLog("等待中: " + state.waitTime);
    };
    
    updateWaitTime();
    
    var intervalId = setInterval(function() {
        remaining -= 1000;
        if (remaining <= 0 || !state.isRunning) {
            clearInterval(intervalId);
            state.waiting = false;
            LOG.INFO("等待时间结束");
            return;
        }
        updateWaitTime();
    }, 1000);
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
    if (random(10, 15) < state.pullDownCount) {
        LOG.INFO("达到最大下滑次数，刷新页面");
        state.pullDownCount = 0;
        launchApp();
        return;
    }
    
    // 如果所有笔记都已处理完，先滑动再查找新笔记
    if (state.currentNoteIndex >= state.selectedNotes.length) {
        LOG.INFO("所有选中笔记已处理完，先滑动首页");
        randomSwipe(2, 5);
        state.selectedNotes = []; // 清空已选笔记
        state.currentNoteIndex = 0; // 重置索引
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

function findRandomNotes() {
    LOG.INFO("开始随机查找笔记");
    state.selectedNotes = [];
    state.currentNoteIndex = 0;
    
    var allNotes = className("android.widget.FrameLayout").untilFind();
    if (allNotes.empty()) {
        LOG.WARN("未找到任何笔记");
        return false;
    }
    
    var validNotes = [];
    for (var i = 0; i < allNotes.size(); i++) {
        var note = allNotes.get(i);
        var desc = note.desc();
        if (desc && desc.indexOf("笔记") === 0) {
            validNotes.push(note);
        }
    }
    
    if (validNotes.length === 0) {
        LOG.WARN("没有有效的笔记");
        return false;
    }
    
    var selectCount = Math.min(random(1, CONFIG.MAX_NOTES_TO_SELECT), validNotes.length);
    LOG.INFO("从" + validNotes.length + "个有效笔记中随机选择" + selectCount + "个");
    
    for (var j = 0; j < selectCount; j++) {
        var randomIndex = random(0, validNotes.length - 1);
        state.selectedNotes.push(validNotes[randomIndex]);
        validNotes.splice(randomIndex, 1);
    }
    
    LOG.INFO("已选择" + state.selectedNotes.length + "个笔记");
    return true;
}

function processNote() {
    if (!state.isRunning) return false;
    if (state.currentNoteIndex >= state.selectedNotes.length) return false;
    
    var currentNote = state.selectedNotes[state.currentNoteIndex];
    if (!currentNote || !currentNote.desc() || currentNote.desc().indexOf("笔记") !== 0) {
        LOG.WARN("当前笔记无效，跳过处理");
        state.currentNoteIndex++;
        return false;
    }
    
    LOG.INFO("--------------------- 开始处理笔记 " + (state.currentNoteIndex + 1) + "/" + state.selectedNotes.length + " ---------------------");
    LOG.INFO("笔记描述: " + currentNote.desc());
    
    if (!clickNote()) {
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
    
    // 处理完最后一个笔记后，不在这里滑动首页（改在singleFlow中处理）
    return true;
}

function clickNote() {
    if (state.currentNoteIndex >= state.selectedNotes.length) {
        LOG.WARN("当前笔记索引超出范围");
        return false;
    }
    
    var note = state.selectedNotes[state.currentNoteIndex];
    
    // 二次验证笔记有效性
    if (!note || !note.desc() || note.desc().indexOf("笔记") !== 0) {
        LOG.WARN("笔记无效或描述不匹配，跳过处理");
        state.currentNoteIndex++; // 跳过这个笔记
        return false;
    }
    
    var bounds = note.bounds();
    
    // 更安全的点击区域计算
    var x = bounds.left + random(bounds.width() * 0.2, bounds.width() * 0.8);
    var y = bounds.top + random(bounds.height() * 0.2, bounds.height() * 0.8);
    
    LOG.INFO("点击笔记位置: x=" + x + ", y=" + y);
    click(x, y);
    
    // 只在成功点击后才增加索引
    state.currentNoteIndex++;
    return true;
}

function waitForNoteDetail() {
    var timeout = 5000; // 5秒超时
    var start = Date.now();
    
    while (Date.now() - start < timeout) {
        if (id(CONFIG.LIKE_ELEMENT_ID).exists()) {
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
        swipeNoteImages();
        sleepRandomDelay(2, 5);
    }
}

function swipeNoteImages() {
    LOG.INFO("查找可滑动的图片区域");
    var frameLayouts = className("android.widget.FrameLayout").untilFind();
    
    for (var i = 0; i < frameLayouts.size(); i++) {
        var frameLayout = frameLayouts.get(i);
        var desc = frameLayout.desc();
        if (desc && desc.indexOf('右划即可查看更多内容') !== -1) {
            var bounds = frameLayout.bounds();
            var startX = random(bounds.centerX(), bounds.right - bounds.width() / 5);
            var endX = random(bounds.left, bounds.centerX());
            var y = random(bounds.top, bounds.bottom);
            
            LOG.INFO("滑动图片: 从(" + startX + "," + y + ")到(" + endX + "," + y + ")");
            swipe(startX, y, endX, y, random(110, 130));
            return;
        }
    }
    LOG.WARN("未找到可滑动的图片区域");
}

function swipeComments() {
    var swipeCount = random(2, 6);
    LOG.INFO("计划滑动评论区" + swipeCount + "次");
    
    for (var i = 0; i < swipeCount && state.isRunning; i++) {
        LOG.INFO("第" + (i+1) + "次滑动评论区");
        swipeCommentArea();
        sleepRandomDelay(2, 5);
    }
}

function swipeCommentArea() {
    var screen = getScreenSize();
    var startX = random(screen.width / 5, (screen.width / 5) * 4);
    var startY = random(screen.height * 0.6, screen.height * 0.8);
    var endY = random(screen.height * 0.2, screen.height * 0.4);
    
    LOG.INFO("滑动评论区: 从(" + startX + "," + startY + ")到(" + startX + "," + endY + ")");
    swipe(startX, startY, startX, endY, random(300, 800));
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
    var bounds = button.bounds();
    LOG.INFO("点击点赞按钮: x=" + bounds.centerX() + ", y=" + bounds.centerY());
    click(bounds.centerX(), bounds.centerY());
    
    state.likeCount++;
    updateUI();
    LOG.INFO("点赞成功，当前点赞次数: " + state.likeCount);
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
    var bounds = button.bounds();
    LOG.INFO("点击返回按钮: x=" + bounds.centerX() + ", y=" + bounds.centerY());
    click(bounds.centerX(), bounds.centerY());
}

function randomSwipe(minCount, maxCount) {
    var screen = getScreenSize();
    var swipeCount = random(minCount, maxCount);
    LOG.INFO("计划在首页随机滑动" + swipeCount + "次");
    
    for (var i = 0; i < swipeCount && state.isRunning; i++) {
        var startX = random(screen.width / 6, screen.width / 6 * 5);
        var startY = random(screen.height * 0.7, screen.height * 0.8);
        var endY = random(screen.height * 0.2, screen.height * 0.3);
        
        LOG.INFO("第" + (i+1) + "次滑动: 从(" + startX + "," + startY + ")到(" + startX + "," + endY + ")");
        swipe(startX, startY, startX, endY, random(300, 600));
        
        var delay = random(CONFIG.SWIPE_DELAY[0], CONFIG.SWIPE_DELAY[1]);
        LOG.INFO("滑动后延迟" + delay + "毫秒");
        sleep(delay);
        
        state.pullDownCount++;
        updateUI();
        LOG.INFO("下滑次数: " + state.pullDownCount);
    }
}

function startCountdown() {
    state.countdownDuration = random(CONFIG.MIN_RUN_TIME, CONFIG.MAX_RUN_TIME);
    var minutes = Math.round(state.countdownDuration / 60000);
    LOG.INFO("设置本次运行倒计时: " + minutes + "分钟");
    
    setTimeout(function() {
        LOG.INFO("本次运行倒计时结束");
        state.isRunning = false;
    }, state.countdownDuration);
}

function killApp() {
    LOG.INFO("正在关闭小红书应用");
    kill(CONFIG.PACKAGE_NAME);
    LOG.INFO("小红书应用已关闭");
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