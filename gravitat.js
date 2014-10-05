//INITIALIZATION
var width = width(),
    height = height(),
    forceStack = [],
    fill = d3.scale.category10(), //Temporary. Now is random. In future colors must not repeat ever.
    svg = d3.select('body').append('svg')
            .attr('width', width)
            .attr('height', height),
    lastKeyDown = null,
    animationDone = false;
//Temporary until db is hooked up
var nodes = []

$(window).on('keydown', keydown);

system(svg, nodes, 'CS170', true);

// SYSTEM
function system(ext_sel, nodes, name, edit) { //edit: true or false so that i can add planets on click.
    var center = {
        x: width/2,
        y: height/2,
        fixed: true,
        title: name,
        center: true
    };

    var nodeInFocus = null,
        nodes = [center],
        links = [],
        node = null,
        link = null;

    var force = d3.layout.force()
                    .nodes(nodes)
                    .links(links)
                    .size([width, height])
                    .on('tick', tick)
                    .linkDistance(function(link, index) {
                        x1 = link['source']['x']
                        x2 = link['target']['x']
                        y1 = link['source']['y']
                        y2 = link['target']['y'] 
                        return distance(x1,y1,x2,y2)
                    });

    selection = ext_sel.append('g') //Why do we need two groups?
                    .call(d3.behavior.zoom)
                    .append('g')
                    .on('mousedown', mousedown)
                    .call(fadeIn, 550),

    selection.append('rect')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)

    //Init
    killPrecedingForce();
    initiateForce(force);
    constructCenter(center);
    update();

    function constructCenter(center) {
        selection.append('text')
            .call(fadeIn, 1000)
            .text(center.title)
            .attr('class','center-concept')
            .attr('x', center.x)
            .attr('y', center.y)
            .attr('text-anchor','middle')
            .attr('font-family','sans-serif')
            .attr('font-size','12')
            .attr('fill','#000')
    }

    function update() {
        node = selection.selectAll('.node')
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
                clickedNode(d);
            })

        link = selection.selectAll('.link')
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
    //Events
    function tick() {
        // add some alpha later
        nodes.forEach(function(o) {
            if (o.center == true) return;
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

    function mousedown(e) {
        lastKeyDown = null;
        createNode(d3.mouse(this));
    }

    function clickedNode(d) {
        var x, y, k;

        if (d && nodeInFocus !== d) {
            x = d.x;
            y = d.y;
            k = 125;
            nodeInFocus = d;
            //conceal(nodeInFocus); //?
            //expose(d); //?
        } else {
            x = width / 2;
            y = height / 2;
            k = 1;
            nodeInFocus = null;
            //conceal(d); //?
            //dissolveInternalGraph(); //?
        }

        zoomIn(width, height, x, y, k, 1500);
        clearCanvas(d);
    }

    //Auxiliary
    function createNode(coordinate) {
        var x = coordinate[0],
            y = coordinate[1],
            dist = distance(x,y,center['x'],center['y']),
            textCoordinates = newCoordinates(center.x, center.y, dist, Math.PI/2)

        var node = {
            x: x,
            y: y,
            title: 'Sometext',
            center: false,
            angle: angle(x,y,center),
            distance: dist,
            velocity: 0.05 * Math.random(), //Velocity needs to be smarter
            radius: 8
        };

        var link = {
            source:center,
            target:node
        };

        //Orbit. Maybe later put in array to run updates.
        selection.append('circle')
            .attr('class', 'orbit')
            .attr('cx', center.x)
            .attr('cy', center.y)
            .attr('r', dist)
            .attr('stroke', '#A8A8A8')
            .attr('stroke-width', '1.0')
            .attr('fill','none')
            .call(fadeIn, 950);

        selection.append('text')
            .call(fadeIn, 1000)
            .text(node.title)
            .attr('class','node-title')
            .attr('x', textCoordinates.x)
            .attr('y', textCoordinates.y-10)
            .attr('text-anchor','middle')
            .attr('font-family','sans-serif')
            .attr('font-size','12')
            .attr('fill','#000');

        nodes.push(node);
        links.push(link);

        update();

        force.start();
    }

    function initiateForce(force) {
        forceStack.push(force);
        window.force = forceStack[forceStack.length - 1];
    }

    function killPrecedingForce() {
        forceStack.pop();
        window.force = forceStack[forceStack.length - 1];
    }
}

//EVENTS
function keydown(e) {
    if (lastKeyDown == e.keyCode && e.keyCode == 83) {
        lastKeyDown = null;
        resumeSystem();
    } else if (e.keyCode == 83) {
        haltSystem();
        lastKeyDown = e.keyCode;
    }
}

// ANIMATION
function fadeIn(selection, duration) {
    duration = typeof duration !== 'undefined' ? duration : 550;
    selection.style("opacity", 1e-6)
        .transition()
        .duration(duration)
        .style("opacity", 1)
}

function fadeOut(selection, duration) {
    selection.style("opacity", 1)
        .transition()
        .duration(duration)
        .style("opacity", 1e-6)    
}

function zoomIn(width, height, x, y, scale, time) {
    selection.transition()
            .duration(time)
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + scale + ")translate(" + -x + "," + -y + ")");
}

// UTILITIES

//Width and height should be more sophisticated as I add more features.
function width() {
    return window.innerWidth
}

function height() {
    return window.innerHeight
}

function haltSystem() {
    force.stop();
}

function resumeSystem() {
    force.resume();
}

function clearCanvas(d) {
    fadeOut(svg, 1750);

}

//Geometry
function distance(x1,y1,x2,y2) {
        return Math.sqrt(Math.pow((x1-x2),2) + Math.pow((y1-y2),2))
}

function angle(x,y, center) {
    if (x < center['x'] && y > center['y']) {
        return Math.PI - Math.acos((center['x'] - x) / distance(x,y,center['x'],center['y']))
    } else if(y < center['y'])  {
        return Math.PI + Math.acos((center['x'] - x) / distance(x,y,center['x'],center['y']))
    } else {
        return Math.acos((x-center['x']) / distance(x,y,center['x'],center['y']))
    }        
}

function newCoordinates(oldX, oldY, distance, angle) {
    if (angle == 3*Math.PI/2) {
        var newX = oldX + distance*Math.cos(angle)
            newY = oldY + distance*Math.sin(5*Math.PI/4);
        return {x:newX, y:newY}
    } else {
        var newX = oldX + distance*Math.cos(angle)
            newY = oldY + distance*Math.sin(angle);
        return {x:newX, y:newY}
    }
}