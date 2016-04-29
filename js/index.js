var width = 500,
    height = 500,
	scale = 1,
	distance = 80,
	charge = -500,
    root;

var force = d3.layout.force()
    .charge(charge)
    .gravity(.05)
    .size([width, height])
    .on("tick", tick);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);
	
var zoom = d3.behavior.zoom().scaleExtent([0.1, 7]);

var g = svg.append("g");

var link = g.selectAll(".link"),
    node = g.selectAll(".node");

var Graph =  (function() {
    var formattedData = function (json){
        var data = {
            name: json.anomalousProperty.key,
            children:[
                {
                    name: json.anomalousProperty.value,
                    children: []
                }
            ]
        }

        for (var i = 0; i < json.significantVariables.length; i++) {

            var index = -1;
            for (var j = 0; j < data.children[0].children.length; j++) {

                if (data.children[0].children[j].name == json.significantVariables[i].key ) {
                    index = j;
                    break;
                } else {

                }
            }

            if (index==-1) {
                data.children[0].children.push({
                    name:json.significantVariables[i].key,
                    children:[
                        {
                            name:json.significantVariables[i].value,
                            relativeChange: json.significantVariables[i].relativeChange
                        }
                    ]
                });
            } else {
                if (!data.children[0].children[index].children) {
                    data.children[0].children[index].children = [];
                }
                data.children[0].children[index].children.push({
                    name:json.significantVariables[i].value,
                    relativeChange: json.significantVariables[i].relativeChange
                });
            }

        }
        return data;
    }
	var updateGraph = function () {
		var nodes = flatten(root),
			links = d3.layout.tree().links(nodes);

		// Restart the force layout.
		force
			.nodes(nodes)
			.links(links)
			.linkDistance(linkDistance)
			.start();

		// Update links.
		link = link.data(links, function(d) { return d.target.id; });
		link.exit().remove();
		link.enter().insert("line", ".node")
			.attr("class", "link")
			.attr("title", linkDistance)
			.style("stroke", colorLink)
			.style("stroke-dasharray", dashStyle);

		// Update nodes.
		node = node.data(nodes, function(d) { return d.id; });

		node.exit().remove();

		var nodeEnter = node.enter().append("g")
			.attr("class", "node")
			.on("click", click)
			.on("mousedown", mousedown)
			.call(force.drag);

		nodeEnter.append("circle")
			.attr("r", "5");

		nodeEnter.append("text")
			.attr("dy", ".35em")
			.attr("dx", 10)
			.text(function(d) { return d.name; });

		node.select("circle")
			.style("fill", colorNode);
			
		zoom.on("zoom", function() {
			g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	
		});
			 
		svg.call(zoom);
	}

    return {
        getFormattedData: formattedData,
		update: updateGraph
    }
})()

d3.json("data/candidates_task.json", function(error, json) {
    if (error) throw error;

    root = Graph.getFormattedData(json);
	
    Graph.update();
});


function tick() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
}

function colorNode(d) {
    return d._children ? "#3182bd" 
        : d.children ? "#c6dbef" 
        : "#fd8d3c"; 
}

function colorLink(d) {
	if (d.target.relativeChange){	
		return (d.target.relativeChange < 0) ? "#ff0000" : "#000";
	} else {
		if (d.target.children){
			for (var j=0; j<d.target.children.length; j++) {
				
				if (d.target.children[j].relativeChange){
					return (d.target.children[j].relativeChange < 0) ? "#ff0000" : "#000";
				} 
			}
		}
	}
}

function dashStyle(d){
	if (d.target.relativeChange){	
		return (d.target.relativeChange < 0) ? "5,5" : "10,0";
	} else {
		if (d.target.children){
			for (var j=0; j<d.target.children.length; j++) {
				
				if (d.target.children[j].relativeChange){
					return (d.target.children[j].relativeChange < 0) ? "5,5" : "10,0";
				} 

			}
		}
	}
}

function linkDistance(d){
	var sourceDistance = distance;
	var targetDistance = distance;
	var totalDistance;
	
	if (d.source.relativeChange) {
		sourceDistance = d.source.relativeChange;
	} else {
		sourceDistance = 0;
	}
	
	if (d.target.relativeChange) {
		targetDistance = d.target.relativeChange;
	} else if (d.target.children){
		for (var j=0; j<d.target.children.length; j++) {
			
			if (d.target.children[j].relativeChange){
				targetDistance += d.target.children[j].relativeChange;
			} else {
				targetDistance = 0;
			}

		}
	} else {
		targetDistance = 0;
	}
	
	if (typeof sourceDistance == "undefined"){
		sourceDistance = distance;
	}
	if (typeof targetDistance == "undefined"){
		targetDistance = distance;
	}
	if (sourceDistance == 0 && targetDistance==0) {
		totalDistance = 80;
	} else {
		if (sourceDistance < 0) {
			sourceDistance *= -1;
		}
		if (targetDistance < 0) {
			targetDistance *= -1;
		}
		totalDistance = sourceDistance + targetDistance;
	}

	return totalDistance * scale;
}


function click(d) {
	d3.event.stopPropagation();
    if (d3.event.defaultPrevented) return; 
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    Graph.update();
}

function mousedown(){
	d3.event.stopPropagation();
}

function flatten(root) {
    var nodes = [], i = 0;

    function recurse(node) {
        if (node.children) node.children.forEach(recurse);
        if (!node.id) node.id = ++i;
        nodes.push(node);
    }

    recurse(root);
    return nodes;
}