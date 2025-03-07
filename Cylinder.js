function Circle3D(x, y, z, radius, segments, color) {
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

    let angleStep = (2 * Math.PI) / segments;
    let center = [x, y, z];

    for (let i = 0; i < segments; i++) {
        let angle1 = i * angleStep;
        let angle2 = (i + 1) * angleStep;

        let x1 = x + radius * Math.cos(angle1);
        let y1 = y + radius * Math.sin(angle1);
        let x2 = x + radius * Math.cos(angle2);
        let y2 = y + radius * Math.sin(angle2);

        let normal = [0, 0, z >= 0 ? 1 : -1];

        drawTriangle3DNormal([...center, x1, y1, z, x2, y2, z], [...normal, ...normal, ...normal]);
    }
}

class Cylinder {
    constructor(radius, height, segments, color) {
        this.radius = radius;
        this.height = height;
        this.segments = segments;
        this.color = color || [1.0, 1.0, 1.0, 1.0]; // Default white
        this.matrix = new Matrix4();
    }

    render() {
        //console.log("Rendering Cylinder...");
        let angleStep = (2 * Math.PI) / this.segments;
        
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        for (let i = 0; i < this.segments; i++) {
            let angle1 = i * angleStep;
            let angle2 = (i + 1) * angleStep;

            let x1 = this.radius * Math.cos(angle1);
            let y1 = this.radius * Math.sin(angle1);
            let x2 = this.radius * Math.cos(angle2);
            let y2 = this.radius * Math.sin(angle2);
            //console.log(`Triangle ${i}: (${x1}, ${y1}, 0) -> (${x2}, ${y2}, 0) -> (${x1}, ${y1}, ${this.height})`);


            let zBottom = 0;
            let zTop = this.height;

            let normal1 = normalize([x1, y1, 0]);
            let normal2 = normalize([x2, y2, 0]);
            
            let rgba = this.color;
            gl.uniform1i(u_whichTexture, 0); // Disable vertex colors
            // SIDE WALL: Using two triangles per segment
            gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

            //drawTriangle3D([x1, y1, zBottom, x2, y2, zBottom, x1, y1, zTop]); // First Triangle
            //drawTriangle3D([x1, y1, zTop, x2, y2, zBottom, x2, y2, zTop]); // Second Triangle
            drawTriangle3DNormal([x1, y1, zBottom, x2, y2, zBottom, x1, y1, zTop], [...normal1, ...normal2, ...normal1]);
            drawTriangle3DNormal([x1, y1, zTop, x2, y2, zBottom, x2, y2, zTop], [...normal1, ...normal2, ...normal2]);
        }

        // Top and Bottom Circles
        let color = this.color;
        //console.log("Drawing Circle Caps...");
        Circle3D(0, 0, 0, this.radius, this.segments, color); // Bottom face
        Circle3D(0, 0, this.height, this.radius, this.segments, [color[0], color[1], color[2], color[3]]); // Top face
    }
}
function normalize(v) {
    let length = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
    return length === 0 ? v : [v[0] / length, v[1] / length, v[2] / length];
}