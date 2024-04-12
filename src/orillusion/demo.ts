import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, BitmapTexture2DArray, BitmapTexture2D, PlaneGeometry, Vector3, BlendMode, Color, Vector2, ExtrudeGeometry, MeshRenderer, LitMaterial, PointerEvent3D, GUICanvas, WorldPanel, FontInfo, UITextField, TextAnchor, UIInteractive, UIShadow, Vector4 } from "@orillusion/core";
import { Shape3DMaker } from "@orillusion/graphic";
import { Stats } from "@orillusion/stats";
import * as d3 from "d3";

export default class demo {
    view: View3D;
    maker: Shape3DMaker;
    canvas: GUICanvas;
    font: FontInfo;
    //存放所有的板块shape
    shapeArr: any[] = [];
    //定义板块的三种颜色
    shapeColor: Color[] = [Color.hexRGBColor(0x0465bd), Color.hexRGBColor(0x357bcb), Color.hexRGBColor(0x3a7abd)];
    //板块选中时的颜色
    hoverColor: Color = new Color(0.9, 0.7, 0.5);
    //经纬度转换为3D坐标(墨卡托投影)
    projection = d3.geoMercator().center([104, 37.5]).translate([0, 0]).scale(80);
    async run() {
        Engine3D.setting.shadow.shadowSize = 2048;
        await Engine3D.init();

        //create scene,add sky and fps
        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);
        scene.addComponent(Stats);

        //create camera and controller
        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, Engine3D.aspect, 1, 5000);
        camera.enableCSM = true;
        let controller = camera.object3D.addComponent(HoverCameraController);
        controller.setCamera(0, -30, 50);

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

        this.canvas = this.view.enableUICanvas();
        this.font = await Engine3D.res.loadFont("font/alibabapuhuiti-light.fnt");

        //创建场景
        await this.initScene();
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
    private async initScene() {
        //添加网格地面
        {
            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new PlaneGeometry(300, 300, 1, 1);
            let mat = new LitMaterial();
            let tex = await Engine3D.res.loadTexture("texture/cell.png");
            mat.baseColor = new Color(0.2, 0.3, 1);
            mat.blendMode = BlendMode.ALPHA;
            mat.baseMap = tex;
            mat.setUniformVector4("transformUV1", new Vector4(0, 0, 10, 10));
            mr.material = mat;
            this.view.scene.addChild(floor);
        }
        //设置Shape3DMaker
        let texs = [];
        texs.push((await Engine3D.res.loadTexture("texture/white.png")) as BitmapTexture2D);
        let bitmapTexture2DArray = new BitmapTexture2DArray(texs[0].width, texs[0].height, texs.length);
        bitmapTexture2DArray.setTextures(texs);
        //maxNodeCount和tirangleEachNode设置的多一些，否则显示不全
        this.maker = Shape3DMaker.makeRenderer("shape", bitmapTexture2DArray, this.view.scene, 1000, 1000);
        this.maker.renderer.material.doubleSide = true;
        //加载geojson，生成模型
        let mapJson = await Engine3D.res.loadJSON("/geojson/中华人民共和国.json");
        await mapJson["features"].forEach((element, index) => {
            let coordinates = element.geometry.coordinates;
            let height = Math.random() * 0.3 + 4;
            const color = this.shapeColor[index % 3];
            this.shapeArr[index] = [];
            coordinates.forEach((multiPolygon) => {
                multiPolygon.forEach((polygon) => {
                    this.createBody(polygon, color, height);
                    this.createShape(polygon, color, height, index);
                });
            });
            //根据位置生成省份名称，34是十段线，不生成名称
            if (index < 34) {
                let name = element.properties.name;
                let centerPos = this.projection(element.properties.centroid);
                this.createName(centerPos, name, index);
            }
        });
    }
    private async createName(pos: [number, number], name: string, index: number) {
        let panelRoot = new Object3D();
        panelRoot.addComponent(WorldPanel);
        this.canvas.addChild(panelRoot);
        panelRoot.localScale = new Vector3(0.03, 0.03, 0.03);
        panelRoot.rotationX = -90;

        let textObj = new Object3D();
        textObj.data = index;
        panelRoot.addChild(textObj);
        let text = textObj.addComponent(UITextField);
        textObj.addComponent(UIInteractive).interactive = true;
        textObj.addComponent(UIShadow);
        textObj.addEventListener(PointerEvent3D.PICK_OVER_GUI, this.over, this, textObj.data);
        textObj.addEventListener(PointerEvent3D.PICK_OUT_GUI, this.out, this, textObj.data);
        text.font = this.font.face;
        text.text = name;
        text.alignment = TextAnchor.MiddleCenter;
        text.fontSize = 42;
        text.uiTransform.resize(100, 60);
        panelRoot.x = pos[0];
        panelRoot.z = pos[1];
        panelRoot.y = 4.3;
    }
    private async createBody(coor: [], color: Color, height: number) {
        let shape: Vector3[] = [];
        let path: Vector3[] = [];
        coor.forEach((element) => {
            let arr = this.projection(element);
            shape.push(new Vector3(arr[0], 0, arr[1]));
        });
        path.push(new Vector3(0, 0, 0));
        path.push(new Vector3(0, height, 0));

        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        let geo = new ExtrudeGeometry().build(shape, true, path, 0.23);
        mr.geometry = geo;
        let tex = new BitmapTexture2D();
        tex.flipY = true;
        await tex.load("texture/gradient_whiteblack.png");
        let mat = new LitMaterial();
        mat.baseColor = color;
        mat.emissiveColor = color;
        mat.baseMap = tex;
        mat.emissiveMap = tex;
        mat.emissiveIntensity = 1;
        mat.doubleSide = true;
        mr.material = mat;
        this.view.scene.addChild(obj);
    }
    private async createShape(coor: any, color: Color, height: number, index: number) {
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
        line.fillColor = color;
        line.lineColor = new Color(1, 1, 1);
        line.fill = true;
        line.line = true;
        line.isClosed = true;
    }
}
