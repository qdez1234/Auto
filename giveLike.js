// 封装点击指定元素的函数
function clickElementById(elementId='com.xingin.xhs:id/g7x') {
    let frameLayouts = className("android.widget.ImageView").untilFind();

    let frameLayout = undefined;
    // 查找符合条件的 ImageView 元素
    if (frameLayouts.length > 0) {
        for (let i = 0; i < frameLayouts.length; i++) {
            let ifram = frameLayouts[i];
            let id = ifram.id(); // 获取当前元素的 ID
            if (id && id == elementId) {
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

