var Render = module.exports = require('./component')

var SORTER = '_kindredRendererSorter_' + Math.random().toString(36).slice(2)
var SORTFN = '_kindredRendererSortFn_' + Math.random().toString(36).slice(2)

Render.draw = function (gl, scene, camera) {
  var drawProps = scene.getFrameProps(camera, gl.canvas.width, gl.canvas.height)

  var background = scene.data.background
  if (background) {
    gl.clearColor(background[0], background[1], background[2], background[3])
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  var currSort = scene.data.drawSort || defaultSort
  var lastSort = scene[SORTFN]
  if (!scene[SORTER] || currSort !== lastSort) {
    scene[SORTER] = scene.list(currSort)
    scene[SORTFN] = currSort
  }

  var nodes = scene[SORTER]()

  drawProps.gl = gl
  treePreDraw(nodes, drawProps)
  treeDraw(nodes, drawProps)
  treePostDraw(nodes, drawProps)
  drawProps.gl = null
}

var treePostDraw = treeCall('postDraw')
var treePreDraw = treeCall('preDraw')
var treeDraw = treeCall('draw')

function treeCall (name) {
  return function triggerDrawEvents (nodes, props) {
    for (var i = 0; i < nodes.length; i++) {
      var components = nodes[i]._componentList
      for (var j = 0; j < components.length; j++) {
        var component = components[j]
        if (component[name]) component[name](props)
      }
    }
  }
}

function defaultSort (a, b) {
  var aRender = a.component(Render)
  var bRender = b.component(Render)
  if (!aRender) return -1
  if (!bRender) return +1

  if (aRender.zIndex !== bRender.zIndex) {
    return aRender.zIndex - bRender.zIndex
  }

  var aShad = aRender.shader.id
  var bShad = aRender.shader.id
  if (aShad !== bShad) return aShad - bShad

  var aGeom = aRender.geometry.id
  var bGeom = bRender.geometry.id
  if (aGeom !== bGeom) return aGeom - bGeom

  return 0
}
