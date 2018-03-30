/*
Options
-----------------
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
                }
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
*/

(function (jQuery) {
	var ganttOpts = {};
	var ganttView = null;
    jQuery.fn.resizeEnd = function (callback, timeout) {
        $(this).resize(function () {
            var $this = $(this);
            if ($this.data('resizeTimeout')) {
                clearTimeout($this.data('resizeTimeout'));
            }
            $this.data('resizeTimeout', setTimeout(callback, timeout));
        });
    };
    jQuery.fn.ganttView = function () {
    	
    	var args = Array.prototype.slice.call(arguments);
    	
    	if (args.length === 1 && typeof(args[0]) === "object") {
            ganttView = this;
        	build.call(ganttView, args[0]);
    	} else if(args.length >= 1 && typeof(args[0] === "string")) {
    	    handleMethod.call(ganttView, args);
    	}
        $(window).resizeEnd(function() {
            build.call(ganttView, ganttOpts);
        }, 500);

    };
    
    function build(options) {
    	ganttView.children().remove();
        var defaults = {
            showWeekends: true,
            cellWidth: 40,
            cellHeight: 30,
            vtHeaderWidth: 200,
            data: [],
            dataUrl: null,
            behavior: {
            	clickable: true,
            	draggable: true,
            	resizable: true
            }
        };
        
        var opts = jQuery.extend(true, defaults, options);
        jQuery.extend(ganttOpts, opts);
		if (opts.data) {
			build();
		} else if (opts.dataUrl) {
			jQuery.getJSON(opts.dataUrl, function (data) {
				opts.data = data;
                jQuery.extend(ganttOpts, opts);
				build();
			});
		}

		function build() {
			for(var i = 0; i < opts.data.length; i++) {
			    for(var j = 0; j < opts.data[i].series.length; j++) {
			        var serie = opts.data[i].series[j];
			        if (!!serie.start && !!serie.end) {
			            serie.start = new Date(serie.start);
			            serie.end = new Date(serie.end);
                    }
                }
            }
			var minDays = Math.floor(((ganttView.outerWidth() - opts.vtHeaderWidth ) / opts.cellWidth)  + 15);
			var startEnd = DateUtils.getBoundaryDatesFromData(opts.data, minDays);
			opts.start = startEnd[0];
			opts.end = startEnd[1];

            ganttView.each(function () {
	            var container = jQuery(this);
	            var div = jQuery("<div>", { "class": "ganttview" });
	            new Chart(div, opts).render();
				container.append(div);
	            new Behavior(container, opts).apply();
	        });
		}
    }

    function handleMethod(args) {

        if(args.length > 1) {
            if (args[0] === "getDatas" && typeof(args[1]) === "function") {
                var datas = [];
                ganttOpts.data.forEach(function (value) {
                    var data = {};
                    jQuery.extend(data, value);
                    data.series = value.series.filter(function (v) {
                        return !v._empty;
                    });
                    datas.push(data);
                })
                args[1](datas);
            }
        }
    }

	var Chart = function(div, opts) {
		
		function render() {
			addVtHeader(div, opts.data, opts.cellHeight, opts.vtHeaderWidth);
            var slideDiv = jQuery("<div>", {
                "class": "ganttview-slide-container",
                // "css": { "width": ganttView.outerWidth() - opts.vtHeaderWidth - 3 + "px" }
            });
			
            var dates = getDates(opts.start, opts.end);
            addHzHeader(slideDiv, dates, opts.cellWidth,opts.showWeekends);
            addGrid(slideDiv, opts.data, dates, opts.cellWidth, opts.cellHeight, opts.showWeekends);
            addBlockContainers(slideDiv, opts.data, opts.cellHeight);
            addBlocks(slideDiv, opts.data, opts.cellWidth, opts.start, opts.cellHeight);
            div.append(slideDiv);
            applyLastClass(div.parent());
		}
		
		var monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

        function getDates(start, end) {
            var dates = [];
			dates[start.getFullYear()] = [];
			dates[start.getFullYear()][start.getMonth()] = [start];
			var last = start;
			while (last.getTime() < end.getTime()) {
				var next = DateUtils.addDays(new Date(last), 1);
				if (!dates[next.getFullYear()]) { dates[next.getFullYear()] = []; }
				if (!dates[next.getFullYear()][next.getMonth()]) { 
					dates[next.getFullYear()][next.getMonth()] = []; 
				}
				dates[next.getFullYear()][next.getMonth()].push(next);
				last = next;
			}
			return dates;
        }

        function addVtHeader(div, data, cellHeight, vtHeaderWidth) {
            var headerDiv = jQuery("<div>", {
                "class": "ganttview-vtheader",
                "css": {"width": vtHeaderWidth + "px"}
            });
            var headerTitleDiv = jQuery("<div>", {
                "class": "ganttview-vtheader-title",
                "css": {"width": vtHeaderWidth + "px", "height": cellHeight * 2 + 1+ "px"}
            });

            headerTitleDiv.append(jQuery("<div>", {
                "class": "ganttview-vtheader-title-name",
                "css": {"height": "100%", "line-height": cellHeight * 2 + 1 + "px", "width": "80px"}
            }).append("名称"));
            headerTitleDiv.append(jQuery("<div>", {
                "class": "ganttview-vtheader-title-name",
                "css": {"height": "100%", "line-height": cellHeight * 2 + 1 + "px", "width": "calc(100% - 81px)"}
            }).append("任务"));

            headerDiv.append(headerTitleDiv);
            for (var i = 0; i < data.length; i++) {
                if (!data[i].series || data[i].series.length === 0) { // 没有任务则加一条空的任务
                    data[i].series = [{id: null, name: '暂无任务', _empty: true}];
                }
                var itemDiv = jQuery("<div>", {
                    "class": "ganttview-vtheader-item",
                    "css": { "height": (data[i].series.length * cellHeight) + "px" }
                });
                itemDiv.append(jQuery("<div>", {
                    "class": "ganttview-vtheader-item-name",
                    "css": { "height": (data[i].series.length * cellHeight) + "px", "line-height": (data[i].series.length * cellHeight - 6) + "px" }
                }).append(data[i].name));
                var seriesDiv = jQuery("<div>", { "class": "ganttview-vtheader-series" });
                for (var j = 0; j < data[i].series.length; j++) {
                    seriesDiv.append(jQuery("<div>", {
                        "class": "ganttview-vtheader-series-name",
                        "css": { "height": cellHeight + "px", "line-height": cellHeight - 6 + "px" }
                    })
                        .append(data[i].series[j].name));
                }
                itemDiv.append(seriesDiv);
                headerDiv.append(itemDiv);

            }

            div.append(headerDiv);
        }

        function addHzHeader(div, dates, cellWidth,showWeekends) {
            var headerDiv = jQuery("<div>", { "class": "ganttview-hzheader" });
            var monthsDiv = jQuery("<div>", { "class": "ganttview-hzheader-months clearfix" });
            var daysDiv = jQuery("<div>", { "class": "ganttview-hzheader-days clearfix" });
            var totalW = 0;
			for (var y in dates) {
				for (var m in dates[y]) {
					var w = dates[y][m].length * cellWidth;
					totalW = totalW + w;
					monthsDiv.append(jQuery("<div>", {
						"class": "ganttview-hzheader-month",
						"css": { "width": (w - 1) + "px" }
					}).append(y + "年" + monthNames[m]));
					for (var d in dates[y][m]) {
                        var dayDiv = jQuery("<div>", {
                            "class": "ganttview-hzheader-day",
                            "css": {"width": (cellWidth - 1) + "px"}
                        });
                        dayDiv.append(dates[y][m][d].getDate());
                        if (DateUtils.isWeekend(dates[y][m][d]) && showWeekends) {
                            dayDiv.addClass("ganttview-weekend");
                        }
						daysDiv.append(dayDiv);
					}
				}
			}
            monthsDiv.css("width", totalW + "px");
            daysDiv.css("width", totalW + "px");
            headerDiv.append(monthsDiv).append(daysDiv);
            div.append(headerDiv);
        }

        function addGrid(div, data, dates, cellWidth, cellHeight, showWeekends) {
            var gridDiv = jQuery("<div>", { "class": "ganttview-grid" });
            var rowDiv = jQuery("<div>", { "class": "ganttview-grid-row clearfix" });
			for (var y in dates) {
				for (var m in dates[y]) {
					for (var d in dates[y][m]) {
						var cellDiv = jQuery("<div>", {
						    "class": "ganttview-grid-row-cell",
                            "css": {"width": (cellWidth - 1) + "px", "height": (cellHeight - 1) + "px"}
                        });
						if (DateUtils.isWeekend(dates[y][m][d]) && showWeekends) { 
							cellDiv.addClass("ganttview-weekend"); 
						}
						rowDiv.append(cellDiv);
					}
				}
			}
            var w = jQuery("div.ganttview-grid-row-cell", rowDiv).length * cellWidth;
            rowDiv.css("width", w + "px");
            gridDiv.css("width", w + "px");
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                	var cloneRowDiv = rowDiv.clone();
                    cloneRowDiv.droppable({
                        accept: '.task',
                        hoverClass: "gantt-drag-hover",
                        drop: function (e, ui) {
                            var task = ui.helper.data("task");
                        	var lineCount = gridDiv.children(".ganttview-grid-row").index(jQuery(this))+1;
                            var count = 0;
                            for(var i = 0; i < ganttOpts.data.length; i ++) {
                                for(var j = 0; j < ganttOpts.data[i].series.length; j ++) {
                                    count ++;
                                    if (count === lineCount) {
                                        console.log(task);
                                        task.start = new Date(task.start);
                                        task.end = new Date(task.end);
                                        ui.helper.remove();
                                        var series = ganttOpts.data[i].series.filter(function (value) {
                                            return !value._empty;
                                        } );
                                        series.push(task);
                                        ganttOpts.data[i].series = series;
                                        build(ganttOpts);
                                        break;
                                    }
                                }
                                if (count === lineCount) {
                                    break;
                                }
                            }
                        }
                    });
                    gridDiv.append(cloneRowDiv);
                }
            }
            div.append(gridDiv);
        }

        function addBlockContainers(div, data, cellHeight) {
            var blocksDiv = jQuery("<div>", { "class": "ganttview-blocks" });
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    blocksDiv.append(jQuery("<div>", {
                        "class": "ganttview-block-container",
                        "css": {"height": cellHeight - 8 + "px"}
                    }));
                }
            }
            div.append(blocksDiv);
        }

        function addBlocks(div, data, cellWidth, start, cellHeight) {
            var rows = jQuery("div.ganttview-blocks div.ganttview-block-container", div);
            var rowIdx = 0;
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    var series = data[i].series[j];
                    var size = 0;
                    if (!series._empty) {
                        size = DateUtils.daysBetween(series.start, series.end) + 1;

                        var offset = DateUtils.daysBetween(start, series.start);
                        var block = jQuery("<div>", {
                            "class": "ganttview-block",
                            "title": series.name + "： " + size + " 天",
                            "css": {
                                "width": ((size * cellWidth) - 8) + "px",
                                "height": cellHeight - 8 + "px",
                                "margin-left": ((offset * cellWidth) + 4) + "px"
                            }
                        });
                        addBlockData(block, data[i], series);
                        if (!!data[i].series[j].options && data[i].series[j].options.color) {
                            block.css("background-color", data[i].series[j].options.color);
                        }
                        block.append(jQuery("<div>", {
                            "class": "ganttview-block-text",
                            "css": {"height": cellHeight - 8 + "px", "line-height": cellHeight - 8 + "px"}
                        }).text(size + "天"));
                        jQuery(rows[rowIdx]).append(block);
                    }
                    rowIdx = rowIdx + 1;
                }
            }
        }
        
        function addBlockData(block, data, series) {
            var options = {draggable: true, resizable: true};
        	var blockData = { id: data.id, taskId: null, name: data.name};
        	if (!!series.options) {
                jQuery.extend(options, series.options);
            }
        	jQuery.extend(blockData, series);
            blockData.options = options;
        	block.data("block-data", blockData);
        }

        function applyLastClass(div) {
            jQuery("div.ganttview-grid-row div.ganttview-grid-row-cell:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-days div.ganttview-hzheader-day:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-months div.ganttview-hzheader-month:last-child", div).addClass("last");
        }
		
		return {
			render: render
		};
	}

	var Behavior = function (div, opts) {
		
		function apply() {
			
			if (opts.behavior.clickable) { 
            	bindBlockClick(div, opts.behavior.onClick); 
        	}
        	
            if (opts.behavior.resizable) { 
            	bindBlockResize(div, opts.cellWidth, opts.start, opts.behavior.onResize); 
        	}
            
            if (opts.behavior.draggable) { 
            	bindBlockDrag(div, opts.cellWidth, opts.start, opts.behavior.onDrag); 
        	}
		}

        function bindBlockClick(div, callback) {
            jQuery("div.ganttview-block", div).live("click", function () {
                if (callback) { callback(jQuery(this).data("block-data")); }
            });
        }
        
        function bindBlockResize(div, cellWidth, startDate, callback) {
            jQuery("div.ganttview-block", div).each(function () {
            if (jQuery(this).data("block-data").options.resizable) {
                jQuery(this).resizable({
                    // grid: cellWidth,
                    handles: "e",
                    stop: function () {
                        var block = jQuery(this);
                        var count = (block.outerWidth()+8)%cellWidth < cellWidth/2?Math.floor((block.outerWidth()+8)/cellWidth):Math.ceil((block.outerWidth()+8)/cellWidth);
                        block.width(count * cellWidth - 8);
                        updateDataAndPosition(div, block, cellWidth, startDate);
                        if (callback) { callback(block.data("block-data")); }
                    }
                });
            }});
        }
        
        function bindBlockDrag(div, cellWidth, startDate, callback) {
		    jQuery("div.ganttview-block", div).each(function () {
                // console.log(jQuery(this));
                if (jQuery(this).data("block-data").options.draggable) {
                    jQuery(this).draggable({
                        axis: "x",
                        stop: function () {
                            var block = jQuery(this);
                            var container = jQuery("div.ganttview-slide-container", div);
                            var scroll = container.scrollLeft();
                            var offset = block.offset().left - container.offset().left - 1 + scroll;
                            offset = offset >=0 ? offset : 0;
                            var left =((offset%cellWidth < cellWidth/2)?Math.floor(offset/cellWidth):Math.ceil(offset/cellWidth)) * cellWidth;
                            block.css('left', "");
                            block.css('margin-left', left + 4 +'px');

                            updateDataAndPosition(div, block, cellWidth, startDate);
                            if (callback) { callback(block.data("block-data")); }
                        }
                    });
                }
            });
        }
        
        function updateDataAndPosition(div, block, cellWidth, startDate) {
        	var container = jQuery("div.ganttview-slide-container", div);
        	var scroll = container.scrollLeft();
			var offset = block.offset().left - container.offset().left - 1 + scroll;
			
			// Set new start date
			var daysFromStart = Math.floor(offset / cellWidth);
			var newStart = DateUtils.addDays(new Date(startDate),daysFromStart);
			block.data("block-data").start = newStart;

			// Set new end date
        	var width = block.outerWidth();
			var numberOfDays = Math.floor(width / cellWidth);
			var newEnd = DateUtils.addDays(new Date(newStart),numberOfDays);
			block.data("block-data").end = newEnd;
			jQuery("div.ganttview-block-text", block).text(numberOfDays + 1 + "天");

			block.css("top", "").css("left", "")
				.css("position", "relative");
           updateGanttOptsDatas(block, newStart, newEnd);
        }

        function updateGanttOptsDatas(block, newStart, newEnd) {
            var blockIndex = ganttView.find(".ganttview-block").index(block);
            var count = 0;
            for(var i = 0; i < ganttOpts.data.length; i++) {
                for (var j = 0; j < ganttOpts.data[i].series.length; j++) {
                    if(ganttOpts.data[i].series[j]._empty) {
                        continue;
                    }
                    // count ++;
                    if (count === blockIndex) {
                        console.log(ganttOpts.data[i].series[j]);
                        ganttOpts.data[i].series[j].start = newStart;
                        ganttOpts.data[i].series[j].end = newEnd;
                        return;
                    }
                    count ++;
                }
            }
        }
        
        return {
        	apply: apply	
        };
	}

    // var ArrayUtils = {
    //     contains: function (arr, obj) {
    //         var has = false;
    //         for (var i = 0; i < arr.length; i++) { if (arr[i] == obj) { has = true; } }
    //         return has;
    //     }
    // };

    var DateUtils = {

        addDays: function(date, number)
    	{
			var adjustDate = new Date(date.getTime() + 24*60*60*1000*number);
			return adjustDate;
    	},
    	
        daysBetween: function (start, end) {
            if (!start || !end) { return 0; }
            if (new Date(start).getFullYear() === 1901 || new Date(end).getFullYear() === 8099) { return 0; }
            var count = 0, date = new Date(start);
            while (date.getTime() < new Date(end).getTime()) { count = count + 1; date = DateUtils.addDays(date,1);}
            return count;
        },
        
        isWeekend: function (date) {
            return date.getDay() % 6 == 0;
        },

		getBoundaryDatesFromData: function (data, minDays) {
			var minStart = DateUtils.addDays(new Date(), -15);
			var maxEnd = new Date();
			for (var i = 0; i < data.length; i++) {
				for (var j = 0; j < data[i].series.length; j++) {
					if (!data[i].series[j].start || !data[i].series[j].end){
						continue;
					}
                    // series.start = new Date()
					var start = new Date(data[i].series[j].start);
					var end = new Date(data[i].series[j].end);
					if (i == 0 && j == 0) { minStart = new Date(start); maxEnd = new Date(end); }
					if (minStart.getTime() > start.getTime()) { minStart = new Date(start); }
					if (maxEnd.getTime() < end.getTime()) { maxEnd = new Date(end); }
				}
			}
			if (DateUtils.daysBetween(minStart, maxEnd) < minDays) {
				maxEnd = DateUtils.addDays(minStart, minDays);
			}
			
			return [minStart, maxEnd];
		}
    };
})(jQuery);