var Graph =  (function(){
	var size = 500;
	
	var force = d3.layout.force().size([size, size]);
	
	var svg = d3.select("body").append("svg")
		.attr("width", size)
		.attr("height", size);
		
	var zoom = d3.behavior.zoom().scaleExtent([0.1, 7]);
	
	var formattedData = function (json){
		var data = {
			  nodes:[],
			  links:[]
		}
		
		json.anomalousProperty.anomalityProp = true;
		data.nodes.push(json.anomalousProperty);
		
		for (var i = 0; i < json.significantVariables.length; i++) {
			var dataItemNode = {key:"", value:"", relativeChange:"", anomalityProp:false}
			var dataItemLink = {source:0, target:"", relativeChange:""}
			
			dataItemNode.key = json.significantVariables[i].key;
			dataItemNode.value = json.significantVariables[i].value;
			dataItemNode.relativeChange = json.significantVariables[i].relativeChange;
			
			
			dataItemLink.target = i+1;
			dataItemLink.relativeChange = json.significantVariables[i].relativeChange;
			
			
			data.nodes.push(dataItemNode);
			data.links.push(dataItemLink);
		}
		
		return data;
	}
	
	return {
		width: size,
		height: size,
		force: force,
		svg: svg,
		zoom: zoom,
		getFormattedData: formattedData
	}
})()

var svg = Graph.svg;
var force = Graph.force;
var zoom = Graph.zoom;
var g = svg.append("g");


d3.json("data/candidates_task.json", function(error, json) {
 
	if (error) throw error;

	var data;
  
	if (json) {
	  
		data = Graph.getFormattedData(json);

		force
			.nodes(data.nodes)
			.links(data.links)
			.charge(-500)
			.linkDistance(function(d) { 
				return (d.relativeChange < 0) ? d.relativeChange * (-5) : d.relativeChange * 5; 
			})
			.start();
	  
		var link = g.selectAll(".link")
			.data(data.links)
			.enter().append("g")
			.attr("class", "glink")
			.append("line")
			.attr("class", "link")
			.style("opacity", function(d) { 
				return (d.relativeChange < 0) ? 0.5 : 1; 
			}) 
			.style("stroke-dasharray", function(d) { 
				return (d.relativeChange < 0) ? "5,5" : "10,0"; 
			})
			.style("fill", "#000");

		var linkText = svg.selectAll(".glink")
			.append("text")
			.attr("class", "link-label")
			.style("fill", function(d){ return (d.relativeChange < 0) ? "#ff0000" : "#000"; })
			.attr("dy", 10)
			.attr("text-anchor", "middle")
			.text(function(d) {
					return d.relativeChange;
			});
			
		var node = g.selectAll(".node")
			.data(data.nodes)
			.enter().append("g")
			.attr("class", "node")
			.call(force.drag);
			
		node.append("path")
			.attr("d", 
				d3.svg.symbol()
				.size(function(d) {
					return (d.anomalityProp) ? Math.PI*Math.pow(10,2) : Math.PI*Math.pow(2,2);
				})
				.type(function(d) { return (d.anomalityProp) ? "square" : "circle"; })
			)
			.style("stroke", function(d){ return (d.relativeChange < 0) ? "#ff0000" : "#000"; });
			
		node.append("text").text(function(d) { return d.key; })
			.attr("dx", 10)
			.attr("dy", 0)
			.style("fill", function(d){ return (d.relativeChange < 0) ? "#ff0000" : "#000"; });;

		node.append("title")
			.text(function(d) { return d.key + "-" + d.value; });

		node.on("mousedown", function(d) { 
			d3.event.stopPropagation();
		});

		zoom.on("zoom", function() {
			g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		});
			 
		svg.call(zoom);
		
		force.on("tick", function() {
			link.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });
			linkText
				.attr("x", function(d) { return ((d.source.x + d.target.x)/2); })
				.attr("y", function(d) { return ((d.source.y + d.target.y)/2); });
				
			node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

		});
	  
	}

});
