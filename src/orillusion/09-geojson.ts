import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, BitmapTexture2DArray, BitmapTexture2D, PlaneGeometry, Vector3, BlendMode, Color, Vector2, ExtrudeGeometry, MeshRenderer, LitMaterial, PointerEvent3D, GUICanvas, WorldPanel, FontInfo, UITextField, TextAnchor, UIInteractive, UIShadow, Vector4 } from "@orillusion/core";
import { LineShape3D, Shape3DMaker } from "@orillusion/graphic";
import { Stats } from "@orillusion/stats";
import * as d3 from "d3";

export default class demo {
    view: View3D;
    controller: HoverCameraController;
    maker: Shape3DMaker;
    canvas: GUICanvas;
    font: FontInfo;
    //存放所有的板块shape，用于在鼠标移入移出时修改shape的颜色
    shapeArr: LineShape3D[][] = [];
    //定义板块默认的三种颜色
    shapeColor: Color[] = [Color.hexRGBColor(0x0465bd), Color.hexRGBColor(0x357bcb), Color.hexRGBColor(0x3a7abd)];
    //鼠标移入板块时的颜色
    hoverColor: Color = new Color(0.9, 0.7, 0.5);
    //板块高度渐变贴图
    bodyTex: BitmapTexture2D;
    //板块高度材质
    bodyMat: LitMaterial[] = [];
    //经纬度转换为平面坐标(墨卡托投影)
    projection = d3.geoMercator().center([104, 37.5]).translate([0, 0]).scale(80);
    async run() {
        console.log("08.geojson生成中国板块");
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBound = 100;
        await Engine3D.init();

        //create scene,add sky and fps
        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);
        scene.addComponent(Stats);

        //create camera and controller
        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, Engine3D.aspect, 1, 5000);
        this.controller = camera.object3D.addComponent(HoverCameraController);
        this.controller.setCamera(3, -60, 55, new Vector3(4.2, 0, 10.4));

        //add DirectLight
        let lightObj = new Object3D();
        let light = lightObj.addComponent(DirectLight);
        light.intensity = 20;
        light.castShadow = true;
        lightObj.rotationX = 35;
        lightObj.rotationY = 35;
        scene.addChild(lightObj);

        //start render
        this.view = new View3D();
        this.view.scene = scene;
        this.view.camera = camera;
        Engine3D.startRenderView(this.view);

        //get canvas,load font,load texture
        this.canvas = this.view.enableUICanvas();
        this.font = await Engine3D.res.loadFont("/font/alibabapuhuiti-light.fnt");
        this.bodyTex = new BitmapTexture2D();
        this.bodyTex.flipY = true;
        await this.bodyTex.load("/texture/gradient_whiteblack.png");

        //创建场景
        await this.initScene();
    }
    private async initScene() {
        //添加网格地面
        {
            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new PlaneGeometry(300, 300, 1, 1);
            let mat = new LitMaterial();
            let tex = await Engine3D.res.loadTexture("/texture/cell.png");
            mat.baseColor = new Color(0.2, 0.3, 1);
            mat.blendMode = BlendMode.ALPHA;
            mat.baseMap = tex;
            mat.setUniformVector4("transformUV1", new Vector4(0, 0, 10, 10));
            mr.material = mat;
            this.view.scene.addChild(floor);
        }

        //设置Shape3DMaker所需的纹理集合
        let texs = [];
        texs.push((await Engine3D.res.loadTexture("/texture/white.png")) as BitmapTexture2D);
        let bitmapTexture2DArray = new BitmapTexture2DArray(texs[0].width, texs[0].height, texs.length);
        bitmapTexture2DArray.setTextures(texs);

        //maxNodeCount和tirangleEachNode设置的多一些，否则显示不全
        this.maker = Shape3DMaker.makeRenderer("shape", bitmapTexture2DArray, this.view.scene, 1000, 1000);
        this.maker.renderer.material.doubleSide = true;

        //设置板块高度部分的材质
        for (let index = 0; index < this.shapeColor.length; index++) {
            this.bodyMat[index] = new LitMaterial();
            this.bodyMat[index].baseColor = this.shapeColor[index];
            this.bodyMat[index].emissiveColor = this.shapeColor[index];
            this.bodyMat[index].baseMap = this.bodyTex;
            this.bodyMat[index].emissiveMap = this.bodyTex;
            this.bodyMat[index].emissiveIntensity = 1;
            this.bodyMat[index].doubleSide = true;
        }

        //加载geojson
        let mapJson = await Engine3D.res.loadJSON("/geojson/中华人民共和国.json");

        //features中的每个元素都是一个区域
        await mapJson["features"].forEach((feature, index) => {
            //每个feature中，properties代表本区域的基本信息，geomrtry.coordinates代表区域所有的点的坐标
            let coordinates = feature.geometry.coordinates;
            //随机高度，使各板块高度不一样
            const height = Math.random() * 0.3 + 4;
            //初始化该板块的shape数组
            this.shapeArr[index] = [];
            //遍历coordinates中的数组，生成板块
            coordinates.forEach((multiPolygon) => {
                multiPolygon.forEach((polygon) => {
                    this.createBody(polygon, height, index);
                    this.createShape(polygon, height, index);
                });
            });
            //根据位置生成省份名称，34不是省份板块(是十段线)，所以跳过
            if (index < 34) {
                let name = feature.properties.name; //名称
                let centerPos = this.projection(feature.properties.centroid); //位置
                this.createName(centerPos, name, index);
            }
        });
    }
    //给每个省份添加文字
    private async createName(pos: [number, number], name: string, index: number) {
        //创建worldpanel面板，使得文字展示在场景中
        let panelRoot = new Object3D();
        panelRoot.addComponent(WorldPanel);
        this.canvas.addChild(panelRoot);
        panelRoot.localScale = new Vector3(0.03, 0.03, 0.03);
        panelRoot.rotationX = -90;

        //textObj添加三个组件，UITextField负责显示文字，UIInteractive使文字具有交互功能，UIShadow使文字有阴影
        let textObj = new Object3D();
        panelRoot.addChild(textObj);
        let text = textObj.addComponent(UITextField);
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
        panelRoot.y = 4.31;
    }
    //给每个省份添加板块高度
    private async createBody(coor: [number, number][], height: number, index: number) {
        //shape是板块的形状，path是板块挤出的路径
        let shape: Vector3[] = [];
        let path: Vector3[] = [];
        coor.forEach((element) => {
            let arr = this.projection(element);
            shape.push(new Vector3(arr[0], 0, arr[1]));
        });
        path.push(new Vector3(0, 0, 0));
        path.push(new Vector3(0, height, 0));

        //使用ExtrudeGeometry生成板块的高度部分
        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        let geo = new ExtrudeGeometry().build(shape, true, path, 0.23);
        mr.geometry = geo;
        mr.material = this.bodyMat[index % 3];
        this.view.scene.addChild(obj);
    }
    //给每个省份板块添加上面的面以及边界线
    private async createShape(coor: any, height: number, index: number) {
        let points: Vector2[] = [];
        coor.forEach((element) => {
            let arr = this.projection(element);
            points.push(new Vector2(arr[0], arr[1]));
        });
        let line = this.maker.line(points);
        this.shapeArr[index].push(line);
        let lineObj = this.maker.renderer.getShapeObject3D(line);
        lineObj.y = height;
        line.lineWidth = 0.07;
        line.fillColor = this.shapeColor[index % 3];
        line.lineColor = new Color(1, 1, 1);
        line.fill = true;
        line.line = true;
        line.isClosed = true;
    }
    //鼠标移入省份名称上时,板块变颜色
    private over(e: PointerEvent3D) {
        this.shapeArr[e.param].forEach((element) => {
            element.fillColor = this.hoverColor;
        });
    }
    //鼠标移出省份名称时，板块变为原来的颜色
    private out(e: PointerEvent3D) {
        this.shapeArr[e.param].forEach((element) => {
            element.fillColor = this.shapeColor[e.param % 3];
        });
    }
}
new demo().run();