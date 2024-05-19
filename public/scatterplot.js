// Fetch the data from the JSON file
d3.json("data-clip.json").then(data => {

    const margin = {top: 20, right: 20, bottom: 30, left: 40};
    const width = 750 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    const slidersHeight = 400;

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
    
    // Sliders container
    const slider_g = d3.select('#filterContainer').append('svg')
        .attr('width', width+margin.left+margin.right)
        .attr('height', slidersHeight)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .attr('class', 'slider')

    // clipScore slider
    var clipScoreSliderValue = 0;
    var clipScoreSlider = d3.sliderHorizontal()
        .min(0)
        .max(45)
        .step(1)
        .width(300)
        .tickFormat(d3.format('d'))
        .ticks(9)
        .value(clipScoreSliderValue)
        .on('onchange', val => {
            clipScoreSliderValue = val;
            filterUpdate();
        });
    const clipScoreSlider_g = slider_g.append('g');
    clipScoreSlider_g.append('text')
        .attr('x', 0)
        .attr('y', 10)
        .style('font-size', '16px')
        .text('CLIP score filter (show data with value greater than selected):');
    clipScoreSlider_g.append('g')
        .call(clipScoreSlider)
        .attr('transform', `translate(10, 30)`);

    
    // captionLength slider
    var captionLengthSliderValue = 100;
    var captionLengthSlider = d3.sliderHorizontal()
        .min(0)
        .max(200)
        .step(5)
        .width(300)
        .tickFormat(d3.format('d'))
        .ticks(10)
        .value(captionLengthSliderValue)
        .on('onchange', val => {
            captionLengthSliderValue = val;
            filterUpdate();
        });
    const captionLengthSlider_g = slider_g.append('g').attr('transform', `translate(0, 100)`);
    captionLengthSlider_g.append('text')
        .attr('x', 0)
        .attr('y', 10)
        .style('font-size', '16px')
        .text('Caption length filter (show data with value less than selected):');
    captionLengthSlider_g.append('g')
        .call(captionLengthSlider)
        .attr('transform', `translate(10, 30)`);


    // Create a clip path to prevent dots from being drawn outside the chart area
    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    const scatter = svg.append("g")
        .attr("clip-path", "url(#clip)");

    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    const yAxis = svg.append("g")
        .call(d3.axisLeft(y));

    // Create a tooltip div that is hidden by default
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Select the image and caption elements
    const imageElement = d3.select("#selectedImage");
    const captionElement = d3.select("#imageCaption");

    function updatePlot(filteredData) {
        // Bind data to circles
        const dots = scatter.selectAll(".dot")
            .data(filteredData, d => d.x + ":" + d.y);

        // Remove exiting elements
        dots.exit().remove();
        
        dots.enter().append("circle")
            .attr("class", "dot")
            .attr("class", "dot")
            .attr("cx", d => x(d.x))
            .attr("cy", d => y(d.y))
            .attr("r", 4)
            .style("fill", d => z(d.z))
            .on("mouseover", function(event, d) {
                d3.select(this).style("cursor", "pointer"); 
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`x: ${d.x}<br/>y: ${d.y}<br/>CLIP score: ${d.z}`)
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

            // Update existing elements
            dots.attr("cx", d => x(d.x))
            .attr("cy", d => y(d.y))
            .style("fill", d => z(d.z));
    }
    
    function filterUpdate() {
        const filteredData = data.filter(d => ((d.z > clipScoreSliderValue) && (d.caption_length < captionLengthSliderValue)));
        updatePlot(filteredData);
    }
    // Initial plot update
    // updatePlot(data);
    filterUpdate();

    // Zoom function
    const zoom = d3.zoom()
        .scaleExtent([0.5, 20])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    function zoomed(event) {
        // create new scale ojects based on event
        const newX = event.transform.rescaleX(x);
        const newY = event.transform.rescaleY(y);
        // update axes
        xAxis.call(d3.axisBottom(newX));
        yAxis.call(d3.axisLeft(newY));
        scatter.selectAll("circle")
            .attr("cx", d => newX(d.x))
            .attr("cy", d => newY(d.y));
    }

    svg.call(zoom);
}).catch(error => {
    console.error("Error loading the data: ", error);
});
