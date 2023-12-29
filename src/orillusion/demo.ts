import { BoxGeometry, Camera3D, Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Color, Object3DUtil, Vector3, AtmosphericComponent, HoverCameraController, ColliderComponent, BoxColliderShape, KeyEvent, SphereColliderShape, DirectLight, SphereGeometry } from "@orillusion/core";
import { Stats } from '@orillusion/stats';
import { Ammo, Physics, Rigidbody } from "@orillusion/physics";

export default class demo {
    rigidBody:Rigidbody;
    btrigid:Ammo.btRigidBody;
    async run() {
        console.log("04.小球打盒子");
        await Physics.init();
        await Engine3D.init({
            renderLoop: () => {
                if (Physics.isInited) {
                    Physics.update();
                }
                /*if(this.btrigid&&this.force){
                    console.log(1);
                    console.log(this.btrigid.isKinematicObject());
                    let v =new Vector3(0,0,-100);
                    let v1 = new Ammo.btVector3()
                    v1.setValue(v.clone().x,v.clone().x,v.clone().x)
                    this.btrigid.setLinearVelocity(v1)
                    
                }*/
                
            }
        }
        );
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN,this.keyDown,this)
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_UP,this.keyUp,this)
        //新建一个场景
        let scene = new Scene3D();
        let sky = scene.addComponent(AtmosphericComponent);
        scene.addComponent(Stats);
        
        //新建相机
        let cameraObj = new Object3D();
        let camera = cameraObj.addComponent(Camera3D);
        camera.enableCSM = true
        //设置相机参数
        camera.perspective(60, Engine3D.aspect, 1, 5000);
        let con = cameraObj.addComponent(HoverCameraController);
        con.setCamera(0, -15, 40)
        scene.addChild(cameraObj);
        
        //添加光源 
        let lightObj = new Object3D();
        let light = lightObj.addComponent(DirectLight);
        light.intensity = 10;
        light.castShadow = true;
        lightObj.rotationX = 40
        lightObj.rotationY = 140
        sky.relativeTransform = light.transform;
        scene.addChild(lightObj);

        //添加一个地面
        {
            let floor = Object3DUtil.GetSingleCube(50, 1, 50, 0.6, 0.4, 0.2);
            floor.y = -0.5
            let rigidBody = floor.addComponent(Rigidbody)
            rigidBody.mass = 0
            let collider = floor.addComponent(ColliderComponent)
            collider.shape = new BoxColliderShape();
            collider.shape.size = new Vector3(50,1,50)
            scene.addChild(floor);
        }
        //添加Box墙
        {
            let box = new Object3D();
            let mr = box.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(2,2,2);
            let mats = [
                new LitMaterial(),
                new LitMaterial(),
                new LitMaterial(),
                new LitMaterial(),
            ]
            mats.forEach(element => {
                element.baseColor = Color.random();
            });
            for (let i = 0; i <10; i++) {
                for (let j = 0; j < 10; j++) {
                    let b =box.clone();
                    b.x = 2*i-9;
                    b.y = 2*j+1; 
                    b.z = -20;
                    b.getComponent(MeshRenderer).material = mats[Math.floor(Math.random()*4) ]
                    let r=b.addComponent(Rigidbody)
                    r.mass = 1
                    r.isTrigger = true
                    let c = b.addComponent(ColliderComponent)
                    c.shape = new BoxColliderShape();
                    c.shape.size = new Vector3(2,2,2)
                    scene.addChild(b)
                }
            }
        } 

        let sphereObj = new Object3D();
        let mr = sphereObj.addComponent(MeshRenderer)
        mr.geometry = new SphereGeometry(1,20,20)
        let mat = new LitMaterial()
        mr.material = mat
        mat.baseMap = Engine3D.res.redTexture
        sphereObj.y = 10
        let collider = sphereObj.addComponent(ColliderComponent);
        collider.shape = new SphereColliderShape(1);
        this.rigidBody = sphereObj.addComponent(Rigidbody)
        this.rigidBody.mass = 10
        this.rigidBody.isKinematic = true
        this.rigidBody.addInitedFunction(()=>{
            this.btrigid = this.rigidBody.btRigidbody
        },this)
        
        scene.addChild(sphereObj)


        //创建View3D对象 开始渲染
        let view = new View3D();
        view.scene = scene;
        view.camera = camera;
        Engine3D.startRenderView(view);

        
    }
    private keyDown(e){
        //console.log(this.rigidBody.btRigidbody.getMotionState());
        this.btrigid.activate(true)
        //let bt = new Ammo.btVector3();
        //bt.setValue(this.vec.x,this.vec.y,this.vec.z)
        //this.btrigid.setLinearVelocity(bt)
        this.rigidBody.velocity = new Vector3(0,0,-10000)
        //this.force = true
        //this.rigidBody.velocity = new Vector3(0,0,-10000)
    }
    private keyUp(e){
        
        //console.log(this.rigidBody.btRigidbody.getMotionState());
        //this.force = false
        //this.rigidBody.velocity = new Vector3(0,0,-10000)
    }
}