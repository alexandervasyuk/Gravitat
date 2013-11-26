//Initialization
//Globals
var width = width(),
    height = height(),
    centeredNode = null;

// System
function system(selection, nodes, name) {

}
// Animation

// Utilities

//Width and height should be more sophisticated as I add more features.
function width() {
    return window.innerWidth
}

function height() {
    return window.innerHeight
}


var width = 1400,
    height = 750,
    centeredNode = null,
    haltRadius = 8,
    fill = d3.scale.category10(),
    center = {
        x: width/2,
        y: height/2,
        fixed: true,
        angle: 0,
        distance: 0,
        velocity: 0.01, // ? why does center have velocity!!
        radius:8
    };

//Working arrays
var nodes = [center];
var links = [];

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append('g')
    .call(d3.behavior.zoom().scaleExtent([1, 50]))
    .append('g')
    .attr('class', 'external-graph')
    .on('mousedown', mousedown);

svg.append("rect") // Do I still need thia?
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height);

var haltRegion = svg.append('circle')
    .attr("class", "haltRegion")
    .attr("cx", width/2)
    .attr("cy", height/2)
    .attr("r", haltRadius)
    .style("opacity", 1e-6)
    .on('mousemove', function(d){
        d3.event.stopPropagation();
        force.stop();
    })
    .on('mouseout', function(d){
        d3.event.stopPropagation();
        var left = d3.mouse(this);
        if (distance(left[0], left[1], center.x, center.y) > haltRadius) { // Temporary fix - if you exit though the outermost node, grpah stays frozen
            force.resume();
        }
    });

var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    .on('tick', tick)
    .linkDistance(function(link, index){
        x1 = link['source']['x']
        x2 = link['target']['x']
        y1 = link['source']['y']
        y2 = link['target']['y'] 
        return distance(x1,y1,x2,y2)
    })  
    .start();

//Selections
var node = null;
var link = null;

function update() {
    node = svg.selectAll('.node')
        .data(nodes)
    //figure out why enter + update did not work together    
    node.enter().append("circle")
        .attr("class", "node")
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .attr("r", function(d) {return d.radius})
        .style("fill", function(d, i) { return fill(i & 3); })
        .style("stroke", function(d, i) { return d3.rgb(fill(i & 3)).darker(2); })
        .on('mousedown', function(d){
            d3.event.stopPropagation();
            clicked(d)
        })


    link = svg.selectAll('.link')
        .data(links);

    link.enter().append('line')
        .attr('class', 'link')
        .attr('stroke', '#ddd')
        .attr("stroke-opacity", 0.8)
        .attr("x1", function(d){d.source.x})
        .attr("y1", function(d){d.source.y})
        .attr("x2", function(d){d.target.x})
        .attr("y2", function(d){d.target.y})
        .style("stroke-width", 2.0);

}

svg.style("opacity", 1e-6)
  .transition()
    .duration(1000)
    .style("opacity", 1);

update();

function tick(e) {
    // add some alpha later
    nodes.forEach(function(o) {
        o.x = center['x'] + o['distance']*Math.cos(o['angle'])
        o.y = center['y'] + o['distance']*Math.sin(o['angle'])
        o.angle = (o.angle + o.velocity) % (2*Math.PI)
    });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })

    link.attr('x1', function(d){return d.source.x})
        .attr('y1', function(d){return d.source.y})
        .attr('x2', function(d){return d.target.x})
        .attr('y2', function(d){return d.target.y});

    force.resume();
}

function mousedown(e){
    var coordinate = d3.mouse(this);
    createNode(coordinate);
}

function createNode(coordinate){
    var x = coordinate[0],
        y = coordinate[1];

    var node = {
        x: x,
        y: y,
        angle: angle(x,y),
        distance: distance(x,y,center['x'],center['y']),
        velocity: 0.1 * Math.random(),
        radius: 8
    };

    updateHaltRegion(node);

    var link = {
        source:center,
        target:node
    };

    nodes.push(node);
    links.push(link);

    update();

    force.start();
}

function angle(x,y) {
    if (x < center['x'] && y > center['y']) {
        return Math.PI - Math.acos((center['x'] - x) / distance(x,y,center['x'],center['y']))
    } else if(y < center['y'])  {
        return Math.PI + Math.acos((center['x'] - x) / distance(x,y,center['x'],center['y']))
    } else {
        return Math.acos((x-center['x']) / distance(x,y,center['x'],center['y']))
    }        
}

function distance(x1,y1,x2,y2) {
        return Math.sqrt(Math.pow((x1-x2),2) + Math.pow((y1-y2),2))
}

function updateHaltRegion(node) {
    if (node.distance > haltRadius) {
        haltRadius = node.distance;
        haltRegion.attr('r', haltRadius);
    }
}

function clicked(d) {
    var x, y, k;

    if (d && centeredNode !== d) {
        //$('.temp-text-box').show()
        x = d.x;
        y = d.y;
        k = 40;
        centeredNode = d;
        conceal(centeredNode);
        expose(d);
        initInternalGraph(d,svg,false)
    } else {
        //$('.temp-text-box').hide()
        x = width / 2;
        y = height / 2;
        k = 1;
        centeredNode = null;
        conceal(d);
        dissolveInternalGraph();
    }

    svg.transition()
        .duration(750)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");
}

function expose(d) {
    var angles = [5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4]
        labels = ['why', 'what', 'how'];

    for (i in angles) {
        var i = parseInt(i);

        var sectionRadius = 1,
            padding = 1,
            newXY = newCoordinates(d.x, d.y, d.radius - sectionRadius - padding, angles[i])

        if (i+1 < angles.length) {
            var nextXY = newCoordinates(d.x, d.y, d.radius - sectionRadius - padding, angles[i+1])
            svg.append('line')
                .style("fill", '#fff')
                .call(fadeIn)
                .attr('class', 'section-bridge')
                .attr("x1", newXY[0])
                .attr("y1", newXY[1])
                .attr("x2", nextXY[0])
                .attr("y2", nextXY[1])
                .attr('stroke', '#ddd')
                .attr("stroke-opacity", 0.8)
                .style("stroke-width", 0.1);
        } 

        svg.append('circle')
            .style("fill", '#fff')
            .call(fadeIn)
            .attr('class', 'section')
            .attr("cx", newXY[0])
            .attr("cy", newXY[1])
            .attr("r", sectionRadius)
            .on("mousedown", function() { //Temporary fix
                d3.event.stopPropagation();
            })

        svg.append('text')
            .call(fadeIn)
            .text(labels[i])
            .attr('class','section-title')
            .attr('x', newXY[0])
            .attr('y', newXY[1]+0.1)
            .attr('text-anchor','middle')
            .attr('font-family','sans-serif')
            .attr('font-size','0.5')
            .attr('fill','#000')
            .on("mousedown", function() { //Temporary fix
                d3.event.stopPropagation();
            })
    }
}

function fadeIn(selection) {
    selection.style("opacity", 1e-6)
        .transition()
        .duration(550)
        .style("opacity", 1)
}

function fadeOut(selection) {
    selection.transition()
        .duration(550)
        .style("opacity", 1e-6)
        .remove();
}

function conceal(d) {
    svg.selectAll('.section')
        .call(fadeOut)

    svg.selectAll('.section-bridge')
        .call(fadeOut)

    svg.selectAll('.section-title')
        .call(fadeOut)

    svg.selectAll('.section-text')
        .call(fadeOut)
}

function newCoordinates(oldX, oldY, distance, angle) {
    if (angle == 3*Math.PI/2) {
        var newX = oldX + distance*Math.cos(angle)
            newY = oldY + distance*Math.sin(5*Math.PI/4);
        return [newX, newY]
    } else {
        var newX = oldX + distance*Math.cos(angle)
            newY = oldY + distance*Math.sin(angle);
        return [newX, newY]
    }
}

function initInternalGraph(d, selection, magnify) {
    var internalCenter = {
        x: d.x,
        y: d.y,
        fixed: true,
        angle: 0,
        distance: 0,
        velocity: 0.01,
        radius: magnify? 8 : 0.3,
        center: true
    };

    var circlingNode1 = {
        x: d.x,
        y: d.y,
        fixed: false,
        angle: Math.PI/2,
        distance: magnify? 300 : 3,
        velocity: 0.04, 
        radius: magnify? 14 : 0.4,
        center: false
    };

    var circlingNode2 = {
        x: d.x,
        y: d.y,
        fixed: false,
        angle: Math.PI,
        distance: magnify? 200 : 2,
        velocity: 0.06,
        radius: magnify? 10 : 0.1,
        center: false
    };

    var circlingNode3 = {
        x: d.x,
        y: d.y,
        fixed: false,
        angle: 3*Math.PI/2,
        distance: magnify? 100: 1,
        velocity: 0.07,
        radius: magnify? 8 :0.3,
        center: false
    };

    var internalLink1 = {
        source:internalCenter,
        target:circlingNode1
    };

    var internalLink2 = {
        source:internalCenter,
        target:circlingNode2
    };

    var internalLink3 = {
        source:internalCenter,
        target:circlingNode3
    };

    var nodes = [internalCenter, circlingNode1,circlingNode2,circlingNode3];
    var links = [internalLink1,internalLink2,internalLink3];

    var graph = selection.append('g')
                    .attr('class', 'internal-graph');

    var internalForce = d3.layout.force()
        .nodes(nodes)
        .links(links)
        .size([d.r*2, d.r*2])
        .on('tick', internalTick)
        .linkDistance(function(link, index){
            x1 = link['source']['x']
            x2 = link['target']['x']
            y1 = link['source']['y']
            y2 = link['target']['y'] 
            return distance(x1,y1,x2,y2)
        })  
        .start();

    var internalNode = null;
    var internalLink = null;

    internalNode = graph.selectAll('.node')
        .data(nodes)
    //figure out why enter + update did not work together    
    internalNode.enter().append("circle")
        .attr("class", "node")
        .attr("cx", function(d) {  return d.x; })
        .attr("cy", function(d) {  return d.y; })
        .attr("r", function(d) {return d.radius})
        .style("fill", function(d, i) { return 'black';})
        .on('mousedown', function(d){
            d3.event.stopPropagation();
            if (d.center) {
                fallThrough(d);
            }
        })
        .style("opacity", magnify? 1: 0.2)

    internalLink = graph.selectAll('.link')
        .data(links);

    internalLink.enter().append('line')
        .attr('class', 'link')
        .attr('stroke', '#ddd')
        .attr("stroke-opacity", 0.8)
        .attr("x1", function(d){d.source.x})
        .attr("y1", function(d){d.source.y})
        .attr("x2", function(d){d.target.x})
        .attr("y2", function(d){d.target.y})
        .style("stroke-width", 2.0);

    function internalTick(e) {
        // add some alpha later
        nodes.forEach(function(o) {
            o.x = internalCenter['x'] + o['distance']*Math.cos(o['angle'])
            o.y = internalCenter['y'] + o['distance']*Math.sin(o['angle'])
            o.angle = (o.angle + o.velocity) % (2*Math.PI)
        });

        internalNode.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
        internalLink.attr('x1', function(d){return d.source.x})
            .attr('y1', function(d){return d.source.y})
            .attr('x2', function(d){return d.target.x})
            .attr('y2', function(d){return d.target.y});

        internalForce.resume();
    }
}

function dissolveInternalGraph() {
    d3.select('.internal-graph').remove();
}

function dissolveExternalGraph() {
    d3.select('.external-graph').remove();
}

function fallThrough(d) {
    svg.transition()
        .duration(750)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(20)translate(" + -d.x + "," + -d.y + ")");

    setTimeout(function(){
        svg.transition()
            .duration(750)
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(80)scale(80)translate(" + -d.x + "," + -d.y + ")");
    }, 750)

    setTimeout(function(){
        dissolveInternalGraph();
        dissolveExternalGraph();

        var selection = d3.select('svg g')
            .call(d3.behavior.zoom().scaleExtent([1, 50]))

        initInternalGraph(d, selection, true);
        
        selection.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(200)translate(" + -d.x + "," + -d.y + ")");
        setTimeout(function(){
            selection.transition()
                .duration(1050)
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(1)translate(" + -d.x + "," + -d.y + ")");
        }, 0)

    }, 1200)
}