class game{
    constructor ({
        dom,
        scoreNum
    }) {
        if (!dom || !scoreNum) {
            console.error('请传参dom和score');
            return;
        }
        this.grade = 1
        this.total = 0
        this.option = {
            size: [4, 4],
            name: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
        }
        this.chooseContainer = null
        this.container = {
            containerArr: [],
            names: []
        }
        createjs.Ticker.timingMode = createjs.Ticker.RAF
        this.dom = dom
        this.scoreNum = scoreNum
        this.canvas = document.createElement('canvas')
        this.boxWidth = Math.min(this.dom.offsetWidth, this.dom.offsetHeight)
        this.singleWidth = this.boxWidth / (Math.max(...this.option.size) + 2) // 左右空两行宽，边界连接时可画线
        this.canvas.width = this.boxWidth
        this.canvas.height = this.boxWidth
        this.dom.appendChild(this.canvas)
        // 舞台
        this.stage = new createjs.Stage(this.canvas)
        createjs.Ticker.on('tick', this.stage)
        this.lines = new createjs.Shape();
        this.stage.addChild(this.lines);
        this.createNames()
        this.createContent()
        this.events()
        // this.initLayout()
        // this.resize();
        // this.updateLoop();
        // this.update(this.data);
    }

    // 创建画块
    createContent () {
        for (let i = 0; i < this.option.size[0]; i+=1) {
            for (let j = 0; j < this.option.size[1]; j+=1) {
                // 容器
                let container = new createjs.Container();
                container.y = this.singleWidth + this.singleWidth * i
                container.x = this.singleWidth + this.singleWidth * j
                // container.mask = true
                container.cursor = 'pointer'
                // 方块
                let square = new createjs.Shape();
                square.name = 'square';
                square.graphics.clear().beginFill('rgba(0,0,0,0.1)').beginStroke('red').rect(0, 0, this.singleWidth, this.singleWidth);
                // 标题
                let title = new createjs.Text();
                title.x = this.singleWidth / 2
                title.y = this.singleWidth / 2
                title.name = 'title';
                title.textAlign = 'center';
                title.textBaseline = 'middle';
                title.font = `30px Arial`;
                // 随机方块名字
                let random = Math.floor(Math.random() * this.container.names.length)
                let text = this.container.names[random]
                this.container.names.splice(random, 1)
                container.name = title.text = text
                container.addChild(square, title);
                this.container.containerArr.push(container)
                this.stage.addChild(container);
            }
        }
    }

    // 生成随机名字
    createNames () {
        for (let i = 0; i < this.option.size[0] * this.option.size[1] / 2; i++) {
            let text = this.option.name[Math.floor(Math.random() * this.option.name.length)]
            this.container.names.push(text)
        }
        // 生成一对名称
        this.container.names = this.container.names.concat(this.container.names)
    }

    events () {
        let me = this
        this.stage.addEventListener('click', e => {
            // 判断点击的是否为同一个
            if (e.target.parent.checked) {
                e.target.parent.checked = false
                me.chooseContainer.children[0].graphics.clear().beginFill('rgba(0,0,0,0.1)').beginStroke('red').rect(0, 0, this.singleWidth, this.singleWidth);
                me.chooseContainer.children[1].color = '#000'
                me.chooseContainer = null
                return
            }
            // 如果有选中，对比2者是否一样
            if (me.chooseContainer) {
                me.chooseContainer.children[0].graphics.clear().beginFill('rgba(0,0,0,0.1)').beginStroke('red').rect(0, 0, this.singleWidth, this.singleWidth);
                me.chooseContainer.children[1].color = '#000'
                me.contrast(me.chooseContainer, e.target.parent)
                me.chooseContainer = null
            } else {
                me.checked(e.target.parent)
            }
            // console.log(e.target.parent.name, e.target.parent)
        })
    }

    // 选中状态标记
    checked (target) {
        let me = this
        // 取消选中
        if (me.chooseContainer) {
            me.chooseContainer.checked = false
            me.chooseContainer.children[0].graphics.clear().beginFill('rgba(0,0,0,0.1)').beginStroke('red').rect(0, 0, this.singleWidth, this.singleWidth);
            me.chooseContainer.children[1].color = '#000'
        }
        // 更改目标
        me.chooseContainer = target
        me.chooseContainer.checked = true
        me.chooseContainer.children[0].graphics.clear().beginFill('rgba(0,0,0,0.8)').beginStroke('red').rect(0, 0, this.singleWidth, this.singleWidth);
        me.chooseContainer.children[1].color = 'red'
    }

    // 对比点击的2个是否一样
    contrast (a, b) {
        let me = this
        if (a.name === b.name) {
            let clean = false
            // 无拐点
            clean = this.noBreakPoint(a, b)
            // 一个拐点
            if (!clean) {
                clean = this.oneBreakPoint(a, b)
            }
            // 两个拐点
            if (!clean) {
                clean = this.twoBreakPoint(a, b)
            }
            // 清空处理，需延时，否则判断某点是否存在物体时与画线矛盾
            if (clean) {
                setTimeout(() => {
                    this.lines.graphics.clear()
                    a.removeAllChildren()
                    b.removeAllChildren()
                    this.total += this.grade * 100
                    this.scoreNum.innerText = this.total
                    me.chooseContainer = null
                    me.ifRemoveAll()
                }, 500)
            }
        }
        this.chooseContainer.checked = false
    }
    // 无拐点，一条直线上
    noBreakPoint (a, b, noline = false) {
        let flag = false
        if (a.x === b.x) {
            flag = true
            let x = a.x
            let minY = Math.min(a.y, b.y),
                maxY = Math.max(a.y, b.y)
            for (let y = minY + this.singleWidth; y < maxY; y = y + this.singleWidth) {
                // x,y为左上角，应用中心点判断是否存在
                if (this.getObjectUnderPoint({x, y})) {
                    flag = false
                    return
                }
            }
        } else if (a.y === b.y) {
            flag = true
            let y = a.y
            let minX = Math.min(a.x, b.x),
                maxX = Math.max(a.x, b.x)
            for (let x = minX + this.singleWidth; x < maxX; x = x + this.singleWidth) {
                if (this.getObjectUnderPoint({x, y})) {
                    flag = false
                    return
                }
            }
        }
        if (!noline && flag) {
            this.drawLine([a, b])
        }
        return flag
    }
    // 有一个拐点
    oneBreakPoint (a, b, noline = false) {
        let me = this
        let flag = false
        // 一个拐点时，应为矩形的对角点
        let breakPoint1 = {
            x: a.x,
            y: b.y
        }, breakPoint2 = {
            x: b.x,
            y: a.y
        }
        let breakPoint = null
        // 首先判断拐点为空白
        if (!this.getObjectUnderPoint(breakPoint1)){
            flag = me.noBreakPoint(a, breakPoint1, true) && me.noBreakPoint(b, breakPoint1, true)
            if (flag) breakPoint = breakPoint1
        } else if (!this.getObjectUnderPoint(breakPoint2)) {
            flag = me.noBreakPoint(a, breakPoint2, true) && me.noBreakPoint(b, breakPoint2, true)
            if (flag) breakPoint = breakPoint2
        }
        if (!noline) {
            if (breakPoint) this.drawLine([a, breakPoint, b])
            return flag
        } else {
            return breakPoint
        }
    }
    // 2个拐点
    twoBreakPoint (a, b) {
        let flag = false
        let bp1 = {}, bp2 = {}
        // 找到a点的所有边界点
        // a点向左遍历
        for (let x = a.x - this.singleWidth; x >= 0; x -= this.singleWidth) {
            bp1 = {
                x,
                y: a.y
            }
            // 如果bp1不存在，退出循环
            if (this.getObjectUnderPoint(bp1)) {
                break
            } else {
                bp2 = this.oneBreakPoint(bp1, b, true)
                if (bp2) {
                    flag = true
                    this.drawLine([a, bp1, bp2, b])
                    break
                }
            }
        }
        // a点向右遍历
        if (!flag) {
            for (let x = a.x + this.singleWidth; x <= this.boxWidth - this.singleWidth; x += this.singleWidth) {
                bp1 = {
                    x,
                    y: a.y
                }
                // 如果bp1不存在，退出循环
                if (this.getObjectUnderPoint(bp1)) {
                    break
                } else {
                    bp2 = this.oneBreakPoint(bp1, b, true)
                    if (bp2) {
                        flag = true
                        this.drawLine([a, bp1, bp2, b])
                        break
                    }
                }
            }
        }
        // a点向上遍历
        if (!flag) {
            for (let y = a.y - this.singleWidth; y >= 0; y -= this.singleWidth) {
                bp1 = {
                    x: a.x,
                    y: y
                }
                // 如果bp1不存在，退出循环
                if (this.getObjectUnderPoint(bp1)) {
                    break
                } else {
                    bp2 = this.oneBreakPoint(bp1, b, true)
                    if (bp2) {
                        flag = true
                        this.drawLine([a, bp1, bp2, b])
                        break
                    }
                }
            }
        }
        // a点向下遍历
        if (!flag) {
            for (let y = a.y + this.singleWidth; y <= this.boxWidth - this.singleWidth; y += this.singleWidth) {
                bp1 = {
                    x: a.x,
                    y: y
                }
                // 如果bp1不存在，退出循环
                if (this.getObjectUnderPoint(bp1)) {
                    break
                } else {
                    bp2 = this.oneBreakPoint(bp1, b, true)
                    if (bp2) {
                        flag = true
                        this.drawLine([a, bp1, bp2, b])
                        break
                    }
                }
            }
        }
        return flag
    }
    // 判断以该点为左上定点的正方形的中心点是否存在
    getObjectUnderPoint (point) {
        return this.stage.getObjectUnderPoint(point.x + this.singleWidth / 2, point.y + this.singleWidth / 2)
    }

    // 画连接线
    drawLine (arr) {
        setTimeout(() => {
            arr.forEach((p, index) => {
                if (index === 0) {
                    this.lines.graphics.clear().setStrokeStyle(2).beginStroke("green").mt(p.x + this.singleWidth / 2, p.y + this.singleWidth / 2)
                } else {
                    this.lines.graphics.lt(p.x + this.singleWidth / 2, p.y + this.singleWidth / 2)
                }
            })
        }, 200)
    }

    // 是否全部清空
    ifRemoveAll () {
        let a = null, b = null
        this.container.containerArr.forEach((c, index)=> {
            if (c.children.length === 0) {
                if (a === null) {
                    a = index
                } else {
                    b = index
                }
            }
        })
        this.container.containerArr.splice(b, 1)
        this.container.containerArr.splice(a, 1)
        // 已清空
        if (this.container.containerArr.length === 0) {
            this.grade++
            this.restart()
        }
    }

    restart (reset) {
        this.chooseContainer = null
        this.container = {
            containerArr: [],
            names: []
        }
        if (reset) {
            this.grade = 1
            this.total = 0
            this.scoreNum.innerText = this.total
        }
        if (this.grade <= 5) {
            this.option.size = [(this.grade + 1) * 2, (this.grade + 1) * 2]
        } else {
            this.option.size = [10, 10]
        }        
        this.singleWidth = this.boxWidth / (Math.max(...this.option.size) + 2)
        this.stage.removeAllChildren()
        this.lines = new createjs.Shape();
        this.stage.addChild(this.lines);
        this.createNames()
        this.createContent()
    }
}
