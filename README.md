jQuery-ganttView
================

jQuery-ganttView是基于jQuery，下载后直接运行即可。
特性：
1.可以点击、拖动、调整大小、以及直接拖拽新任务到视图中
![示例图](https://github.com/982964399/jQuery-ganttView/blob/master/example/example.png)
![示例图](https://github.com/982964399/jQuery-ganttView/blob/master/example/example2.png)

依赖
------------
- jQuery 1.4以上
- jQuery-UI 1.8.4以上

用法
----------
<pre><code>
$("#ganttChart").ganttView({
	data: data,
	behavior: {
		onClick: function (data) { 
			var msg = "click事件:" + JSON.stringify(data);
			$("#eventMessage").text(msg);
		},
		onResize: function (data) {
			var msg = "resize事件:" + JSON.stringify(data);
			$("#eventMessage").text(msg);
		},
		onDrag: function (data) {
			var msg = "drag事件:" + JSON.stringify(data);
			$("#eventMessage").text(msg);
		}
	}
});
</pre></code>

参数
-----------------
<pre><code>
showWeekends: boolean
data: object
data格式：[
    {
        id: 2, name: "Aaron", series: [
            {
			    taskId: 1,
			    name: "任务1",
			    start: '2018/01,05',
			    end: '2018/01/20',
			    options:{ // 单条配置
			        resizable?:boolean, // default:true
			        draggable?:boolean, // default:true
			        color?: string
                },
                ...其他参数
			 }
		]
    }
]
dataUrl: string,
cellWidth: number, default: 30
cellHeight: number, default: 30
vtHeaderWidth: number, default: 100,
behavior: { // 整体配置， 如果整体设置不能拖拽、改变大小，则单条配置会失效
	clickable: boolean,
	draggable: boolean,
	resizable: boolean,
	onClick: function,
	onDrag: function,
	onResize: function
}
</code></pre>


License
-------
MIT License

Copyright (c) 2018 982964399

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.