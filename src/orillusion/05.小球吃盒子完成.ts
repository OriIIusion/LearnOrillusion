import { BoxGeometry, Camera3D, Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Color, Object3DUtil, Vector3, AtmosphericComponent, HoverCameraController, ColliderComponent, BoxColliderShape, KeyEvent, SphereColliderShape, DirectLight, SphereGeometry, ComponentBase, KeyCode, KelvinUtil, ColliderShape } from '@orillusion/core';
import { Stats } from '@orillusion/stats';
import { Ammo, Physics, Rigidbody } from "@orillusion/physics";

export default class demo {
    view: View3D;
    world: Ammo.btDiscreteDynamicsWorld
    bodys: Ammo.btRigidBody[] = []
    foods: Object3D[] = []
    async run() {
        console.log("05.roll a ball");
        //物理系统初始化 
        await Physics.init();
        await Engine3D.init({
            //在主循环中调用Physics.update()使物理世界一直生效
            renderLoop: () => this.loop()
        });
        //每一帧都更新阴影，可避免运动中的物体出现阴影闪烁。
        //默认值为2，如果场景中有运动的物体，一定要记得将此值改为1
        Engine3D.setting.shadow.updateFrameRate = 1;

        //添加键盘按下监听事件
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, this.keyDown, this);
        this.world = Physics.world;
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

        

        //创建地面以及边界
        {
            let floor = Object3DUtil.GetSingleCube(50, 1, 50, 0.3, 0.3, 0.3);
            let rigidBody = floor.addComponent(Rigidbody);
            rigidBody.addInitedFunction(() => {
                rigidBody.btRigidbody.setUserIndex(-1)
            }, this)
            rigidBody.mass = 0;
            rigidBody.friction = 1;
            rigidBody.rollingFriction = 100;
            let collider = floor.addComponent(ColliderComponent)
            collider.shape = new BoxColliderShape();
            collider.shape.size = new Vector3(50, 1, 50);
            scene.addChild(floor); 
            

            let border1 = Object3DUtil.GetSingleCube(50, 5, 1, 0.3, 0.3, 0.3);
            let rigidbody1 = border1.addComponent(Rigidbody);
            rigidbody1.addInitedFunction(() => {
                rigidbody1.btRigidbody.setUserIndex(-1)
            }, this)
            rigidbody1.restitution = 0
            rigidbody1.mass = 0;
            let collider1 = border1.addComponent(ColliderComponent);
            collider1.shape = new BoxColliderShape();
            collider1.shape.size = new Vector3(50, 5, 1);
            border1.y = 1.5
            border1.z = 24.5
            scene.addChild(border1);

            let border2 = Object3DUtil.GetSingleCube(50, 5, 1, 0.3, 0.3, 0.3);
            let rigidbody2 = border2.addComponent(Rigidbody);
            rigidbody2.addInitedFunction(() => {
                rigidbody2.btRigidbody.setUserIndex(-1)
            }, this)
            rigidbody2.restitution = 0
            rigidbody2.mass = 0;
            let collider2 = border2.addComponent(ColliderComponent);
            collider2.shape = new BoxColliderShape();
            collider2.shape.size = new Vector3(50, 5, 1);
            border2.y = 1.5
            border2.z = -24.5
            scene.addChild(border2);

            let border3 = Object3DUtil.GetSingleCube(50, 5, 1, 0.3, 0.3, 0.3);
            let rigidbody3 = border3.addComponent(Rigidbody);
            rigidbody3.addInitedFunction(() => {
                rigidbody3.btRigidbody.setUserIndex(-1)
            }, this)
            rigidbody3.restitution = 0
            rigidbody3.mass = 0;
            let collider3 = border3.addComponent(ColliderComponent);
            collider3.shape = new BoxColliderShape();
            collider3.shape.size = new Vector3(50, 5, 1);
            border3.y = 1.5
            border3.x = 24.5
            border3.rotationY = 90
            scene.addChild(border3);

            let border4 = Object3DUtil.GetSingleCube(50, 5, 1, 0.3, 0.3, 0.3);
            let rigidbody4 = border4.addComponent(Rigidbody);
            rigidbody4.addInitedFunction(() => {
                rigidbody4.btRigidbody.setUserIndex(-1)
            }, this)
            rigidbody4.restitution = 0
            rigidbody4.mass = 0;
            let collider4 = border4.addComponent(ColliderComponent);
            collider4.shape = new BoxColliderShape();
            collider4.shape.size = new Vector3(50, 5, 1);
            border4.y = 1.5
            border4.x = -24.5
            border4.rotationY = 90
            scene.addChild(border4);
        }
        //添加食物
        {
            let boxobj = new Object3D();
            let mr = boxobj.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(2, 2, 2);
            mr.material = new LitMaterial();
            for (let index = 0; index < 10; index++) {
                let boxObj = boxobj.clone();
                boxObj.y = 1.5
                boxObj.x = Math.random() * 40 - 20
                boxObj.z = Math.random() * 40 - 20
                let rig = boxObj.addComponent(Rigidbody);
                rig.mass = 0
                let col = boxObj.addComponent(ColliderComponent);
                rig.addInitedFunction(() => {
                    let btrig = rig.btRigidbody
                    btrig.setCollisionFlags(4)
                    btrig.setUserIndex(index)
                    this.bodys.push(btrig)
                    this.foods.push(boxObj)
                }, this)
                col.shape = new BoxColliderShape();
                col.shape.size = new Vector3(2, 2, 2);
                scene.addChild(boxObj);

            }
        }

        //添加小球预制体
        let sphereObj = new Object3D();
        let mr = sphereObj.addComponent(MeshRenderer);
        mr.geometry = new SphereGeometry(1, 20, 20);
        let mat = new LitMaterial();
        mr.material = mat;
        mat.baseColor = KelvinUtil.color_temperature_to_rgb(1325);
        sphereObj.y = 5;
        let move = sphereObj.addComponent(MoveScript);
        move.rigidbody = sphereObj.addComponent(Rigidbody);
        move.rigidbody.addInitedFunction(() => {
            move.rigidbody.btRigidbody.setUserIndex(-1)
        }, this)
        move.rigidbody.mass = 1;
        let collider = sphereObj.addComponent(ColliderComponent);
        collider.shape = new SphereColliderShape(1);
        scene.addChild(sphereObj);
        
        let box = Object3DUtil.GetSingleCube(2,1,1,1,1,1);
        
        
        //创建View3D对象 开始渲染
        this.view = new View3D();
        this.view.scene = scene;
        this.view.camera = camera;
        Engine3D.startRenderView(this.view);
    }
    loop() {
        if (Physics.isInited) {
            let dis = this.world.getDispatcher()
            let num = dis.getNumManifolds()
            if (num > 0) {
                console.log(num + "个碰撞信息");
                for (let index = 0; index < num; index++) {
                    let info = dis.getManifoldByIndexInternal(index)
                    if (info.getBody0().getUserIndex() > -1 || info.getBody1().getUserIndex() > -1) {
                        let index = Math.max(info.getBody0().getUserIndex(), info.getBody1().getUserIndex())
                        let obj = this.foods[index]
                        this.foods[index] = null
                        this.bodys[index] = null
                        obj.destroy()
                    }
                }
            }
            Physics.update();
        }
    }
    //参数e中有本次事件相关的信息 其中e.keyCode代表的是按下的按键
    private keyDown(e: KeyEvent) {
        //仅当按下空格键时才执行if中的语句
        if (e.keyCode == KeyCode.Key_Space) {
            let dis = this.world.getDispatcher()
            let num = dis.getNumManifolds()
            if (num > 0) {
                console.log(num + "个碰撞信息");
                for (let index = 0; index < num; index++) {
                    let info = dis.getManifoldByIndexInternal(index)
                    if (info.getBody0().getUserIndex() > -1 || info.getBody1().getUserIndex() > -1) {
                        let index = Math.max(info.getBody0().getUserIndex(), info.getBody1().getUserIndex())
                        let obj = this.foods[index]
                        this.foods[index] = null
                        this.bodys[index] = null
                        obj.destroy()
                    }

                }

            }
        }
    }
}
//移动组件 按下wasd四个键进行四个方向的移动
class MoveScript extends ComponentBase {
    up: boolean = false
    down: boolean = false
    left: boolean = false
    right: boolean = false
    speed: number = 30
    rigidbody: Rigidbody;
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
        if (this.up || this.down || this.left || this.right) {
            if (!this.rigidbody.btRigidbody.isActive()) {
                this.rigidbody.btRigidbody.activate()
            }
            let x = 0
            let y = 0
            x = -1 * Number(this.left) + Number(this.right)
            y = -1 * Number(this.up) + Number(this.down)
            this.rigidbody.velocity = new Vector3(x * this.speed, 0, y * this.speed)
        }
    }
}