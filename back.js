// 封装点击指定元素的函数
function clickBack() {
    let frameLayouts = className("android.widget.Button").untilFind();
      
    let frameLayout = undefined;
    // 查找符合条件的 ImageView 元素
    if (frameLayouts.length > 0) {
        for (let i = 0; i < frameLayouts.length; i++) {
            let ifram = frameLayouts[i];
            console.log(ifram,'用户数据')
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
clickElementById()