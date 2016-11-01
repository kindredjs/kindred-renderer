var Component = require('kindred-component')

var GL_TRIANGLES = 4

var prevShader = null
var prevFrame = null
var prevGeom = null

module.exports = class RenderComponent extends Component('render') {
  init (node, props) {
    this.node = node
    this.geometry = props.geometry
    this.shader = props.shader
    this.uniforms = props.uniforms || null
    this.textures = props.textures || {}
    this.drawStart = props.drawStart
    this.drawCount = props.drawCount
    this.primitive = typeof props.primitive === 'number'
      ? props.primitive
      : GL_TRIANGLES
  }

  stop () {
    this.geometry = null
    this.shader = null
    this.node = null
  }

  draw (props) {
    var shader = this.shader
    var uniforms = shader.uniforms
    var changedShader = false
    var gl = props.gl

    if (!shader || !this.geometry) {
      throw new Error('kindred-renderer component needs both a .geometry and .shader to be supplied')
    }

    // Only switch shaders and upload common uniforms when necessary :)
    // Frames are being counted to ensure that the state is "reset" at
    // the start of a new frame.
    if (shader !== prevShader || props.frame > prevFrame) {
      shader.bind(gl)
      uniforms.uFrame = props.frame
      uniforms.uProj = props.proj
      uniforms.uView = props.view
      uniforms.uFog = props.fog
      uniforms.uEye = props.eye
      prevShader = shader
      prevFrame = props.frame
      changedShader = true
    }

    // Note: optimised previously to check if model/normal had changed
    // in the hope of reducing draw calls, found it increased CPU significantly.
    // Will need to test further, but will probably only be useful on normal
    // matrices if anything.
    uniforms.uModel = this.node.modelMatrix
    uniforms.uNormal = this.node.normalMatrix

    // Note: this could be optimised more by only rebinding textures
    // when necessary. We could keep a "pool" of textures and just
    // keep binding them to new indices only when required.
    if (this.textures !== null) {
      var index = 0
      for (var key in this.textures) {
        var tex = this.textures[key]
        if (tex) uniforms[key] = tex.bind(gl, index++)
      }
    }

    if (this.uniforms !== null) {
      this.uniforms(gl, this.node, uniforms)
    }

    if (changedShader || prevGeom !== this.geometry) {
      this.geometry.bind(gl, shader.attributes)
      prevGeom = this.geometry
    }

    this.geometry.draw(gl, this.primitive, this.drawStart, this.drawCount)
  }
}
