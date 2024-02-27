import { Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Object3DUtil, AtmosphericComponent, HoverCameraController, DirectLight, SphereGeometry, CameraUtil, Vector3, BoxGeometry, Color, ViewPanel, WorldPanel, BitmapTexture2D, UIImage, makeAloneSprite, UITextField, TextAnchor, PointerEvent3D, BillboardType, GUICanvas, UIInteractive, TorusGeometry, UIShadow, GUISprite } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
export default class demo {
    view: View3D;
    canvas: GUICanvas;
    buttonIndex: number = 0;
    sprite_gray: GUISprite;
    sprite_orange: GUISprite;
    buttonBgGroup: UIImage[] = [];
    buttonIconGroup: UIImage[] = [];
    poiGroup: Object3D[] = [];
    boardGroup: Object3D[] = [];
    async run() {
        console.log("07.UI与交互");
        //init engine
        await Engine3D.init();

        //set shadow
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBound = 64;

        //create scene,add sky and fps
        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);
        scene.addComponent(Stats);

        //create camera and controller
        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, Engine3D.aspect, 1, 5000);
        let controller = camera.object3D.addComponent(HoverCameraController);
        controller.setCamera(0, -30, 50);

        //add DirectLight
        let lightObj = new Object3D();
        let light = lightObj.addComponent(DirectLight);
        light.intensity = 50;
        light.castShadow = true;
        lightObj.rotationX = 60;
        lightObj.rotationY = 60;
        scene.addChild(lightObj);

        //start render
        this.view = new View3D();
        this.view.scene = scene;
        this.view.camera = camera;
        Engine3D.startRenderView(this.view);

        //加载字体
        await Engine3D.res.loadFont("/font/deyihei.fnt");
        //获取canvas，后续将添加UI
        this.canvas = this.view.enableUICanvas();
        //创建基础场景
        await this.initScene();
        //创建2DUI
        await this.create2DButton();
        //创建3DUI
        await this.create3DUI();
    }
    private async initScene() {
        //添加地面
        {
            let floor = Object3DUtil.GetSingleCube(100, 1, 100, 0.4, 0.2, 0.1);
            floor.y = -0.5;
            this.view.scene.addChild(floor);
        }
        //创建共用材质
        let mat = new LitMaterial();
        mat.baseColor = new Color(0.3, 0.6, 0.8);
        mat.metallic = 0.2;
        mat.roughness = 0;
        //添加目标点1 box
        {
            let box = new Object3D();
            let mr = box.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(5, 5, 5);
            mr.material = mat;
            box.y = 2.5;
            box.x = box.z = -15;
            this.poiGroup.push(box);
            this.view.scene.addChild(box);
        }
        //添加目标点2 sphere
        {
            let sphere = new Object3D();
            let mr = sphere.addComponent(MeshRenderer);
            mr.geometry = new SphereGeometry(2.5, 20, 20);
            mr.material = mat;
            sphere.y = 2.5;
            sphere.x = 15;
            sphere.z = -15;
            this.poiGroup.push(sphere);
            this.view.scene.addChild(sphere);
        }
        //添加目标点3 Torus
        {
            let torus = new Object3D();
            let mr = torus.addComponent(MeshRenderer);
            mr.geometry = new TorusGeometry(5, 0.5);
            mr.material = mat;
            torus.y = 2;
            torus.x = -15;
            torus.z = 15;
            this.poiGroup.push(torus);
            this.view.scene.addChild(torus);
        }
        //添加目标点4 box
        {
            let box = new Object3D();
            let mr = box.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(5, 2, 3);
            mr.material = mat;
            box.y = 1;
            box.x = box.z = 15;
            this.poiGroup.push(box);
            this.view.scene.addChild(box);
        }
    }
    private async create2DButton() {
        //创建viewpanel viewpanel是2DUI的载体
        let panelRoot = new Object3D();
        panelRoot.addComponent(ViewPanel);
        this.canvas.addChild(panelRoot);

        //制作两个sprite,一个是灰色星星，一个是橙色星星，用于按钮上图标的切换
        let star_gray = new BitmapTexture2D();
        let star_orange = new BitmapTexture2D();
        await star_gray.load("/icon/star_gray.png");
        await star_orange.load("/icon/star_orange.png");
        this.sprite_gray = makeAloneSprite("sprite_gray", star_gray);
        this.sprite_orange = makeAloneSprite("sprite_orange", star_orange);

        //制作4个按钮
        for (let i = 0; i < 4; i++) {
            let buttonRoot = new Object3D();
            buttonRoot.data = i + 1;
            //添加UI交互组件 添加UI点击事件
            buttonRoot.addComponent(UIInteractive).interactive = true;
            buttonRoot.addEventListener(PointerEvent3D.PICK_CLICK_GUI, this.Click, this, buttonRoot.data);

            //添加背景图片，这里只是更改了一下颜色，设置每个按钮的大小与位置
            let bgImg = buttonRoot.addComponent(UIImage);
            this.buttonBgGroup.push(bgImg);
            bgImg.color = new Color(0.2, 0.2, 0.2, 0.9);
            bgImg.uiTransform.resize(180, 60);
            bgImg.uiTransform.setXY(-300 + 200 * i, 400);

            //添加icon作为背景的子物体，这里设置位置是相对于背景的位置
            let iconObj = new Object3D();
            buttonRoot.addChild(iconObj);
            let icon = iconObj.addComponent(UIImage);
            this.buttonIconGroup.push(icon);
            icon.uiTransform.resize(40, 40);
            icon.uiTransform.setXY(-65, 0);
            icon.sprite = this.sprite_gray;

            //添加text作为背景的子物体
            let textObj = new Object3D();
            buttonRoot.addChild(textObj);
            let text = textObj.addComponent(UITextField);
            text.fontSize = 42;
            text.text = "Object" + String(i + 1);
            text.font = "得意黑";
            text.color = new Color(1, 1, 1, 1);
            text.uiTransform.resize(180, 60);
            text.uiTransform.setXY(60, 0);
            text.alignment = TextAnchor.MiddleLeft;
            textObj.addComponent(UIShadow);

            //将button根节点添加到viewpanel中
            panelRoot.addChild(buttonRoot);
        }
    }
    private async create3DUI() {
        let texts = ["Hi,I'm Box!", "Hi,I'm Sphere!", "Hi,I'm Torus!", "Hi,I'm Box too!"];
        //创建4个3DUI面板，用于显示目标点的信息
        for (let i = 0; i < 4; i++) {
            //创建worldpanel,worldpanel是3DUI的载体
            let panelRoot = new Object3D();
            this.boardGroup.push(panelRoot);
            let pos = this.poiGroup[i].transform.localPosition;
            panelRoot.localPosition = new Vector3(pos.x, pos.y + 5, pos.z);
            panelRoot.localScale = new Vector3(0.05, 0.05, 0.05);
            let panel = panelRoot.addComponent(WorldPanel);
            panel.billboard = BillboardType.BillboardXYZ;
            panel.depthTest = false;
            this.canvas.addChild(panelRoot);

            //添加背景图片，修改颜色
            let BgObj = new Object3D();
            let Bg = BgObj.addComponent(UIImage);
            Bg.isShadowless = true;
            Bg.uiTransform.resize(160, 50);
            Bg.color = new Color(0.1, 0.4, 0.5, 0.9);

            //添加文字
            let text = BgObj.addComponent(UITextField);
            text.text = texts[i];
            text.font = "得意黑";
            text.fontSize = 30;
            text.color = new Color(1, 1, 1, 1);
            text.alignment = TextAnchor.MiddleCenter;
            BgObj.addComponent(UIShadow);
            panelRoot.addChild(BgObj);
            panelRoot.transform.enable = false;
        }
    }

    private Click(e: PointerEvent3D) {
        //按钮的逻辑是互斥按钮，点击一个按钮，其他按钮的图标变为灰色，点击的按钮图标变为橙色，并且背景颜色也有变化
        //如果点击已经选中的按钮，则已经按下的按钮会再次切换，变为未选中
        if (e.param == this.buttonIndex) {
            this.buttonIndex = 0;
            this.resetButton();
        } else {
            let clickedButton = this.buttonBgGroup[e.param - 1];
            let oldButton = this.buttonBgGroup[this.buttonIndex - 1];
            let clickedIcon = this.buttonIconGroup[e.param - 1];
            let oldIcon = this.buttonIconGroup[this.buttonIndex - 1];
            let board = this.boardGroup[e.param - 1];
            let oldBoard = this.boardGroup[this.buttonIndex - 1];
            //通过按钮的图标以及背景颜色的改变，来展示按钮的是否选中的状态
            clickedButton.color = new Color(0.1, 0.4, 0.5, 0.9);
            clickedIcon.sprite = this.sprite_orange;
            board.transform.enable = true;
            if (oldButton) {
                oldButton.color = new Color(0.2, 0.2, 0.2, 0.9);
                oldIcon.sprite = this.sprite_gray;
                oldBoard.transform.enable = false;
            }
            this.buttonIndex = e.param;
        }
    }
    //重置按钮后，每个按钮恢复默认的背景颜色，icon使用默认的灰色星星，场景中展示牌也隐藏
    /*This function sets the color of each button's background to its default color,
     sets the icon of each button to the default star icon, and hides the corresponding
     information board.*/
    private resetButton(): void {
        for (let i = 0; i < this.buttonBgGroup.length; i++) {
            this.buttonBgGroup[i].color = new Color(0.2, 0.2, 0.2, 0.9);
            this.buttonIconGroup[i].sprite = this.sprite_gray;
            this.boardGroup[i].transform.enable = false;
        }
    }
}
