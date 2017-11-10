queue()
	.defer(d3.json, "/viewdb")
	.await(makeGraphs);

function makeGraphs(error, projectsJson) {

	//Clean projectsJson data
	var socialDataProjects = projectsJson;
	var dateFormat = d3.time.format("%Y-%m-%d");
	socialDataProjects.forEach(function (d) {
		d["Date"] = dateFormat.parse(d["Date"]);
		d["Post engagements"] = +d["Post engagements"];
		d["Reach"] = +d["Reach"];
		d["Impressions"] = +d["Impressions"];
		d["Link clicks"] = +d["Link clicks"];
		d["Amount spent"] = parseFloat(d["Amount spent"]);
		d["Website purchases"] = +d["Website purchases"];
		d["Website purchases conversion value"] = parseFloat(d["Website purchases conversion value"]);
		d["Page likes"] = +d["Page likes"];
		d["Post engagements"] = +d["Post engagements"];
		d["month"] = +d["month"];
		d["year"] = +d["year"];
		d["day_of_week"] = +d["day_of_week"];
	});

	//Create a Crossfilter instance
	var ndx = crossfilter(socialDataProjects);

	//Define Dimensions
	var dateDim = ndx.dimension(function (d) {
		return d["Date"];
	});
	var dayOfWeekDim = ndx.dimension(function (d) {
		return d["day_of_week_name"];
	});
	var accountDim = ndx.dimension(function (d) {
		return d["Account"];
	});
	var monthDim = ndx.dimension(function (d) {
		return d["month_name"];
	});
	var revenueDim = ndx.dimension(function(d){
		return d["Website purchases conversion value"]
	})

	//Calculate metrics
	var dateGroup = dateDim.group();
	var monthGroup = monthDim.group();
	var accountGroup = accountDim.group();
	var dayOfWeekGroup = dayOfWeekDim.group();

	var totalEngagementByDate = dateDim.group().reduceSum(function (d) {
		return d["Post engagements"];
	});
	var totalEngagementsByAccount = accountDim.group().reduceSum(function (d) {
		return d["Post engagements"];
	});
	var amountSpentByDay = dayOfWeekDim.group().reduceSum(function(d){
		return d["Amount spent"];
	});
	var totalRevenueByDay = dateDim.group().reduceSum(function(d){
		return d["Website purchases conversion value"]
	})

	var all = ndx.groupAll();

	var numberLikes = ndx.groupAll().reduceSum(function (d) {
		return d["Page likes"];
	});
	var totalAmount = ndx.groupAll().reduceSum(function (d) {
		return d["Amount spent"];
	});
	var numberImpression = ndx.groupAll().reduceSum(function (d) {
		return d["Impressions"];
	});
	var totalReach = ndx.groupAll().reduceSum(function (d) {
		return d["Reach"];
	});

	var max_state = totalEngagementsByAccount.top(1)[0].value;

	//Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["Date"];
	var maxDate = dateDim.top(1)[0]["Date"];

	//Charts
	var dateChart = dc.lineChart("#date-chart");
	var timeChart = dc.barChart("#time-chart");
	var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
	var povertyLevelChart = dc.rowChart("#poverty-level-row-chart");
	// var usChart = dc.geoChoroplethChart("#us-chart");
	var numberLikesND = dc.numberDisplay("#number-projects-nd");
	var totalAmountND = dc.numberDisplay("#total-donations-nd");
	var numberImpressionND = dc.numberDisplay("#number-impression-nd");
	var totalReachND = dc.numberDisplay("#total-reach-nd");

	numberLikesND
		.formatNumber(d3.format("d"))
		.valueAccessor(function (d) {
			return d;
		})
		.group(numberLikes);

	totalAmountND
		.formatNumber(d3.format("d"))
		.valueAccessor(function (d) {
			return d;
		})
		.group(totalAmount)
		.formatNumber(d3.format(".3s"));

	numberImpressionND
		.formatNumber(d3.format("d"))
		.valueAccessor(function (d) {
			return d;
		})
		.group(numberImpression)
		.formatNumber(d3.format(".3s"));

	totalReachND
		.formatNumber(d3.format("d"))
		.valueAccessor(function (d) {
			return d;
		})
		.group(totalReach)
		.formatNumber(d3.format(".3s"));


	timeChart
		.width(600)
		.height(160)
		.margins({
			top: 10,
			right: 50,
			bottom: 30,
			left: 50
		})
		.dimension(dateDim)
		.group(totalEngagementByDate)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.xAxisLabel("Date")
		.yAxis().ticks(4);

	resourceTypeChart
	      .width(300)
	      .height(250)
	      .dimension(dayOfWeekDim)
	      .group(amountSpentByDay)
				.ordering(function(d) { return -d.value })
	      .xAxis().ticks(4);
	//
	povertyLevelChart
		.width(300)
		.height(250)
	      .dimension(accountDim)
	      .group(totalEngagementsByAccount)
	      .xAxis().ticks(4);
//
	dateChart
		.height(160)
		.width(600)
		.margins({top: 10,right: 50,bottom: 30,left: 50})
		.dimension(dateDim)
		.group(totalRevenueByDay)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.xAxisLabel("Date");


	dc.renderAll();

};
