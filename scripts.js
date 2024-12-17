function drawNet(book_name){
	d3.json(book_name).then(data => {
	  // Clear the existing subgraph
	  d3.select("#chart").html(""); 
	  d3.select("#chart2").html("");  		  
	  
	  const width = 900;
	  const height = 700;

	  // Set up the color scale
	  //const color = d3.scaleOrdinal(d3.schemeCategory10);
	  const custom_color = ["#ff6347","#357bfc",];
	  const color = d3.scaleOrdinal(custom_color);
	  
	  const mainRoles = ["Adda","Ciri","Dandelion","Eskel","Foltest","Geralt","Lambert","Philippa","Shani","Vesemir","Yennefer"];

	  // Copy the data for immutability
	  const links = data.links.map(d => ({ ...d }));
	  const nodes = data.nodes.map(d => ({ ...d }));
	  

	  // Create the simulation
	  const simulation = d3.forceSimulation(nodes)
		.force("link", d3.forceLink(links).id(d => d.id))
		.force("charge", d3.forceManyBody().strength(-170))
		//.force("center", d3.forceCenter(width / 2, height / 2))
		.force("x", d3.forceX(width/2))
		.force("y", d3.forceY(height/2))
		.on("tick", ticked);

	  // Create the SVG container
	  const svg = d3.select("#chart")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("viewBox", [0, 0, width, height])
		.attr("style", "max-width: 100%; height: auto;");
	  
	  // Add a group element for zooming
	  const g = svg.append("g");

	  // Add lines for the links
	  const link = g.append("g")
		.selectAll("line")
		.data(links)
		.join("line")
		.attr("stroke", "#357bfc")
		.attr("stroke-opacity", d => Math.cbrt(d.value)/5)
		.attr("stroke-width", d => Math.sqrt(d.value));

	  // Add circles for the nodes
	  const node = g.append("g")
		.attr("stroke", "#fff")
		.attr("stroke-width", 1.5)
		.selectAll("circle")
		.data(nodes)
		.join("circle")
		.attr("r", d => Math.sqrt(d.totalLinkNum * 8))
		.attr("fill", d => color(d.group))
		.attr("fill-opacity", 0.8)
		.call(d3.drag()
		  .on("start", dragstarted)
		  .on("drag", dragged)
		  .on("end", dragended))
		.on("click", showCard)
		.on("mouseover",highlightNode)
		.on("mouseout",resetHighlight); 

	  //node.append("title").text(d => d.id)
	  const nodeLabels = g.append("g")
			.selectAll("text")
			.data(nodes)
			.join("text")
			.attr("class","node-label")
			.attr("x",d=>d.x+10)
			.attr("y",d=>d.y-10)
			.text(d=>d.id)
			.style("visibility", "hidden");
	  
	  // Add a custom tooltip for the node ID
	  const tooltip = g.append("text")
		.attr("class", "tooltip")
		.attr("x", 0)
		.attr("y", 0)
		.style("visibility", "hidden") // Hidden initially
		.text(""); // Empty text initially

	  
	  // Add zoom behavior
	  const zoom = d3.zoom()
	   .scaleExtent([0.5, 5]) // Define zoom scale limits (e.g., 0.5x to 5x)
	   .on("zoom", (event) => {
		g.attr("transform", event.transform); // Apply zoom transformation
		});

	  svg.call(zoom);

	  // Update positions on each tick
	  function ticked() {
		link
		  .attr("x1", d => d.source.x)
		  .attr("y1", d => d.source.y)
		  .attr("x2", d => d.target.x)
		  .attr("y2", d => d.target.y);

		node
		  .attr("cx", d => d.x)
		  .attr("cy", d => d.y);
		
		nodeLabels
			.attr("x", d => d.x + 10)
			.attr("y", d => d.y - 10); 
		  
	  }

	  // Drag functions
	  function dragstarted(event) {
		if (!event.active) simulation.alphaTarget(0.3).restart();
		event.subject.fx = event.subject.x;
		event.subject.fy = event.subject.y;
	  }

	  function dragged(event) {
		event.subject.fx = event.x;
		event.subject.fy = event.y;
	  }

	  function dragended(event) {
		if (!event.active) simulation.alphaTarget(0);
		event.subject.fx = null;
		event.subject.fy = null;
	  }

	  // Function to highlight node and its links on hover
	  function highlightNode(event, d) {
		// Highlight the node
		d3.select(this).classed("highlighted-node", true);

		// Highlight links connected to this node
		link.classed("highlighted-link", function(l) {
		  return l.source === d || l.target === d;
		});
		
		// Show the node label next to it
		nodeLabels.filter(node => node.id === d.id).style("visibility", "visible");
	  }
		

	  // Function to reset the highlight when mouse leaves
	  function resetHighlight(event, d) {
		// Reset node style
		d3.select(this).classed("highlighted-node", false);

		// Reset links style
		link.classed("highlighted-link", false);
		
		// hide the node label
		nodeLabels.style("visibility", "hidden");
		
	  }
	  
	  function draw_sub_graph(centralName){
		d3.select("#chart2").html("");  // Clear the existing subgraph
		const width = 600;
		const height = 600;
		const radius = 158; // Radius for the circle layout
		const center = { x: width / 2, y: height / 2 };
	  
		// Set up the color scale
		//const color = d3.scaleOrdinal(d3.schemeCategory10);
		const custom_color = ["#ff6347","#357bfc",];
		const color = d3.scaleOrdinal(custom_color);
		
		// Copy the data for immutability
		const copy_links = data.links.map(d => ({ ...d }));
		const copy_nodes = data.nodes.map(d => ({ ...d }));
	  
		// Filter data to only include connections with centralName
		const filteredLinks = copy_links.filter(d => d.source === centralName || d.target === centralName);
		const filteredNodes = copy_nodes.filter(d => d.id === centralName || filteredLinks.some(link => link.source === d.id || link.target === d.id));

		// find center node and place it in the center
		const centralNode = filteredNodes.find(d => d.id === centralName);
		centralNode.x = center.x;
		centralNode.y = center.y;

		const angleStep = (2 * Math.PI) / (filteredNodes.length - 1);
		filteredNodes.forEach((node, index) => {
		if (node.id !== centralName) {
			const angle = index * angleStep;
			node.x = center.x + radius * Math.cos(angle);
			node.y = center.y + radius * Math.sin(angle);
			}
		});

		// Update links to resolve references to actual node objects
		filteredLinks.forEach(link => {
			link.source = filteredNodes.find(node => node.id === link.source);
			link.target = filteredNodes.find(node => node.id === link.target);
		});


		// Create the SVG container
		// clear all its content first
		d3.select("#chart2").html("")
		const svg = d3.select("#chart2")
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.attr("viewBox", [0, 0, width, height])
			.attr("style", "max-width: 100%; height: auto;");
	
		// Add a group element for zooming
		const g = svg.append("g");

		// Add lines for the links
		const link = g.append("g")
			.selectAll("line")
			.data(filteredLinks)
			.join("line")
			.attr("stroke", "#357bfc")
			.attr("stroke-opacity", d => Math.cbrt(d.value)/5)
			.attr("stroke-width", d => 2*Math.sqrt(d.value))
			.on("mouseover",highlightLink)
			.on("mouseout",resetLink);


		// Add circles for the nodes
		const node = g.append("g")
			.attr("stroke", "#fff")
			.attr("stroke-width", 1.5)
			.selectAll("circle")
			.data(filteredNodes)
			.join("circle")
			.attr("r", 8)
			.attr("fill", d => color(d.group))
			.attr("fill-opacity", 0.8)	
			.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended))
			.on("mouseover",highlightNode)
			.on("mouseout",resetHighlight); 

		//node.append("title").text(d => d.id);
		
		const nodeLabels = g.append("g")
			.selectAll("text")
			.data(filteredNodes)
			.join("text")
			.attr("class","node-label")
			.attr("x",d=>d.x+10)
			.attr("y",d=>d.y-10)
			.text(d=>d.id)
			.style("visibility", "hidden");
		
		const linkLabels = g.append("g")
			.selectAll(".link-label")
			.data(filteredLinks)
			.join("text")
			.attr("class", "link-label")
			.attr("x", d => (d.source.x + d.target.x) / 2) 
			.attr("y", d => (d.source.y + d.target.y) / 2 -1)
			.text(d=>d.value)
			.style("visibility","hidden");

		
		// Add zoom behavior
		const zoom = d3.zoom()
			.scaleExtent([0.5, 5]) // Define zoom scale limits (e.g., 0.5x to 5x)
			.on("zoom", (event) => {
			g.attr("transform", event.transform); // Apply zoom transformation
			});

		svg.call(zoom);

		// Update link positions
		function ticked() {
		  link
			.attr("x1", d => d.source.x)
			.attr("y1", d => d.source.y)
			.attr("x2", d => d.target.x)
			.attr("y2", d => d.target.y);

		  node
			.attr("cx", d => d.x)
			.attr("cy", d => d.y);
		
		  nodeLabels
			.attr("x", d => d.x + 10)
			.attr("y", d => d.y - 10); 
		
		  nodeLabels.filter(d => d.id === centralName).style("visibility","visible")
		  
		  linkLabels
			.attr("x", d => (d.source.id ===centralName)?d.target.x+20: d.source.x+20) 
			.attr("y", d => (d.source.id ===centralName)?d.target.y+15: d.source.y+15)
		}

		// Drag functions
		function dragstarted(event) {
			if (!event.active) simulation.alphaTarget(0.3).restart();
			event.subject.fx = event.subject.x;
			event.subject.fy = event.subject.y;
		}

		function dragged(event) {
			event.subject.fx = event.x;
			event.subject.fy = event.y;
		}

		function dragended(event) {
			if (!event.active) simulation.alphaTarget(0);
			event.subject.fx = null;
			event.subject.fy = null;
		}
		
		// Function to highlight node and its links on hover
		function highlightNode(event, d) {
			// Highlight the node
			d3.select(this).classed("highlighted-node", true);

			// Highlight links connected to this node if it's not the central node
			if(d.id !== centralName){
				link.classed("highlighted-link", function(l) {
				return l.source === d || l.target === d;
				});
			}
			
			// Show the node label next to it
			nodeLabels.filter(node => node.id === d.id).style("visibility", "visible");
			
			// Display the link values next to the highlighted links
			linkLabels.style("visibility", function(l) {
				return (l.source === d || l.target === d) ? 	 "visible" : "hidden";});
			
		}
		

		// Function to reset the highlight when mouse leaves
		function resetHighlight(event, d) {
			// Reset node style
			d3.select(this).classed("highlighted-node", false);

			// Reset links style
			link.classed("highlighted-link", false);
		
			// hide the node label
			nodeLabels.filter(d => d.id !== centralName).style("visibility", "hidden");
			
			// hide the link label
			linkLabels.style("visibility","hidden")
		}

		function highlightLink(event, d) {
			// Highlight the link
			d3.select(this).classed("highlighted-link", true);

			// Highlight nodes connected to the link
			node.classed("highlighted-node", function(n) {
				return n === d.source || n === d.target;
			});
			
			// Show the labels of the connected nodes
			nodeLabels.style("visibility", function(n) {
				return (n === d.source || n === d.target) ? "visible" : "hidden";
			});
			// Show the link value as a label near the link
			linkLabels.style("visibility", function(l) {
				return (l.source === d.source && l.target === d.target) ? "visible" : "hidden";});

		}
		
		function resetLink(event, d) {
			// Reset link style
			d3.select(this).classed("highlighted-link", false);

			// Reset node style
			node.classed("highlighted-node", false);
			
			// Hide the node labels
			nodeLabels.filter(d => d.id !== centralName).style("visibility", "hidden");

			// hide the link label
			linkLabels.style("visibility","hidden")
		}

		// Create the simulation
		const simulation = d3.forceSimulation(filteredNodes)
			.force("link", d3.forceLink(filteredLinks).id(d => d.id).strength(d => Math.log(d.value)/10))
			.force("charge", d3.forceManyBody().strength(-100))
			//.force("radius", d3.forceRadial(radius,center.x, center.y))
			.force("x", d3.forceX(center.x))
			.force("y", d3.forceY(center.y))
			.on("tick", ticked);
	  
	  }
	  
	  function showCard(event, d) {
		const nodeId = d.id;
		// Calculate total connections (degree) and strongest link
		const connectedLinks = links.filter(link => link.source.id === nodeId || link.target.id === nodeId);
		const totalConnections = connectedLinks.length;

		const strongestLink = connectedLinks.reduce((max, link) => 
			link.value > max.value ? link : max, 
			connectedLinks[0]
		);

		const strongestPartner = strongestLink.source.id === nodeId ? strongestLink.target.id : strongestLink.source.id;
		const strongestValue = strongestLink.value;
		
		// draw the sub-network graph
		draw_sub_graph(nodeId);
		
		if(d.group===1){
			// Update the info card
			d3.select("#info-card1")
			.html(`
			<p><strong>Name:</strong><b class="bestPal"> ${nodeId}</b></p>
			<p><strong>Total Connections:</strong> ${totalConnections}</p>
			<img class="avatar" src="${nodeId}.jpg" alt="avatar image">
			`);
		}else{
			d3.select("#info-card1")
			.html(`
			<p><strong>Name:</strong><b class="bestPal"> ${nodeId}</b></p>
			<p><strong>Total Connections:</strong> ${totalConnections}</p>
			<img class="avatar" src="unknown.jpg" alt="avatar image">
			`);
		}
		if(mainRoles.includes(strongestPartner)){
			d3.select("#info-card2")
			.html(`
			<p><strong>Best Pal:</strong><b class="bestPal"> ${strongestPartner}</b></p>
			<p><strong>Connection Value:</strong> ${strongestValue}</p>
			<img class="avatar" src="${strongestPartner}.jpg" alt="avatar image">
			`);
		}else{
			d3.select("#info-card2")
			.html(`
			<p><strong>Best Pal:</strong><b class="bestPal"> ${strongestPartner}</b></p>
			<p><strong>Connection Value:</strong> ${strongestValue}</p>
			<img class="avatar" src="unknown.jpg" alt="avatar image">
			`);
		}
		
		
	  }

	}).catch(error => {
	  console.error("Error loading the JSON file:", error);
	});
};
function changeBook(value) {
  book_name = `out_book_${value}.json`
  drawNet(book_name)
};
// initial drawing
changeBook(1);