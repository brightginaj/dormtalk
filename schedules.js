function ScheduleDAO(db){
	"use strict";

	/* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof ScheduleDAO)) {
        console.log('Warning: ScheduleDAO constructor called without "new" operator');
        return new ScheduleDAO(db);
    }

    var schedule = db.collection("schedule");

	this.getSchedule = function(callback) {
        "use strict";

        //For deleting schedule whose due is one day before
        var todayTime = new Date();
        todayTime = Number(todayTime.getTime());

        schedule.remove({expireInfo : {$lt : todayTime}}, function(err, results){
            console.log('deleted schedule : ' + results);
        })

    	schedule.find().toArray(function(err, items) {
            "use strict";
            if (err) return callback(err, null);
 
            callback(err, items);
        });

    }

    this.insertSchedule = function(startDate, endDate, content, callback){
    	"use strict";

        var temp_end_date = new Date(endDate);
        //expiry date for the schedule is (endDate + 10 days)
        var expireInfo = temp_end_date.getTime() + 864000000;

    	//get parameters from Routers
    	var scheduleinfo = {
    		'startDate' : startDate,
    		'endDate' : endDate,
    		'content' : content,
            'expireInfo' : expireInfo
    	};

    	schedule.insert(scheduleinfo, function(err, inserted){
            "use strict";

            if(err) return callback(err, null);
            callback(err, inserted[0]);
        })

    }

}

module.exports.ScheduleDAO = ScheduleDAO;