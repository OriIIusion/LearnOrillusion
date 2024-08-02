import  dat  from 'dat.gui';
import { BoxGeometry, Camera3D, Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Color, Object3DUtil, Vector3, AtmosphericComponent, HoverCameraController, ColliderComponent, BoxColliderShape, KeyEvent, SphereColliderShape, DirectLight, SphereGeometry, ComponentBase, KeyCode, KelvinUtil } from '@orillusion/core';
import { Stats } from '@orillusion/stats';
import { Physics, Rigidbody } from "@orillusion/physics";

export default class demo {
    aim: Object3D;
    view: View3D;
    async run() {
        console.log("04.小球打盒子");
        //物理系统初始化 
        await Physics.init();
        await Engine3D.init({
            //在主循环中调用Physics.update()使物理世界一直生效
            renderLoop: () => {
                if (Physics.isInited) {
                    Physics.update();
                }
            }
        });
        //每一帧都更新阴影，可避免运动中的物体出现阴影闪烁。
        //默认值为2，如果场景中有运动的物体，一定要记得将此值改为1
        Engine3D.setting.shadow.updateFrameRate = 1;

        //添加键盘按下监听事件
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, this.keyDown, this);

        //新建场景 添加天空盒子和性能统计
        let scene = new Scene3D();
        let sky = scene.addComponent(AtmosphericComponent);
        scene.addComponent(Stats);
        
        //新建相机
        let cameraObj = new Object3D();
        let camera = cameraObj.addComponent(Camera3D);
        //开启联级阴影贴图 无需再设置阴影范围(shadowBound)
        camera.enableCSM = true;
        //设置相机参数
        camera.perspective(60, Engine3D.aspect, 1, 5000);
        let con = cameraObj.addComponent(HoverCameraController);
        con.setCamera(0, -30, 50);
        scene.addChild(cameraObj);

        //添加光源 
        let lightObj = new Object3D();
        let light = lightObj.addComponent(DirectLight);
        light.intensity = 50;
        light.castShadow = true;
        lightObj.rotationX = 60;
        lightObj.rotationY = 140;
        sky.relativeTransform = light.transform;
        scene.addChild(lightObj);

        //添加一个地面 
        {
            let floor = Object3DUtil.GetSingleCube(50, 1, 50, 0.3, 0.3, 0.3);
            floor.y = -0.5;
            let rigidBody = floor.addComponent(Rigidbody);
            rigidBody.mass = 0;
            let collider = floor.addComponent(ColliderComponent)
            collider.shape = new BoxColliderShape();
            collider.shape.size = new Vector3(50, 1, 50);
            scene.addChild(floor);
        }
        //添加Box墙
        let mats = [
            new LitMaterial(),
            new LitMaterial(),
            new LitMaterial(),
            new LitMaterial(),
            new LitMaterial()
        ]
        {
            let box = new Object3D();
            let mr = box.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(2, 2, 2);
            mats.forEach(element => {
                element.baseColor = Color.random();
            });
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    let b = box.clone();
                    b.x = 2 * i - 9;
                    b.y = 2 * j + 1;
                    b.z = -10;
                    b.getComponent(MeshRenderer).material = mats[Math.floor(Math.random() * 5)]
                    let rig = b.addComponent(Rigidbody)
                    rig.mass = 10
                    let col = b.addComponent(ColliderComponent)
                    col.shape = new BoxColliderShape();
                    col.shape.size = new Vector3(2, 2, 2)
                    scene.addChild(b)
                }
            }
        }

        //添加瞄准点
        {
            this.aim = new Object3D();
            let aim1 = Object3DUtil.GetSingleCube(0.5, 2, 0.5, 0.6, 0.3, 0.1);
            this.aim.addChild(aim1)
            let aim2 = Object3DUtil.GetSingleCube(0.5, 2, 0.5, 0.6, 0.3, 0.1);
            aim2.rotationZ = 90
            this.aim.addChild(aim2)
            this.aim.z = 10;
            this.aim.y = 10;
            this.aim.addComponent(MoveScript);
            scene.addChild(this.aim)
        }

        //添加小球预制体
        let sphereObj = new Object3D();
        let mr = sphereObj.addComponent(MeshRenderer);
        mr.geometry = new SphereGeometry(1, 20, 20);
        let mat = new LitMaterial();
        mr.material = mat;
        mat.baseColor = KelvinUtil.color_temperature_to_rgb(1325);
        Engine3D.res.addPrefab("ball", sphereObj);

        //添加提示
        const gui = new dat.GUI();
        let tips = {
            tip1:"按下wasd移动准心",
            tip2:"按下空格键发射小球"
        }
        gui.add(tips,"tip1");
        gui.add(tips,"tip2");

        //创建View3D对象 开始渲染
        this.view = new View3D();
        this.view.scene = scene;
        this.view.camera = camera;
        Engine3D.startRenderView(this.view);
    }
    //参数e中有本次事件相关的信息 其中e.keyCode代表的是按下的按键
    private keyDown(e: KeyEvent) {
        //仅当按下空格键时才执行if中的语句
        if (e.keyCode == KeyCode.Key_Space) {
            let sphereObj = Engine3D.res.getPrefab("ball");
            let collider = sphereObj.addComponent(ColliderComponent);
            collider.shape = new SphereColliderShape(1);
            let rigidBody = sphereObj.addComponent(Rigidbody);
            rigidBody.mass = 10;
            //当RigidBody初始化完成以后再添加速度才可生效
            rigidBody.addInitedFunction(() => {
                rigidBody.velocity = new Vector3(0, 0, -30000);
            }, this)
            sphereObj.transform.localPosition = this.aim.localPosition
            this.view.scene.addChild(sphereObj);
        }
    }
}
//移动组件 按下wasd四个键进行四个方向的移动
class MoveScript extends ComponentBase {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
    speed: number = 0.3
    init(): void {
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, this.keyDown, this)
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_UP, this.keyUp, this)
    }
    private keyDown(e: KeyEvent) {
        if (e.keyCode == KeyCode.Key_A) {
            this.left = true
        }
        else if (e.keyCode == KeyCode.Key_D) {
            this.right = true
        }
        else if (e.keyCode == KeyCode.Key_W) {
            this.up = true
        }
        else if (e.keyCode == KeyCode.Key_S) {
            this.down = true
        }
    }
    private keyUp(e: KeyEvent) {
        if (e.keyCode == KeyCode.Key_A) {
            this.left = false
        }
        else if (e.keyCode == KeyCode.Key_D) {
            this.right = false
        }
        else if (e.keyCode == KeyCode.Key_W) {
            this.up = false
        }
        else if (e.keyCode == KeyCode.Key_S) {
            this.down = false
        }
    }
    onUpdate() {
        if (this.up) {
            this.transform.y += this.speed
        }
        else if (this.down) {
            this.transform.y -= this.speed
        }
        else if (this.left) {
            this.transform.x -= this.speed
        }
        else if (this.right) {
            this.transform.x += this.speed
        }
    }
}
new demo().run();