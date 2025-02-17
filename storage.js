// 引入需要的模块
var storages = require('storages');

// 获取当前时间戳
var date = new Date();
var year = date.getFullYear();
var month = date.getMonth() + 1; // 月份从0开始，所以要加1
var day = date.getDate();
var timestamp = year + '' + month + '' + day;

// 定义存储键
var storageKey = 'lickN_' + timestamp;

// 创建存储对象
var storage = storages.create('myStorage');

// 获取当前存储的值，如果不存在则默认为0
var currentValue = storage.get(storageKey, 0);

// 将值加1
var newValue = currentValue + 1;

// 存储新的值
storage.put(storageKey, newValue);

// 输出结果
toast('当前值: ' + currentValue + ', 新值: ' + newValue);