import { BoxGeometry, Camera3D, Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Object3DUtil, Vector3, AtmosphericComponent, ColliderComponent, BoxColliderShape, KeyEvent, SphereColliderShape, DirectLight, SphereGeometry, ComponentBase, KeyCode, KelvinUtil } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { Ammo, Physics, Rigidbody } from "@orillusion/physics";

export default class demo {
    view: View3D;
    ammoWorld: Ammo.btDiscreteDynamicsWorld;
    foods: Object3D[] = [];
    //以下五个属性可存放临时变量，避免在主循环中频繁new新物体
    dispatcher: Ammo.btDispatcher;
    numManifolds: number;
    Manifold: Ammo.btPersistentManifold;
    objIndex: number;
    tempObj: Object3D;
    async run() {
        console.log("小球吃盒子");
        //物理系统与引擎初始化
        await Physics.init();
        await Engine3D.init({
            renderLoop: () => this.loop(),
        });
        //设置阴影
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBias = 0.01;
        //获取ammo原生物理世界以实现更多自定义需求aaaaa
        this.ammoWorld = Physics.world;

        //新建场景 添加天空盒子和性能统计
        const scene = new Scene3D();
        const sky = scene.addComponent(AtmosphericComponent);
        scene.addComponent(Stats);

        //新建相机
        const cameraObj = new Object3D();
        const camera = cameraObj.addComponent(Camera3D);
        //开启联级阴影贴图 无需再设置阴影范围(shadowBound)
        camera.enableCSM = true;
        camera.perspective(60, Engine3D.aspect, 1, 5000);
        camera.lookAt(new Vector3(0, 40, 35), new Vector3());
        scene.addChild(cameraObj);

        //添加光源
        const lightObj = new Object3D();
        const light = lightObj.addComponent(DirectLight);
        light.intensity = 2;
        light.castShadow = true;
        lightObj.rotationX = 60;
        lightObj.rotationY = 80;
        sky.relativeTransform = light.transform;
        light.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        scene.addChild(lightObj);

        //创建View3D
        this.view = new View3D();
        this.view.scene = scene;
        this.view.camera = camera;

        //创建地面以及四周围栏
        this.createFloor();
        //添加食物（盒子）
        this.createFoods();
        //添加主角
        this.createBall();
        //开始渲染
        Engine3D.startRenderView(this.view);
    }
    private createFloor() {
        //创建地面以及四周围栏
        const floor = Object3DUtil.GetSingleCube(50, 1, 50, 0.3, 0.3, 0.6);
        const border1 = Object3DUtil.GetSingleCube(50, 5, 1, 0.3, 0.3, 0.6);
        const border2 = Object3DUtil.GetSingleCube(50, 5, 1, 0.3, 0.3, 0.6);
        const border3 = Object3DUtil.GetSingleCube(50, 5, 1, 0.3, 0.3, 0.6);
        const border4 = Object3DUtil.GetSingleCube(50, 5, 1, 0.3, 0.3, 0.6);
        //添加刚体组件 不动的物体质量设置为0
        const rigidbody = floor.addComponent(Rigidbody);
        const rigidbody1 = border1.addComponent(Rigidbody);
        const rigidbody2 = border2.addComponent(Rigidbody);
        const rigidbody3 = border3.addComponent(Rigidbody);
        const rigidbody4 = border4.addComponent(Rigidbody);
        rigidbody.mass = rigidbody1.mass = rigidbody2.mass = rigidbody3.mass = rigidbody4.mass = 0;
        //添加碰撞体组件 大小与模型一样
        const collider = floor.addComponent(ColliderComponent);
        collider.shape = new BoxColliderShape();
        collider.shape.size = new Vector3(50, 1, 50);
        const colshape = new BoxColliderShape();
        colshape.size = new Vector3(50, 5, 1);
        const collider1 = border1.addComponent(ColliderComponent);
        const collider2 = border2.addComponent(ColliderComponent);
        const collider3 = border3.addComponent(ColliderComponent);
        const collider4 = border4.addComponent(ColliderComponent);
        collider1.shape = collider2.shape = collider3.shape = collider4.shape = colshape;
        //摆放位置
        border1.y = 3;
        border1.z = 24.5;
        border2.y = 3;
        border2.z = -24.5;
        border3.y = 3;
        border3.x = 24.5;
        border3.rotationY = 90;
        border4.y = 3;
        border4.x = -24.5;
        border4.rotationY = 90;
        //设置摩擦力和弹力
        rigidbody.rollingFriction = 10;
        rigidbody1.restitution = rigidbody2.restitution = rigidbody3.restitution = rigidbody4.restitution = 0.3;
        //设置index为-1，方便从碰撞信息中剔除小球与地面墙面的碰撞
        rigidbody.userIndex = -1;
        rigidbody1.userIndex = -1;
        rigidbody2.userIndex = -1;
        rigidbody3.userIndex = -1;
        rigidbody4.userIndex = -1;
        this.view.scene.addChild(floor);
        this.view.scene.addChild(border1);
        this.view.scene.addChild(border2);
        this.view.scene.addChild(border3);
        this.view.scene.addChild(border4);
    }
    private createFoods() {
        //制作好一个box样本
        const boxobj = new Object3D();
        const mr = boxobj.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(2, 2, 2);
        mr.material = new LitMaterial();
        //提前创建好碰撞体形状大小 可复用
        const boxColliderShape = new BoxColliderShape();
        boxColliderShape.size = new Vector3(2, 2, 2);
        for (let index = 0; index < 10; index++) {
            const boxObj = boxobj.clone();
            boxObj.y = 2;
            boxObj.x = Math.random() * 40 - 20;
            boxObj.z = Math.random() * 40 - 20;
            const rig = boxObj.addComponent(Rigidbody);
            rig.mass = 0;
            const col = boxObj.addComponent(ColliderComponent);
            col.shape = boxColliderShape;
            rig.isTrigger = true;
            rig.userIndex = index;
            //将box存到数组中，以备后续的使用
            this.foods[index] = boxObj;

            boxObj.addComponent(RotateScript);
            this.view.scene.addChild(boxObj);
        }
    }
    private createBall() {
        //添加可操控的小球
        const sphereObj = new Object3D();
        const mr = sphereObj.addComponent(MeshRenderer);
        mr.geometry = new SphereGeometry(1, 20, 20);
        const mat = new LitMaterial();
        mr.material = mat;
        mat.baseColor = KelvinUtil.color_temperature_to_rgb(1325);
        sphereObj.y = 5;
        //添加移动组件
        const moveScript = sphereObj.addComponent(MoveScript);
        moveScript.rigidbody = sphereObj.addComponent(Rigidbody);
        moveScript.rigidbody.userIndex = -1;
        // moveScript.rigidbody.btRigidbody.setUserIndex(-1);
        moveScript.rigidbody.mass = 10;
        const collider = sphereObj.addComponent(ColliderComponent);
        collider.shape = new SphereColliderShape(1);
        this.view.scene.addChild(sphereObj);
    }
    //循环中尽量不要new东西
    private loop() {
        if (Physics.isInited) {
            //获取ammo原生物理世界的碰撞信息
            this.dispatcher = this.ammoWorld.getDispatcher();
            //获取碰撞信息的个数
            this.numManifolds = this.dispatcher.getNumManifolds();
            if (this.numManifolds > 0) {
                for (let index = 0; index < this.numManifolds; index++) {
                    //获取每一条碰撞信息
                    this.Manifold = this.dispatcher.getManifoldByIndexInternal(index);
                    //地面墙面和小球UserIndex都是-1 十个盒子UserIndex为0~9
                    //如果碰撞信息中的两个原生rigidbody的UserIndex有任一个大于-1，则意味着小球碰到了盒子
                    if (this.Manifold.getBody0().getUserIndex() > -1 || this.Manifold.getBody1().getUserIndex() > -1) {
                        //获取小球和盒子的UserIndex更大的那个值，也就是盒子的UserIndex
                        this.objIndex = Math.max(this.Manifold.getBody0().getUserIndex(), this.Manifold.getBody1().getUserIndex());
                        //从数组中取出该盒子并销毁
                        this.tempObj = this.foods[this.objIndex];
                        if (this.tempObj) {
                            this.foods[this.objIndex] = undefined;
                            this.tempObj.destroy();
                        }
                    }
                }
            }
            Physics.update();
        }
    }
}
//移动组件 按下wasd四个键进行四个方向的移动
class MoveScript extends ComponentBase {
    forward: boolean = false;
    back: boolean = false;
    left: boolean = false;
    right: boolean = false;
    speed: number = 280;
    rigidbody: Rigidbody;
    x: number = 0;
    y: number = 0;
    direction: Vector3 = new Vector3();
    init(): void {
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, this.keyDown, this);
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_UP, this.keyUp, this);
    }
    private keyDown(e: KeyEvent) {
        if (e.keyCode == KeyCode.Key_A) {
            this.left = true;
        } else if (e.keyCode == KeyCode.Key_D) {
            this.right = true;
        } else if (e.keyCode == KeyCode.Key_W) {
            this.forward = true;
        } else if (e.keyCode == KeyCode.Key_S) {
            this.back = true;
        }
    }
    private keyUp(e: KeyEvent) {
        if (e.keyCode == KeyCode.Key_A) {
            this.left = false;
        } else if (e.keyCode == KeyCode.Key_D) {
            this.right = false;
        } else if (e.keyCode == KeyCode.Key_W) {
            this.forward = false;
        } else if (e.keyCode == KeyCode.Key_S) {
            this.back = false;
        }
    }
    //循环中尽量不要new东西
    onUpdate() {
        //按下wasd任意一个键才生效
        if (this.forward || this.back || this.left || this.right) {
            //为了优化性能，在原生ammo世界中，物体停下一段时间后会处于未激活状态，未激活状态下不对施加的力产生响应
            //所以我们先检测一下物体的状态，如果物体属于未激活状态就先激活一下
            if (!this.rigidbody.btRigidbody.isActive()) {
                this.rigidbody.btRigidbody.activate();
            }
            //将前后左右四个状态转化成数值，false对应0，true对应1，将x和y填入Vector3中，就可得到最终的移动方向
            this.x = -1 * Number(this.left) + Number(this.right);
            this.y = -1 * Number(this.forward) + Number(this.back);
            this.direction.set(this.x * this.speed, 0, this.y * this.speed);
            this.rigidbody.velocity = this.direction;
        }
    }
}
//自旋转组件
class RotateScript extends ComponentBase {
    onUpdate() {
        this.object3D.rotationY += 1;
    }
}
new demo().run();
