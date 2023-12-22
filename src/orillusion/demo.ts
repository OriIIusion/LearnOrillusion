import { BoxGeometry, Camera3D, ComponentBase, Engine3D, HoverCameraController, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Color, KelvinUtil, Object3DUtil, SolidColorSky, SkyRenderer, PointLight, KeyEvent, KeyCode, PointerEvent3D, Vector3, BoundingBox, ColliderComponent, MeshColliderShape, ColliderShape, BoxColliderShape, BlendMode, Plane, TriGeometry, MatrixGPUBuffer, MatrixBindGroup } from "@orillusion/core";
import { Stats } from '@orillusion/stats';

export default class demo {
    view: View3D;
    light: PointLight;
    camera:Camera3D;
    floor:Object3D;
    async run() {
        console.log("------")
        //设置阴影 初始化引擎 
        
        Engine3D.setting.shadow.pointShadowSize = 2048;
        Engine3D.setting.shadow.shadowBound = 100;
        Engine3D.setting.shadow.pointShadowBias = 0.0001
        Engine3D.setting.shadow.type = "HARD"
        Engine3D.setting.pick.enable = true
        Engine3D.setting.pick.mode = "pixel"
        
        await Engine3D.init({
            
        });
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_MOVE,this.onMove,this)
        //新建一个场景 添加天空盒 设置太阳高度 添加FPS显示
        let scene = new Scene3D();
        let colorSky = new SolidColorSky(new Color(0, 0, 0, 1));
        let sky = scene.addComponent(SkyRenderer);
        sky.map = colorSky;
        scene.envMap = colorSky;
        scene.addComponent(Stats);
        
        //新建相机
        let cameraObj = new Object3D();
        this.camera = cameraObj.addComponent(Camera3D);
        //设置相机参数
        this.camera.perspective(60, window.innerWidth / window.innerHeight, 1, 5000);
        this.camera.lookAt(new Vector3(0,0,30),new Vector3())
        scene.addChild(cameraObj);

        
        //添加平行光
        let lightObj = new Object3D();
        this.light = lightObj.addComponent(PointLight);
        this.light.intensity = 10;
        this.light.range = 20;
        lightObj.z = 5;
        this.light.radius = 2;
        //灯光颜色 开启阴影
        this.light.lightColor = KelvinUtil.color_temperature_to_rgb(2323);
        this.light.castShadow = true
        //灯光添加到场景中
        scene.addChild(lightObj);

        //快速添加一个地面
        
        this.floor = Object3DUtil.GetSingleCube(100, 1, 100, 1, 1, 1);
        this.floor.rotationX = 90;
        this.floor.z = -3;
        //this.floor.addComponent(ColliderComponent)
        //this.floor.addEventListener(PointerEvent3D.PICK_MOVE,this.onMove,this)
        scene.addChild(this.floor)
        
        
        //创建View3D对象
        this.view = new View3D();
        //指定渲染的场景和相机
        this.view.scene = scene;
        this.view.camera = this.camera;
        //开始渲染
        Engine3D.startRenderView(this.view);
        
        //初始化场景 添加dat.gui
        //await this.createBox();
       
    }
    onMove(e:PointerEvent3D) {
        //console.log(e);
        
        //console.log('onMove:',e.mouseX,e.mouseY,e.mouseCode);
        //console.log(e.data.pickInfo.worldPos.x);
        //console.log(e.data.pickInfo.worldPos.y);
        //this.light.transform.x = e.data.pickInfo.worldPos.x
        //this.light.transform.y = e.data.pickInfo.worldPos.y
        let ray = this.camera.screenPointToRay(e.mouseX,e.mouseY);
        //console.log(ray.origin);
        
        //console.log(ray.direction);
        console.log(ray.getPoint(30).x);
        console.log(ray.getPoint(30).y);
        console.log("--------------");
        
        this.light.transform.x = ray.getPoint(30).x
        this.light.transform.y = ray.getPoint(30).y
        
        
    }
    async createBox() {
        //新建一个Box并添加网格渲染组件
        let boxObj = new Object3D();
        let mr = boxObj.addComponent(MeshRenderer);
        //设置网格渲染组件的几何形状和材质
        let mat = new LitMaterial();
        mr.geometry = new BoxGeometry(2, 2, 2);
        mr.material = mat;
        
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                let obj = boxObj.clone();
                obj.addComponent(RotateScript)
                obj.x = i*4-20;
                obj.y = j*4-20;
                this.view.scene.addChild(obj)
            }
            
        }
    }
}
//自旋转组件
class RotateScript extends ComponentBase {
    onUpdate() {
        this.object3D.rotationY += 1;
        this.object3D.rotationX += 1;
        this.object3D.rotationZ += 1;
    }
}