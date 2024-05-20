// Fetch the data from the JSON file
d3.json("data-clip-new.json").then(data => {
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
        .attr("height", height + margin.top + margin.bottom);
    
    const scatterContainer = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Sliders container
    const slider_g = d3.select('#filterContainer').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', slidersHeight)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .attr('class', 'slider');

    var isEnglishValue = 0;
    var aspectratio = 1000;
    var smallerdimValue = 0;

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
        .style('font-size', '20px')
        .text('CLIP score filter (show data with value greater than selected value):');
    clipScoreSlider_g.append('g')
        .call(clipScoreSlider)
        .attr('transform', `translate(10, 30)`);

    
    // captionLength slider
    var captionLengthSliderValue = 0;
    var captionLengthSlider = d3.sliderHorizontal()
        .min(0)
        .max(50)
        .step(1)
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
        .style('font-size', '20px')
        .text('Caption length filter (show data with value greater than selected value):');
    captionLengthSlider_g.append('g')
        .call(captionLengthSlider)
        .attr('transform', `translate(10, 30)`);

    // Create a clip path to prevent dots from being drawn outside the chart area
    scatterContainer.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    const scatter = scatterContainer.append("g")
        .attr("clip-path", "url(#clip)");

    const xAxis = scatterContainer.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    const yAxis = scatterContainer.append("g")
        .call(d3.axisLeft(y));

    // Create a tooltip div that is hidden by default
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Record current zoom state
    let currentZoomTransform = d3.zoomIdentity;

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
            .attr("r", 4)
            .attr("cx", d => currentZoomTransform.rescaleX(x)(d.x))
            .attr("cy", d => currentZoomTransform.rescaleY(y)(d.y))
            .style("fill", d => z(d.z))
            .style("opacity", 1.0)  // Adjust opacity
            .style("stroke-width", 0.2)  // Adjust stroke width
            .style("stroke", "black")  // Optionally, add stroke color
            .on("mouseover", function(event, d) {
                d3.select(this).style("cursor", "pointer"); 
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`x: ${d.x}<br/>y: ${d.y}<br/>CLIP score: ${d.z}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .style('font-size', '15px');
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
    }
    updatePlot(data);
    
    function filterUpdate() {
        const filteredData = data.filter(d => ((d.z > clipScoreSliderValue) && (d.caption_length > captionLengthSliderValue)&& (d.is_english >= isEnglishValue) && (d.aspect_ratio < aspectratio) && (d.smaller_dim > smallerdimValue)));
        updatePlot(filteredData);
    }
    // Initial plot update
    
    filterUpdate();

    // Zoom function
    const zoom = d3.zoom()
        .scaleExtent([0.5, 20])
        .extent([[0, 0], [width, height]])
        .on("zoom", function(event) {
            currentZoomTransform = event.transform;
            zoomed(event);
        });

    function zoomed(event) {
        const {transform} = event;
        // create new scale objects based on event
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

    // Add clickable links to adjust filter values
    const filterLinks = [
        {value: 28, label: '28', slider: clipScoreSlider},
        {value: 30, label: '30', slider: clipScoreSlider},
        {value: 5, label: '5', slider: captionLengthSlider}
    ];

    // Function to create filter links in the text
    function createFilterLinks(containerId, links, title) {
        const container = d3.select(containerId);
        title_text = container.text(title);
        links.forEach(link => {
            title_text.append("a")
                .attr("href", "#")
                .attr("data-value", link.value)
                .attr("data-slider", link.slider === clipScoreSlider ? "clipScore" : "captionLength")
                .style("cursor", "pointer")
                .style("text-decoration", "underline")
                .style("margin-right", "15px")
                .text(link.label)
                .on("click", function(event) {
                    event.preventDefault();
                    link.slider.value(link.value);
                    link.slider.on('onchange')(link.value);
                });
        });
    }

    // Create filter links for CLIP score and caption length
    createFilterLinks("#clipScoreValues", filterLinks.filter(link => link.slider === clipScoreSlider), "CLIP score values:  ");
    createFilterLinks("#captionLengthValues", filterLinks.filter(link => link.slider === captionLengthSlider), "Caption length values:  ");

    const Englishcontainer = d3.select("#isEnglishValues");
    Englishcontainer.append("a")
            .attr("href", "#")
            .style("cursor", "pointer")
            .style("text-decoration", "underline")
            .text("Only English captions")
            .on("click", function(event) {
                event.preventDefault();
                isEnglishValue = 1;
                filterUpdate();
            });
    
    const Aspectcontainer = d3.select("#aspectratio");
    Aspectcontainer.append("a")
            .attr("href", "#")
            .style("cursor", "pointer")
            .style("text-decoration", "underline")
            .text("Image aspect ratio < 3")
            .on("click", function(event) {
                event.preventDefault();
                aspectratio = 3;
                filterUpdate();
            });
    
    const Smallerdimcontainer = d3.select("#smallerdimValue");
    Smallerdimcontainer.append("a")
            .attr("href", "#")
            .style("cursor", "pointer")
            .style("text-decoration", "underline")
            .text("Image smaller dimension > 200px")
            .on("click", function(event) {
                event.preventDefault();
                smallerdimValue = 200;
                filterUpdate();
            });
    
    const resetcontainer = d3.select("#reset");
    resetcontainer.append("a")
            .attr("href", "#")
            .style("cursor", "pointer")
            .style("text-decoration", "underline")
            .text("Reset Basic Filtering")
            .on("click", function(event) {
                event.preventDefault();
                isEnglishValue = 0;
                aspectratio = 1000;
                smallerdimValue = 0;
                captionLengthSliderValue = 0;
                captionLengthSlider.value(0);

                filterUpdate();
            });

}).catch(error => {
    console.error("Error loading the data: ", error);
});
