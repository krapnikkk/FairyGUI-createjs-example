import * as fgui from 'fairygui-createjs'
import * as Stats from "stats.js";
import { LoadingView } from './LoadingView';
import { WindowA } from './WindowA';
import { WindowB } from './WindowB';
import { WindowWait } from './WindowWait';

class Main {
    stats: Stats;
    loader: fgui.AssetLoader;
    manifest: Array<{ [key: string]: string }> = [];
    canvas: HTMLCanvasElement;
    stage: createjs.Stage;
    contentlayer: fgui.GComponent;
    loadingView: LoadingView;
    constructor(canvas: HTMLCanvasElement, manifest) {
        this.canvas = canvas;
        this.manifest = manifest;
        this.stage = new createjs.Stage(canvas);
        this.init();
    }

    init() {
        this.initStats();
        this.createStage();
        this.createLoader();
    }

    createStage() {
        fgui.UIConfig.verticalScrollBar = "ui://test/ScrollBar_VT";
        fgui.UIConfig.horizontalScrollBar = "ui://test/ScrollBar_HZ";
        fgui.UIConfig.popupMenu = "ui://test/PopupMenu";
        fgui.UIConfig.globalModalWaiting = "ui://test/GlobalModalWaiting";
        fgui.UIConfig.windowModalWaiting = "ui://test/WindowModalWaiting";
        
        fgui.GRoot.inst.attachTo(this.stage, {
            designWidth: 1136,
            designHeight: 640,
            scaleMode: fgui.StageScaleMode.FIXED_WIDTH,
            orientation: fgui.StageOrientation.LANDSCAPE,
            alignV: fgui.StageAlign.TOP,
            alignH: fgui.StageAlign.LEFT
        });

        this.contentlayer = new fgui.GComponent();
        fgui.GRoot.inst.addChild(this.contentlayer);
        this.loadingView = new LoadingView();
        this.contentlayer.addChild(this.loadingView);
        this.loadingView.setSize(fgui.GRoot.inst.width, fgui.GRoot.inst.height);
        this.loadingView.addRelation(fgui.GRoot.inst, fgui.RelationType.Size);

        createjs.Ticker.framerate = 60;
        createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
        createjs.Ticker.on('tick', this.tick, this);
    }

    createLoader() {
        this.loader = new fgui.AssetLoader(false, "", "Anonymous");
        createjs.Sound.alternateExtensions = ["mp3"];
        this.loader.installPlugin(createjs.Sound);
        this.loader.loadManifest(this.manifest);
        this.loader.on("progress", this.loadProgress, this);
        this.loader.on("complete", this.resLoaded, this);
    }

    initStats() {
        this.stats = new Stats();
        this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(this.stats.dom);
    }

    loadProgress(e:Object): void {
        let p = (e as createjs.ProgressEvent).progress * 100;
        this.loadingView.setProgress(p);
        if (p >= 100) {
            this.loader.off("progress", this.loadProgress);
            this.loadingView.dispose();
            this.loadingView = null;
            this.contentlayer.dispose();
            fgui.GRoot.inst.removeChild(this.contentlayer);
        }
    }

    resLoaded() {
        this.loader.destroy();
        // fgui.UIPackage.addPackage("main");
        // let ins = fgui.UIPackage.createObject("main", "Main");
        fgui.UIPackage.addPackage("test");
        let ins = fgui.UIPackage.createObject("test", "main") as fgui.GComponent;
        ins.setSize(fgui.GRoot.inst.width, fgui.GRoot.inst.height);
        ins.addRelation(fgui.GRoot.inst, fgui.RelationType.Size);
        fgui.GRoot.inst.addChild(ins);
        this.initClicks(ins);
        this.animate();
    }

    animate() {
        this.stats.begin();
        this.stats.end();
        requestAnimationFrame(this.animate.bind(this));
    }

    tick(e: { [key: string]: any }) {
        if (e.paused !== 1) {
            this.stage.update();
        } else {
            console.log('pause!')
        }
    }


    private mainIns: fgui.GComponent;
    private container: fgui.GComponent;
    private currentDemo: fgui.GComponent;
    private progressDemoHandler: (deltaTime: number) => void;
    private textResizeHandler: (deltaTime: number) => void;

    private initClicks(ins: fgui.GComponent): void {
        this.mainIns = ins;
        ins.setSize(fgui.GRoot.inst.width, fgui.GRoot.inst.height);
        ins.addRelation(fgui.GRoot.inst, fgui.RelationType.Size);
        this.container = ins.getChild("container") as fgui.GComponent;

        for (let i = 0; i < ins.numChildren; i++) {
            let c = ins.getChildAt(i);
            let cname = c.name;
            if (fgui.StringUtil.startsWith(cname, "btn_")) {
                if (cname == "btn_back")
                    c.click(this.backToMenu, this);
                else
                    c.click(this.runDemo, this);
            }
        }
    }

    private runDemo(e: createjs.Event): void {
        let name = fgui.GObject.castFromNativeObject(e.currentTarget).name.replace("btn_", "");
        if (this.currentDemo) {
            if (this.currentDemo.name == name) {
                this.mainIns.getController("c1").selectedIndex = 1;
                return;
            }
            this.currentDemo.dispose();
            this.container.removeChild(this.currentDemo);
            this.currentDemo = null;
        }
        this.currentDemo = fgui.UIPackage.createObjectFromURL(`ui://test/${name}`) as fgui.GComponent;
        this.currentDemo.name = name;
        this.currentDemo.setSize(this.container.width, this.container.height);
        this.currentDemo.addRelation(this.container, fgui.RelationType.Size);
        this.container.addChild(this.currentDemo);
        this.initDemo(name, this.currentDemo);
        this.mainIns.getController("c1").selectedIndex = 1;
    }

    private initDemo(name: string, ins: fgui.GComponent): void {
        switch (name) {
            case "text":
                this.textResizeHandler = fgui.Binder.create(this.__playText, this, ins);
                fgui.GTimer.inst.add(0,0,this.textResizeHandler,this);
                break;
            case "window":
                this.playWindow(ins);
                break;
            case "popup":
                this.playPopup(ins);
                break;
            case "grid":
                this.playGrid(ins);
                break;
            case "drag_drop":
                this.playDragDrop(ins);
                break;
            case "progressbar":
                this.progressDemoHandler = fgui.Binder.create(this.__playProgress, this, ins);
                fgui.GTimer.inst.add(50,0,this.progressDemoHandler,this);
                break;
            case "depth":
                let testContainer = ins.getChild("n22") as fgui.GComponent;
                let fixedObj = testContainer.getChild("n0");
                fixedObj.sortingOrder = 100;
                fixedObj.draggable = true;
                let startPos: createjs.Point = new createjs.Point(fixedObj.x, fixedObj.y);
                ins.getChild("btn0").click((e) => {
                    this.__click1(e, ins, startPos);
                }, this);
                ins.getChild("btn1").click((e) => {
                    this.__click2(e, ins, startPos);
                }, this);
                break;
        }
    }

    private disposeDemo(): void {
        let ins = this.currentDemo;
        switch (ins.name) {
            case "progressbar":
                fgui.GTimer.inst.remove(this.progressDemoHandler, this);
                this.progressDemoHandler = null;
                break;
            case "text":
                fgui.GTimer.inst.remove(this.textResizeHandler, this);
                this.textResizeHandler = null;
                break;
        }
    }

    private backToMenu(e: createjs.Event): void {
        this.disposeDemo();
        this.mainIns.getController("c1").selectedIndex = 0;
    }

    //-----grid--------------------
    private playGrid(ins: fgui.GComponent): void {
        let list1: fgui.GList = ins.getChild("list1") as fgui.GList;
        list1.removeChildrenToPool();
        const testNames: string[] = ["iOS", "Android", "WinPhone", "PC", "Mac", "Unknown"];
        const testColors: string[] = ["#FFFF00", "#660033", "#FFFFFF", "#123456"];
        testNames.forEach((n, i) => {
            let item: fgui.GButton = list1.addItemFromPool() as fgui.GButton;
            item.getChild("t0").text = String(i + 1);
            item.getChild("t1").text = testNames[i];
            (item.getChild("t2") as fgui.GTextField).color = testColors[Math.floor(Math.random() * 4)];
            (item.getChild("star") as fgui.GProgressBar).value = (Math.floor(Math.random() * 3) + 1) / 3 * 100;
        });
        let list2: fgui.GList = ins.getChild("list2") as fgui.GList;
        list2.removeChildrenToPool();
        testNames.forEach((n, i) => {
            let item: fgui.GButton = list2.addItemFromPool() as fgui.GButton;
            let cb = item.getChild("cb") as fgui.GButton;
            cb.selected = false;
            (item.getChild("mc") as fgui.GMovieClip).playing = false;
            cb.on(fgui.StateChangeEvent.CHANGED, this.gridChkChanged, this);
            item.getChild("t1").text = testNames[i];
            item.getChild("t3").text = String(Math.floor(Math.random() * 10000));
        });
    }
    private gridChkChanged(target:fgui.GButton): void {
        (target.parent.getChild("mc") as fgui.GMovieClip).playing = target.selected;
    }

    //-----depth--------------------
    private __click1(e: createjs.Event, obj: fgui.GComponent, startPos: createjs.Point): void {
        let graph: fgui.GGraph = new fgui.GGraph();
        startPos.x += 10;
        startPos.y += 10;
        graph.setXY(startPos.x, startPos.y);
        graph.setSize(150, 150);
        graph.drawRect(1, "#000000", "#FF0000");
        (obj.getChild("n22") as fgui.GComponent).addChild(graph);
    }

    private __click2(e: createjs.Event, obj: fgui.GComponent, startPos: createjs.Point): void {
        let graph: fgui.GGraph = new fgui.GGraph();
        startPos.x += 10;
        startPos.y += 10;
        graph.setXY(startPos.x, startPos.y);
        graph.setSize(150, 150);
        graph.drawRect(1, "#000000", "#00FF00");
        graph.sortingOrder = 200;
        (obj.getChild("n22") as fgui.GComponent).addChild(graph);
    }

    //-----------progressbar-------------------------
    private __playProgress(delta: number, p: fgui.GComponent): void {
        let cnt: number = p.numChildren;
        for (let i: number = 0; i < cnt; i++) {
            let child: fgui.GProgressBar = p.getChildAt(i) as fgui.GProgressBar;
            if (child != null) {
                child.value += .1 * delta;
                if (child.value > child.max)
                    child.value = 0;
            }
        }
    }

    //-----------text-------------------------
    private textSizeWidth: number = 337;
    private textSizeDir: number = -1;
    private __playText(delta: number, p: fgui.GComponent): void {
        if (this.textSizeWidth < 80)
            this.textSizeDir = 1;
        else if (this.textSizeWidth > 337)
            this.textSizeDir = -1;
        this.textSizeWidth += this.textSizeDir;
        p.getChild("n24").width = p.getChild("n23").width = this.textSizeWidth;
        p.getChild("n22").removeClick(this.__getInputText);
        p.getChild("n22").click(this.__getInputText, this);
    }
    private __getInputText(e:createjs.Event):void {
        let p = fgui.GObject.castFromNativeObject(e.currentTarget).parent as fgui.GComponent;
        let text = p.getChild("inputbox").text
        p.getChild("resulttxt").text = text;
    }

    //------------drag&drop-----------------------------
    private ddi: fgui.DragIndicator;

    private playDragDrop(ins: fgui.GComponent): void {
        let btnA: fgui.GObject = ins.getChild("a");
        btnA.draggable = true;

        let btnB: fgui.GButton = ins.getChild("b") as fgui.GButton;
        btnB.draggable = true;
        btnB.on(fgui.DragEvent.START, this.__onDragStart, this);

        let btnC: fgui.GButton = ins.getChild("c") as fgui.GButton;
        btnC.icon = "";
        btnC.on(fgui.DragEvent.DROP, this.__onDrop, this);

        let btnD: fgui.GObject = ins.getChild("d");
        btnD.draggable = true;
        let bounds: fgui.GObject = ins.getChild("bounds");
        let rect: createjs.Rectangle = new createjs.Rectangle();
        bounds.localToGlobalRect(0, 0, bounds.width, bounds.height, rect);
        fgui.GRoot.inst.globalToLocalRect(rect.x, rect.y, rect.width, rect.height, rect);
        rect.x -= ins.parent.x;   //the panel is moving, so fix it with parent.x
        btnD.dragBounds = rect;
    }

    private __onDragStart(evt: createjs.Event): void {
        let btn = fgui.GObject.castFromNativeObject(evt.currentTarget);
        console.log(btn.x,btn.y);
        btn.stopDrag();
        if (!this.ddi) this.ddi = new fgui.DragIndicator();
        this.ddi.startDrag(btn, btn.icon, btn.icon, evt.data.pointerID);
    }

    private __onDrop(evt: any): void {
        let {sourceData,currentTarget}= evt.data;
        let btn: fgui.GButton = fgui.GObject.castFromNativeObject(currentTarget) as fgui.GButton;
        btn.icon = sourceData;
    }

    //-------window--------------------------------
    private _winA: fgui.Window;
    private _winB: fgui.Window;
    private _winW: fgui.Window;

    private playWindow(ins: fgui.GComponent): void {
        ins.getChild("n0").click(this.__clickWindowA, this);
        ins.getChild("n1").click(this.__clickWindowB, this);
        ins.getChild("n2").click(this.__clickWindowC, this);
        ins.getChild("n3").click(this.__clicRootWiat, this);
        ins.getChild("n4").click(this.__clickWindowWait, this);
    }

    private __clickWindowA(): void {
        if (this._winA == null)
            this._winA = new WindowA();
        this._winA.modal = false;
        this._winA.show();
    }

    private __clickWindowB(): void {
        if (this._winB == null)
            this._winB = new WindowB();
        this._winB.show();
    }

    private __clickWindowC(): void {
        if (this._winA == null)
            this._winA = new WindowA();
        this._winA.modal = true;
        this._winA.show();
    }

    private __clicRootWiat(): void {
        fgui.GRoot.inst.showModalWait("Please wait while loading...");
        setTimeout(() => {
            fgui.GRoot.inst.closeModalWait();
        }, 3000);
    }

    private __clickWindowWait(): void {
        if (this._winW == null)
            this._winW = new WindowWait();
        this._winW.show();
    }

    //-------popup: wait for the accomplishment of the event bubbling system-----------------------
    private _pm: fgui.PopupMenu;
    private _popupCom: fgui.GComponent;
    private playPopup(ins: fgui.GComponent): void {
        if (this._pm == null) {
            this._pm = new fgui.PopupMenu();
            this._pm.addItem("Item 1");
            this._pm.addItem("Item 2");
            this._pm.addItem("Item 3");
            this._pm.addItem("Item 4");

            if (this._popupCom == null) {
                this._popupCom = fgui.UIPackage.createObject("test", "PopTest1") as fgui.GComponent;
                this._popupCom.center();
            }
        }

        let btn: fgui.GObject = ins.getChild("n3");
        btn.click(this.__clickPopup1, this);

        let btn2: fgui.GObject = ins.getChild("n5");
        btn2.click(this.__clickPopup2, this);
    }

    private __clickPopup1(evt: createjs.Event): void {
        let btn: fgui.GObject = fgui.GObject.castFromNativeObject(evt.currentTarget);
        this._pm.show(btn, fgui.PopupDirection.Down);
    }

    private __clickPopup2(): void {
        fgui.GRoot.inst.showPopup(this._popupCom);
    }

}

let canvas = document.querySelector('#canvas') as HTMLCanvasElement;
let manifest = [
    { id: "test", src: 'ui/test.fui', type: "binary" },
    { id: 'test@atlas0', src: 'ui/test@atlas0.png', type: "image" },
    { id: 'test@atlas0_1', src: 'ui/test@atlas0_1.png', type: "image" }
];
new Main(canvas, manifest);










