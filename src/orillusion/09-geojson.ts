import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, BitmapTexture2DArray, BitmapTexture2D, PlaneGeometry, Vector3, Color, Vector2, MeshRenderer, LitMaterial, PointerEvent3D, GUICanvas, WorldPanel, FontInfo, UITextField, TextAnchor, UIInteractive, UIShadow, PointLight, KelvinUtil } from "@orillusion/core";
import { Shape3DMaker } from "@orillusion/graphic";
import { ExtrudeGeometry, Shape2D } from "@orillusion/geometry";
import { Stats } from "@orillusion/stats";
import * as d3 from "d3";

export default class demo {
    view: View3D;
    container: Object3D;
    controller: HoverCameraController;
    maker: Shape3DMaker;
    canvas: GUICanvas;
    font: FontInfo;
    //存放所有的板块shape，用于在鼠标移入移出时修改shape的颜色
    mrArr: MeshRenderer[][] = [];
    //定义板块默认的三种颜色
    shapeColor: Color[] = [Color.hexRGBColor(0x0465bd), Color.hexRGBColor(0x358bcb), Color.hexRGBColor(0x3a7abd)];
    //鼠标移入板块时的颜色
    hoverColor: Color = new Color(0.9, 0.7, 0.5);
    hoverMat: LitMaterial;
    //板块材质
    bodyMat: LitMaterial[] = [];
    shapeMat: LitMaterial[] = [];
    //经纬度转换为平面坐标(墨卡托投影)
    projection = d3.geoMercator().center([105, 32.5]).translate([0, 0]).scale(100);
    async run() {
        console.log("geojson生成中国板块");
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBound = 100;
        Engine3D.setting.shadow.shadowBias = 0.01;
        await Engine3D.init();

        //create scene,add sky and fps
        const scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);
        scene.addComponent(Stats);

        //create camera and controller
        const camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(70, Engine3D.aspect, 1, 2000);
        this.controller = camera.object3D.addComponent(HoverCameraController);
        this.controller.setCamera(0, -60, 70);
        this.controller.topClamp = -90;
        // this.controller.bottomClamp = -10;

        //add DirectLights
        const lightObj = new Object3D();
        const light = lightObj.addComponent(DirectLight);
        light.intensity = 0.5;
        light.castShadow = true;
        lightObj.rotationX = 40;
        lightObj.rotationY = 240;
        scene.addChild(lightObj);

        //add point light
        const pointLightObj = new Object3D();
        pointLightObj.y = 20;
        pointLightObj.z = -3;
        pointLightObj.x = 5;
        const pointLight = pointLightObj.addComponent(PointLight);
        pointLight.intensity = 0.2;
        pointLight.lightColor = KelvinUtil.color_temperature_to_rgb(1111);
        pointLight.range = 60;
        scene.addChild(pointLightObj);

        //start render
        this.view = new View3D();
        this.view.scene = scene;
        this.view.camera = camera;
        Engine3D.startRenderView(this.view);

        //加载资源
        await this.LoadRes();
        //创建地面
        await this.createFloor();
        //创建场景
        await this.initScene();
    }
    private async createFloor() {
        //添加地面
        {
            const floor = new Object3D();
            const mr = floor.addComponent(MeshRenderer);
            mr.geometry = new PlaneGeometry(300, 300, 1, 1);
            const mat = new LitMaterial();
            mat.baseColor = new Color(0.4, 0.4, 0.4, 1);
            mr.material = mat;
            this.view.scene.addChild(floor);
        }
    }
    private async LoadRes() {
        //get canvas,load font
        this.canvas = this.view.enableUICanvas();
        this.font = await Engine3D.res.loadFont("/font/alibabapuhuiti-light.fnt");
    }
    private async initScene() {
        //设置Shape3DMaker所需的纹理集合
        const texs = [];
        texs.push((await Engine3D.res.loadTexture("/texture/white.png")) as BitmapTexture2D);
        const bitmapTexture2DArray = new BitmapTexture2DArray(texs[0].width, texs[0].height, texs.length);
        bitmapTexture2DArray.setTextures(texs);

        //maxNodeCount和tirangleEachNode设置的多一些，否则显示不全
        this.maker = Shape3DMaker.makeRenderer("shape", bitmapTexture2DArray, this.view.scene, 1000, 1000);
        this.maker.renderer.material.doubleSide = true;

        //设置板块材质 分为两部分
        for (let index = 0; index < this.shapeColor.length; index++) {
            this.bodyMat[index] = new LitMaterial();
            this.bodyMat[index].baseColor = this.shapeColor[index];
            this.bodyMat[index].emissiveColor = this.shapeColor[index];
            this.bodyMat[index].emissiveIntensity = 1;
            this.shapeMat[index] = new LitMaterial();
            this.shapeMat[index].baseColor = this.shapeColor[index];
            this.shapeMat[index].emissiveColor = this.shapeColor[index];
            this.shapeMat[index].emissiveIntensity = 1;
        }

        //鼠标悬浮材质
        this.hoverMat = new LitMaterial();
        this.hoverMat.baseColor = this.hoverColor;
        this.hoverMat.emissiveColor = this.hoverColor;
        this.hoverMat.emissiveIntensity = 0.7;

        //加载geojson
        const mapJson = await Engine3D.res.loadJSON("/geojson/中华人民共和国.json");
        this.container = new Object3D();
        this.container.rotationX = -90;
        //features中的每个元素都是一个区域
        await mapJson["features"].forEach((feature, index) => {
            //每个feature中，properties代表本区域的基本信息，geomrtry.coordinates代表区域所有的点的坐标
            const coordinates = feature.geometry.coordinates;
            //随机高度，使各板块高度不一样(4~5)
            const height = Math.random() * 1 + 4;
            //初始化该板块的shape数组
            this.mrArr[index] = [];
            //遍历coordinates中的数组，生成板块
            coordinates.forEach((multiPolygon) => {
                multiPolygon.forEach((polygon) => {
                    this.createBody(polygon, height, index);
                    this.createShape(polygon, height);
                });
            });
            //根据位置生成省份名称，34不是省份板块(是十段线)，所以跳过
            if (index < 34) {
                const name = feature.properties.name; //名称
                const centerPos = this.projection(feature.properties.centroid); //位置
                this.createName(centerPos, name, index, height);
            }
            this.view.scene.addChild(this.container);
        });
    }
    //给每个省份添加文字
    private async createName(pos: [number, number], name: string, index: number, height: number) {
        //创建worldpanel面板，使得文字展示在场景中
        const panelRoot = new Object3D();
        panelRoot.addComponent(WorldPanel);
        this.canvas.addChild(panelRoot);
        panelRoot.localScale = new Vector3(0.03, 0.03, 0.03);
        panelRoot.rotationX = -90;

        //textObj添加三个组件，UITextField负责显示文字，UIInteractive使文字具有交互功能，UIShadow使文字有阴影
        const textObj = new Object3D();
        panelRoot.addChild(textObj);
        const text = textObj.addComponent(UITextField);
        textObj.addComponent(UIInteractive).interactive = true;
        textObj.addComponent(UIShadow);

        //每个文字的data都为index，用于判断点击的是哪个板块
        textObj.data = index;
        textObj.addEventListener(PointerEvent3D.PICK_OVER_GUI, this.over, this, textObj.data);
        textObj.addEventListener(PointerEvent3D.PICK_OUT_GUI, this.out, this, textObj.data);

        //设置文字
        text.font = this.font.face;
        text.text = name;
        text.alignment = TextAnchor.MiddleCenter;
        text.fontSize = 42;
        text.uiTransform.resize(100, 60);
        panelRoot.x = pos[0];
        panelRoot.z = pos[1];
        panelRoot.y = height + 0.1;
    }
    //给每个省份添加板块高度
    private async createBody(coor: [number, number][], height: number, index: number) {
        //shape是板块的形状
        const points: Vector2[] = [];

        coor.forEach((element) => {
            const arr = this.projection(element);
            points.push(new Vector2(arr[0], -arr[1]));
        });
        const shape = new Shape2D(points);
        //使用ExtrudeGeometry生成板块的高度部分
        const obj = new Object3D();
        const mr = obj.addComponent(MeshRenderer);
        mr.geometry = new ExtrudeGeometry([shape], {
            depth: height,
            bevelEnabled: false,
            step: 1,
        });
        mr.materials = [this.shapeMat[index % 3], this.bodyMat[index % 3]];
        this.mrArr[index].push(mr);
        this.container.addChild(obj);
    }
    //给每个省份板块添加边界线
    private async createShape(coor: any, height: number) {
        const points: Vector2[] = [];
        coor.forEach((element) => {
            const arr = this.projection(element);
            points.push(new Vector2(arr[0], arr[1]));
        });
        const line = this.maker.line(points);
        const lineObj = this.maker.renderer.getShapeObject3D(line);
        lineObj.y = height;
        line.lineWidth = 0.07;
        line.lineColor = new Color(1, 1, 1);
        line.fill = false;
        line.line = true;
        line.isClosed = true;
    }
    //鼠标移入省份名称上时,板块变颜色
    private over(e: PointerEvent3D) {
        this.mrArr[e.param].forEach((element) => {
            element.materials = [this.hoverMat, this.bodyMat[e.param % 3]];
        });
    }
    //鼠标移出省份名称时，板块变为原来的颜色
    private out(e: PointerEvent3D) {
        this.mrArr[e.param].forEach((element) => {
            element.materials = [this.shapeMat[e.param % 3], this.bodyMat[e.param % 3]];
        });
    }
}
new demo().run();
