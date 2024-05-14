// Fetch the data from the JSON file
d3.json("data.json").then(data => {

    const margin = {top: 20, right: 20, bottom: 30, left: 40};
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.x))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.y))
        .range([height, 0]);

    const z = d3.scaleSequential(d3.interpolateViridis)
        .domain(d3.extent(data, d => d.z));

    const svg = d3.select("#scatterPlot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Create a tooltip div that is hidden by default
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Select the image and caption elements
    const imageElement = d3.select("#selectedImage");
    const captionElement = d3.select("#imageCaption");

    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .attr("r", 5)
        .style("fill", d => z(d.z))
        .on("mouseover", function(event, d) {
            d3.select(this).style("cursor", "pointer"); 
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`x: ${d.x}<br/>y: ${d.y}<br/>z: ${d.z}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            d3.select(this).style("cursor", "default"); 
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function(event, d) {
            // Update the src attribute of the image element and the text content of the caption element
            imageElement.attr("src", d.image);
            captionElement.text(d.caption);
        });

}).catch(error => {
    console.error("Error loading the data: ", error);
});
