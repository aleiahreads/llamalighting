class Camera {
    constructor(canvas) {
        this.eye = new Vector3();
        this.eye.elements[1] = .75;
        this.eye.elements[2] = -2;
        this.at  = new Vector3();
        //this.at  = new Vector3(0,0,1);
        //this.at.elements[2] = -1;
        this.up  = new Vector3();
        this.up.elements[1] = 1;
        this.fov = 75;
        this.canvas = canvas;
        this.viewMatrix = new Matrix4();
        this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2], this.at.elements[0], 
            this.at.elements[1], this.at.elements[2], this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        this.projectionMatrix = new Matrix4();
        this.projectionMatrix.setPerspective(this.fov, this.canvas.width/this.canvas.height, 0.1, 1000);
    }

    moveForward(speed) {
        let f = new Vector3();
        f = f.set(this.at);
        f.sub(this.eye);
        f.normalize();
        f.mul(speed);
        this.eye.add(f);
        this.at.add(f);
        console.log("move forward");
    }

    moveBackwards(speed) {
        // b = eye - at
        let b = new Vector3();
        b = b.set(this.eye);
        b.sub(this.at);
        // normalize b 
        b.normalize();
        // scale it by speed
        b.mul(speed);
        // update eye and at vectors
        this.eye.add(b);
        this.at.add(b);
        console.log("move back");
    }

    moveLeft(speed) {
        // f = at - eye
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);

        // s = up x f
        let s = Vector3.cross(this.up, f);

        s.normalize();
        s.mul(speed);
        this.eye.add(s);
        this.at.add(s);
        console.log("move left");
    }

    moveRight(speed) {
        // f = at - eye
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);

        // s = f x up
        let s = Vector3.cross(f, this.up);

        s.normalize();
        s.mul(speed);
        this.eye.add(s);
        this.at.add(s);
        console.log("move right");
    }

    panLeft(alpha) {
        let up = this.up;
        // f = at - eye
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);

        //let alpha = 0.0872665; // 5 degrees in radians
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(alpha, up.elements[0], up.elements[1], up.elements[2]);
        
        let f_prime = rotationMatrix.multiplyVector3(f);
        this.at = new Vector3().set(this.eye).add(f_prime);
        console.log("pan left");
    }

    panRight(alpha) {
        let up = this.up;
        // f = at - eye
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);

        //let alpha = 0.0872665; // 5 degrees in radians
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(-alpha, up.elements[0], up.elements[1], up.elements[2]);
        
        let f_prime = rotationMatrix.multiplyVector3(f);
        this.at = new Vector3().set(this.eye).add(f_prime);
        console.log("pan right");
    }
}
