var svgContainer;
var path = d3.geoPath();

const createTitle = () => {
  d3.selectAll('.container')
      .append('h1')
      .attr('id','title')
      .style('text-align','center')
      .text("United States Educational Attainment");
  
  d3.selectAll('.container')
      .append('h2')
      .attr('id','description')
      .style('text-align','center')
      .text("Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)");
};

const createTooltip = () => {
  return d3.selectAll('.container')
    .append('div')
    .attr('id', 'tooltip')
    .attr('class', 'tooltip')
    .html( function (d) {
              return d;
            });
};

const createLegend = (colorScale, rangoEduc) => {
  
  const tickSize = 6,
        legendWidth = 340,
        legendHeight = 10 + tickSize,        
        legendRectWidth = legendWidth/((colorScale.range()).length-1)
        ;
  
  const xScaleLegend = d3.scaleLinear().domain([rangoEduc[0], rangoEduc[1]]).rangeRound([0,legendWidth]);    
  
  const colorsRange = 
        colorScale.range()
                  .map( d => {
                    d = colorScale.invertExtent(d);
                    //invertExtent() return the extent of the values in the specified domain [x0,x1]
                    if(!d[0]){
                      d[0] = xScaleLegend.domain()[0];
                    }
                    if(!d[1]){
                      d[1] = xScaleLegend.domain()[1];
                    }
                    return d;
                  });
  //console.log(colorsRange);
  
  var legend = d3.selectAll('.canvas')    
                  .append('g')
                  .attr('class', 'legend')
                  .attr('id', 'legend')                  
                  .attr("transform",'translate(540,10)');
  
  legend.selectAll('rect')
        .data(colorsRange)
        .enter()
        .append('rect')
        .attr('class', 'legend-rect')
        .attr('x', (d, i) => (i * legendRectWidth) -legendRectWidth)
 //.attr('x', (d) => xScaleLegend(d[0]))
        .attr('y', 0)        
        .attr('width',legendRectWidth)
  //.attr('width',(d) => xScaleLegend(d[1])-xScaleLegend(d[0]))
        .attr('height', legendHeight)
        .attr('fill', (d) => { return colorScale(d[0]); });
  
  legend.append('text')
        .attr('class','caption')
        //.attr('transform', 'translate(0,'+ legendHeight +')')
        .attr('x', xScaleLegend.range()[0])
        .attr('y', -6)
  //.text(function(d){ return d})
        .attr('fill', 'black')        
        .attr('text-anchor','start');
  
  const xAxis = d3.axisBottom(xScaleLegend) 
                  .tickFormat(d => Math.round(d) +'%')
                  .tickValues(colorScale.domain())
                  //.tickSize(legendRectWidth);
                  .tickSize(16);
  
  legend.call(xAxis)
        .select('.domain')
        .remove();
        
};

function ready(usData, educationData) { 
  
  //console.log(educationData);
  //GeoJson format (coordinates) -  format topoJson (geometry arcs) for data education
    
  
  //console.log(usData.objects.counties);
 //console.log(topojson.feature(usData, usData.objects.counties).features);
  var countyData = topojson.feature(usData, usData.objects.counties).features;
  
  var rangoEduc = d3.extent(educationData, county => county.bachelorsOrHigher);
  
 //https://observablehq.com/@d3/color-schemes
 var colorScale = d3.scaleThreshold()
                    .domain(d3.range(rangoEduc[0], rangoEduc[1],(rangoEduc[1] - rangoEduc[0])/11))
                    .range(d3.schemePaired);
  
  
  svgContainer = d3.selectAll('.container')
                   .append('svg')
                   .attr('class','canvas');
  
  //draw Legend
  createLegend(colorScale, rangoEduc);
  
  //draw Map  
  
  svgContainer.append('g')
      .attr('class', 'counties')
      .selectAll('path')
      .data(countyData)
      .enter()
      .append('path')
      .attr('class', 'county')
      .attr('d', path)
      .attr('data-fips', function (d) {
        //console.log(d.id);
        return d.id;
      })
     .attr('data-education', (d) => {
      var result = educationData.filter(function (elem) {
        return elem.fips === d.id;
      });
      if (result[0]) {
        return result[0].bachelorsOrHigher;
      }
      // could not find a matching fips id in the data
      console.log('could find data for: ', d.id);
      return 0;
    })
   .attr('fill', (d) => {
      var result = educationData.filter(elem => {
        return elem.fips === d.id;
      });
      if (result[0]) {
        return colorScale(result[0].bachelorsOrHigher);
      }
      // could not find a matching fips id in the data
      console.log('could find data for: ', d.id);
      return colorScale(0);
    })
  .on('mouseover', (e, d) => {   
        
    var str ="";
    var result = educationData.filter(elem => {
        return elem.fips === d.id;
      });
    if(result[0]) {
      str = '<p>'
            +result[0]['area_name'] + ', '
            +result[0]['state'] + ': '
            +result[0]['bachelorsOrHigher'] + '%'
            +'</p>';
    }
   // console.log(result[0]['bachelorsOrHigher']);
    d3.selectAll('#tooltip')
       .style('opacity', 0.9)
       .style('left', e.pageX + 10 + 'px')
       .style('top', e.pageY -28 + 'px')
       .attr('data-education', result[0]['bachelorsOrHigher'])
       .html(str);
  })
  .on('mouseout', function (e, d) {                                                         d3.selectAll('#tooltip')
                  .style('opacity', 0)
                  .style('left', 0)
                  .style('top', 0); 
              });
  
  svgContainer
    .selectAll('path')
    .data(
      topojson.mesh(usData, usData.objects.states, function (a, b) {
        return a !== b;
      })
    )
    .enter()
    .append('path')
    .attr('class', 'states')
    .attr('d', path)
    .attr('stroke', 'white'); 
  
}

const leadingGraphic = () => {
  
  var urlCounty = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
  
  var urlEducation = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
  
  createTitle();
  createTooltip();
  
  Promise.all([d3.json(urlCounty), d3.json(urlEducation)])     
         .then((data) => ready(data[0], data[1]))
         .catch((err) => console.log(err));
  
};
leadingGraphic(); 