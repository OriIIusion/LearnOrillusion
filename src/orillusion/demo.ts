import { Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Object3DUtil, AtmosphericComponent, HoverCameraController, DirectLight, SphereGeometry, KelvinUtil, CameraUtil, PlaneGeometry, Vector3, KeyEvent, BoxGeometry, UnLitMaterial, BlendMode, Vector4, DEGREES_TO_RADIANS, Color, MinMaxCurve, ViewPanel, WorldPanel, GPUCullMode, BitmapTexture2D, UIImage, makeAloneSprite, UITextField, TextAnchor, UIButton, PointerEvent3D, BillboardType } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
export default class demo {
    ball: Object3D;
    view: View3D;
    async run() {
        await Engine3D.init();

        //set shadow
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowSize = 2048;
        //Engine3D.setting.shadow.shadowBound = 64;

        //create scene,add sky and FPS
        let scene = new Scene3D();
        let sky = scene.addComponent(AtmosphericComponent);
        //sky.roughness = 0.8;
        scene.addComponent(Stats);

        //create camera
        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, Engine3D.aspect, 1, 5000);
        camera.enableCSM = true;
        let controller = camera.object3D.addComponent(HoverCameraController);
        controller.setCamera(0, -30, 50);

        //add DirectLight
        let lightObj = new Object3D();
        let light = lightObj.addComponent(DirectLight);
        light.intensity = 50;
        light.castShadow = true;
        lightObj.rotationX = 60;
        lightObj.rotationY = 140;
        //sky.relativeTransform = light.transform;
        scene.addChild(lightObj);

        //add a floor
        {
            let floor = Object3DUtil.GetSingleCube(50, 1, 50, 0.3, 0.3, 0.3);
            floor.y = -2;
            scene.addChild(floor);
        }

        this.ball = new Object3D();
        this.ball.y = 1;
        let mr = this.ball.addComponent(MeshRenderer);
        mr.geometry = new SphereGeometry(1, 20, 20);
        let mat = new LitMaterial();
        mat.baseColor = KelvinUtil.color_temperature_to_rgb(1325);
        mr.material = mat;
        scene.addChild(this.ball);

        //start render
        this.view = new View3D();
        this.view.scene = scene;
        this.view.camera = camera;
        Engine3D.startRenderView(this.view);

        //this.createText();
    }
    private async createText() {
        let canvas = this.view.enableUICanvas();

        let viewPanel = new Object3D();
        viewPanel.addComponent(ViewPanel);
        canvas.addChild(viewPanel);

        let worldPanel = new Object3D();
        let panel = worldPanel.addComponent(WorldPanel);
        panel.cullMode = GPUCullMode.none;
        worldPanel.localScale = new Vector3(0.05, 0.05, 0.05);
        worldPanel.rotationX = -45;
        canvas.addChild(worldPanel);

        await Engine3D.res.loadFont("/dot_pixel.fnt");
        await Engine3D.res.loadFont("/youshebiaotihei.fnt");
        await Engine3D.res.loadFont("/youshebiaotiyuan.fnt");
        await Engine3D.res.loadFont("https://cdn.orillusion.com/fnt/0.fnt");
        {
            let imgQuad = new Object3D();
            let img = imgQuad.addComponent(UIImage);
            img.color = new Color(1, 1, 1, 0.5);
            img.uiTransform.resize(580, 60);
            let text = imgQuad.addComponent(UITextField);
            text.fontSize = 42;
            text.text = "优设标题黑-Orillusion-123456789";
            text.font = "优设标题黑";

            text.color = new Color(1, 0.5, 0.5, 1);
            text.uiTransform.setXY(0, 0);
            text.alignment = TextAnchor.MiddleCenter;
            viewPanel.addChild(imgQuad);
        }
        {
            let imgQuad = new Object3D();
            let img = imgQuad.addComponent(UIImage);
            img.color = new Color(1, 1, 1, 0.5);
            img.uiTransform.resize(580, 60);
            let text = imgQuad.addComponent(UITextField);
            text.fontSize = 42;
            text.text = "优设标题圆-Orillusion-123456789";
            text.font = "YouSheBiaoTiYuan";

            text.uiTransform.setXY(0, -100);
            text.color = new Color(0, 0.6, 0.5, 1);
            text.alignment = TextAnchor.MiddleCenter;
            viewPanel.addChild(imgQuad);
        }
        {
            let imgQuad = new Object3D();
            let img = imgQuad.addComponent(UIImage);
            img.color = new Color(1, 1, 1, 0.5);
            img.uiTransform.resize(580, 60);
            let text = imgQuad.addComponent(UITextField);
            text.fontSize = 42;
            text.text = "像素字-Orillusion-123456789";
            text.font = "DottedSongtiSquare";
            text.uiTransform.setXY(0, -200);

            text.color = new Color(0.5, 0.5, 1, 1);
            text.alignment = TextAnchor.MiddleCenter;
            viewPanel.addChild(imgQuad);
        }
    }
}
