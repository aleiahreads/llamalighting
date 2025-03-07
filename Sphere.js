class Sphere {
    constructor() {
        this.type = 'sphere';
        this.color = [1,1,1,1];
        this.matrix = new Matrix4();
        this.textureNum = 0;
        this.verts32 = new Float32Array([]);
    }

    render() {
        var rgba = this.color;

        // Remember to add textureNum as an attribute of cubes
        gl.uniform1i(u_whichTexture, this.textureNum);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        var d = Math.PI/10;
        var dd = Math.PI/10;

        for(let t = 0; t < Math.PI; t+=d) {
            for(let r = 0; r < (2*Math.PI); r+=d) {
                let p1 = [Math.sin(t)*Math.cos(r), Math.sin(t)*Math.sin(r), Math.cos(t)];
                let p2 = [Math.sin(t+dd)*Math.cos(r), Math.sin(t+dd)*Math.sin(r), Math.cos(t+dd)];
                let p3 = [Math.sin(t)*Math.cos(r+dd), Math.sin(t)*Math.sin(r+dd), Math.cos(t)];
                let p4 = [Math.sin(t+dd)*Math.cos(r+dd), Math.sin(t+dd)*Math.sin(r+dd), Math.cos(t+dd)];

                let v = [];
                let uv = [];
                v = v.concat(p1); uv=uv.concat([0,0]);
                v = v.concat(p2); uv=uv.concat([0,0]);
                v = v.concat(p4); uv=uv.concat([0,0]);
                
                gl.uniform4f(u_FragColor, 1,1,1,1);
                drawTriangle3DNormal(v,v);

                v=[]; uv=[];
                v = v.concat(p1); uv=uv.concat([0,0]);
                v = v.concat(p4); uv=uv.concat([0,0]);
                v = v.concat(p3); uv=uv.concat([0,0]);

                gl.uniform4f(u_FragColor, 1,0,0,1);
                drawTriangle3DNormal(v,v);
            }
        }
    }

}