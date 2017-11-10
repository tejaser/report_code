// Create the dc.js chart objects & link to div
var dataTable = dc.dataTable("#dc-table-graph");
var engagementChart = dc.barChart("#dc-engagement-chart");
var numberLikesND = dc.numberDisplay("#dc-likes-nd");
var numberLikesND1 = dc.numberDisplay("#dc-likes-nd1");
var numberAmountND = dc.numberDisplay("#dc-amount-nd");
var numberAmountND1 = dc.numberDisplay("#dc-amount-nd1");
var numberImpressionND = dc.numberDisplay("#dc-impression-nd");
var numberReachND = dc.numberDisplay("#dc-reach-nd");
var clicksChart = dc.lineChart("#dc-clicks-chart");
var monthChart = dc.rowChart("#dc-month-chart");
var yearChart = dc.pieChart("#dc-year-chart");
var revenueChart = dc.lineChart("#dc-revenue-chart");
var dayChart = dc.rowChart("#dc-day-chart");

queue()
  .defer(d3.json, "/viewdb")
  .await(makeGraphs);

function makeGraphs(error, projectsJson) {
  //Clean projectsJson data
  var socialDataProjects = projectsJson;
  var dateFormat = d3.time.format("%Y-%m-%d");
  socialDataProjects.forEach(function(d) {
    d["Date"] = dateFormat.parse(d["Date"]);
    d["Post engagements"] = +d["Post engagements"];
    d["Reach"] = +d["Reach"];
    d["Impressions"] = +d["Impressions"];
    d["Link clicks"] = +d["Link clicks"];
    d["Amount spent"] = parseFloat(d["Amount spent"]);
    d["Website purchases"] = +d["Website purchases"];
    d["Website purchases conversion value"] = parseFloat(
      d["Website purchases conversion value"]
    );
    d["Page likes"] = +d["Page likes"];
    d["Post engagements"] = +d["Post engagements"];
    d["month"] = +d["month"];
    d["year"] = +d["year"];
    d["day_of_week"] = +d["day_of_week"];
  });

  var facts = crossfilter(socialDataProjects);
  var all = facts.groupAll();

  // page likes
  var likesValue = facts.dimension(function(d) {
    return d["Page likes"];
  });

  var likesValueGroupSum = likesValue.group().reduceSum(function(d) {
    return d["Page likes"];
  });
  var likesValueGroupCount = likesValue.group().reduceCount(function(d) {
    return d["Page likes"];
  });
  var numberLikes = facts.groupAll().reduceSum(function(d) {
    return d["Page likes"];
  });

  // Post engagements
  var engValue = facts.dimension(function(d) {
    return d["Post engagements"];
  });
  var engValueGroupSum = engValue.group().reduceSum(function(d) {
    return d["Post engagements"];
  });
  var engValueGroupCount = engValue.group().reduceCount(function(d) {
    return d["Post engagements"];
  });

  // Amont spent
  var numberAmount = facts.groupAll().reduceSum(function(d) {
    return d["Amount spent"];
  });

  // number Impressions
  var numberImpressions = facts.groupAll().reduceSum(function(d) {
    return d["Impressions"];
  });

  // number Reach
  var numberReach = facts.groupAll().reduceSum(function(d) {
    return d["Reach"];
  });

  // day of week

  var dayOfWeekValue = facts.dimension(function(d) {
    return d["day_of_week_name"];
  });

  var dayOfWeekValueGroup = dayOfWeekValue.group();

  // Pie chart
  var yearValue = facts.dimension(function(d) {
    return d["year"];
  });

  var yearValueGroup = yearValue.group();

  // month name
  var monthValue = facts.dimension(function(d) {
    return d["month_name"];
  });
  var monthValueGroup = monthValue.group();

  // date dimension
  var dateDimension = facts.dimension(function(d) {
    return d["Date"];
  });

  // setup charts

  // count all the facts
  dc
    .dataCount(".dc-data-count")
    .dimension(facts)
    .group(all);

  // engagement by dayOfweek

  var minDate = dateDimension.bottom(1)[0]["Date"];
  var maxDate = dateDimension.top(1)[0]["Date"];

  document.getElementById(
    "date-from"
  ).textContent = minDate.toLocaleDateString();

  document.getElementById("date-to").textContent = maxDate.toLocaleDateString();

  var totalEngByDate = dateDimension.group().reduceSum(function(d) {
    return d["Post engagements"];
  });

  var totalClicksByDate = dateDimension.group().reduceSum(function(d) {
    return d["Link clicks"];
  });

  var totalEngByMonth = monthValue.group().reduceSum(function(d) {
    return d["Post engagements"];
  });

  var totalEngByYear = yearValue.group().reduceSum(function(d) {
    return d["Post engagements"];
  });

  var totalEngByDay = dayOfWeekValue.group().reduceSum(function(d) {
    return d["Post engagements"];
  });

  var totalRevenueByDate = dateDimension.group().reduceSum(function(d) {
    return d["Website purchases conversion value"];
  });

  var totalAmountSpentByDay = dayOfWeekValue.group().reduceSum(function(d) {
    return d["Amount spent"];
  });

  // number display charts

  numberLikesND
    .formatNumber(d3.format("d"))
    .valueAccessor(function(d) {
      return d;
    })
    .transitionDuration(500)
    .group(numberLikes);

  numberLikesND1
    .formatNumber(d3.format("d"))
    .valueAccessor(function(d) {
      return d;
    })
    .transitionDuration(500)
    .group(numberLikes);

  numberAmountND
    .formatNumber(d3.format("d"))
    .transitionDuration(1000)
    .valueAccessor(function(d) {
      return d;
    })
    .group(numberAmount)
    .formatNumber(d3.format(".3s"));

  numberAmountND1
    .formatNumber(d3.format("d"))
    .transitionDuration(1000)
    .valueAccessor(function(d) {
      return d;
    })
    .group(numberAmount)
    .formatNumber(d3.format(".3s"));

  numberImpressionND
    .formatNumber(d3.format("d"))
    .transitionDuration(1000)
    .valueAccessor(function(d) {
      return d;
    })
    .group(numberImpressions)
    .formatNumber(d3.format(".3s"));

  numberReachND
    .formatNumber(d3.format("d"))
    .transitionDuration(1000)
    .valueAccessor(function(d) {
      return d;
    })
    .group(numberReach)
    .formatNumber(d3.format(".3s"));

  // engagement bar chart
  engagementChart
    // .width(300)
    .width(800)
    .height(220)
    .margins({
      top: 10,
      right: 10,
      bottom: 25,
      left: 40
    })
    .dimension(dateDimension)
    .group(totalEngByDate)
    .transitionDuration(500)
    .brushOn(false)
    .gap(20)
    .centerBar(true)
    .x(d3.time.scale().domain([minDate, maxDate]))
    .elasticY(true)
    .elasticX(true)
    .renderHorizontalGridLines(true)
    // .xUnits(function(){ return 10 })
    .xAxis()
    .tickFormat(d3.time.format("%d%b"))
    .ticks(5);

  // engagement bar chart
  // clicksChart
  //   .width(350)
  //   .height(220)
  //   .margins({
  //     top: 10,
  //     right: 10,
  //     bottom: 25,
  //     left: 40
  //   })
  //   .dimension(dateDimension)
  //   .group(totalClicksByDate)
  //   .transitionDuration(500)
  //   .gap(40)
  //   .centerBar(true)
  //   .x(d3.time.scale().domain([minDate, maxDate]))
  //   .elasticY(true)
  //   .elasticX(true)
  //   .renderHorizontalGridLines(true)
  //   // .xUnits(function(){ return 10 })
  //   .xAxis()
  //   .tickFormat(d3.time.format("%d%b"))
  //   .ticks(5);
  clicksChart
    .renderArea(false)
    .renderHorizontalGridLines(true)
    // .width(300)
    .width(350)
    .height(220)
    .margins({
      top: 10,
      right: 10,
      bottom: 25,
      left: 40
    })
    .dimension(dateDimension)
    .group(totalClicksByDate, "Revenue Conversion")
    .transitionDuration(500)
    .elasticX(true)
    .x(d3.time.scale().domain([minDate, maxDate]))
    .xAxis()
    .tickFormat(d3.time.format("%d%b"))
    .ticks(4);

  // monthly row chart
  monthChart
    // .width(300)
    // .height(220)
    // .dimension(monthValue)
    // .group(totalEngByMonth)
    // .colors(d3.scale.category20())
    // .elasticX(true)
    // .ordering(function(d) {
    //   return -d.value;
    // })
    // .xAxis()
    // .ticks(4);
    .width(300)
    .height(220)
    .dimension(dayOfWeekValue)
    .group(totalAmountSpentByDay)
    .colors(d3.scale.category10())
    .elasticX(true)
    .xAxis()
    .ticks(4);

  // yearly pie chart

  yearChart
    .width(220)
    .height(220)
    .radius(100)
    .innerRadius(40)
    .dimension(dayOfWeekValue)
    .title(function(d) {
      return d.value;
    })
    .group(totalEngByDay);

  // daily amount spent
  dayChart
    .width(300)
    .height(220)
    .dimension(dayOfWeekValue)
    .group(totalAmountSpentByDay)
    .colors(d3.scale.category10())
    .elasticX(true)
    .ordering(function(d) {
      return -d.value;
    })
    .xAxis()
    .ticks(4);

  // revenue and amount stack chart
  // revenueChart
  //  .renderArea(true)
  //  .width(500)
  //  .height(220)
  //  .transitionDuration(1000)
  //  .margins({top: 30, right: 50, bottom: 25, left: 40})
  //  .dimension(dateDimension)
  //  .mouseZoomable(true)
  //  .x(d3.time.scale().domain([minDate, maxDate]))
  //  .brushOn(false)
  //  .renderHorizontalGridLines(true)
  //  .group(totalRevenueByDate, 'Revenue Conversion', function(d){
  //      return d.value;
  //  })
  //  .stack(totalAmountSpentByDate, 'Amount Spent', function(d){
  //      return d.value;
  //  })
  //  .elasticX(true)
  //  .legend(dc.legend().x(60).y(10).itemHeight(13).gap(5))
  //  .xAxis().ticks(4);

  // revenue chart as a line chart
  revenueChart
    .renderArea(true)
    .renderHorizontalGridLines(true)
    // .width(300)
    .width(350)
    .height(220)
    .margins({
      top: 10,
      right: 10,
      bottom: 25,
      left: 40
    })
    .dimension(dateDimension)
    .group(totalRevenueByDate, "Revenue Conversion")
    .transitionDuration(500)
    .elasticX(true)
    .x(d3.time.scale().domain([minDate, maxDate]))
    .xAxis()
    .ticks(4);
  // Table of Paid Social Data
  dataTable
    .width(960)
    .height(800)
    .dimension(dateDimension)
    .group(function(d) {
      return "Detailed Information Data";
    })
    .size(10)
    .columns([
      function(d) {
        return d["Date"].toLocaleDateString();
      },
      function(d) {
        return d["Reach"];
      },
      function(d) {
        return d["Link clicks"];
      },
      function(d) {
        return d["Website purchases"];
      },
      function(d) {
        return d["Amount spent"];
      },
      function(d) {
        return d["Page likes"];
      },
      function(d) {
        return d["Post engagements"];
      }
    ])
    .sortBy(function(d) {
      return d["Date"];
    })
    .order(d3.ascending);

  // Render the charts
  dc.renderAll();
}
