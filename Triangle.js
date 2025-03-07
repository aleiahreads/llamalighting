class Triangle{
    constructor(){
      this.type= 'triangle';
      this.position = [0.0,0.0,0.0];
      this.color = [1.0,1.0,1.0,1.0];
      this.size = 5.0
    }
  
    render() {
      var xy = this.position;
      var rgba = this.color; 
      var size = this.size;
      /*
      var xy = g_points[i];
      var rgba = g_colors[i];
      var size = g_sizes[i];
      */
  
      // Pass the position of a point to a_Position variable
      // dont need this anymore, we use attribpointer instead in drawTriangle()
      //gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);

      gl.uniform1i(u_whichTexture, 0); // Disable vertex colors

      // Pass the color of a point to u_FragColor variable
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      
      // Pass the size of a point to u_Size variable
      gl.uniform1f(u_Size, size);


        
      // Draw
      var d = this.size/200.0;   // delta
      drawTriangle([xy[0], xy[1], xy[0]+d, xy[1], xy[0], xy[1]+d])
    }
}


function drawTriangle(vertices) {
    var n = 3; // The number of vertices
  
    // Create a buffer object on the gpu so we can pass vertices into it
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }
  
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    //gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  
    // Assign the buffer object to a_Position variable
    // instead of a call to vertexAtribLocation, we call vertextAttribPointer
    // now a_Position will be a pointer to the buffer we made
    // The 2 means there is elements per vertex, an x and a y and gl.FLOAT means they're all floats
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.TRIANGLES, 0, n);
    //return n;
}

// Same function as a above but vertexArrribPointer has 3 not 2 points
function drawTriangle3D(vertices) {
    var n = 3; // The number of vertices
  
    // Create a buffer object on the gpu so we can pass vertices into it
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }
  
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    //gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  
    // Assign the buffer object to a_Position variable
    // instead of a call to vertexAtribLocation, we call vertextAttribPointer
    // now a_Position will be a pointer to the buffer we made
    // The 2 means there is elements per vertex, an x and a y and gl.FLOAT means they're all floats
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.TRIANGLES, 0, n);
    //return n;

  }

    function drawTriangle3DNormal(vertices, normals) {
      var n = vertices.length/3;

      // Create buffer object for positions
      let vertexBuffer = gl.createBuffer();
      if(!vertexBuffer) {
        console.log('Failed to create the vertex buffer object')
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0,0);

      gl.enableVertexAttribArray(a_Position);


      // Create buffer object for normals
      let normalBuffer = gl.createBuffer();
      if(!normalBuffer) {
        console.log('Failed to create the normals buffer object');
      }


      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

      gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0,0);

      gl.enableVertexAttribArray(a_Normal);

      // Draw triangle
      gl.drawArrays(gl.TRIANGLES, 0, n);

      // Cleanup: disable a_Normal so other functions aren't expecting it
      gl.disableVertexAttribArray(a_Normal);
    }